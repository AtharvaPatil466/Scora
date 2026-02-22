import json
import networkx as nx
import random

def main():
    print("Generating knowledge graph...")
    G = nx.DiGraph()
    # 50 concepts
    concepts = [f"concept_{i}" for i in range(50)]
    
    for c in concepts:
        G.add_node(c, name=f"Topic {c.split('_')[1]}", difficulty=random.uniform(0.1, 0.9))
        
    for i in range(1, 50):
        # random prerequisites
        num_prereqs = random.randint(1, 3)
        prereqs = random.sample(concepts[:i], min(num_prereqs, i))
        for p in prereqs:
            G.add_edge(p, concepts[i], type="prerequisite", strength=random.uniform(0.5, 1.0))
            
    data = nx.node_link_data(G)
    
    # Store in raw data folder
    with open("data/raw/knowledge_graph.json", "w") as f:
        json.dump(data, f, indent=2)
    print(f"Done! Generated knowledge graph with 50 nodes and {G.number_of_edges()} edges.")

if __name__ == "__main__":
    import os
    os.makedirs("data/raw", exist_ok=True)
    main()
