import urllib.request
from backend.database import get_supabase_client
client = get_supabase_client()
res = client.storage.from_("documents").create_signed_url("test.txt", 3600)
url = res["signedURL"]
print("Signed URL:", url)
try:
    req = urllib.request.urlopen(url)
    print("Status:", req.status, req.read())
except Exception as e:
    print("Error:", e)
