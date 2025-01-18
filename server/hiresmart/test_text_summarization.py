from cv_processing.processing.text_summarization import summarize_text

# Mock text for testing
text = """
Data Science is an interdisciplinary field that uses scientific methods, processes, algorithms and systems to extract knowledge and insights from structured and unstructured data.
"""

# Test the summarization function
summary = summarize_text(text)
print("Summary:", summary) 