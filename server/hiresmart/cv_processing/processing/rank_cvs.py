from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import os
from .text_extraction import extract_text  

# Initialize the embedding model once to avoid reloading it repeatedly
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

def calculate_similarity(text1: str, text2: str) -> float:
    """Calculate cosine similarity between two texts."""
    # Generate embeddings for both texts
    embedding1 = embedding_model.encode(text1, convert_to_tensor=True)
    embedding2 = embedding_model.encode(text2, convert_to_tensor=True)
    
    # Compute cosine similarity
    similarity = cosine_similarity([embedding1.cpu().numpy()], [embedding2.cpu().numpy()])
    return similarity[0][0]

def rank_cvs(cvs_input, job_desc_texts):
    """
    Rank CVs based on their similarity to the job description.
    
    Args:
        cvs_input (str or list): Path to a folder, a single file, or a list of file paths.
        job_desc_texts (str): The job description text to compare against.
    
    Returns:
        list: Sorted list of tuples (similarity score, file name).
    """
    scores = []
    
    # Determine input type
    if isinstance(cvs_input, list):
        files = cvs_input
    elif os.path.isfile(cvs_input):
        files = [cvs_input]
    elif os.path.isdir(cvs_input):
        files = [os.path.join(cvs_input, file_name) for file_name in os.listdir(cvs_input)]
    else:
        raise ValueError("Invalid input: cvs_input must be a file, directory, or list of file paths.")
    
    for file_path in files:
        if not os.path.isfile(file_path):
            continue  # Skip invalid paths
        
        extracted_text = extract_text(file_path)
        if not extracted_text:
            continue  # Skip files where text extraction failed
        
        score = calculate_similarity(extracted_text, job_desc_texts)
        scores.append((score, os.path.basename(file_path)))
    
    # Rank CVs based on the scores in descending order
    ranked_cvs = sorted(scores, reverse=True, key=lambda x: x[0])
    return ranked_cvs
