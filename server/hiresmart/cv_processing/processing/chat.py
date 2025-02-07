from typing import Iterable
from .text_extraction import extract_text 
from langchain.prompts import PromptTemplate
from langchain_core.output_parsers.string import StrOutputParser
from langchain.chains import LLMChain
from langchain.chains import RetrievalQA
import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq

# Load environment variables from the .env file
load_dotenv()

# Fetch the API key from the environment variables
api_key = os.getenv("GROQ_API_KEY")
model="llama3-70b-8192"

llm = ChatGroq(
    model=model,
    api_key=api_key,
    temperature=0.5,  
)

def rag_query(query, index, llm=llm):
    # Create RetrievalQA chain using the index and language model
    chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type='stuff',
        retriever=index.vectorstore.as_retriever(),
        input_key='question'
    )
    # Generate the response using the language model and the relevant documents
    response = chain.invoke(query)
    # Extract just the answer string from the response
    return response['result'] if isinstance(response, dict) else str(response)
