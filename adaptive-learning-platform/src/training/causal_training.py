import pandas as pd
import numpy as np
import pickle
import yaml
from pathlib import Path
from pgmpy.estimators import PC
from econml.dml import CausalForestDML
from sklearn.preprocessing import StandardScaler

def load_trajectories():
    project_root = Path(__file__).parent.parent.parent
    data_path = project_root / "data" / "processed" / "student_trajectories.pkl"
    with open(data_path, "rb") as f:
        trajectories = pickle.load(f)
    return trajectories

def prepare_causal_data(trajectories):
    rows = []
    for student in trajectories:
        interactions = student["interactions"]
        for i in range(len(interactions)):
            inter = interactions[i]
            # Features: prior knowledge (sum/mean of state), difficulty, time_spent
            rows.append({
                "prior_knowledge": np.mean(inter["knowledge_state"]),
                "difficulty": inter["difficulty"],
                "time_spent": inter["time_spent"],
                "content_id": inter["content_id"],
                "learning_gain": inter["reward"]
            })
    return pd.DataFrame(rows)

def train_causal():
    config_path = Path(__file__).parent.parent.parent / "config" / "training_config.yaml"
    with open(config_path, "r") as f:
        config = yaml.safe_load(f)["causal"]
        
    trajectories = load_trajectories()
    df = prepare_causal_data(trajectories)
    
    print(f"Prepared causal dataset with {len(df)} samples.")
    
    # 1. Causal Discovery (PC Algorithm) - Discover DAG
    # Using pgmpy's PC algorithm
    print("Running PC algorithm for causal discovery...")
    c = PC(df.drop(columns=["content_id", "learning_gain"])) # Discover features relations
    # Simplified approach for DAG discovery on main variables
    dag = c.estimate(significance_level=config["significance_level"])
    
    # 2. Causal Forest for Treatment Effects (EconML)
    print("Estimating treatment effects with Causal Forest...")
    Y = df["learning_gain"]
    T = df["content_id"]
    X = df[["prior_knowledge", "difficulty", "time_spent"]]
    
    # Standardize X
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Initialize and fit Causal Forest
    handler = CausalForestDML(
        model_y='auto',
        model_t='auto',
        discrete_treatment=False,
        n_estimators=100
    )
    handler.fit(Y, T, X=X_scaled)
    
    # Save artifacts
    save_dir = Path(__file__).parent.parent.parent / "models" / "trained"
    save_dir.mkdir(parents=True, exist_ok=True)
    
    with open(save_dir / "causal_dag.pkl", "wb") as f:
        pickle.dump(dag, f)
        
    with open(save_dir / "treatment_model.pkl", "wb") as f:
        pickle.dump(handler, f)
        
    print(f"Causal training complete. Artifacts saved to {save_dir}/")

if __name__ == "__main__":
    train_causal()
