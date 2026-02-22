import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import GATConv
from torch_geometric.utils import negative_sampling
import pickle
import yaml
from pathlib import Path

class KnowledgeGraphGNN(nn.Module):
    def __init__(self, num_nodes, in_channels, hidden_channels, out_channels, heads=4, dropout=0.2):
        super(KnowledgeGraphGNN, self).__init__()
        self.conv1 = GATConv(in_channels, hidden_channels, heads=heads, dropout=dropout)
        self.conv2 = GATConv(hidden_channels * heads, hidden_channels, heads=heads, dropout=dropout)
        self.conv3 = GATConv(hidden_channels * heads, out_channels, heads=1, concat=False, dropout=dropout)
        
    def forward(self, x, edge_index):
        x = F.relu(self.conv1(x, edge_index))
        x = F.dropout(x, p=0.2, training=self.training)
        x = F.relu(self.conv2(x, edge_index))
        x = F.dropout(x, p=0.2, training=self.training)
        x = self.conv3(x, edge_index)
        return x

def load_data():
    project_root = Path(__file__).parent.parent.parent
    data_path = project_root / "data" / "processed" / "knowledge_graph.pkl"
    with open(data_path, "rb") as f:
        kg = pickle.load(f)
    return kg

def prepare_graph(kg):
    num_nodes = len(kg["concepts"])
    # Node features: initial random embeddings or based on difficulty/type
    # Using 10-dim initial features as requested
    x = torch.randn((num_nodes, 10))
    
    edge_index = []
    for edge in kg["edges"]:
        edge_index.append([edge["from"], edge["to"]])
        # Add reverse edges for bidirectionality as requested
        edge_index.append([edge["to"], edge["from"]])
        
    edge_index = torch.tensor(edge_index, dtype=torch.long).t().contiguous()
    return x, edge_index

def train_gnn():
    config_path = Path(__file__).parent.parent.parent / "config" / "training_config.yaml"
    with open(config_path, "r") as f:
        config = yaml.safe_load(f)["gnn"]
        
    kg = load_data()
    x, edge_index = prepare_graph(kg)
    
    model = KnowledgeGraphGNN(
        num_nodes=len(kg["concepts"]),
        in_channels=10,
        hidden_channels=config["hidden_dim"] // config["attention_heads"], # heads * hidden_channels = 128
        out_channels=config["embedding_dim"],
        heads=config["attention_heads"]
    )
    
    optimizer = torch.optim.Adam(model.parameters(), lr=config["learning_rate"])
    
    print("Starting GNN training for link prediction...")
    for epoch in range(config["epochs"]):
        model.train()
        optimizer.zero_grad()
        
        # Link prediction: positive and negative edges
        z = model(x, edge_index)
        
        # Positive edges (original graph)
        pos_edge_index = edge_index
        
        # Negative edges (sampling)
        neg_edge_index = negative_sampling(
            edge_index=pos_edge_index,
            num_nodes=x.size(0),
            num_neg_samples=pos_edge_index.size(1)
        )
        
        # Predict scores
        pos_score = (z[pos_edge_index[0]] * z[pos_edge_index[1]]).sum(dim=-1)
        neg_score = (z[neg_edge_index[0]] * z[neg_edge_index[1]]).sum(dim=-1)
        
        # Binary cross entropy loss
        loss = F.binary_cross_entropy_with_logits(torch.cat([pos_score, neg_score]),
                                                torch.cat([torch.ones(pos_score.size(0)),
                                                          torch.zeros(neg_score.size(0))]))
        
        loss.backward()
        optimizer.step()
        
        if epoch % 10 == 0:
            print(f"Epoch {epoch:03d}, Loss: {loss.item():.4f}")
            
    # Save model and embeddings
    save_dir = Path(__file__).parent.parent.parent / "models" / "trained"
    save_dir.mkdir(parents=True, exist_ok=True)
    
    torch.save(model.state_dict(), save_dir / "gnn_model.pth")
    
    model.eval()
    with torch.no_grad():
        final_embeddings = model(x, edge_index)
    torch.save(final_embeddings, save_dir / "concept_embeddings.pt")
    
    print(f"GNN Training complete. Model saved to {save_dir}/gnn_model.pth")

if __name__ == "__main__":
    train_gnn()
