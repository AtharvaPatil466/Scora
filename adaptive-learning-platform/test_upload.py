import asyncio
import httpx

async def test_upload():
    print("Testing file upload...")
    # Create an empty sample markdown file
    with open("sample.md", "w") as f:
        f.write("# Sample Notes\\nThis is a test of the extraction and AI expansion pipeline.")
    
    # Upload to /materials/upload
    async with httpx.AsyncClient() as client:
        with open("sample.md", "rb") as f:
            files = {"file": ("sample.md", f, "text/markdown")}
            resp = await client.post(
                "http://localhost:8000/materials/upload?student_id=sam",
                files=files
            )
            print("Upload response:", resp.json())
            
            material_id = resp.json()["material_id"]
            
            print(f"\\nPolling status for material {material_id}...")
            for _ in range(10):
                await asyncio.sleep(2)
                status_resp = await client.get(f"http://localhost:8000/materials/sam/{material_id}/status")
                status = status_resp.json().get("status")
                print(f"Status: {status}")
                if status == "ready":
                    break
            
            print("\\nFetching final result...")
            result = await client.get(f"http://localhost:8000/materials/sam/{material_id}")
            print(result.json())

if __name__ == "__main__":
    asyncio.run(test_upload())
