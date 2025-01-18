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

"""
def rag(vectorstore, query):
    try:
        if not vectorstore:
            raise ValueError("Vectorstore is not initialized or contains no data.")

        # Embed the query text
        query_embedding = embed_query(query)
        
        # Debugging print for the query_embedding
        print(f"Query embedding type: {type(query_embedding)}")
        
        # Retrieve relevant documents from the vectorstore based on the query embedding
        results = vectorstore.similarity_search(query_embedding, k=3)  # Retrieve top 3 most relevant documents

        print(f"Number of results from vectorstore: {len(results)}")
        # Debugging print for results
        print(f"Number of results from vectorstore: {len(results)}")
        print(f"Results (content): {[result.page_content for result in results]}")
        
        # Format the documents for use in the prompt
        context = "\n\n".join([str(result.page_content) for result in results])

        # Debugging print for context
        print(f"Formatted context:\n{context}")
        
        # Define the prompt template
        prompt = PromptTemplate.from_template(
            "Context information is below.\n---------------------\n{context}\n---------------------\n"
            "Given the context information and no prior knowledge, answer the query.\nQuery: {question}\nAnswer:\n"
        )

        # Combine the context and query in the prompt
        prompt_input = prompt.format(context=context, question=query)
        
        # Debugging print for prompt_input
        print(f"Prompt input:\n{prompt_input}")
        
        # Generate the response using the language model
        response = llm.predict(prompt_input)
        
        # Clean the response (if necessary)
        return response

    except Exception as e:
        import logging
        logging.error(f"Error in RAG query processing: {str(e)}")
        return f"An error occurred while processing the CVs: {e}"
"""