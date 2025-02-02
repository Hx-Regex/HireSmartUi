import os
from django.shortcuts import render
from django.http import JsonResponse
from .processing.rank_cvs import rank_cvs
from .processing.chat import rag_query
from .processing.utils import embed_cvs_and_store
from .processing.text_extraction import extract_text
from .processing.ner import extract_entities
from .processing.text_summarization import summarize_text, summarize_section_with_llama
import logging

logger = logging.getLogger(__name__)

# Define the directory for CV uploads
upload_dir = os.path.join(os.getcwd(), "uploaded_cvs")
if not os.path.exists(upload_dir):
    os.makedirs(upload_dir)

def save_uploaded_file(uploaded_file):
    file_path = os.path.join(upload_dir, uploaded_file.name)
    with open(file_path, "wb") as temp_file:
        temp_file.write(uploaded_file.read())
    return file_path

def index_view(request):
    return render(request, "cv_processing/index.html")

def rank_cvs_view(request):
    if request.method == "POST":
        try:
            if "files" in request.FILES:
                uploaded_files = request.FILES.getlist("files")
                file_info = []
                
                for uploaded_file in uploaded_files:
                    file_path = save_uploaded_file(uploaded_file)
                    file_info.append({
                        "name": uploaded_file.name,
                        "path": file_path
                    })
                
                return JsonResponse({
                    "message": "CVs uploaded successfully",
                    "files": file_info
                })
            
            elif "rank_request" in request.POST:
                job_description = request.POST.get("job_description")
                selected_files = request.POST.getlist("selected_files")
                
                if not job_description:
                    return JsonResponse({"error": "Job description is required."}, status=400)
                
                if not selected_files:
                    return JsonResponse({"error": "No CVs selected for ranking."}, status=400)
                
                file_paths = [os.path.join(upload_dir, file) for file in selected_files]
                
                ranked_results = rank_cvs(file_paths, job_description)
                ranked_results_serializable = [(float(score), os.path.basename(cv_name)) for score, cv_name in ranked_results]

                return JsonResponse({"ranked_cvs": ranked_results_serializable})

        except Exception as e:
            logger.error(f"Error ranking CVs: {str(e)}", exc_info=True)
            return JsonResponse({"error": str(e)}, status=500)

    return render(request, "cv_processing/rank_cvs.html")

def chat_view(request):
    if request.method == "POST":
        try:
            if "files" in request.FILES:
                uploaded_files = request.FILES.getlist("files")
                file_info = []
                
                for uploaded_file in uploaded_files:
                    file_path = save_uploaded_file(uploaded_file)
                    file_info.append({
                        "name": uploaded_file.name,
                        "path": file_path
                    })
                
                return JsonResponse({
                    "message": "CVs uploaded successfully",
                    "files": file_info
                })
            
            elif "query" in request.POST:
                selected_files = request.POST.getlist("selected_files")
                if not selected_files:
                    return JsonResponse({"error": "Please select at least one CV file"}, status=400)
                
                # Get the full paths for the selected files
                file_paths = [os.path.join(upload_dir, file) for file in selected_files]
                
                # Check if all selected files exist
                missing_files = [file for file in file_paths if not os.path.exists(file)]
                if missing_files:
                    return JsonResponse({"error": f"Selected file(s) not found: {', '.join(missing_files)}"}, status=404)
                
                query = request.POST.get("query")
                # Create index from selected files
                index = embed_cvs_and_store(file_paths)
                response = rag_query(query, index)
                
                if not isinstance(response, str):
                    response = str(response)
                    
                return JsonResponse({"response": response})
                
        except Exception as e:
            logger.error(f"Error in chat: {str(e)}", exc_info=True)
            return JsonResponse({"error": str(e)}, status=500)
            
    return render(request, "cv_processing/chat.html")

def summarize_view(request):
    if request.method == "POST":
        try:
            if "files" in request.FILES:
                uploaded_files = request.FILES.getlist("files")
                file_info = []
                
                for uploaded_file in uploaded_files:
                    file_path = save_uploaded_file(uploaded_file)
                    file_info.append({
                        "name": uploaded_file.name,
                        "path": file_path
                    })
                
                return JsonResponse({
                    "message": "CVs uploaded successfully",
                    "files": file_info
                })
            
            elif "summarize_request" in request.POST:
                file_name = request.POST.get("file_name")
                if not file_name:
                    return JsonResponse({"error": "Please select a CV file"}, status=400)
                
                section = request.POST.get("section", "")
                file_path = os.path.join(upload_dir, file_name)
                
                if not os.path.exists(file_path):
                    return JsonResponse({"error": "File not found"}, status=404)
                
                with open(file_path, 'rb') as file:
                    text = extract_text(file_path) 
                    ner  = extract_entities(text)
                    print(ner)
                if section:
                    summary = summarize_section_with_llama(text, section)
                else:
                    summary = summarize_text(text)
                
                return JsonResponse({"summary": summary,"ner": ner,"fulltext" : text})
                
        except Exception as e:
            logger.error(f"Error in summarization: {str(e)}", exc_info=True)
            return JsonResponse({"error": str(e)}, status=500)
            
    return render(request, "cv_processing/summarize.html")


def delete_cv(request):
    if request.method == "POST":
        try:
            file_name = request.POST.get("file_name")
            if not file_name:
                return JsonResponse({"error": "File name is required."}, status=400)
            
            # Remove from session
            if 'uploaded_cvs' in request.session:
                if file_name in request.session['uploaded_cvs']:
                    request.session['uploaded_cvs'].remove(file_name)
                    request.session.modified = True
                    
                    # Optionally remove file from disk
                    file_path = os.path.join(upload_dir, file_name)
                    if os.path.exists(file_path):
                        os.remove(file_path)
                    
                    return JsonResponse({"message": "File deleted successfully"})
                
            return JsonResponse({"error": "File not found in current session"}, status=404)
        except Exception as e:
            logger.error(f"Error deleting CV: {str(e)}", exc_info=True)
            return JsonResponse({"error": str(e)}, status=500)
