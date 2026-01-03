//! Text extraction from PDF content

use lopdf::{Document, Object};

/// Extract text content from a specific page of a PDF
pub fn extract_page_text(doc: &Document, page_id: lopdf::ObjectId) -> Result<String, String> {
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
pub fn extract_text_from_content(content: &[u8]) -> String {
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
    let doc =
        Document::load(file_path).map_err(|e| format!("Failed to load PDF: {}", e))?;

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

