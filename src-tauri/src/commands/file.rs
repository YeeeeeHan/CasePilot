//! File commands - Repository file operations

use crate::db;
use crate::{AppState, CreateFileRequest, File, UpdateFileRequest};

#[tauri::command]
pub async fn list_files(
    case_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<File>, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::list_files(pool, &case_id).await
}

#[tauri::command]
pub async fn create_file(
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
pub async fn get_file(id: String, state: tauri::State<'_, AppState>) -> Result<File, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::get_file(pool, &id).await
}

#[tauri::command]
pub async fn update_file(
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
pub async fn delete_file(id: String, state: tauri::State<'_, AppState>) -> Result<(), String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::delete_file(pool, &id).await
}

