//! PDF metadata extraction

use lopdf::Document;
use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Debug, Serialize, Deserialize)]
pub struct PdfMetadata {
    pub page_count: usize,
    pub title: Option<String>,
    pub file_size: u64,
}

/// Extract metadata from a PDF file
pub fn extract_pdf_metadata(file_path: &str) -> Result<PdfMetadata, String> {
    println!("[pdf] extract_pdf_metadata called for: {}", file_path);

    // Check if file exists
    if !std::path::Path::new(file_path).exists() {
        let err_msg = format!("File not found: {}", file_path);
        println!("[pdf] Error: {}", err_msg);
        return Err(err_msg);
    }
    println!("[pdf] File exists, proceeding with metadata extraction");

    // Get file size
    let file_size = fs::metadata(file_path)
        .map_err(|e| {
            let err_msg = format!("Failed to read file metadata: {}", e);
            println!("[pdf] Error: {}", err_msg);
            err_msg
        })?
        .len();
    println!("[pdf] File size: {} bytes", file_size);

    // Load PDF document
    let doc = Document::load(file_path).map_err(|e| {
        let err_msg = format!("Not a valid PDF: {}", e);
        println!("[pdf] Error: {}", err_msg);
        err_msg
    })?;
    println!("[pdf] PDF loaded successfully");

    // Extract page count
    let pages = doc.get_pages();
    let page_count = pages.len();
    println!("[pdf] Page count: {}", page_count);

    // TODO: Implement proper title extraction if needed
    let title = None;

    let metadata = PdfMetadata {
        page_count,
        title,
        file_size,
    };
    println!("[pdf] Metadata extraction complete: {:?}", metadata);

    Ok(metadata)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_metadata_file_not_found() {
        let result = extract_pdf_metadata("/non/existent/file.pdf");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("File not found"));
    }
}

