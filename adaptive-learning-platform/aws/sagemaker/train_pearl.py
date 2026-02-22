import argparse
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '../../src'))
from training.pearl_training import train_pearl

if __name__ == "__main__":
    print("Launching PEARL Meta-Learning from SageMaker...")
    train_pearl()
