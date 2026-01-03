//! PDF processing module for CasePilot
//!
//! Submodules:
//! - metadata: PDF metadata extraction
//! - text: Text extraction from PDF content
//! - heuristics: Document type detection and date parsing

mod heuristics;
mod metadata;
mod text;

pub use heuristics::{extract_document_info, generate_auto_description, ExtractedDocumentInfo};
pub use metadata::{extract_pdf_metadata, PdfMetadata};
pub use text::extract_first_page_text;

