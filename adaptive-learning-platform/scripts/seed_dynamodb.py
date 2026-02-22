import os
import time
import uuid

try:
    import boto3
    # Use local DynamoDB if testing locally
    dynamodb = boto3.resource('dynamodb', endpoint_url='http://localhost:8000', region_name='us-east-1')
except ImportError:
    dynamodb = None
    print("boto3 not installed, script requires boto3")

STUDENT_STATES_TABLE = 'StudentStates-prod'
CONTENT_LIBRARY_TABLE = 'ContentLibrary-prod'
INTERACTION_LOGS_TABLE = 'InteractionLogs-prod'

def create_tables():
    if not dynamodb:
        return
        
    try:
        # StudentStates
        dynamodb.create_table(
            TableName=STUDENT_STATES_TABLE,
            KeySchema=[{'AttributeName': 'student_id', 'KeyType': 'HASH'}],
            AttributeDefinitions=[{'AttributeName': 'student_id', 'AttributeType': 'S'}],
            BillingMode='PAY_PER_REQUEST'
        )
        print(f"Created table {STUDENT_STATES_TABLE}")
        
        # ContentLibrary
        dynamodb.create_table(
            TableName=CONTENT_LIBRARY_TABLE,
            KeySchema=[{'AttributeName': 'content_id', 'KeyType': 'HASH'}],
            AttributeDefinitions=[{'AttributeName': 'content_id', 'AttributeType': 'S'}],
            BillingMode='PAY_PER_REQUEST'
        )
        print(f"Created table {CONTENT_LIBRARY_TABLE}")
        
        # InteractionLogs
        dynamodb.create_table(
            TableName=INTERACTION_LOGS_TABLE,
            KeySchema=[
                {'AttributeName': 'student_id', 'KeyType': 'HASH'},
                {'AttributeName': 'timestamp', 'KeyType': 'RANGE'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'student_id', 'AttributeType': 'S'},
                {'AttributeName': 'timestamp', 'AttributeType': 'N'},
                {'AttributeName': 'content_id', 'AttributeType': 'S'}
            ],
            GlobalSecondaryIndexes=[{
                'IndexName': 'content_id-index',
                'KeySchema': [
                    {'AttributeName': 'content_id', 'KeyType': 'HASH'},
                    {'AttributeName': 'timestamp', 'KeyType': 'RANGE'}
                ],
                'Projection': {'ProjectionType': 'ALL'}
            }],
            BillingMode='PAY_PER_REQUEST'
        )
        print(f"Created table {INTERACTION_LOGS_TABLE}")
        
    except Exception as e:
        print(f"Tables might already exist: {e}")

def seed_content():
    if not dynamodb:
        return
    table = dynamodb.Table(CONTENT_LIBRARY_TABLE)
    
    concepts = [
        "Arithmetic", "Algebra I", "Geometry", "Algebra II", "Trigonometry", "Pre-Calculus"
    ]
    
    for i in range(500):
        concept_idx = i % len(concepts)
        difficulty = (i % 10 + 1) / 10.0
        c_type = ["video", "quiz", "reading"][i % 3]
        
        table.put_item(Item={
            'content_id': str(i),
            'title': f"{concepts[concept_idx]} - Level {difficulty * 10} {c_type}",
            'description': f"A {c_type} covering {concepts[concept_idx]} concepts.",
            'content_type': c_type,
            'difficulty_level': str(difficulty), # DynamoDB handles floats as strings/Decimals
            'concepts_covered': [concepts[concept_idx]],
            'estimated_time_minutes': 15
        })
    print(f"Seeded 500 items into {CONTENT_LIBRARY_TABLE}")

def seed_students():
    if not dynamodb:
        return
    table = dynamodb.Table(STUDENT_STATES_TABLE)
    
    students = [
        {"id": "alex", "name": "Alex", "kn": [0.1]*50},      # Beginner
        {"id": "sam", "name": "Sam", "kn": [0.5]*50},       # Intermediate 
        {"id": "jo", "name": "Jo", "kn": [0.8]*50}          # Advanced
    ]
    
    # DynamoDB doesn't allow raw floats in lists easily without Decimal mapping via boto3.
    # To keep this generic, we convert them to strings for the mock.
    from decimal import Decimal
    
    for s in students:
        table.put_item(Item={
            'student_id': s["id"],
            'profile': {'name': s["name"], 'learning_style': 'visual'},
            'knowledge_state': [Decimal(str(x)) for x in s["kn"]],
            'total_interactions': 0
        })
    print(f"Seeded students: {[s['id'] for s in students]}")

if __name__ == "__main__":
    print("Initializing Database Seeding...")
    create_tables()
    # Wait for tables to be active
    time.sleep(2)
    seed_content()
    seed_students()
    print("Done!")
