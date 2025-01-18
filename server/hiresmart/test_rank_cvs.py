import os
from cv_processing.processing.rank_cvs import rank_cvs
from cv_processing.processing.utils import embed_cvs_and_store

# Mock data for testing
job_description = "freelance"
cvs_input = [
    "uploaded_cvs/2025-TAZI-MOHANNAD-PFE-DataScience--En.pdf",  # Replace with actual paths to test CVs
    "uploaded_cvs/cv_en.pdf"
]

# Ensure the files exist for testing
for cv in cvs_input:
    if not os.path.isfile(cv):
        print(f"File not found: {cv}")

# Test the ranking function
ranked_results = rank_cvs(cvs_input, job_description)
print("Ranked CVs:", ranked_results) 