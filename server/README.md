# CV Processing System
This is a Django-based web application designed to process resumes (CVs) and extract meaningful insights. The application performs text extraction, entity recognition, text summarization, and ranking for uploaded CVs.

## Features
- Upload CVs: Accepts multiple CVs in formats such as PDF, DOCX, and TXT.
- Text Extraction: Extracts text content from uploaded resumes.
- Entity Recognition: Identifies entities like Name, Email, and Skills.
- Summarization: Generates concise summaries for resumes.
- Advanced Summarization: Utilizes Llama models for AI-based summarization.
- Ranking: Ranks resumes based on relevance and content.

## Installation
### Prerequisites
> Python 3.8+  
> Django 4.x  
> Virtual environment tool (optional but recommended)  

### Steps
1. Clone the repository:

```bash
git clone https://github.com/mohannadtazi/HireSmart.git
cd cv-processing
```
2. Create and activate a virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```
3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Run the server:

```bash
python manage.py runserver
```
5. Access the application:
Open your browser and navigate to http://127.0.0.1:8000/.

## Directory Structure
```graphql
cv-processing/
│
├── uploaded_cvs/                # Directory for storing uploaded CVs
├── cv_processing/               # Main Django app
│   ├── templates/               # HTML templates for the application
│   ├── processing/              # Core processing scripts
│   │   ├── text_extraction.py   # Extracts text from CVs
│   │   ├── ner.py               # Extracts entities from text
│   │   ├── text_summarization.py # Summarizes extracted text
│   │   ├── rank_cvs.py          # Ranks CVs based on criteria
│   │   ├── chat.py              # Handles RAG queries
│   │   ├── utils.py             # Helper functions
│   ├── views.py                 # Django views for processing requests
│   ├── urls.py                  # URL configuration
│
├── static/                      # Static files (CSS, JS)
├── manage.py                    # Django management script
└── requirements.txt             # Python dependencies
```
## API Endpoints
1. Upload and Process CV
Endpoint: /process_cv/
Method: POST
Request:
Multipart form data containing the CV files (files).
Response:
```json
{
  "results": [
    {
      "text": "Extracted text here...",
      "Entities": [["Name", "John Doe"], ["Email", "john.doe@example.com"]],
      "Summary": "Experienced software developer...",
      "llama_summary": "AI-focused summary..."
    }
  ]
}
```
## Development
### Running in Debug Mode
Use the following command to start the server in debug mode:

```bash
python manage.py runserver
```
### Testing API Endpoints
Use tools like Postman or cURL to test the /process_cv/ endpoint. Example using cURL:

```bash
curl -X POST -F "files=@sample.pdf" http://127.0.0.1:8000/process_cv/
```
## Customization
- Modify the entity recognition logic in processing/ner.py to extract additional entities.
- Update summarization logic in processing/text_summarization.py to tweak output styles.
- Change the ranking criteria in processing/rank_cvs.py.
