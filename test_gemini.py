import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

for model_name in ["models/embedding-001", "models/text-embedding-004", "text-embedding-004"]:
    try:
        embeddings = GoogleGenerativeAIEmbeddings(model=model_name, google_api_key=api_key)
        embeddings.embed_query("hello")
        print(f"{model_name}: Success")
    except Exception as e:
        print(f"{model_name}: Error - {e}")
