# ocr.py

from docling.document_converter import DocumentConverter
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import EasyOcrOptions, PdfPipelineOptions

def process_ocr(image_path: str) -> str:
    """Perform OCR on image or PDF files using Docling's OCR capabilities."""
    
    # Set up OCR pipeline options
    pipeline_options = PdfPipelineOptions()
    pipeline_options.do_ocr = True
    pipeline_options.ocr_options = EasyOcrOptions(force_full_page_ocr=True)

    # Initialize DocumentConverter with OCR pipeline options
    converter = DocumentConverter(
        format_options={InputFormat.PDF: pipeline_options}
    )

    # Convert the document (PDF, image) using Docling
    result = converter.convert(image_path)
    
    # Extract text from the OCR processed document
    ocr_text = result.document.export_to_markdown()
    
    return ocr_text
