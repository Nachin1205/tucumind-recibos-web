import io
import zipfile
import traceback
from typing import List, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from core.security import get_current_user
from core.ocr_service import ocr_service

router = APIRouter()

@router.post("/process-batch")
async def process_ocr_batch(
    files: List[UploadFile] = File(...),
    current_user: str = Depends(get_current_user)
) -> Any:
    """
    Extract data from multiple images, PDFs or images/PDFs inside a ZIP file.
    """
    results = []
    
    for file in files:
        filename = file.filename or "unknown"
        try:
            content_bytes: bytes = await file.read()
            print(f"DEBUG OCR: Processing {filename} ({len(content_bytes)} bytes)")
            
            # 1. ZIP File
            if filename.lower().endswith('.zip'):
                try:
                    with zipfile.ZipFile(io.BytesIO(content_bytes)) as z:
                        for zip_info in z.infolist():
                            if zip_info.is_dir():
                                continue
                            
                            lname = zip_info.filename.lower()
                            # Images in ZIP
                            if lname.endswith(('.png', '.jpg', '.jpeg', '.tiff', '.bmp')):
                                with z.open(zip_info) as f:
                                    img_bytes = f.read()
                                    ocr_result = await ocr_service.extract_receipt_data(img_bytes)
                                    results.append({
                                        "filename": f"{filename}/{zip_info.filename}",
                                        "extracted_number": ocr_result.get("extracted_number"),
                                        "extracted_date": ocr_result.get("extracted_date"),
                                        "status": "success" if ocr_result.get("success") else "error",
                                        "error": ocr_result.get("error")
                                    })
                            # PDFs in ZIP
                            elif lname.endswith('.pdf'):
                                with z.open(zip_info) as f:
                                    pdf_bytes = f.read()
                                    pdf_res = await ocr_service.extract_pdf_data(pdf_bytes)
                                    for res in pdf_res:
                                        page_num = res.get('page')
                                        page_str = f" (Pag {page_num})" if page_num else ""
                                        results.append({
                                            "filename": f"{filename}/{zip_info.filename}{page_str}",
                                            "extracted_number": res.get("extracted_number"),
                                            "extracted_date": res.get("extracted_date"),
                                            "status": "success" if res.get("success") else "error",
                                            "error": res.get("error")
                                        })
                except Exception as e:
                    with open("ocr_debug.log", "a") as logf:
                        logf.write(f"ZIP ERROR ({filename}): {str(e)}\n{traceback.format_exc()}\n")
                    results.append({"filename": filename, "status": "error", "error": f"ZIP Error: {str(e)}"})

            # 2. PDF File
            elif filename.lower().endswith('.pdf'):
                try:
                    pdf_results = await ocr_service.extract_pdf_data(content_bytes)
                    for res in pdf_results:
                        page_num = res.get('page')
                        page_str = f" (Pag {page_num})" if page_num else ""
                        results.append({
                            "filename": f"{filename}{page_str}",
                            "extracted_number": res.get("extracted_number"),
                            "extracted_date": res.get("extracted_date"),
                            "status": "success" if res.get("success") else "error",
                            "error": res.get("error")
                        })
                except Exception as e:
                    results.append({"filename": filename, "status": "error", "error": f"PDF Error: {str(e)}"})

            # 3. Assume Image
            else:
                try:
                    ocr_result = await ocr_service.extract_receipt_data(content_bytes)
                    results.append({
                        "filename": filename,
                        "extracted_number": ocr_result.get("extracted_number"),
                        "extracted_date": ocr_result.get("extracted_date"),
                        "status": "success" if ocr_result.get("success") else "error",
                        "error": ocr_result.get("error")
                    })
                except Exception as e:
                    results.append({"filename": filename, "status": "error", "error": f"Image Error: {str(e)}"})
                    
        except Exception as global_e:
            results.append({"filename": filename, "status": "error", "error": f"Global Error: {str(global_e)}"})
                
    return results
