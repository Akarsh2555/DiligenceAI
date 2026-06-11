from backend.database import get_supabase_client

client = get_supabase_client()
try:
    client.storage.create_bucket("documents")
    print("Bucket created")
except Exception as e:
    print("Bucket might already exist or error:", e)
