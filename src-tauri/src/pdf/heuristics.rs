//! Document heuristics: type detection, date parsing, auto-description

use serde::{Deserialize, Serialize};

use super::text::extract_first_page_text;

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

/// Try to extract structured information from the first page of a PDF
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
            info.sender = Some(
                line.split(':')
                    .skip(1)
                    .collect::<Vec<_>>()
                    .join(":")
                    .trim()
                    .to_string(),
            );
        } else if line_lower.starts_with("to:") || line_lower.starts_with("recipient:") {
            info.recipient = Some(
                line.split(':')
                    .skip(1)
                    .collect::<Vec<_>>()
                    .join(":")
                    .trim()
                    .to_string(),
            );
        } else if line_lower.starts_with("date:") || line_lower.starts_with("dated:") {
            info.date = Some(
                line.split(':')
                    .skip(1)
                    .collect::<Vec<_>>()
                    .join(":")
                    .trim()
                    .to_string(),
            );
        } else if line_lower.starts_with("subject:") || line_lower.starts_with("re:") {
            info.subject = Some(
                line.split(':')
                    .skip(1)
                    .collect::<Vec<_>>()
                    .join(":")
                    .trim()
                    .to_string(),
            );
        }
    }

    // Try to find date patterns if not found in headers
    if info.date.is_none() {
        info.date = extract_date_from_text(&first_page);
    }

    Ok(info)
}

/// Try to find a date in text using common patterns
fn extract_date_from_text(text: &str) -> Option<String> {
    let months = [
        "january",
        "february",
        "march",
        "april",
        "may",
        "june",
        "july",
        "august",
        "september",
        "october",
        "november",
        "december",
    ];

    let text_lower = text.to_lowercase();

    // Look for "DD Month YYYY" pattern
    for month in &months {
        if let Some(idx) = text_lower.find(month) {
            let start = idx.saturating_sub(5);
            let end = (idx + month.len() + 10).min(text.len());
            let date_region = &text[start..end];

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

