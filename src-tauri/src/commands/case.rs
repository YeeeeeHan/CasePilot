//! Case commands - CRUD operations for cases

use crate::db;
use crate::{AppState, Case, CreateCaseRequest};

#[tauri::command]
pub async fn list_cases(state: tauri::State<'_, AppState>) -> Result<Vec<Case>, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::list_cases(pool).await
}

#[tauri::command]
pub async fn create_case(
    request: CreateCaseRequest,
    state: tauri::State<'_, AppState>,
) -> Result<Case, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::create_case(
        pool,
        &request.name,
        &request.case_type,
        request.content_json.as_deref(),
    )
    .await
}

#[tauri::command]
pub async fn delete_case(id: String, state: tauri::State<'_, AppState>) -> Result<(), String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::delete_case(pool, &id).await
}
