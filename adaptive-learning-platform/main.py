from fastapi import FastAPI, HTTPException, File, UploadFile, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import os
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from pipeline import AdaptiveLearningPipeline as RecommendationPipeline
from src.content_pipeline import ContentPipeline

app = FastAPI(title="Adaptive Learning Platform API")

# Initialize pipelines
pipeline = RecommendationPipeline()
content_pipeline = ContentPipeline(storage_root="data/materials")

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory student storage for demo/test
# In production, this would be a database
students_db = {}

@app.on_event("startup")
async def startup_event():
    setup_demo()

class RecommendationRequest(BaseModel):
    student_id: str
    top_k: Optional[int] = 5
    knowledge_state: Optional[List[float]] = None
    student_features: Optional[dict] = None

class InteractionLog(BaseModel):
    student_id: str
    content_id: int
    success: bool
    time_spent: int
    difficulty: float

@app.get("/health")
def health_check():
    loaded = list(pipeline.models.keys())
    return {
        "status": "healthy",
        "models_loaded": loaded,
        "embeddings": pipeline.embeddings is not None if hasattr(pipeline, 'embeddings') else False
    }

@app.get("/demo/setup")
def setup_demo():
    """Create 3 demo students: Alex (beginner), Sam (intermediate), Jo (advanced)"""
    students_db["alex"] = {
        "student_id": "alex",
        "knowledge_state": [0.1] * 50,
        "interactions": [],
        "last_difficulty": 0.2,
        "last_time_spent": 300
    }
    students_db["sam"] = {
        "student_id": "sam",
        "knowledge_state": [0.5] * 50,
        "interactions": [],
        "last_difficulty": 0.5,
        "last_time_spent": 200
    }
    students_db["jo"] = {
        "student_id": "jo",
        "knowledge_state": [0.8] * 50,
        "interactions": [],
        "last_difficulty": 0.8,
        "last_time_spent": 100
    }
    return {"message": "Demo students created: alex, sam, jo"}

@app.post("/recommend")
def recommend_content(request: RecommendationRequest):
    if request.student_id not in students_db:
        # Create student if not exists for demo purposes
        students_db[request.student_id] = {
            "student_id": request.student_id,
            "knowledge_state": request.knowledge_state or [0.0] * 50,
            "interactions": [],
            "last_difficulty": 0.5,
            "last_time_spent": 120
        }
    
    student_data = students_db[request.student_id]
    if request.knowledge_state:
        student_data["knowledge_state"] = request.knowledge_state
    recommendations_result = pipeline.recommend(
        knowledge_state=student_data.get("knowledge_state", []),
        student_features=student_data,
        interaction_history=student_data.get("interactions", []),
        top_k=request.top_k
    )
    
    recs_list = recommendations_result.get("recommendations", [])
    
    return {
        "student_id": request.student_id,
        "recommendations": recs_list,
        "count": len(recs_list)
    }

@app.post("/interact")
def log_interaction(interaction: InteractionLog):
    if interaction.student_id not in students_db:
        raise HTTPException(status_code=404, detail="Student not found")
        
    student = students_db[interaction.student_id]
    
    # Update student state (simplified logic)
    # In a real system, the reward/knowledge update would be more complex
    content_id = interaction.content_id
    if interaction.success:
        student["knowledge_state"][content_id] = min(1.0, student["knowledge_state"][content_id] + 0.1)
        reward = 0.1
    else:
        reward = -0.05
        
    # Log interaction
    student["interactions"].append({
        "content_id": content_id,
        "success": interaction.success,
        "time_spent": interaction.time_spent,
        "difficulty": interaction.difficulty,
        "knowledge_state": student["knowledge_state"].copy(),
        "reward": reward
    })
    
    student["last_difficulty"] = interaction.difficulty
    student["last_time_spent"] = interaction.time_spent
    
    return {"status": "success", "new_knowledge_avg": sum(student["knowledge_state"])/50}

@app.get("/knowledge-graph")
def get_kg(student_id: Optional[str] = None):
    kg = pipeline.get_knowledge_graph()
    if not kg:
        raise HTTPException(status_code=404, detail="Knowledge graph not loaded")
        
    # Inject student mastery if student_id is provided
    if student_id and student_id in students_db:
        knowledge_state = students_db[student_id].get("knowledge_state", [])
        for i, node in enumerate(kg.get("nodes", [])):
            if i < len(knowledge_state):
                node["mastery"] = knowledge_state[i]
                
    return kg

@app.get("/concepts")
def list_concepts():
    kg = pipeline.get_knowledge_graph()
    if not kg:
        return [{"id": i, "name": f"Concept {i}"} for i in range(50)]
    return kg.get("concepts", [])

@app.get("/student/{student_id}")
def get_student(student_id: str):
    if student_id not in students_db:
        raise HTTPException(status_code=404, detail="Student not found")
    return students_db[student_id]


# ==============================================================================
# MATERIAL UPLOAD & PROCESSING ENDPOINTS
# ==============================================================================

async def _process_material_background(
    student_id: str,
    material_id: str,
    filename: str,
    file_bytes: bytes,
):
    """Background task: run the full content pipeline."""
    try:
        knowledge_state = None
        learning_style = "visual"
        if student_id in students_db:
            knowledge_state = students_db[student_id].get("knowledge_state")
            # Could read learning_style from student profile in the future

        result = await content_pipeline.process_material(
            student_id=student_id,
            material_id=material_id,
            filename=filename,
            knowledge_state=knowledge_state,
            learning_style=learning_style,
        )
        print(f"  ✅ Material {material_id} processed: {result.get('title')}")
    except Exception as e:
        print(f"  ❌ Material {material_id} processing failed: {e}")
        content_pipeline.storage.update_status(student_id, material_id, "error")


@app.post("/materials/upload")
async def upload_material(
    student_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """Upload a study material file for processing."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Validate file type
    allowed_extensions = {
        ".pdf", ".docx", ".pptx", ".txt", ".md",
        ".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp",
    }
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Allowed: {', '.join(sorted(allowed_extensions))}",
        )

    # Read file bytes
    file_bytes = await file.read()

    # Save the upload (synchronous — fast)
    material_id = content_pipeline.storage.save_upload(
        student_id, file.filename, file_bytes,
    )

    # Process in background (extract → expand → quiz)
    background_tasks.add_task(
        _process_material_background,
        student_id,
        material_id,
        file.filename,
        file_bytes,
    )

    return {
        "material_id": material_id,
        "filename": file.filename,
        "status": "uploaded",
        "message": "File uploaded. Processing started in background.",
    }


@app.get("/materials/{student_id}")
def list_materials(student_id: str):
    """List all materials for a student."""
    materials = content_pipeline.storage.list_materials(student_id)
    return {"student_id": student_id, "materials": materials, "count": len(materials)}


@app.get("/materials/{student_id}/{material_id}")
def get_material(student_id: str, material_id: str):
    """Get processed material (expanded content)."""
    meta = content_pipeline.storage.get_material_meta(student_id, material_id)
    if not meta:
        raise HTTPException(status_code=404, detail="Material not found")

    result = {"meta": meta}

    # Include expanded content if ready
    expanded = content_pipeline.storage.load_expanded(student_id, material_id)
    if expanded:
        result["expanded"] = expanded

    # Include extracted content
    extracted = content_pipeline.storage.load_extracted(student_id, material_id)
    if extracted:
        result["extracted"] = extracted

    return result


@app.get("/materials/{student_id}/{material_id}/quiz")
def get_material_quiz(student_id: str, material_id: str):
    """Get generated quiz for a material."""
    quiz = content_pipeline.storage.load_quiz(student_id, material_id)
    if quiz is None:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found — material may still be processing",
        )
    return {"material_id": material_id, "questions": quiz, "count": len(quiz)}


@app.get("/materials/{student_id}/{material_id}/status")
def get_material_status(student_id: str, material_id: str):
    """Get processing status of a material."""
    status = content_pipeline.storage.get_status(student_id, material_id)
    if status == "not_found":
        raise HTTPException(status_code=404, detail="Material not found")
    return {"material_id": material_id, "status": status}


@app.delete("/materials/{student_id}/{material_id}")
def delete_material(student_id: str, material_id: str):
    """Delete a material and all its processed data."""
    success = content_pipeline.storage.delete_material(student_id, material_id)
    if not success:
        raise HTTPException(status_code=404, detail="Material not found")
    return {"message": "Material deleted", "material_id": material_id}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
