import json
import os
from typing import Dict, Any

try:
    import boto3
    bedrock = boto3.client('bedrock-runtime')
except ImportError:
    boto3 = None
    bedrock = None

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Generate personalized content using Bedrock Claude 3.5 Sonnet.
    Trigger: POST /content/generate
    """
    try:
        # Parse request body
        if not event.get('body'):
            return _error_response(400, "Missing request body")
            
        body = json.loads(event.get('body', '{}'))
        student_profile = body.get('student_profile', {})
        concept = body.get('concept', "Unknown Concept")
        content_type = body.get('content_type', 'explanation')
        
        # Build prompt
        prompt = _build_prompt(student_profile, concept, content_type)
        
        # Call Bedrock (if available in AWS environment)
        if bedrock:
            generated_content = _invoke_claude(prompt)
        else:
            # Fallback mock for local testing
            generated_content = _mock_generation(prompt, student_profile, concept)
            
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "generated_content": generated_content,
                "content_type": content_type,
                "concept": concept
            })
        }

    except Exception as e:
        print(f"Error in content_generation_handler: {e}")
        return _error_response(500, str(e))

def _build_prompt(profile: Dict, concept: str, content_type: str) -> str:
    """Construct effective prompt for Claude 3.5 Sonnet"""
    return f"""
    Student Profile:
    - Knowledge Level: {profile.get('knowledge_level', 'intermediate')}
    - Learning Style: {profile.get('learning_style', 'visual')}
    - Recent Struggles: {profile.get('struggles', [])}
    
    Task: Generate a {content_type} for the concept: {concept}
    
    Requirements:
    - Match the student's knowledge level
    - Use {profile.get('learning_style', 'visual')} teaching style/metaphors
    - Be encouraging and clear
    - Keep it concise (2-3 paragraphs)
    """

def _invoke_claude(prompt: str) -> str:
    """Invoke Claude 3.5 Sonnet on AWS Bedrock"""
    try:
        response = bedrock.invoke_model(
            modelId='anthropic.claude-3-5-sonnet-20241022-v2:0',
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 1000,
                "messages": [{
                    "role": "user",
                    "content": prompt
                }]
            })
        )
        
        result = json.loads(response['body'].read())
        return result['content'][0]['text']
    except Exception as e:
        print(f"Bedrock invocation failed: {e}")
        return "Sorry, I am currently unable to generate personalized content. Please refer to standard materials."

def _mock_generation(prompt: str, profile: Dict, concept: str) -> str:
    """Mock generating content locally"""
    style = profile.get('learning_style', 'visual')
    return (
        f"Here is a personalized {style}-focused explanation for {concept}!\n\n"
        f"Imagine {concept} as a building block. Because you are a {style} learner, "
        "picture a bright diagram connecting these blocks together. "
        "Keep up the great work learning this topic!"
    )

def _error_response(status: int, message: str) -> Dict:
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps({"error": message})
    }

# Local test execution
if __name__ == "__main__":
    test_event = {
        "body": json.dumps({
            "student_profile": {
                "knowledge_level": "beginner",
                "learning_style": "visual",
                "struggles": ["calculus"]
            },
            "concept": "Derivatives",
            "content_type": "explanation"
        })
    }
    print(json.dumps(lambda_handler(test_event, None), indent=2))
