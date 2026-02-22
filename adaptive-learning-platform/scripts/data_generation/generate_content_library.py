import json
import random
from uuid import uuid4

def main():
    print("Generating content library...")
    content_types = ["video", "quiz", "reading", "interactive"]
    library = []
    
    for i in range(500):
        item = {
            "content_id": f"content_{uuid4()}",
            "title": f"Content Unit {i}",
            "content_type": random.choice(content_types),
            "difficulty": random.uniform(0.1, 0.9),
            "concept_id": f"concept_{random.randint(0, 49)}",
            "estimated_time_minutes": random.randint(5, 30),
            "effectiveness_score": random.uniform(0.1, 0.25)
        }
        library.append(item)
        
    with open("data/raw/content_library.json", "w") as f:
        json.dump(library, f, indent=2)
    print("Done! Generated 500 content items.")

if __name__ == "__main__":
    import os
    os.makedirs("data/raw", exist_ok=True)
    main()
