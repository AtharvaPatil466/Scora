import json
import pickle
import random
import numpy as np
import pandas as pd
import yaml
import os
from pathlib import Path

# Load configuration
def load_config():
    config_path = Path(__file__).parent.parent.parent / "config" / "training_config.yaml"
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

def generate_knowledge_graph():
    """Generates 50 mathematics concepts and 80 prerequisite edges."""
    concepts = [
        "Counting", "Numbers", "Addition", "Subtraction", "Multiplication", "Division",
        "Fractions", "Decimals", "Percentages", "Ratios", "Proportions", "Basic Geometry",
        "Area", "Perimeter", "Volume", "Angles", "Triangles", "Quadrilaterals", "Circles",
        "Pre-Algebra", "Variables", "Equations", "Inequalities", "Functions", "Linear Equations",
        "Systems of Equations", "Polynomials", "Factoring", "Quadratic Equations", "Exponents",
        "Radicals", "Logarithms", "Trigonometry", "Sine", "Cosine", "Tangent", "Unit Circle",
        "Analytic Geometry", "Complex Numbers", "Pre-Calculus", "Limits", "Derivatives",
        "Differentiation Rules", "Applications of Derivatives", "Integrals", "Integration Rules",
        "Fundamental Theorem of Calculus", "Sequence and Series", "Vector Algebra", "Differential Equations"
    ]
    
    kg = {
        "concepts": [],
        "edges": []
    }
    
    # Create concept metadata
    for i, name in enumerate(concepts):
        kg["concepts"].append({
            "id": i,
            "name": name,
            "domain": "Mathematics",
            "difficulty": round(0.1 + (i / len(concepts)) * 0.8, 2),
            "type": "Theory" if i % 2 == 0 else "Practice"
        })
        
    # Generate 80 prerequisite edges (lower index -> higher index)
    edges_count = 0
    existing_edges = set()
    
    # Standard linear prerequisites
    for i in range(len(concepts) - 1):
        kg["edges"].append({
            "from": i,
            "to": i + 1,
            "difficulty_level": random.randint(1, 5)
        })
        existing_edges.add((i, i+1))
        edges_count += 1
        
    # Additional 31 complex prerequisites
    while edges_count < 80:
        f = random.randint(0, len(concepts) - 2)
        t = random.randint(f + 1, min(f + 5, len(concepts) - 1))
        if (f, t) not in existing_edges:
            kg["edges"].append({
                "from": f,
                "to": t,
                "difficulty_level": random.randint(1, 5)
            })
            existing_edges.add((f, t))
            edges_count += 1
            
    return kg

def generate_student_trajectories(kg):
    """Generates 100 students with 100 interactions each."""
    students = []
    concepts = kg["concepts"]
    
    for student_id in range(100):
        skill_level = random.uniform(0.3, 0.9)
        learning_rate = random.uniform(0.01, 0.1)
        
        interactions = []
        knowledge_state = np.zeros(len(concepts))
        
        for step in range(100):
            # Select content relative to knowledge (simple heuristic)
            learned_indices = np.where(knowledge_state > 0.5)[0]
            if len(learned_indices) == 0:
                target_concept_idx = 0
            else:
                max_learned = learned_indices.max()
                target_concept_idx = min(max_learned + random.randint(0, 2), len(concepts) - 1)
            
            concept = concepts[target_concept_idx]
            
            # Realistic learning dynamics (sigmoid success)
            difficulty_gap = skill_level - concept["difficulty"]
            success_prob = 1 / (1 + np.exp(-5 * (difficulty_gap + np.mean(knowledge_state[:target_concept_idx+1]) if target_concept_idx > 0 else difficulty_gap)))
            success = 1 if random.random() < success_prob else 0
            
            # Update knowledge state
            if success:
                knowledge_state[target_concept_idx] = min(1.0, knowledge_state[target_concept_idx] + learning_rate * (1 - knowledge_state[target_concept_idx]))
                reward = 0.1  # Learning gain
            else:
                reward = -0.05 # Stagnation penalty
                
            interactions.append({
                "step": step,
                "content_id": target_concept_idx,
                "success": success,
                "reward": round(reward, 3),
                "knowledge_state": knowledge_state.copy().tolist(),
                "time_spent": random.randint(30, 300),
                "difficulty": concept["difficulty"]
            })
            
        students.append({
            "student_id": student_id,
            "skill_level": round(skill_level, 2),
            "learning_rate": round(learning_rate, 3),
            "interactions": interactions
        })
        
    return students

def main():
    print("Starting synthetic data generation...")
    kg = generate_knowledge_graph()
    trajectories = generate_student_trajectories(kg)
    
    # Save files
    data_dir = Path(__file__).parent.parent
    
    # Raw JSON for reference
    with open(data_dir / "raw" / "concepts.json", "w") as f:
        json.dump(kg["concepts"], f, indent=2)
        
    with open(data_dir / "raw" / "prerequisites.json", "w") as f:
        json.dump(kg["edges"], f, indent=2)
        
    # Processed PKL for training
    with open(data_dir / "processed" / "knowledge_graph.pkl", "wb") as f:
        pickle.dump(kg, f)
        
    with open(data_dir / "processed" / "student_trajectories.pkl", "wb") as f:
        pickle.dump(trajectories, f)
        
    print(f"Generated {len(kg['concepts'])} concepts and {len(kg['edges'])} edges.")
    print(f"Generated {len(trajectories)} student trajectories with 100 interactions each.")
    print("Data generation complete. Files saved in data/raw/ and data/processed/")

if __name__ == "__main__":
    main()
