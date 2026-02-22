import json
import random
from uuid import uuid4
from datetime import datetime

def main():
    print("Generating synthetic students...")
    students = []
    # 1000 students
    for i in range(1000):
        student = {
            "student_id": f"student_{uuid4()}",
            "name": f"Student {i}",
            "grade_level": random.choice(["8", "9", "10", "11"]),
            "learning_style": random.choice(["visual", "auditory", "reading/writing", "kinesthetic"]),
            "subject_interests": random.sample(["math", "science", "history", "english"], 2),
            "knowledge_state": [random.random() for _ in range(50)], # 50 concepts
        }
        students.append(student)
        
    with open("data/raw/synthetic_students.json", "w") as f:
        json.dump(students, f, indent=2)
    print("Done! Generated 1000 students.")

if __name__ == "__main__":
    import os
    os.makedirs("data/raw", exist_ok=True)
    main()
