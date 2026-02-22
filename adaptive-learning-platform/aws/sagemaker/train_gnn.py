import argparse
import os
import sys
from pathlib import Path

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../src'))

from training.gnn_training import train_gnn

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    
    # SageMaker paths
    parser.add_argument('--model-dir', type=str, default=os.environ.get('SM_MODEL_DIR'))
    parser.add_argument('--train', type=str, default=os.environ.get('SM_CHANNEL_TRAIN'))
    
    args, _ = parser.parse_known_args()
    
    # In a real SM job, we'd copy data from args.train to data/processed
    # and call train_gnn. For this demo, we assume data is already there.
    
    print("Launching GNN Training from SageMaker...")
    train_gnn()
