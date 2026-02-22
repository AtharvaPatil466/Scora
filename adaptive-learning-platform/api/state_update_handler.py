import json
import os
import time
import datetime
from typing import Dict, Any, List

try:
    import boto3
    dynamodb = boto3.resource('dynamodb')
except ImportError:
    boto3 = None
    dynamodb = None

STUDENT_STATES_TABLE = os.environ.get('STUDENT_STATES_TABLE', 'StudentStates-prod')
INTERACTION_LOGS_TABLE = os.environ.get('INTERACTION_LOGS_TABLE', 'InteractionLogs-prod')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    State Update logic for API Gateway proxy integration.
    Trigger: POST /students/{id}/interact
    """
    try:
        # Extract path parameter
        path_parameters = event.get('pathParameters', {})
        student_id = path_parameters.get('id', '')
        
        # Parse interaction payload
        if not event.get('body'):
            return _error_response(400, "Missing request body")
        
        body = json.loads(event.get('body', '{}'))
        interaction = _parse_interaction(body)

        if not student_id:
            return _error_response(400, "Missing student_id in path parameters")

        # 1. Fetch current student state
        student_state = _get_student_state(student_id)
        if not student_state:
            # Create a baseline default profile
            student_state = {
                "student_id": student_id,
                "knowledge_state": [0.0] * 50,  # default 50 concepts
                "learning_style": "visual",
                "interaction_history": [],
                "total_interactions": 0
            }

        # 2. Update state based on interaction
        updated_state = _compute_next_state(student_state, interaction)
        
        # 3. Save to DynamoDB
        _persist_interaction(student_id, updated_state, interaction)

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "message": "Interaction logged successfully",
                "updated_knowledge_state": updated_state["knowledge_state"],
                "total_interactions": updated_state["total_interactions"]
            })
        }

    except Exception as e:
        print(f"Error in state_update_handler: {e}")
        return _error_response(500, str(e))

def _parse_interaction(body: Dict) -> Dict:
    return {
        "content_id": body.get('content_id', 0),
        "concept_id": body.get('concept_id', 0),
        "action": body.get('action', 'completed'),
        "performance": body.get('performance', 0.5), # 0.0 to 1.0 score
        "difficulty": body.get('difficulty', 0.5), # 0.0 to 1.0 difficulty
        "time_spent": body.get('time_spent', 60), # seconds
    }

def _get_student_state(student_id: str) -> Dict:
    """Fetch student state from DynamoDB"""
    if not dynamodb:
        return {} 
    try:
        table = dynamodb.Table(STUDENT_STATES_TABLE)
        response = table.get_item(Key={'student_id': student_id})
        return response.get('Item', {})
    except Exception as e:
        print(f"DynamoDB lookup failed: {e}")
        return {}

def _compute_next_state(state: Dict, interaction: Dict) -> Dict:
    """Apply simple heuristic update to knowledge state based on result"""
    ks = list(state.get("knowledge_state", [0.0]*50))
    concept_idx = interaction["concept_id"]
    
    if concept_idx < len(ks):
        # Update rule: Increase mastery if strong performance, decrease if low
        perf = interaction["performance"]
        diff = interaction["difficulty"]
        
        # Reward is higher for getting hard questions right
        # Penalty is higher for getting easy questions wrong
        learning_gain = 0.0
        if perf > 0.7:
            learning_gain = 0.1 + (diff * 0.1) # 0.1 to 0.2
        elif perf < 0.3:
            learning_gain = -0.05 - ((1-diff) * 0.1) # -0.05 to -0.15
        else:
            learning_gain = 0.05 * diff 
            
        # Apply bounds
        ks[concept_idx] = max(0.0, min(1.0, ks[concept_idx] + learning_gain))
        
    state["knowledge_state"] = ks
    state["total_interactions"] = state.get("total_interactions", 0) + 1
    
    # Store simplified history for PEARL context encoding
    history = state.get("interaction_history", [])
    history.append({
        "state": state.get("knowledge_state"), # Original state before update
        "action": interaction["content_id"],
        "reward": perf, 
        "next_state": ks # New state
    })
    
    # Keep only last 10 interactions for context window
    if len(history) > 10:
        history = history[-10:]
    state["interaction_history"] = history
    state["last_interaction"] = datetime.datetime.utcnow().isoformat()
    
    return state

def _persist_interaction(student_id: str, state: Dict, interaction: Dict):
    """Save to Dynamo tables"""
    if not dynamodb:
        # Mock save
        print(f"Mock Save State for {student_id}: interactions = {state['total_interactions']}")
        return
        
    try:
        # Update generic state
        state_table = dynamodb.Table(STUDENT_STATES_TABLE)
        state_table.put_item(Item={
            'student_id': student_id,
            **state
        })
        
        # Append to timeseries log
        log_table = dynamodb.Table(INTERACTION_LOGS_TABLE)
        log_table.put_item(Item={
            'student_id': student_id,
            'timestamp': int(time.time() * 1000), # Unix ms
            'action': interaction,
            'knowledge_state': state['knowledge_state'],
            'session_id': 'auto-gen-session'
        })
    except Exception as e:
        print(f"Failed to persist state: {e}")

def _error_response(status: int, message: str) -> Dict:
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps({"error": message})
    }

# Local test execution
if __name__ == "__main__":
    test_event = {
        "pathParameters": {"id": "test_student"},
        "body": json.dumps({
            "content_id": 42,
            "concept_id": 3,
            "action": "completed",
            "performance": 0.85,
            "difficulty": 0.6,
            "time_spent": 120
        })
    }
    print(json.dumps(lambda_handler(test_event, None), indent=2))
