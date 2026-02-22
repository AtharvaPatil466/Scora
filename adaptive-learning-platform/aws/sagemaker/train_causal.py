import argparse
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '../../src'))
from training.causal_training import train_causal

if __name__ == "__main__":
    print("Launching Causal Discovery from SageMaker...")
    train_causal()
