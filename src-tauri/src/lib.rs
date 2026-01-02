//! CasePilot v2.0 - Tauri Commands
//!
//! Core entities:
//! - Case: Top-level container for a legal matter
//! - File: Raw PDF asset in the repository
//! - Artifact: Container (affidavit or bundle)
//! - ArtifactEntry: Polymorphic link (file | component | nested artifact)

use serde::{Deserialize, Serialize};
use sqlx::{sqlite::SqlitePoolOptions, FromRow, Pool, Sqlite};
use std::sync::Arc;
use tauri::Manager;
use tokio::sync::Mutex;

mod db;
mod pdf;

// ============================================================================
// STATE
// ============================================================================

pub struct AppState {
    pub db: Arc<Mutex<Option<Pool<Sqlite>>>>,
}

// ============================================================================
// DOMAIN TYPES
// ============================================================================

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct Case {
    pub id: String,
    pub name: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct File {
    pub id: String,
    pub case_id: String,
    pub path: String,
    pub original_name: String,
    pub page_count: Option<i32>,
    pub metadata_json: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct Artifact {
    pub id: String,
    pub case_id: String,
    pub artifact_type: String, // "affidavit" | "bundle"
    pub name: String,
    pub content_json: Option<String>, // TipTap JSON for affidavits
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct ArtifactEntry {
    pub id: String,
    pub artifact_id: String,
    pub sequence_order: i32,
    pub row_type: String, // "file" | "component" | "artifact"
    pub file_id: Option<String>,
    pub config_json: Option<String>,    // For components (cover, divider)
    pub ref_artifact_id: Option<String>, // For nested artifacts
    pub label_override: Option<String>,  // e.g., "TAK-1"
    pub created_at: String,
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCaseRequest {
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateFileRequest {
    pub case_id: String,
    pub path: String,
    pub original_name: String,
    pub page_count: Option<i32>,
    pub metadata_json: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateFileRequest {
    pub id: String,
    pub page_count: Option<i32>,
    pub metadata_json: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateArtifactRequest {
    pub case_id: String,
    pub artifact_type: String,
    pub name: String,
    pub content_json: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateArtifactRequest {
    pub id: String,
    pub name: Option<String>,
    pub content_json: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateEntryRequest {
    pub artifact_id: String,
    pub sequence_order: i32,
    pub row_type: String,
    pub file_id: Option<String>,
    pub config_json: Option<String>,
    pub ref_artifact_id: Option<String>,
    pub label_override: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateEntryRequest {
    pub id: String,
    pub sequence_order: Option<i32>,
    pub config_json: Option<String>,
    pub label_override: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReorderEntriesRequest {
    pub artifact_id: String,
    pub entry_ids: Vec<String>,
}

// ============================================================================
// PDF TYPES
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct PdfMetadata {
    pub page_count: usize,
    pub title: Option<String>,
    pub file_size: u64,
}

// ============================================================================
// CASE COMMANDS
// ============================================================================

#[tauri::command]
async fn list_cases(state: tauri::State<'_, AppState>) -> Result<Vec<Case>, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::list_cases(pool).await
}

#[tauri::command]
async fn create_case(
    request: CreateCaseRequest,
    state: tauri::State<'_, AppState>,
) -> Result<Case, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::create_case(pool, &request.name).await
}

#[tauri::command]
async fn delete_case(id: String, state: tauri::State<'_, AppState>) -> Result<(), String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::delete_case(pool, &id).await
}

// ============================================================================
// FILE COMMANDS
// ============================================================================

#[tauri::command]
async fn list_files(
    case_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<File>, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::list_files(pool, &case_id).await
}

#[tauri::command]
async fn create_file(
    request: CreateFileRequest,
    state: tauri::State<'_, AppState>,
) -> Result<File, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::create_file(
        pool,
        &request.case_id,
        &request.path,
        &request.original_name,
        request.page_count,
        request.metadata_json.as_deref(),
    )
    .await
}

#[tauri::command]
async fn get_file(id: String, state: tauri::State<'_, AppState>) -> Result<File, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::get_file(pool, &id).await
}

#[tauri::command]
async fn update_file(
    request: UpdateFileRequest,
    state: tauri::State<'_, AppState>,
) -> Result<File, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::update_file(
        pool,
        &request.id,
        request.page_count,
        request.metadata_json.as_deref(),
    )
    .await
}

#[tauri::command]
async fn delete_file(id: String, state: tauri::State<'_, AppState>) -> Result<(), String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::delete_file(pool, &id).await
}

// ============================================================================
// ARTIFACT COMMANDS
// ============================================================================

#[tauri::command]
async fn list_artifacts(
    case_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<Artifact>, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::list_artifacts(pool, &case_id).await
}

#[tauri::command]
async fn list_artifacts_by_type(
    case_id: String,
    artifact_type: String,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<Artifact>, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::list_artifacts_by_type(pool, &case_id, &artifact_type).await
}

#[tauri::command]
async fn create_artifact(
    request: CreateArtifactRequest,
    state: tauri::State<'_, AppState>,
) -> Result<Artifact, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::create_artifact(
        pool,
        &request.case_id,
        &request.artifact_type,
        &request.name,
        request.content_json.as_deref(),
    )
    .await
}

#[tauri::command]
async fn get_artifact(id: String, state: tauri::State<'_, AppState>) -> Result<Artifact, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::get_artifact(pool, &id).await
}

#[tauri::command]
async fn update_artifact(
    request: UpdateArtifactRequest,
    state: tauri::State<'_, AppState>,
) -> Result<Artifact, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::update_artifact(
        pool,
        &request.id,
        request.name.as_deref(),
        request.content_json.as_deref(),
    )
    .await
}

#[tauri::command]
async fn delete_artifact(id: String, state: tauri::State<'_, AppState>) -> Result<(), String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::delete_artifact(pool, &id).await
}

// ============================================================================
// ARTIFACT ENTRY COMMANDS
// ============================================================================

#[tauri::command]
async fn list_entries(
    artifact_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<ArtifactEntry>, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::list_entries(pool, &artifact_id).await
}

#[tauri::command]
async fn create_entry(
    request: CreateEntryRequest,
    state: tauri::State<'_, AppState>,
) -> Result<ArtifactEntry, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::create_entry(
        pool,
        &request.artifact_id,
        request.sequence_order,
        &request.row_type,
        request.file_id.as_deref(),
        request.config_json.as_deref(),
        request.ref_artifact_id.as_deref(),
        request.label_override.as_deref(),
    )
    .await
}

#[tauri::command]
async fn update_entry(
    request: UpdateEntryRequest,
    state: tauri::State<'_, AppState>,
) -> Result<ArtifactEntry, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::update_entry(
        pool,
        &request.id,
        request.sequence_order,
        request.config_json.as_deref(),
        request.label_override.as_deref(),
    )
    .await
}

#[tauri::command]
async fn delete_entry(id: String, state: tauri::State<'_, AppState>) -> Result<(), String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::delete_entry(pool, &id).await
}

#[tauri::command]
async fn reorder_entries(
    request: ReorderEntriesRequest,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<ArtifactEntry>, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::reorder_entries(pool, &request.artifact_id, request.entry_ids).await
}

// ============================================================================
// PDF COMMANDS
// ============================================================================

#[tauri::command]
async fn extract_pdf_metadata(file_path: String) -> Result<PdfMetadata, String> {
    let metadata = pdf::extract_pdf_metadata(&file_path)?;
    Ok(PdfMetadata {
        page_count: metadata.page_count,
        title: metadata.title,
        file_size: metadata.file_size,
    })
}

#[tauri::command]
async fn extract_document_info(file_path: String) -> Result<pdf::ExtractedDocumentInfo, String> {
    pdf::extract_document_info(&file_path)
}

#[tauri::command]
async fn generate_auto_description(file_path: String) -> Result<String, String> {
    pdf::generate_auto_description(&file_path)
}

// ============================================================================
// APP ENTRY POINT
// ============================================================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_handle = app.handle().clone();

            tauri::async_runtime::spawn(async move {
                let app_data_dir = app_handle
                    .path()
                    .app_data_dir()
                    .expect("Failed to get app data directory");

                std::fs::create_dir_all(&app_data_dir).ok();

                let db_path = app_data_dir.join("casepilot.db");
                let db_url = format!("sqlite:{}?mode=rwc", db_path.display());

                let pool = SqlitePoolOptions::new()
                    .max_connections(5)
                    .connect(&db_url)
                    .await
                    .expect("Failed to connect to database");

                db::run_migrations(&pool)
                    .await
                    .expect("Failed to run migrations");

                let state: tauri::State<AppState> = app_handle.state();
                let mut db_guard = state.db.lock().await;
                *db_guard = Some(pool);

                println!("Database initialized at: {}", db_path.display());
            });

            Ok(())
        })
        .manage(AppState {
            db: Arc::new(Mutex::new(None)),
        })
        .invoke_handler(tauri::generate_handler![
            // Case commands
            list_cases,
            create_case,
            delete_case,
            // File commands
            list_files,
            create_file,
            get_file,
            update_file,
            delete_file,
            // Artifact commands
            list_artifacts,
            list_artifacts_by_type,
            create_artifact,
            get_artifact,
            update_artifact,
            delete_artifact,
            // Entry commands
            list_entries,
            create_entry,
            update_entry,
            delete_entry,
            reorder_entries,
            // PDF commands
            extract_pdf_metadata,
            extract_document_info,
            generate_auto_description,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
