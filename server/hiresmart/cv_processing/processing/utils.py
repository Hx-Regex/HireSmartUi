import re
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.schema import Document
import os
from langchain_community.vectorstores import Chroma
from langchain_community.document_loaders import TextLoader

import tempfile
from langchain_huggingface import HuggingFaceEmbeddings
from sentence_transformers import SentenceTransformer
from langchain.indexes.vectorstore import VectorstoreIndexCreator


from langchain.schema import Document
import os
from .text_extraction import extract_text

def embed_cvs_and_store(cvs_input, temp_folder="temp_files"):
    # Create the folder if it doesn't exist
    if not os.path.exists(temp_folder):
        os.makedirs(temp_folder)
    
    base_Knowledge = []
    
    for file_path in cvs_input:
        if os.path.isfile(file_path):  # Ensure the file exists
            extracted_text = extract_text(file_path)
            
            # Debugging print for extracted text
            print(f"Extracted text from {file_path}: {extracted_text[:100]}...")  # Show only the first 100 chars

            if extracted_text:
                # Generate a unique file name for each CV to avoid overwriting
                temp_file_name = os.path.join(temp_folder, f"{os.path.basename(file_path)}.txt")
                
                # Write the extracted text to the file in the temp folder
                try:
                    with open(temp_file_name, "w", encoding="utf-8") as temp_file:
                        temp_file.write(extracted_text)
                    
                    # Use TextLoader to load the file
                    base_Knowledge.append(TextLoader(temp_file_name))
                except Exception as e:
                    print(f"Error writing or loading file {temp_file_name}: {e}")
                    continue
    
    # Create the vector store index
    index = VectorstoreIndexCreator(
        embedding=HuggingFaceEmbeddings(model_name='all-MiniLM-L12-v2'),
        text_splitter=RecursiveCharacterTextSplitter(chunk_size=100, chunk_overlap=0)
    ).from_loaders(base_Knowledge)
    
    return index







def clean_text(text):
    """
    Cleans the text by removing unnecessary whitespaces and formatting.
    """
    # Remove extra whitespaces
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    return text


def splitter(text):
    # If `text` is a list, check each item and ensure they are strings
    if isinstance(text, list):
        for item in text:
            if not isinstance(item, str):
                raise ValueError(f"Item '{item}' in the list is not a string. Ensure all items in the list are strings.")
        text = "\n".join(text)  # Join list items into a single string if needed
    elif not isinstance(text, str):
        raise ValueError("Text input to the splitter must be a string or a list of strings.")
    
    # Create a Document object from the input text
    documents = [Document(page_content=text)]

    # Initialize the text splitter
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)

    # Split the Document into chunks
    chunks = text_splitter.split_documents(documents)
    return chunks


def sanitize_input(data):
    return [str(item) for item in data]
