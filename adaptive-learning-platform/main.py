from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
from fastapi.middleware.cors import CORSMiddleware
from pipeline import AdaptiveLearningPipeline as RecommendationPipeline

app = FastAPI(title="Adaptive Learning Platform API")

# Initialize pipeline
pipeline = RecommendationPipeline()

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
