import pickle
import numpy as np
import pandas as pd
from pathlib import Path

def validate_data():
    data_dir = Path(__file__).parent.parent / "processed"
    
    # Load knowledge graph
    with open(data_dir / "knowledge_graph.pkl", "rb") as f:
        kg = pickle.load(f)
        
    print("--- Knowledge Graph Validation ---")
    concepts = kg["concepts"]
    edges = kg["edges"]
    print(f"Concepts: {len(concepts)}")
    print(f"Edges: {len(edges)}")
    
    assert len(concepts) == 50, f"Expected 50 concepts, got {len(concepts)}"
    assert len(edges) >= 80, f"Expected at least 80 edges, got {len(edges)}"
    
    # Check for self-loops and forward flow
    for edge in edges:
        assert edge["from"] != edge["to"], f"Self-loop detected at node {edge['from']}"
        assert edge["from"] < edge["to"], f"Backward edge detected: {edge['from']} -> {edge['to']}"
        
    # Load student trajectories
    with open(data_dir / "student_trajectories.pkl", "rb") as f:
        trajectories = pickle.load(f)
        
    print("\n--- Student Trajectories Validation ---")
    print(f"Students: {len(trajectories)}")
    assert len(trajectories) == 100, f"Expected 100 students, got {len(trajectories)}"
    
    for student in trajectories:
        interactions = student["interactions"]
        assert len(interactions) == 100, f"Student {student['student_id']} has {len(interactions)} interactions, expected 100"
        
        rewards = [i["reward"] for i in interactions]
        states = [i["knowledge_state"] for i in interactions]
        
        # Check reward bounds
        assert min(rewards) >= -0.1 and max(rewards) <= 0.1, f"Reward out of bounds: {min(rewards)}, {max(rewards)}"
        
        # Check knowledge state bounds
        states_flat = np.array(states).flatten()
        assert np.all((states_flat >= 0) & (states_flat <= 1)), "Knowledge state not bounded [0, 1]"
        assert not np.any(np.isnan(states_flat)), "NaN found in knowledge states"

    print("\nAll validations passed successfully!")

if __name__ == "__main__":
    validate_data()
