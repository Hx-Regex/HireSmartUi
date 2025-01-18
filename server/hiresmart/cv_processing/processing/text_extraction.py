# text_extraction.py

from docling.document_converter import DocumentConverter
from langchain_core.document_loaders import BaseLoader
from langchain_core.documents import Document as LCDocument
from .ocr import process_ocr
from typing import Union


class DoclingPDFLoader(BaseLoader):
    """Loader to extract text from PDFs using Docling"""

    def __init__(self, file_path: Union[str, list[str]]) -> None:
        self._file_paths = file_path if isinstance(file_path, list) else [file_path]
        self._converter = DocumentConverter()

    def lazy_load(self):
        """Lazy load text from PDF using Docling"""
        for source in self._file_paths:
            dl_doc = self._converter.convert(source).document
            text = dl_doc.export_to_markdown()  # Extract text as markdown
            yield LCDocument(page_content=text)


def extract_text_from_document(file_path: str) -> str:
    """Extract text from PDF using Docling"""
    loader = DoclingPDFLoader(file_path)
    doc = next(loader.lazy_load())
    return doc.page_content

def return_loader(file_path: str):
    """Return the loader object for a given file path"""
    return DoclingPDFLoader(file_path)


def extract_text(file_path: str) -> str:
    """Main extraction function that detects file type and calls respective extraction functions"""
    if file_path.lower().endswith(".pdf") or file_path.lower().endswith(".docx"):
        return extract_text_from_document(file_path)
    else:
        return process_ocr(file_path)
