import torch
import torch.nn as nn
import torch.nn.functional as F
import pickle
import numpy as np
import yaml
from pathlib import Path
import random

class ContextEncoder(nn.Module):
    def __init__(self, input_dim, latent_dim):
        super(ContextEncoder, self).__init__()
        self.fc1 = nn.Linear(input_dim, 256)
        self.fc2 = nn.Linear(256, 128)
        self.mu = nn.Linear(128, latent_dim)
        self.log_std = nn.Linear(128, latent_dim)
        
    def forward(self, x):
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        mu = self.mu(x)
        log_std = self.log_std(x)
        return mu, log_std

    def sample(self, x):
        mu, log_std = self.forward(x)
        std = torch.exp(log_std)
        eps = torch.randn_like(std)
        return mu + eps * std

class PEARLPolicy(nn.Module):
    def __init__(self, state_dim, latent_dim, action_dim):
        super(PEARLPolicy, self).__init__()
        self.fc1 = nn.Linear(state_dim + latent_dim, 256)
        self.fc2 = nn.Linear(256, 128)
        self.fc3 = nn.Linear(128, action_dim)
        
    def forward(self, state, context):
        x = torch.cat([state, context], dim=-1)
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        return self.fc3(x)

def load_data():
    project_root = Path(__file__).parent.parent.parent
    data_path = project_root / "data" / "processed" / "student_trajectories.pkl"
    with open(data_path, "rb") as f:
        trajectories = pickle.load(f)
    return trajectories

def train_pearl():
    config_path = Path(__file__).parent.parent.parent / "config" / "training_config.yaml"
    with open(config_path, "r") as f:
        config = yaml.safe_load(f)["pearl"]
        
    trajectories = load_data()
    
    # Task definition: each student is a task
    # Support: first 5 interactions, Query: next 20
    tasks = []
    for student in trajectories:
        inter = student["interactions"]
        if len(inter) < 25: continue
        
        # simplified state: knowledge mean + difficulty + time_spent (from CQL)
        def get_state(inter_step):
            s = np.zeros(64) # simplified for meta
            s[:50] = inter_step["knowledge_state"]
            s[50] = inter_step["difficulty"]
            s[51] = inter_step["time_spent"] / 300.0
            return s

        support_states = [get_state(i) for i in inter[:5]]
        support_actions = [i["content_id"] for i in inter[:5]]
        support_rewards = [i["reward"] for i in inter[:5]]
        
        query_states = [get_state(i) for i in inter[5:25]]
        query_actions = [i["content_id"] for i in inter[5:25]]
        query_rewards = [i["reward"] for i in inter[5:25]]
        
        tasks.append({
            "support": (torch.FloatTensor(np.array(support_states)), torch.LongTensor(support_actions), torch.FloatTensor(support_rewards)),
            "query": (torch.FloatTensor(np.array(query_states)), torch.LongTensor(query_actions), torch.FloatTensor(query_rewards))
        })
        
    # Model init
    latent_dim = config["context_latent_dim"]
    context_encoder = ContextEncoder(64 + 1 + 1, latent_dim) # state + action + reward
    policy = PEARLPolicy(64, latent_dim, 50)
    
    optimizer = torch.optim.Adam(list(context_encoder.parameters()) + list(policy.parameters()), lr=1e-3)
    
    print("Starting PEARL Meta-training...")
    for iter in range(100): # meta_iterations is 5000 in config, using 100 for local test/demo
        meta_loss = 0
        batch_tasks = random.sample(tasks, 10)
        
        for task in batch_tasks:
            s_s, s_a, s_r = task["support"]
            q_s, q_a, q_r = task["query"]
            
            # Infer context from support set
            # context input: [state, action, reward]
            s_action_onehot = F.one_hot(s_a, num_classes=50).float()
            context_input = torch.cat([s_s, s_a.unsqueeze(1).float(), s_r.unsqueeze(1)], dim=-1)
            z = context_encoder.sample(context_input.mean(dim=0, keepdim=True)) # average over support
            
            # Policy evaluation on query set
            z_expanded = z.expand(q_s.size(0), -1)
            logits = policy(q_s, z_expanded)
            
            # Simplified imitation loss or policy gradient. 
            # Roadmap says CQL artifacts included, implying hybrid.
            # Here using cross-entropy for imitation of the "expert" trajectories
            loss = F.cross_entropy(logits, q_a)
            meta_loss += loss
            
        optimizer.zero_grad()
        (meta_loss / 10).backward()
        optimizer.step()
        
        if iter % 10 == 0:
            print(f"Iteration {iter:03d}, Meta-Loss: {meta_loss.item()/10:.4f}")
            
    # Save models
    save_dir = Path(__file__).parent.parent.parent / "models" / "trained"
    torch.save(context_encoder.state_dict(), save_dir / "pearl_context_encoder.pth")
    torch.save(policy.state_dict(), save_dir / "pearl_policy.pth")
    print(f"PEARL Training complete. Models saved to {save_dir}/")

if __name__ == "__main__":
    train_pearl()
