import pytesseract
from PIL import Image
import io
import os
import re
from typing import Any, Dict, List, Optional
from pdf2image import convert_from_bytes

class OCRService:
    def __init__(self, tesseract_cmd: Optional[str] = None):
        configured_tesseract_cmd = tesseract_cmd or os.getenv("TESSERACT_CMD")
        if configured_tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = configured_tesseract_cmd
        else:
            # Windows fallback for local development only.
            win_tesseract = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
            if os.path.exists(win_tesseract):
                pytesseract.pytesseract.tesseract_cmd = win_tesseract

    async def extract_receipt_data(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Extracts text from image and tries to find receipt/invoice numbers.
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))
            
            # Basic pre-processing could go here (convert to grayscale etc)
            # For now, simple extraction
            text = pytesseract.image_to_string(image)
            
            # Pattern for Argentine numbers: 0000-00000000 or 0000A00000000 etc
            # Most common: XXXX-XXXXXXXX
            receipt_pattern = r'(\d{4,5})[- /](\d{8})'
            match = re.search(receipt_pattern, text)
            
            extracted_number = None
            if match:
                extracted_number = f"{match.group(1)}-{match.group(2)}"
            
            # Also look for date patterns (simplified)
            date_pattern = r'(\d{2})[/.-](\d{2})[/.-](\d{2,4})'
            date_match = re.search(date_pattern, text)
            extracted_date = None
            if date_match:
                extracted_date = f"{date_match.group(1)}/{date_match.group(2)}/{date_match.group(3)}"

            return {
                "success": True,
                "text": text,
                "extracted_number": extracted_number,
                "extracted_date": extracted_date,
                "raw_match": match.groups() if match else None
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    async def extract_pdf_data(self, pdf_bytes: bytes) -> List[Dict[str, Any]]:
        """
        Converts PDF pages to images and extracts data from each.
        """
        try:
            # Convert PDF to list of PIL images
            images = convert_from_bytes(pdf_bytes)
            results = []
            
            for i, image in enumerate(images):
                # We can reuse the same text extraction logic
                text = pytesseract.image_to_string(image)
                
                receipt_pattern = r'(\d{4,5})[- /](\d{8})'
                match = re.search(receipt_pattern, text)
                
                extracted_number = None
                if match:
                    extracted_number = f"{match.group(1)}-{match.group(2)}"
                
                date_pattern = r'(\d{2})[/.-](\d{2})[/.-](\d{2,4})'
                date_match = re.search(date_pattern, text)
                extracted_date = None
                if date_match:
                    extracted_date = f"{date_match.group(1)}/{date_match.group(2)}/{date_match.group(3)}"

                results.append({
                    "page": i + 1,
                    "success": True,
                    "text": text,
                    "extracted_number": extracted_number,
                    "extracted_date": extracted_date
                })
            return results
        except Exception as e:
            return [{
                "success": False,
                "error": f"PDF processing error: {str(e)}"
            }]

ocr_service = OCRService()
