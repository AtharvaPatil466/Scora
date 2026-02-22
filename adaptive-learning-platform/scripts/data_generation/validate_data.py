import json
import os

def check_file(filename):
    if not os.path.exists(filename):
        print(f"❌ Missing file: {filename}")
        return False
        
    try:
        with open(filename, "r") as f:
            data = json.load(f)
            # networkx node_link_data has a dict, others are lists
            count = len(data.get("nodes", [])) if isinstance(data, dict) and "nodes" in data else len(data)
            print(f"✅ Loaded {filename} ({count} items)")
            return True
    except Exception as e:
        print(f"❌ Error validating {filename}: {e}")
        return False

def main():
    print("Validating datasets...")
    files = [
        "data/raw/synthetic_students.json",
        "data/raw/knowledge_graph.json",
        "data/raw/content_library.json"
    ]
    
    all_valid = all(check_file(f) for f in files)
    if all_valid:
        print("✅ All data validation passed! Data is ready for AWS S3 upload.")
    else:
        print("❌ Data validation failed.")

if __name__ == "__main__":
    main()
