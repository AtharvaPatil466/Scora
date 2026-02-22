import torch
import torch.nn as nn
import torch.nn.functional as F
import pickle
import numpy as np
import yaml
from pathlib import Path
from collections import deque
import random

class QNetwork(nn.Module):
    def __init__(self, state_dim, action_dim):
        super(QNetwork, self).__init__()
        self.fc1 = nn.Linear(state_dim, 256)
        self.fc2 = nn.Linear(256, 128)
        self.fc3 = nn.Linear(128, action_dim)
        
    def forward(self, state):
        x = F.relu(self.fc1(state))
        x = F.relu(self.fc2(x))
        return self.fc3(x)

class ReplayBuffer:
    def __init__(self, max_size=10000):
        self.buffer = deque(maxlen=max_size)
        
    def push(self, state, action, reward, next_state):
        self.buffer.append((state, action, reward, next_state))
        
    def sample(self, batch_size):
        batch = random.sample(self.buffer, batch_size)
        state, action, reward, next_state = zip(*batch)
        return (torch.FloatTensor(np.array(state)), 
                torch.LongTensor(action), 
                torch.FloatTensor(reward), 
                torch.FloatTensor(np.array(next_state)))

def load_data():
    project_root = Path(__file__).parent.parent.parent
    data_path = project_root / "data" / "processed" / "student_trajectories.pkl"
    embed_path = project_root / "models" / "trained" / "concept_embeddings.pt"
    
    with open(data_path, "rb") as f:
        trajectories = pickle.load(f)
    
    # Check if embeddings exist, if not we'll need to wait for GNN to finish
    if not embed_path.exists():
        return trajectories, None
        
    embeddings = torch.load(embed_path)
    return trajectories, embeddings

def train_cql():
    config_path = Path(__file__).parent.parent.parent / "config" / "training_config.yaml"
    with open(config_path, "r") as f:
        config = yaml.safe_load(f)["cql"]
        
    trajectories, embeddings = load_data()
    if embeddings is None:
        print("Error: concept_embeddings.pt not found. Ensure GNN training is complete.")
        return

    # Build Replay Buffer
    buffer = ReplayBuffer(max_size=config["buffer_size"])
    action_dim = 50 # 50 concepts
    # State dim = concept_embedding_dim (32) * 3 (current, mean, max) + auxiliary? 
    # Roadmap suggests 96 (32 * 3)
    
    print("Preparing replay buffer...")
    for student in trajectories:
        interactions = student["interactions"]
        for i in range(len(interactions) - 1):
            curr = interactions[i]
            nxt = interactions[i+1]
            
            # Construct state: current concept embedding + knowledge state
            # Knowledge state is 50-dim. Summing/projecting it or using raw?
            # Roadmap says state_dim=96. Let's use embed(curr) + mean(state) + difficulty?
            # Or simplified: current concept embed (32) + next concept embed (32) + something?
            # Actually, state is usually the knowledge vector (50) + current concept embed (32) = 82?
            # Let's stick to a 96-dim state as requested:
            # state = [embed(curr_content), knowledge_mean, knowledge_max, difficulty, time_spent, ...]
            # For simplicity, let's use a zero-padded version of embeddings if needed to hit 96
            
            embed_idx = curr["content_id"]
            state = np.zeros(96)
            state[:32] = embeddings[embed_idx].detach().numpy()
            state[32:82] = curr["knowledge_state"]
            # padding the rest with metadata
            state[82] = curr["difficulty"]
            state[83] = curr["time_spent"] / 300.0
            
            nxt_embed_idx = nxt["content_id"]
            next_state = np.zeros(96)
            next_state[:32] = embeddings[nxt_embed_idx].detach().numpy()
            next_state[32:82] = nxt["knowledge_state"]
            next_state[82] = nxt["difficulty"]
            next_state[83] = nxt["time_spent"] / 300.0
            
            buffer.push(state, curr["content_id"], curr["reward"], next_state)

    q_net = QNetwork(96, action_dim)
    target_q_net = QNetwork(96, action_dim)
    target_q_net.load_state_dict(q_net.state_dict())
    
    optimizer = torch.optim.Adam(q_net.parameters(), lr=1e-3)
    gamma = config["gamma"]
    alpha = config["cql_alpha"]
    
    print("Starting CQL training...")
    for epoch in range(config["epochs"]):
        if len(buffer.buffer) < config["batch_size"]:
            continue
            
        states, actions, rewards, next_states = buffer.sample(config["batch_size"])
        
        # Current Q values
        current_q = q_net(states).gather(1, actions.unsqueeze(1)).squeeze(1)
        
        # Target Q values
        with torch.no_grad():
            max_next_q = target_q_net(next_states).max(1)[0]
            target_q = rewards + gamma * max_next_q
            
        # TD Loss
        td_loss = F.mse_loss(current_q, target_q)
        
        # CQL Penalty: logsumexp(Q) - Q(s,a)
        random_q = q_net(states)
        cql_loss = torch.logsumexp(random_q, dim=1).mean() - current_q.mean()
        
        loss = td_loss + alpha * cql_loss
        
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        
        # Soft update target network
        if epoch % 100 == 0:
            target_q_net.load_state_dict(q_net.state_dict())
            print(f"Epoch {epoch:03d}, Loss: {loss.item():.4f}, TD: {td_loss.item():.4f}, CQL: {cql_loss.item():.4f}")
            
    # Save model
    save_dir = Path(__file__).parent.parent.parent / "models" / "trained"
    torch.save(q_net.state_dict(), save_dir / "cql_model.pth")
    print(f"CQL Training complete. Model saved to {save_dir}/cql_model.pth")

if __name__ == "__main__":
    train_cql()
