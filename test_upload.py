import urllib.request
from backend.database import get_supabase_client
client = get_supabase_client()
try:
    client.storage.from_("documents").upload("test.txt", b"hello world")
except:
    pass
url = client.storage.from_("documents").get_public_url("test.txt")
print("Public URL:", url)
try:
    res = urllib.request.urlopen(url)
    print("Status:", res.status, res.read())
except Exception as e:
    print("Error:", e)
