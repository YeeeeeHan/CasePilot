//! PDF commands - Metadata extraction and document analysis

use crate::pdf;
use crate::PdfMetadata;

#[tauri::command]
pub async fn extract_pdf_metadata(file_path: String) -> Result<PdfMetadata, String> {
    let metadata = pdf::extract_pdf_metadata(&file_path)?;
    Ok(PdfMetadata {
        page_count: metadata.page_count,
        title: metadata.title,
        file_size: metadata.file_size,
    })
}

#[tauri::command]
pub async fn extract_document_info(file_path: String) -> Result<pdf::ExtractedDocumentInfo, String> {
    pdf::extract_document_info(&file_path)
}

#[tauri::command]
pub async fn generate_auto_description(file_path: String) -> Result<String, String> {
    pdf::generate_auto_description(&file_path)
}

