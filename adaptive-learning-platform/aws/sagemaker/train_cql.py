import argparse
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '../../src'))
from training.cql_training import train_cql

if __name__ == "__main__":
    print("Launching CQL Training from SageMaker...")
    train_cql()
