import csv
from rouge_score import rouge_scorer

# Initialize ROUGE scorer
scorer = rouge_scorer.RougeScorer(['rouge1', 'rouge2'], use_stemmer=True)

# Input and output file names
input_csv = 'summarization_comparison.csv'
output_csv = 'summarization_comparison_with_rouge.csv'

# Read and process data
with open(input_csv, 'r', encoding='utf-8') as infile, \
     open(output_csv, 'w', newline='', encoding='utf-8') as outfile:

    csv_reader = csv.DictReader(infile)
    fieldnames = csv_reader.fieldnames + [
        'rouge1_precision', 'rouge1_recall', 'rouge1_f1',
        'rouge2_precision', 'rouge2_recall', 'rouge2_f1'
    ]
    
    csv_writer = csv.DictWriter(outfile, fieldnames=fieldnames)
    csv_writer.writeheader()

    for row in csv_reader:
        local_summary = row['local_api_summary']
        groq_summary = row['groq_summary']
        
        # Skip rows with empty summaries
        if not local_summary or not groq_summary:
            continue
            
        # Calculate ROUGE scores
        scores = scorer.score(groq_summary, local_summary)
        
        # Add ROUGE scores to the row data
        row.update({
            'rouge1_precision': f"{scores['rouge1'].precision:.4f}",
            'rouge1_recall': f"{scores['rouge1'].recall:.4f}",
            'rouge1_f1': f"{scores['rouge1'].fmeasure:.4f}",
            'rouge2_precision': f"{scores['rouge2'].precision:.4f}",
            'rouge2_recall': f"{scores['rouge2'].recall:.4f}",
            'rouge2_f1': f"{scores['rouge2'].fmeasure:.4f}",
        })
        
        csv_writer.writerow(row)

print(f"Processed CSV with ROUGE scores saved to {output_csv}")