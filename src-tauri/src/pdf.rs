use lopdf::{Document, Object};
use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Debug, Serialize, Deserialize)]
pub struct PdfMetadata {
    pub page_count: usize,
    pub title: Option<String>,
    pub file_size: u64,
}

/// Extracted metadata from email-style PDFs
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ExtractedDocumentInfo {
    pub date: Option<String>,
    pub sender: Option<String>,
    pub recipient: Option<String>,
    pub subject: Option<String>,
    pub document_type: Option<String>,
    pub first_page_text: Option<String>,
}

/// Extract metadata from a PDF file
pub fn extract_pdf_metadata(file_path: &str) -> Result<PdfMetadata, String> {
    println!("[pdf.rs] extract_pdf_metadata called for: {}", file_path);

    // Check if file exists
    if !std::path::Path::new(file_path).exists() {
        let err_msg = format!("File not found: {}", file_path);
        println!("[pdf.rs] Error: {}", err_msg);
        return Err(err_msg);
    }
    println!("[pdf.rs] File exists, proceeding with metadata extraction");

    // Get file size
    let file_size = fs::metadata(file_path)
        .map_err(|e| {
            let err_msg = format!("Failed to read file metadata: {}", e);
            println!("[pdf.rs] Error: {}", err_msg);
            err_msg
        })?
        .len();
    println!("[pdf.rs] File size: {} bytes", file_size);

    // Load PDF document
    let doc = Document::load(file_path)
        .map_err(|e| {
            let err_msg = format!("Not a valid PDF: {}", e);
            println!("[pdf.rs] Error: {}", err_msg);
            err_msg
        })?;
    println!("[pdf.rs] PDF loaded successfully");

    // Extract page count
    let pages = doc.get_pages();
    let page_count = pages.len();
    println!("[pdf.rs] Page count: {}", page_count);

    // Try to extract title from metadata
    // For now, we'll skip title extraction as it's optional and complex with lopdf
    // TODO: Implement proper title extraction if needed
    let title = None;

    let metadata = PdfMetadata {
        page_count,
        title,
        file_size,
    };
    println!("[pdf.rs] Metadata extraction complete: {:?}", metadata);

    Ok(metadata)
}

/// Extract text content from a specific page of a PDF
fn extract_page_text(doc: &Document, page_id: lopdf::ObjectId) -> Result<String, String> {
    let mut text = String::new();

    // Get the page dictionary
    if let Ok(Object::Dictionary(page_dict)) = doc.get_object(page_id) {
        // Look for Contents stream(s)
        if let Ok(contents) = page_dict.get(b"Contents") {
            match contents {
                Object::Reference(stream_id) => {
                    if let Ok(content_bytes) = doc.get_page_content(*stream_id) {
                        text.push_str(&extract_text_from_content(&content_bytes));
                    }
                }
                Object::Array(arr) => {
                    for item in arr {
                        if let Object::Reference(stream_id) = item {
                            if let Ok(content_bytes) = doc.get_page_content(*stream_id) {
                                text.push_str(&extract_text_from_content(&content_bytes));
                            }
                        }
                    }
                }
                _ => {}
            }
        }
    }

    Ok(text)
}

/// Extract visible text from PDF content stream bytes
fn extract_text_from_content(content: &[u8]) -> String {
    let mut text = String::new();
    let content_str = String::from_utf8_lossy(content);

    // Simple text extraction: look for text between () in Tj and TJ operators
    let mut in_text = false;
    let mut current_text = String::new();
    let mut paren_depth = 0;

    for ch in content_str.chars() {
        if ch == '(' && !in_text {
            in_text = true;
            paren_depth = 1;
        } else if ch == '(' && in_text {
            paren_depth += 1;
            current_text.push(ch);
        } else if ch == ')' && in_text {
            paren_depth -= 1;
            if paren_depth == 0 {
                in_text = false;
                text.push_str(&current_text);
                text.push(' ');
                current_text.clear();
            } else {
                current_text.push(ch);
            }
        } else if in_text {
            current_text.push(ch);
        }
    }

    // Clean up: normalize whitespace
    text.split_whitespace().collect::<Vec<_>>().join(" ")
}

/// Extract the first N characters of text from a PDF (for preview/description)
pub fn extract_first_page_text(file_path: &str, max_chars: usize) -> Result<String, String> {
    let doc = Document::load(file_path)
        .map_err(|e| format!("Failed to load PDF: {}", e))?;

    let pages = doc.get_pages();
    if pages.is_empty() {
        return Ok(String::new());
    }

    // Get first page ID
    if let Some((_, page_id)) = pages.iter().next() {
        let text = extract_page_text(&doc, *page_id)?;
        if text.len() > max_chars {
            Ok(format!("{}...", &text[..max_chars]))
        } else {
            Ok(text)
        }
    } else {
        Ok(String::new())
    }
}

/// Try to extract structured information from the first page of a PDF
/// This is a best-effort extraction for common email/document formats
pub fn extract_document_info(file_path: &str) -> Result<ExtractedDocumentInfo, String> {
    let first_page = extract_first_page_text(file_path, 2000)?;
    let text_lower = first_page.to_lowercase();

    let mut info = ExtractedDocumentInfo::default();
    info.first_page_text = Some(first_page.clone().chars().take(500).collect());

    // Try to detect document type
    if text_lower.contains("affidavit") {
        info.document_type = Some("Affidavit".to_string());
    } else if text_lower.contains("exhibit") {
        info.document_type = Some("Exhibit".to_string());
    } else if text_lower.contains("contract") || text_lower.contains("agreement") {
        info.document_type = Some("Contract".to_string());
    } else if text_lower.contains("invoice") {
        info.document_type = Some("Invoice".to_string());
    } else if text_lower.contains("from:") && text_lower.contains("to:") {
        info.document_type = Some("Email".to_string());
    } else if text_lower.contains("letter") || text_lower.contains("dear") {
        info.document_type = Some("Letter".to_string());
    }

    // Try to extract email-style fields
    for line in first_page.lines() {
        let line_lower = line.to_lowercase();

        if line_lower.starts_with("from:") || line_lower.starts_with("sender:") {
            info.sender = Some(line.split(':').skip(1).collect::<Vec<_>>().join(":").trim().to_string());
        } else if line_lower.starts_with("to:") || line_lower.starts_with("recipient:") {
            info.recipient = Some(line.split(':').skip(1).collect::<Vec<_>>().join(":").trim().to_string());
        } else if line_lower.starts_with("date:") || line_lower.starts_with("dated:") {
            info.date = Some(line.split(':').skip(1).collect::<Vec<_>>().join(":").trim().to_string());
        } else if line_lower.starts_with("subject:") || line_lower.starts_with("re:") {
            info.subject = Some(line.split(':').skip(1).collect::<Vec<_>>().join(":").trim().to_string());
        }
    }

    // Try to find date patterns in text if not found in headers
    if info.date.is_none() {
        info.date = extract_date_from_text(&first_page);
    }

    Ok(info)
}

/// Try to find a date in text using common patterns
fn extract_date_from_text(text: &str) -> Option<String> {
    // Common Singapore date formats:
    // - 12 January 2024
    // - 12/01/2024
    // - 12-01-2024
    // - January 12, 2024

    let months = [
        "january", "february", "march", "april", "may", "june",
        "july", "august", "september", "october", "november", "december"
    ];

    let text_lower = text.to_lowercase();

    // Look for "DD Month YYYY" pattern
    for month in &months {
        if let Some(idx) = text_lower.find(month) {
            // Try to extract surrounding context as a date
            let start = idx.saturating_sub(5);
            let end = (idx + month.len() + 10).min(text.len());
            let date_region = &text[start..end];

            // Simple validation: contains numbers before and after month
            let words: Vec<&str> = date_region.split_whitespace().collect();
            if words.len() >= 3 {
                return Some(date_region.trim().to_string());
            }
        }
    }

    None
}

/// Generate an automatic description for a document based on extracted info
pub fn generate_auto_description(file_path: &str) -> Result<String, String> {
    let info = extract_document_info(file_path)?;

    let mut parts = Vec::new();

    if let Some(doc_type) = &info.document_type {
        parts.push(doc_type.clone());
    }

    if let Some(subject) = &info.subject {
        parts.push(format!("re: {}", subject));
    } else if let Some(sender) = &info.sender {
        parts.push(format!("from {}", sender));
    }

    if let Some(date) = &info.date {
        parts.push(format!("dated {}", date));
    }

    if parts.is_empty() {
        // Fallback: use first 50 chars of text
        if let Some(text) = info.first_page_text {
            let preview: String = text.chars().take(50).collect();
            return Ok(if preview.len() == 50 {
                format!("{}...", preview)
            } else {
                preview
            });
        }
        return Ok("Document".to_string());
    }

    Ok(parts.join(" - "))
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

    #[test]
    fn test_extract_metadata_non_pdf() {
        // This test would need a test fixture file
        // For now, we'll skip implementation
        // TODO: Add test with actual non-PDF file
    }
}
