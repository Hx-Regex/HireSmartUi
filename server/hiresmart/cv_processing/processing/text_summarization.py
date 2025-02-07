import re
from transformers import pipeline
import os

from typing import Iterable

from langchain_core.documents import Document as LCDocument
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough

from langchain_huggingface import HuggingFaceEndpoint
from transformers import AutoTokenizer

# Load a pre-trained summarization model

#summarizer = pipeline("summarization", model="google/pegasus-cnn_dailymail")
summarizer = pipeline("summarization", model="google/flan-t5-small")
# Initialize the tokenizer
tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-small")

#summarizer = pipeline("summarization", model="t5-small")
def truncate_text(text, max_length=512):
    """
    Tokenizes and truncates the text to the model's maximum length.
    """
    inputs = tokenizer(text, return_tensors="pt", max_length=max_length, truncation=True)
    truncated_text = tokenizer.decode(inputs['input_ids'][0], skip_special_tokens=True)
    return truncated_text


def summarize_text(text):
    """
    Summarizes the entire given text using the Llama model instead of the pre-trained transformer.
    """
    # Use the Llama-based summarization instead of the transformer
    summary = summarize_text_with_llama(text)
    return summary

    

# Load a pre-trained Llama model from HuggingFace for advanced summarization
def load_llama_model():
    HF_API_KEY = os.environ.get("HF_API_KEY")
    HF_LLM_MODEL_ID = "mistralai/Mistral-Small-24B-Instruct-2501"
    return HuggingFaceEndpoint(
        repo_id=HF_LLM_MODEL_ID,
        huggingfacehub_api_token=HF_API_KEY,
        task="text-generation",
    )

def summarize_text_with_llama(text):
    """
    Summarizes the entire CV text concisely using a Llama-based model.
    """
    llama_model = load_llama_model()

    # Prepare the prompt for the Llama model
    prompt_template = PromptTemplate.from_template(
        "The following is a resume.\n---------------------\n{context}\n---------------------\n"
        "Provide a concise summary focusing only on key qualifications, skills, and experience "
        "useful for a recruiter. Limit the summary to 3-5 sentences."
    )

    # Format the prompt with the context (i.e., the provided text)
    formatted_prompt = prompt_template.format(context=text)

    # Pass the formatted prompt string to the model
    result = llama_model.invoke(formatted_prompt)

    # Return the result
    return result.strip()

def summarize_section_with_llama(text, section_name):
    """
    Summarizes a specific section of the CV text using a Llama-based model.
    """
    llama_model = load_llama_model()

    # Prepare the prompt for the Llama model
    prompt_template = PromptTemplate.from_template(
        "Focus only on the section '{section_name}' in the following resume content.\n"
        "---------------------\n{context}\n---------------------\n"
        "Summarize the '{section_name}' section concisely without adding information from other parts. "
        "Limit the summary to 2-3 sentences."
    )

    # Format the prompt with the context (i.e., the provided text)
    formatted_prompt = prompt_template.format(context=text, section_name=section_name)

    # Pass the formatted prompt string to the model
    section_summary = llama_model.invoke(formatted_prompt)

    # Return the section summary
    return section_summary.strip()

def summarize_section(text, section_name):
    """
    Summarizes a specific section of the text using the Llama model.
    """
    # Use the Llama-based section summarization
    section_summary = summarize_section_with_llama(text, section_name)
    return section_summary

    

