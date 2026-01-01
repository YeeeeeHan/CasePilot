use printpdf::*;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::fs::File;
use std::io::BufWriter;
use std::path::PathBuf;

// Use explicit paths to avoid ambiguity with printpdf's lopdf re-export
use ::lopdf::{Document as LopdfDocument, Object, ObjectId, Dictionary};

/// Entry in the Table of Contents
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TOCEntry {
    pub label: String,
    pub description: String,
    pub start_page: usize,
    pub end_page: usize,
    pub page_count: usize,
}

/// Pagination style configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginationStyle {
    pub format: String,   // "Page X of Y", "Page X", "X"
    pub position: String, // "top-right", "bottom-center", "top-center"
    pub font_size: f32,
}

impl Default for PaginationStyle {
    fn default() -> Self {
        Self {
            format: "Page X of Y".to_string(),
            position: "top-right".to_string(),
            font_size: 10.0,
        }
    }
}

/// Sub-page numbering for late inserts (e.g., 45A, 45B)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubPageNumber {
    pub base_page: usize,
    pub suffix: char,  // 'A', 'B', 'C', etc.
}

impl SubPageNumber {
    pub fn new(base_page: usize, index: usize) -> Self {
        // index 0 = 'A', 1 = 'B', etc.
        let suffix = (b'A' + (index as u8).min(25)) as char;
        Self { base_page, suffix }
    }

    pub fn to_string(&self) -> String {
        format!("{}{}", self.base_page, self.suffix)
    }
}

/// Late insert mode for bundle compilation
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum LateInsertMode {
    /// Full renumber: all pages after insert get new numbers
    Repaginate,
    /// Sub-numbering: insert as 45A, 45B, etc.
    SubNumber,
}

impl Default for LateInsertMode {
    fn default() -> Self {
        LateInsertMode::Repaginate
    }
}

/// Validation error types for pagination compliance
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationError {
    pub error_type: String,
    pub message: String,
    pub page: Option<usize>,
    pub expected: Option<usize>,
    pub actual: Option<usize>,
}

/// Validation result for bundle compilation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub errors: Vec<ValidationError>,
    pub warnings: Vec<String>,
}

/// Result of bundle compilation
#[derive(Debug, Serialize, Deserialize)]
pub struct CompileResult {
    pub success: bool,
    pub pdf_path: Option<String>,
    pub toc_entries: Vec<TOCEntry>,
    pub total_pages: usize,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

/// Document to include in bundle
#[derive(Debug, Clone)]
pub struct BundleDocument {
    pub id: String,
    pub file_path: String,
    pub label: String,
    pub description: String,
    pub page_count: usize,
}

/// Calculate TOC entries from bundle documents (fast preview, no PDF generation)
pub fn calculate_toc_preview(documents: &[BundleDocument], toc_page_count: usize) -> Vec<TOCEntry> {
    let mut entries = Vec::new();
    let mut current_page = toc_page_count + 1; // Documents start after TOC

    for (i, doc) in documents.iter().enumerate() {
        let start_page = current_page;
        let end_page = current_page + doc.page_count - 1;

        entries.push(TOCEntry {
            label: format!("Tab {}", i + 1),
            description: doc.description.clone(),
            start_page,
            end_page,
            page_count: doc.page_count,
        });

        current_page = end_page + 1;
    }

    entries
}

/// Estimate how many pages the TOC will need
pub fn estimate_toc_pages(document_count: usize) -> usize {
    // Approximately 25 entries per page with standard formatting
    let entries_per_page = 25;
    (((document_count as f32) / (entries_per_page as f32)).ceil() as usize).max(1)
}

/// Generate TOC PDF pages
pub fn generate_toc_pdf(entries: &[TOCEntry], output_path: &PathBuf) -> Result<usize, String> {
    let (doc, page1, layer1) = PdfDocument::new(
        "Table of Contents",
        Mm(210.0), // A4 width
        Mm(297.0), // A4 height
        "Layer 1",
    );

    let font = doc
        .add_builtin_font(BuiltinFont::TimesRoman)
        .map_err(|e| format!("Failed to add font: {}", e))?;
    let font_bold = doc
        .add_builtin_font(BuiltinFont::TimesBold)
        .map_err(|e| format!("Failed to add bold font: {}", e))?;

    let mut current_layer = doc.get_page(page1).get_layer(layer1);
    let mut y_position = 270.0; // Start from top (A4 is 297mm)
    let left_margin = 25.0;
    let page_num_x = 180.0;
    let mut page_count = 1;
    let entries_per_page = 25;

    // Title
    current_layer.use_text(
        "TABLE OF CONTENTS",
        16.0,
        Mm(left_margin),
        Mm(y_position),
        &font_bold,
    );
    y_position -= 15.0;

    // Divider line
    y_position -= 5.0;

    for (i, entry) in entries.iter().enumerate() {
        // Check if we need a new page
        if i > 0 && i % entries_per_page == 0 {
            let (new_page, new_layer) =
                doc.add_page(Mm(210.0), Mm(297.0), format!("Page {}", page_count + 1));
            current_layer = doc.get_page(new_page).get_layer(new_layer);
            y_position = 270.0;
            page_count += 1;
        }

        // Entry: "Tab 1    Description .................. 1"
        let label_text = format!("{}", entry.label);
        let desc_text = if entry.description.len() > 50 {
            format!("{}...", &entry.description[..47])
        } else {
            entry.description.clone()
        };
        let page_text = format!("{}", entry.start_page);

        // Label (bold)
        current_layer.use_text(&label_text, 11.0, Mm(left_margin), Mm(y_position), &font_bold);

        // Description
        current_layer.use_text(&desc_text, 11.0, Mm(left_margin + 20.0), Mm(y_position), &font);

        // Page number (right-aligned)
        current_layer.use_text(&page_text, 11.0, Mm(page_num_x), Mm(y_position), &font);

        y_position -= 8.0;
    }

    // Save the document
    let file = File::create(output_path).map_err(|e| format!("Failed to create TOC file: {}", e))?;
    doc.save(&mut BufWriter::new(file))
        .map_err(|e| format!("Failed to save TOC PDF: {}", e))?;

    Ok(page_count)
}

/// Merge multiple PDF documents into one using manual page collection
pub fn merge_pdfs_simple(pdf_paths: &[PathBuf], output_path: &PathBuf) -> Result<usize, String> {
    if pdf_paths.is_empty() {
        return Err("No PDFs to merge".to_string());
    }

    // Load all documents and collect pages
    let mut all_pages: Vec<(PathBuf, usize)> = Vec::new();
    let mut total_pages = 0;

    for path in pdf_paths {
        let doc = LopdfDocument::load(path)
            .map_err(|e| format!("Failed to load PDF {}: {}", path.display(), e))?;
        let page_count = doc.get_pages().len();
        total_pages += page_count;
        all_pages.push((path.clone(), page_count));
    }

    // For simplicity, we'll use the first document as base and copy pages manually
    // This is a basic implementation - production would use pdf-rs or similar
    let mut base_doc = LopdfDocument::load(&pdf_paths[0])
        .map_err(|e| format!("Failed to load base PDF: {}", e))?;

    // For each subsequent document, we need to merge pages
    for path in pdf_paths.iter().skip(1) {
        let doc = LopdfDocument::load(path)
            .map_err(|e| format!("Failed to load PDF {}: {}", path.display(), e))?;

        // Get the pages from source document (keys are page numbers, values are ObjectIds)
        let src_pages: Vec<ObjectId> = doc.get_pages().values().cloned().collect();

        // Find the highest object ID in base document
        let mut max_id = 0u32;
        for (obj_id, _) in base_doc.objects.iter() {
            if obj_id.0 > max_id {
                max_id = obj_id.0;
            }
        }

        // Clone objects with new IDs
        let mut id_map: BTreeMap<ObjectId, ObjectId> = BTreeMap::new();
        for (old_id, obj) in doc.objects.iter() {
            let new_id = (old_id.0 + max_id + 1, old_id.1);
            id_map.insert(*old_id, new_id);
            base_doc.objects.insert(new_id, obj.clone());
        }

        // Update references in copied objects
        for (old_id, new_id) in &id_map {
            if let Some(obj) = base_doc.objects.get_mut(new_id) {
                update_references(obj, &id_map);
            }
            // Add new pages to the pages tree
            if src_pages.contains(old_id) {
                // Get the Pages object from base document
                if let Some(catalog_ref) = base_doc.trailer.get(b"Root").ok().and_then(|r| r.as_reference().ok()) {
                    if let Ok(Object::Dictionary(ref catalog)) = base_doc.get_object(catalog_ref) {
                        if let Ok(pages_ref) = catalog.get(b"Pages").and_then(|p| p.as_reference()) {
                            if let Ok(Object::Dictionary(ref mut pages_dict)) = base_doc.get_object_mut(pages_ref) {
                                // Add to Kids array
                                if let Ok(Object::Array(ref mut kids)) = pages_dict.get_mut(b"Kids") {
                                    kids.push(Object::Reference(*new_id));
                                }
                                // Update Count
                                if let Ok(Object::Integer(ref mut count)) = pages_dict.get_mut(b"Count") {
                                    *count += 1;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    base_doc
        .save(output_path)
        .map_err(|e| format!("Failed to save merged PDF: {}", e))?;

    Ok(total_pages)
}

/// Update object references when merging documents
fn update_references(obj: &mut Object, id_map: &BTreeMap<ObjectId, ObjectId>) {
    match obj {
        Object::Reference(ref mut id) => {
            if let Some(new_id) = id_map.get(id) {
                *id = *new_id;
            }
        }
        Object::Array(arr) => {
            for item in arr.iter_mut() {
                update_references(item, id_map);
            }
        }
        Object::Dictionary(dict) => {
            for (_, value) in dict.iter_mut() {
                update_references(value, id_map);
            }
        }
        Object::Stream(stream) => {
            for (_, value) in stream.dict.iter_mut() {
                update_references(value, id_map);
            }
        }
        _ => {}
    }
}

/// Get page dimensions from PDF
fn get_page_dimensions(doc: &LopdfDocument, page_id: ObjectId) -> Result<(f32, f32), String> {
    if let Ok(Object::Dictionary(page_dict)) = doc.get_object(page_id) {
        if let Ok(media_box) = page_dict.get(b"MediaBox") {
            match media_box {
                Object::Array(arr) if arr.len() >= 4 => {
                    let width = match &arr[2] {
                        Object::Real(n) => *n as f32,
                        Object::Integer(n) => *n as f32,
                        _ => 595.0,
                    };
                    let height = match &arr[3] {
                        Object::Real(n) => *n as f32,
                        Object::Integer(n) => *n as f32,
                        _ => 842.0,
                    };
                    return Ok((width, height));
                }
                Object::Reference(ref_id) => {
                    if let Ok(Object::Array(arr)) = doc.get_object(*ref_id) {
                        if arr.len() >= 4 {
                            let width = match &arr[2] {
                                Object::Real(n) => *n as f32,
                                Object::Integer(n) => *n as f32,
                                _ => 595.0,
                            };
                            let height = match &arr[3] {
                                Object::Real(n) => *n as f32,
                                Object::Integer(n) => *n as f32,
                                _ => 842.0,
                            };
                            return Ok((width, height));
                        }
                    }
                }
                _ => {}
            }
        }
    }
    // Default to A4 dimensions in points
    Ok((595.0, 842.0))
}

/// Inject pagination stamp onto a single page
fn inject_page_stamp(
    doc: &mut LopdfDocument,
    page_id: ObjectId,
    page_num: usize,
    total_pages: usize,
    style: &PaginationStyle,
) -> Result<(), String> {
    let stamp_text = match style.format.as_str() {
        "Page X" => format!("Page {}", page_num),
        "X" => format!("{}", page_num),
        _ => format!("Page {} of {}", page_num, total_pages),
    };

    // Get page dimensions
    let (width, height) = get_page_dimensions(doc, page_id)?;

    // Calculate position based on style (in PDF points)
    let (x, y) = match style.position.as_str() {
        "bottom-center" => (width / 2.0 - 30.0, 25.0),
        "top-center" => (width / 2.0 - 30.0, height - 25.0),
        _ => (width - 100.0, height - 25.0), // Default: top-right
    };

    // Create content stream for the stamp
    let content = format!(
        "q BT /Helvetica {} Tf {} {} Td ({}) Tj ET Q",
        style.font_size, x, y, stamp_text
    );

    // First, get existing content (if any) - need to do this before mutable borrow
    let existing_content_bytes = {
        if let Ok(Object::Dictionary(page_dict)) = doc.get_object(page_id) {
            if let Ok(contents_ref) = page_dict.get(b"Contents") {
                match contents_ref {
                    Object::Reference(stream_id) => {
                        if let Ok(Object::Stream(stream)) = doc.get_object(*stream_id) {
                            stream.content.clone()
                        } else {
                            Vec::new()
                        }
                    }
                    _ => Vec::new(),
                }
            } else {
                Vec::new()
            }
        } else {
            Vec::new()
        }
    };

    // Append our stamp content
    let mut new_content = existing_content_bytes;
    new_content.extend_from_slice(b"\n");
    new_content.extend_from_slice(content.as_bytes());
    new_content.extend_from_slice(b"\n");

    // Create new stream object
    let mut stream_dict = Dictionary::new();
    stream_dict.set("Length", Object::Integer(new_content.len() as i64));
    let stream = ::lopdf::Stream::new(stream_dict, new_content);
    let new_stream_id = doc.add_object(Object::Stream(stream));

    // Now update the page to use new contents
    if let Ok(Object::Dictionary(ref mut page_dict)) = doc.get_object_mut(page_id) {
        page_dict.set("Contents", Object::Reference(new_stream_id));
    }

    Ok(())
}

/// Inject pagination stamps into a PDF document
pub fn inject_pagination(
    input_path: &PathBuf,
    output_path: &PathBuf,
    start_page: usize,
    total_pages: usize,
    style: &PaginationStyle,
) -> Result<usize, String> {
    let mut doc =
        LopdfDocument::load(input_path).map_err(|e| format!("Failed to load PDF: {}", e))?;

    let page_ids: Vec<ObjectId> = doc.get_pages().values().cloned().collect();
    let page_count = page_ids.len();

    for (i, page_id) in page_ids.iter().enumerate() {
        let page_num = start_page + i;
        inject_page_stamp(&mut doc, *page_id, page_num, total_pages, style)?;
    }

    doc.save(output_path)
        .map_err(|e| format!("Failed to save stamped PDF: {}", e))?;

    Ok(page_count)
}

/// Add bookmarks to a PDF document
pub fn add_bookmarks(
    input_path: &PathBuf,
    output_path: &PathBuf,
    _entries: &[TOCEntry],
) -> Result<(), String> {
    let mut doc = LopdfDocument::load(input_path)
        .map_err(|e| format!("Failed to load PDF: {}", e))?;

    // For now, just copy the document as-is
    // Bookmark implementation requires more complex outline tree construction
    // TODO: Implement proper bookmark tree
    doc.save(output_path)
        .map_err(|e| format!("Failed to save PDF with bookmarks: {}", e))?;

    Ok(())
}

/// Full bundle compilation pipeline
pub fn compile_bundle(
    documents: &[BundleDocument],
    output_dir: &PathBuf,
    bundle_name: &str,
    pagination_style: &PaginationStyle,
) -> Result<CompileResult, String> {
    let mut errors: Vec<String> = Vec::new();
    let warnings: Vec<String> = Vec::new();

    // Ensure output directory exists
    std::fs::create_dir_all(output_dir)
        .map_err(|e| format!("Failed to create output directory: {}", e))?;

    // 1. Validate all documents exist
    for doc in documents {
        if !std::path::Path::new(&doc.file_path).exists() {
            errors.push(format!("Document not found: {}", doc.file_path));
        }
    }

    if !errors.is_empty() {
        return Ok(CompileResult {
            success: false,
            pdf_path: None,
            toc_entries: Vec::new(),
            total_pages: 0,
            errors,
            warnings,
        });
    }

    if documents.is_empty() {
        return Ok(CompileResult {
            success: false,
            pdf_path: None,
            toc_entries: Vec::new(),
            total_pages: 0,
            errors: vec!["No documents to compile".to_string()],
            warnings,
        });
    }

    // 2. Estimate TOC page count
    let toc_page_count = estimate_toc_pages(documents.len());

    // 3. Calculate TOC entries with correct page numbers
    let toc_entries = calculate_toc_preview(documents, toc_page_count);

    // Calculate total pages
    let mut total_pages = if let Some(last) = toc_entries.last() {
        last.end_page
    } else {
        toc_page_count
    };

    // 4. Generate TOC PDF
    let toc_path = output_dir.join("_toc_temp.pdf");
    let actual_toc_pages = generate_toc_pdf(&toc_entries, &toc_path)?;

    // If TOC pages differ from estimate, recalculate
    let toc_entries = if actual_toc_pages != toc_page_count {
        let new_entries = calculate_toc_preview(documents, actual_toc_pages);
        if let Some(last) = new_entries.last() {
            total_pages = last.end_page;
        }
        new_entries
    } else {
        toc_entries
    };

    // 5. Inject pagination stamps into each document
    let mut stamped_paths: Vec<PathBuf> = vec![toc_path.clone()];

    for (i, doc) in documents.iter().enumerate() {
        let entry = &toc_entries[i];
        let stamped_path = output_dir.join(format!("_doc_{}_stamped.pdf", i));

        inject_pagination(
            &PathBuf::from(&doc.file_path),
            &stamped_path,
            entry.start_page,
            total_pages,
            pagination_style,
        )?;

        stamped_paths.push(stamped_path);
    }

    // 6. Merge all PDFs
    let merged_path = output_dir.join(format!("{}_merged.pdf", bundle_name));
    merge_pdfs_simple(&stamped_paths, &merged_path)?;

    // 7. Add bookmarks (currently just copies)
    let final_path = output_dir.join(format!("{}.pdf", bundle_name));
    add_bookmarks(&merged_path, &final_path, &toc_entries)?;

    // 8. Clean up temporary files
    for path in &stamped_paths {
        let _ = std::fs::remove_file(path);
    }
    let _ = std::fs::remove_file(&merged_path);

    Ok(CompileResult {
        success: true,
        pdf_path: Some(final_path.to_string_lossy().to_string()),
        toc_entries,
        total_pages,
        errors: Vec::new(),
        warnings,
    })
}

/// Calculate TOC entries with sub-numbering for late inserts
pub fn calculate_toc_with_subnumbers(
    documents: &[BundleDocument],
    toc_page_count: usize,
    insert_after: Option<usize>,  // Document index after which to insert
    insert_count: usize,          // Number of documents to insert with subnumbers
) -> Vec<TOCEntry> {
    let mut entries = Vec::new();
    let mut current_page = toc_page_count + 1;

    for (i, doc) in documents.iter().enumerate() {
        let is_late_insert = insert_after.map(|pos| i > pos && i <= pos + insert_count).unwrap_or(false);

        if is_late_insert {
            // Use sub-numbering for late inserts
            let base_page = current_page - 1; // Use the previous document's end page
            let insert_index = i - insert_after.unwrap() - 1;
            let sub_page = SubPageNumber::new(base_page, insert_index);

            entries.push(TOCEntry {
                label: format!("Tab {}{}", insert_after.unwrap() + 1, sub_page.suffix),
                description: doc.description.clone(),
                start_page: current_page,
                end_page: current_page + doc.page_count - 1,
                page_count: doc.page_count,
            });
        } else {
            let start_page = current_page;
            let end_page = current_page + doc.page_count - 1;

            entries.push(TOCEntry {
                label: format!("Tab {}", i + 1 - if is_late_insert { insert_count } else { 0 }),
                description: doc.description.clone(),
                start_page,
                end_page,
                page_count: doc.page_count,
            });
        }

        current_page += doc.page_count;
    }

    entries
}

/// Validate bundle pagination for ePD 2021 compliance
pub fn validate_pagination(
    toc_entries: &[TOCEntry],
    pdf_path: &std::path::Path,
) -> ValidationResult {
    let mut errors = Vec::new();
    let mut warnings = Vec::new();

    // 1. Check for pagination gaps
    let mut expected_page = 1;
    for (i, entry) in toc_entries.iter().enumerate() {
        // Account for TOC pages (entries start after TOC)
        if i == 0 {
            // First entry should start after TOC
            if entry.start_page < 2 {
                errors.push(ValidationError {
                    error_type: "toc_overlap".to_string(),
                    message: format!("First document starts on page {}, but TOC needs at least 1 page", entry.start_page),
                    page: Some(entry.start_page),
                    expected: Some(2),
                    actual: Some(entry.start_page),
                });
            }
            expected_page = entry.start_page;
        }

        // Check for gaps
        if entry.start_page > expected_page {
            errors.push(ValidationError {
                error_type: "pagination_gap".to_string(),
                message: format!("Pagination gap: expected page {}, found page {}", expected_page, entry.start_page),
                page: Some(expected_page),
                expected: Some(expected_page),
                actual: Some(entry.start_page),
            });
        }

        // Check for page count consistency
        let calculated_end = entry.start_page + entry.page_count - 1;
        if calculated_end != entry.end_page {
            errors.push(ValidationError {
                error_type: "page_count_mismatch".to_string(),
                message: format!(
                    "Tab {} page count mismatch: {} pages should end at {}, but marked as {}",
                    entry.label, entry.page_count, calculated_end, entry.end_page
                ),
                page: Some(entry.start_page),
                expected: Some(calculated_end),
                actual: Some(entry.end_page),
            });
        }

        expected_page = entry.end_page + 1;
    }

    // 2. Validate against actual PDF if it exists
    if pdf_path.exists() {
        match LopdfDocument::load(pdf_path) {
            Ok(doc) => {
                let actual_pages = doc.get_pages().len();
                let expected_total = toc_entries.last().map(|e| e.end_page).unwrap_or(0);

                if actual_pages != expected_total {
                    errors.push(ValidationError {
                        error_type: "total_page_mismatch".to_string(),
                        message: format!(
                            "TOC indicates {} total pages, but PDF has {} pages",
                            expected_total, actual_pages
                        ),
                        page: None,
                        expected: Some(expected_total),
                        actual: Some(actual_pages),
                    });
                }
            }
            Err(e) => {
                warnings.push(format!("Could not validate PDF: {}", e));
            }
        }
    }

    // 3. ePD Para 78 compliance warnings
    for entry in toc_entries {
        // Check for very long page ranges (might indicate bundling issues)
        if entry.page_count > 100 {
            warnings.push(format!(
                "Tab {} has {} pages - consider splitting for easier navigation",
                entry.label, entry.page_count
            ));
        }
    }

    ValidationResult {
        is_valid: errors.is_empty(),
        errors,
        warnings,
    }
}

/// Inject sub-numbered pagination stamp (e.g., "Page 45A")
fn inject_subnumber_stamp(
    doc: &mut LopdfDocument,
    page_id: ObjectId,
    sub_page: &SubPageNumber,
    total_pages: usize,
    style: &PaginationStyle,
) -> Result<(), String> {
    let stamp_text = match style.format.as_str() {
        "Page X" => format!("Page {}", sub_page.to_string()),
        "X" => sub_page.to_string(),
        _ => format!("Page {} of {}", sub_page.to_string(), total_pages),
    };

    // Get page dimensions
    let (width, height) = get_page_dimensions(doc, page_id)?;

    // Calculate position based on style
    let (x, y) = match style.position.as_str() {
        "bottom-center" => (width / 2.0 - 30.0, 25.0),
        "top-center" => (width / 2.0 - 30.0, height - 25.0),
        _ => (width - 100.0, height - 25.0),
    };

    // Create content stream for the stamp
    let content = format!(
        "q BT /Helvetica {} Tf {} {} Td ({}) Tj ET Q",
        style.font_size, x, y, stamp_text
    );

    // Get existing content
    let existing_content_bytes = {
        if let Ok(Object::Dictionary(page_dict)) = doc.get_object(page_id) {
            if let Ok(contents_ref) = page_dict.get(b"Contents") {
                match contents_ref {
                    Object::Reference(stream_id) => {
                        if let Ok(Object::Stream(stream)) = doc.get_object(*stream_id) {
                            stream.content.clone()
                        } else {
                            Vec::new()
                        }
                    }
                    _ => Vec::new(),
                }
            } else {
                Vec::new()
            }
        } else {
            Vec::new()
        }
    };

    // Append stamp content
    let mut new_content = existing_content_bytes;
    new_content.extend_from_slice(b"\n");
    new_content.extend_from_slice(content.as_bytes());
    new_content.extend_from_slice(b"\n");

    // Create new stream object
    let mut stream_dict = Dictionary::new();
    stream_dict.set("Length", Object::Integer(new_content.len() as i64));
    let stream = ::lopdf::Stream::new(stream_dict, new_content);
    let new_stream_id = doc.add_object(Object::Stream(stream));

    // Update page to use new contents
    if let Ok(Object::Dictionary(ref mut page_dict)) = doc.get_object_mut(page_id) {
        page_dict.set("Contents", Object::Reference(new_stream_id));
    }

    Ok(())
}

/// Inject pagination with sub-numbering support for late inserts
pub fn inject_pagination_with_subnumbers(
    input_path: &PathBuf,
    output_path: &PathBuf,
    page_numbers: &[String],  // Can be "45" or "45A"
    total_pages: usize,
    style: &PaginationStyle,
) -> Result<usize, String> {
    let mut doc = LopdfDocument::load(input_path)
        .map_err(|e| format!("Failed to load PDF: {}", e))?;

    let page_ids: Vec<ObjectId> = doc.get_pages().values().cloned().collect();
    let page_count = page_ids.len();

    if page_numbers.len() != page_count {
        return Err(format!(
            "Page number count ({}) doesn't match PDF page count ({})",
            page_numbers.len(), page_count
        ));
    }

    for (i, page_id) in page_ids.iter().enumerate() {
        let page_num_str = &page_numbers[i];

        // Check if it's a sub-numbered page (contains letter)
        if page_num_str.chars().last().map(|c| c.is_alphabetic()).unwrap_or(false) {
            let base: String = page_num_str.chars().take_while(|c| c.is_numeric()).collect();
            let suffix = page_num_str.chars().last().unwrap();
            if let Ok(base_page) = base.parse::<usize>() {
                let sub_page = SubPageNumber { base_page, suffix };
                inject_subnumber_stamp(&mut doc, *page_id, &sub_page, total_pages, style)?;
            }
        } else {
            // Regular page number
            if let Ok(page_num) = page_num_str.parse::<usize>() {
                inject_page_stamp(&mut doc, *page_id, page_num, total_pages, style)?;
            }
        }
    }

    doc.save(output_path)
        .map_err(|e| format!("Failed to save stamped PDF: {}", e))?;

    Ok(page_count)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_estimate_toc_pages() {
        assert_eq!(estimate_toc_pages(10), 1);
        assert_eq!(estimate_toc_pages(25), 1);
        assert_eq!(estimate_toc_pages(26), 2);
        assert_eq!(estimate_toc_pages(50), 2);
        assert_eq!(estimate_toc_pages(51), 3);
    }

    #[test]
    fn test_calculate_toc_preview() {
        let documents = vec![
            BundleDocument {
                id: "1".to_string(),
                file_path: "/path/to/doc1.pdf".to_string(),
                label: "Tab 1".to_string(),
                description: "First document".to_string(),
                page_count: 5,
            },
            BundleDocument {
                id: "2".to_string(),
                file_path: "/path/to/doc2.pdf".to_string(),
                label: "Tab 2".to_string(),
                description: "Second document".to_string(),
                page_count: 3,
            },
        ];

        let toc_page_count = 1; // TOC takes 1 page
        let entries = calculate_toc_preview(&documents, toc_page_count);

        assert_eq!(entries.len(), 2);
        assert_eq!(entries[0].start_page, 2); // After TOC
        assert_eq!(entries[0].end_page, 6);   // 5 pages
        assert_eq!(entries[1].start_page, 7);
        assert_eq!(entries[1].end_page, 9);   // 3 pages
    }

    #[test]
    fn test_sub_page_number() {
        let sub_a = SubPageNumber::new(45, 0);
        assert_eq!(sub_a.to_string(), "45A");

        let sub_b = SubPageNumber::new(45, 1);
        assert_eq!(sub_b.to_string(), "45B");

        let sub_z = SubPageNumber::new(100, 25);
        assert_eq!(sub_z.to_string(), "100Z");
    }

    #[test]
    fn test_validate_pagination_gaps() {
        let entries = vec![
            TOCEntry {
                label: "Tab 1".to_string(),
                description: "First".to_string(),
                start_page: 2,
                end_page: 5,
                page_count: 4,
            },
            TOCEntry {
                label: "Tab 2".to_string(),
                description: "Second".to_string(),
                start_page: 7,  // Gap! Should be 6
                end_page: 10,
                page_count: 4,
            },
        ];

        let result = validate_pagination(&entries, std::path::Path::new("/nonexistent"));
        assert!(!result.is_valid);
        assert!(result.errors.iter().any(|e| e.error_type == "pagination_gap"));
    }

    #[test]
    fn test_validate_pagination_valid() {
        let entries = vec![
            TOCEntry {
                label: "Tab 1".to_string(),
                description: "First".to_string(),
                start_page: 2,
                end_page: 5,
                page_count: 4,
            },
            TOCEntry {
                label: "Tab 2".to_string(),
                description: "Second".to_string(),
                start_page: 6,
                end_page: 9,
                page_count: 4,
            },
        ];

        let result = validate_pagination(&entries, std::path::Path::new("/nonexistent"));
        assert!(result.is_valid);
        assert!(result.errors.is_empty());
    }

    #[test]
    fn test_late_insert_mode_default() {
        let mode = LateInsertMode::default();
        assert_eq!(mode, LateInsertMode::Repaginate);
    }
}
