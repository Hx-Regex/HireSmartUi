from cv_processing.processing.chat import rag_query
from cv_processing.processing.utils import embed_cvs_and_store

# Mock data for testing
query = "What are the qualifications of the candidate?"
# Assuming you have an index created for testing
index = embed_cvs_and_store(["uploaded_cvs/2025-TAZI-MOHANNAD-PFE-DataScience--En.pdf"])  # Replace with actual paths

# Test the chat query function
response = rag_query(query, index)
print("Chat Response:", response) 