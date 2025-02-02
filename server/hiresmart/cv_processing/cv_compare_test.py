import os
import csv
import time
import requests
from groq import Groq
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm
import sys
import time

# Add the parent directory to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from processing.text_extraction import extract_text

def extract_text_from_pdf(file_path):
    """Reusing your existing extract_text function"""
    start_time = time.time()
    text = extract_text(file_path)
    extraction_time = time.time() - start_time
    return text, extraction_time

def get_groq_summary(text, retry_count=0):
    """Get summary from Groq API with rate limit handling"""
    start_time = time.time()
    max_retries = 3
    
    try:
        client = Groq(
            api_key="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"
        )
        
        prompt = f"Summarize this CV concisely, focusing on key qualifications and experience: {text}"
        
        # Add delay between requests to respect rate limits
        time.sleep(3)
        
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama3-8b-8192",
            temperature=0.3,
            max_tokens=300
        )
        
        completion_time = time.time() - start_time
        return chat_completion.choices[0].message.content, completion_time
        
    except Exception as e:
        if "rate_limit_exceeded" in str(e) and retry_count < max_retries:
            wait_time = 15  # default wait time
            try:
                import re
                wait_match = re.search(r'try again in (\d+\.?\d*)s', str(e))
                if wait_match:
                    wait_time = float(wait_match.group(1)) + 1
            except:
                pass
            
            print(f"\nRate limit hit. Waiting {wait_time} seconds before retry...")
            time.sleep(wait_time)
            return get_groq_summary(text, retry_count + 1)
        else:
            raise e

def get_local_api_summary(file_path):
    """Get summary from your local API"""
    start_time = time.time()
    
    url = "http://127.0.0.1:8000/summarize/"
    
    files = {'files': open(file_path, 'rb')}
    response = requests.post(url, files=files)
    response.raise_for_status()
    
    file_info = response.json()['files'][0]
    
    summary_response = requests.post(
        url,
        data={
            'summarize_request': True,
            'file_name': file_info['name']
        }
    )
    summary_response.raise_for_status()
    
    completion_time = time.time() - start_time
    return summary_response.json()['summary'], completion_time

def process_single_cv(file_path):
    """Process a single CV and return comparison results"""
    try:
        cv_text, extraction_time = extract_text_from_pdf(file_path)
        local_summary, local_time = get_local_api_summary(file_path)
        groq_summary, groq_time = get_groq_summary(cv_text)
        
        return {
            'file_name': os.path.basename(file_path),
            'extraction_time': round(extraction_time, 2),
            'local_api_time': round(local_time, 2),
            'groq_api_time': round(groq_time, 2),
            'total_local_time': round(extraction_time + local_time, 2),
            'total_groq_time': round(extraction_time + groq_time, 2),
            'local_api_summary': local_summary,
            'groq_summary': groq_summary
        }
    except Exception as e:
        print(f"\nError processing {file_path}: {str(e)}")
        return None

def write_csv_header(csv_file):
    """Write the CSV header"""
    fieldnames = [
        'file_name',
        'extraction_time',
        'local_api_time',
        'groq_api_time',
        'total_local_time',
        'total_groq_time',
        'local_api_summary',
        'groq_summary'
    ]
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

def append_to_csv(result, csv_file):
    """Append a single result to the CSV file"""
    fieldnames = [
        'file_name',
        'extraction_time',
        'local_api_time',
        'groq_api_time',
        'total_local_time',
        'total_groq_time',
        'local_api_summary',
        'groq_summary'
    ]
    with open(csv_file, 'a', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writerow(result)

def compare_summaries(input_folder, output_csv):
    """Compare summaries for all CVs in a folder and save to CSV incrementally"""
    if not os.path.exists(input_folder):
        os.makedirs(input_folder)
        print(f"Created input folder: {input_folder}")
    
    pdf_files = [
        os.path.join(input_folder, f) 
        for f in os.listdir(input_folder) 
        if f.lower().endswith('.pdf')
    ]
    
    if not pdf_files:
        print(f"No PDF files found in {input_folder}")
        return
    
    # Initialize CSV with headers
    write_csv_header(output_csv)
    
    # Initialize counters for averaging
    total_extraction_time = 0
    total_local_time = 0
    total_groq_time = 0
    processed_count = 0
    
    # Create progress bar
    pbar = tqdm(total=len(pdf_files), desc="Processing CVs")
    
    # Process files with reduced parallelism
    with ThreadPoolExecutor(max_workers=2) as executor:
        # Submit all tasks
        future_to_file = {executor.submit(process_single_cv, file): file for file in pdf_files}
        
        # Process completed tasks as they finish
        for future in as_completed(future_to_file):
            result = future.result()
            if result:
                # Write result to CSV immediately
                append_to_csv(result, output_csv)
                
                # Update averages
                total_extraction_time += result['extraction_time']
                total_local_time += result['local_api_time']
                total_groq_time += result['groq_api_time']
                processed_count += 1
                
                # Print current averages
                print(f"\nCurrent Averages ({processed_count} files processed):")
                print(f"Text Extraction: {total_extraction_time/processed_count:.2f} seconds")
                print(f"Local API: {total_local_time/processed_count:.2f} seconds")
                print(f"Groq API: {total_groq_time/processed_count:.2f} seconds")
            
            pbar.update(1)
    
    pbar.close()
    print(f"\nComparison completed. Results saved to {output_csv}")

if __name__ == "__main__":
    input_folder = os.path.join(os.getcwd(), "uploaded_cvs")
    output_csv = "summarization_comparison.csv"
    
    compare_summaries(input_folder, output_csv)