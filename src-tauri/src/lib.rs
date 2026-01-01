use serde::{Deserialize, Serialize};
use sqlx::{sqlite::SqlitePoolOptions, FromRow, Pool, Sqlite};
use std::sync::Arc;
use tauri::Manager;
use tokio::sync::Mutex;

mod db;
mod pdf;

pub struct AppState {
    pub db: Arc<Mutex<Option<Pool<Sqlite>>>>,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct Case {
    pub id: String,
    pub name: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct Document {
    pub id: String,
    pub case_id: String,
    pub name: String,
    pub content: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCaseRequest {
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateDocumentRequest {
    pub case_id: String,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SaveDocumentRequest {
    pub id: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PdfMetadata {
    pub page_count: usize,
    pub title: Option<String>,
    pub file_size: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct Exhibit {
    pub id: String,
    pub case_id: String,
    pub status: String,              // NEW: "unprocessed" | "processed" | "bundled"
    pub file_path: String,            // Changed from Option (NOT NULL in DB)
    pub label: Option<String>,        // Changed to Option (nullable in DB)
    pub sequence_index: Option<i32>,  // Changed to Option (nullable in DB)
    pub page_count: Option<i32>,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateExhibitRequest {
    pub case_id: String,
    pub file_path: String,           // Changed to required
    pub status: String,              // NEW: "unprocessed" | "processed" | "bundled"
    pub label: Option<String>,       // Changed to optional
    pub sequence_index: Option<i32>, // Changed to optional
    pub page_count: Option<i32>,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateExhibitRequest {
    pub id: String,
    pub status: Option<String>,      // NEW: optional status update
    pub label: Option<String>,       // Changed to optional
    pub sequence_index: Option<i32>, // Changed to optional
    pub page_count: Option<i32>,     // NEW: allow page count updates
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReorderExhibitsRequest {
    pub case_id: String,
    pub exhibit_ids: Vec<String>,
}

// Tauri Commands

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
async fn list_documents(
    case_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<Document>, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::list_documents(pool, &case_id).await
}

#[tauri::command]
async fn create_document(
    request: CreateDocumentRequest,
    state: tauri::State<'_, AppState>,
) -> Result<Document, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::create_document(pool, &request.case_id, &request.name).await
}

#[tauri::command]
async fn load_document(id: String, state: tauri::State<'_, AppState>) -> Result<Document, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::load_document(pool, &id).await
}

#[tauri::command]
async fn save_document(
    request: SaveDocumentRequest,
    state: tauri::State<'_, AppState>,
) -> Result<Document, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::save_document(pool, &request.id, &request.content).await
}

#[tauri::command]
async fn delete_case(id: String, state: tauri::State<'_, AppState>) -> Result<(), String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::delete_case(pool, &id).await
}

#[tauri::command]
async fn delete_document(id: String, state: tauri::State<'_, AppState>) -> Result<(), String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::delete_document(pool, &id).await
}

#[tauri::command]
async fn extract_pdf_metadata(file_path: String) -> Result<PdfMetadata, String> {
    println!("[lib.rs] extract_pdf_metadata Tauri command called for: {}", file_path);
    let metadata = pdf::extract_pdf_metadata(&file_path)?;
    println!("[lib.rs] Returning metadata: {:?}", metadata);
    Ok(PdfMetadata {
        page_count: metadata.page_count,
        title: metadata.title,
        file_size: metadata.file_size,
    })
}

// Exhibit Commands

#[tauri::command]
async fn list_exhibits(
    case_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<Exhibit>, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::list_exhibits(pool, &case_id).await
}

#[tauri::command]
async fn list_staging_files(
    case_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<Exhibit>, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::list_staging_files(pool, &case_id).await
}

#[tauri::command]
async fn create_exhibit(
    request: CreateExhibitRequest,
    state: tauri::State<'_, AppState>,
) -> Result<Exhibit, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::create_exhibit(
        pool,
        &request.case_id,
        &request.file_path,
        &request.status,
        request.label.as_deref(),
        request.sequence_index,
        request.page_count,
        request.description.as_deref(),
    )
    .await
}

#[tauri::command]
async fn update_exhibit(
    request: UpdateExhibitRequest,
    state: tauri::State<'_, AppState>,
) -> Result<Exhibit, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::update_exhibit(
        pool,
        &request.id,
        request.status.as_deref(),
        request.label.as_deref(),
        request.sequence_index,
        request.page_count,
        request.description.as_deref(),
    )
    .await
}

#[tauri::command]
async fn update_exhibit_status(
    id: String,
    status: String,
    state: tauri::State<'_, AppState>,
) -> Result<Exhibit, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::update_exhibit_status(pool, &id, &status).await
}

#[tauri::command]
async fn promote_to_bundled(
    id: String,
    label: String,
    sequence_index: i32,
    description: Option<String>,
    state: tauri::State<'_, AppState>,
) -> Result<Exhibit, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::promote_to_bundled(pool, &id, &label, sequence_index, description.as_deref()).await
}

#[tauri::command]
async fn delete_exhibit(id: String, state: tauri::State<'_, AppState>) -> Result<(), String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::delete_exhibit(pool, &id).await
}

#[tauri::command]
async fn reorder_exhibits(
    request: ReorderExhibitsRequest,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<Exhibit>, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::reorder_exhibits(pool, &request.case_id, request.exhibit_ids).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let app_handle = app.handle().clone();

            // Initialize database
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

                // Run migrations
                db::run_migrations(&pool)
                    .await
                    .expect("Failed to run migrations");

                // Store pool in state
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
            list_cases,
            create_case,
            list_documents,
            create_document,
            load_document,
            save_document,
            delete_case,
            delete_document,
            extract_pdf_metadata,
            list_exhibits,
            list_staging_files,
            create_exhibit,
            update_exhibit,
            update_exhibit_status,
            promote_to_bundled,
            delete_exhibit,
            reorder_exhibits,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
