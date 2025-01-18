import unittest
from cv_processing.processing.rank_cvs import rank_cvs
from cv_processing.processing.text_summarization import summarize_text
from cv_processing.processing.chat import rag_query
from cv_processing.processing.utils import embed_cvs_and_store

class TestProcessingFunctions(unittest.TestCase):

    def test_rank_cvs(self):
        job_description = "Data Scientist with experience in machine learning."
        cvs_input = ["path/to/your/test_cv1.pdf", "path/to/your/test_cv2.pdf"]
        ranked_results = rank_cvs(cvs_input, job_description)
        self.assertIsInstance(ranked_results, list)  # Check if the result is a list

    def test_text_summarization(self):
        text = "Data Science is an interdisciplinary field..."
        summary = summarize_text(text)
        self.assertIsInstance(summary, str)  # Check if the result is a string

    def test_chat(self):
        query = "What are the qualifications of the candidate?"
        index = embed_cvs_and_store(["path/to/your/test_cv1.pdf"])
        response = rag_query(query, index)
        self.assertIsInstance(response, str)  # Check if the response is a string

if __name__ == '__main__':
    unittest.main() 