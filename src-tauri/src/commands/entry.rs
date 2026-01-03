//! Entry commands - Artifact entry operations (linking files/components to cases)

use crate::db;
use crate::{
    AppState, ArtifactEntry, CreateEntryRequest, ReorderEntriesRequest, UpdateEntryRequest,
};

#[tauri::command]
pub async fn list_entries(
    case_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<ArtifactEntry>, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::list_entries(pool, &case_id).await
}

#[tauri::command]
pub async fn create_entry(
    request: CreateEntryRequest,
    state: tauri::State<'_, AppState>,
) -> Result<ArtifactEntry, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::create_entry(
        pool,
        &request.case_id,
        request.sequence_order,
        &request.row_type,
        request.file_id.as_deref(),
        request.config_json.as_deref(),
        request.label_override.as_deref(),
    )
    .await
}

#[tauri::command]
pub async fn update_entry(
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
pub async fn delete_entry(id: String, state: tauri::State<'_, AppState>) -> Result<(), String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::delete_entry(pool, &id).await
}

#[tauri::command]
pub async fn reorder_entries(
    request: ReorderEntriesRequest,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<ArtifactEntry>, String> {
    let db_guard = state.db.lock().await;
    let pool = db_guard.as_ref().ok_or("Database not initialized")?;
    db::reorder_entries(pool, &request.case_id, request.entry_ids).await
}
