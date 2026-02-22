import json
import os
import datetime
from typing import Dict, Any

# Mocking boto3 for local testing/hybrid setup flexibility.
# In a real AWS environment, we use standard boto3.
try:
    import boto3
    dynamodb = boto3.resource('dynamodb')
    sagemaker_runtime = boto3.client('sagemaker-runtime')
except ImportError:
    boto3 = None
    dynamodb = None
    sagemaker_runtime = None

# Fallback local pipeline loading logic if running outside lambda
try:
    from pipeline import AdaptiveLearningPipeline
    local_pipeline = AdaptiveLearningPipeline(models_dir="models/")
except Exception as e:
    local_pipeline = None

STUDENT_STATES_TABLE = os.environ.get('STUDENT_STATES_TABLE', 'StudentStates-prod')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main recommendation logic for API Gateway proxy integration.
    Trigger: POST /students/{id}/recommend
    """
    try:
        # Extract path parameter
        path_parameters = event.get('pathParameters', {})
        student_id = path_parameters.get('id', '')
        
        # Parse body for options
        body = {}
        if event.get('body'):
            body = json.loads(event.get('body', '{}'))
        
        top_k = body.get('num_recommendations', 5)

        if not student_id:
            return _error_response(400, "Missing student_id in path parameters")

        # 1. Fetch student state from DynamoDB
        student_state = _get_student_state(student_id)
        
        # If student doesn't exist, create a baseline default profile
        if not student_state:
            student_state = {
                "student_id": student_id,
                "knowledge_state": [0.0] * 50,  # default 50 concepts
                "learning_style": "visual",
                "interaction_history": []
            }

        ks = student_state.get('knowledge_state', [0.0]*50)
        history = student_state.get('interaction_history', [])
        
        # Build student features dictionary
        student_features = {
            "skill_level": sum(ks) / max(1, len(ks)),
            "learning_rate": student_state.get('learning_velocity', 0.05),
        }

        # 2. Invoke Machine Learning Pipeline
        # If we have SageMaker endpoints configured via ENV vars (Prod)
        if os.environ.get('GNN_ENDPOINT'):
            recommendations_data = _invoke_sagemaker_pipeline(
                student_id, student_state, history, top_k
            )
        # Fallback to local pipeline (Dev/Local testing)
        elif local_pipeline is not None:
            recommendations_data = local_pipeline.recommend(
                knowledge_state=ks,
                student_features=student_features,
                interaction_history=history,
                top_k=top_k
            )
        else:
            return _error_response(500, "ML Pipeline not available locally or via SageMaker endpoints")

        response_body = {
            "student_id": student_id,
            "recommendations": recommendations_data.get("recommendations", []),
            "reasoning": recommendations_data.get("causal_insight", {}),
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "student_summary": recommendations_data.get("student_summary", {})
        }

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps(response_body)
        }

    except Exception as e:
        print(f"Error in recommendation_handler: {e}")
        return _error_response(500, str(e))

def _get_student_state(student_id: str) -> Dict:
    """Fetch student state from DynamoDB"""
    if not dynamodb:
        return {} # Fallback to local defaults if no DB connection
        
    try:
        table = dynamodb.Table(STUDENT_STATES_TABLE)
        response = table.get_item(Key={'student_id': student_id})
        return response.get('Item', {})
    except Exception as e:
        print(f"DynamoDB lookup failed: {e}")
        return {}

def _invoke_sagemaker_pipeline(student_id: str, state: Dict, history: list, top_k: int) -> Dict:
    """Mock integration: In a real system, would orchestrate actual SageMaker calls"""
    # E.g. call GNN -> call PEARL -> call CQL endpoints
    # For now, if we are in this block but don't have the explicit HTTP proxy logic, fallback.
    return {
        "recommendations": [],
        "causal_insight": "SageMaker orchestration stub. Use local_pipeline for now.",
    }

def _error_response(status: int, message: str) -> Dict:
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps({"error": message})
    }

# Local test execution
if __name__ == "__main__":
    test_event = {
        "pathParameters": {"id": "test_student"},
        "body": '{"num_recommendations": 3}'
    }
    print(json.dumps(lambda_handler(test_event, None), indent=2))
