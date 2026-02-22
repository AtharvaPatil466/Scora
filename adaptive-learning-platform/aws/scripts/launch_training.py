import boto3
import json
import time
from datetime import datetime

# Configuration (In a real setup, these would come from training_config.yaml or .env)
STATE_MACHINE_ARN = "arn:aws:states:us-east-1:ACCOUNT_ID:stateMachine:AdaptiveLearningTraining"

def launch_training():
    sf_client = boto3.client('stepfunctions', region_name='us-east-1')
    
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    execution_name = f"training-pipeline-{timestamp}"
    
    # Input parameters for the state machine
    input_params = {
        "gnn_job_name": f"gnn-job-{timestamp}",
        "causal_job_name": f"causal-job-{timestamp}",
        "cql_job_name": f"cql-job-{timestamp}",
        "pearl_job_name": f"pearl-job-{timestamp}"
    }
    
    print(f"Starting execution: {execution_name}")
    response = sf_client.start_execution(
        stateMachineArn=STATE_MACHINE_ARN,
        name=execution_name,
        input=json.dumps(input_params)
    )
    
    execution_arn = response['executionArn']
    print(f"Execution started. ARN: {execution_arn}")
    return execution_arn

def monitor_execution(execution_arn):
    sf_client = boto3.client('stepfunctions', region_name='us-east-1')
    
    print("Monitoring execution...")
    while True:
        response = sf_client.describe_execution(executionArn=execution_arn)
        status = response['status']
        print(f"Current Status: {status}")
        
        if status in ['SUCCEEDED', 'FAILED', 'TIMED_OUT', 'ABORTED']:
            print(f"Execution finished with status: {status}")
            if status == 'FAILED':
                # Fetch more details if possible
                pass
            break
            
        time.sleep(60) # Poll every 60 seconds

if __name__ == "__main__":
    try:
        # In this demo, we can't actually call AWS without real credentials.
        # This script is provided as the implementation for Task 4.3.
        print("Ready to launch training pipeline.")
        # exec_arn = launch_training()
        # monitor_execution(exec_arn)
    except Exception as e:
        print(f"Error: {e}")
