//! CasePilot v2.0 - Tauri Application
//!
//! Core entities:
//! - Case: A legal matter (IS an Affidavit or Bundle)
//! - File: Raw PDF asset in the repository
//! - ArtifactEntry: Polymorphic link (file | component)

use serde::{Deserialize, Serialize};
use sqlx::{sqlite::SqlitePoolOptions, FromRow, Pool, Sqlite};
use std::sync::Arc;
use tauri::Manager;
use tokio::sync::Mutex;

mod commands;
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
    pub case_type: String, // "affidavit" | "bundle"
    pub content_json: Option<String>,
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
pub struct ArtifactEntry {
    pub id: String,
    pub case_id: String,
    pub sequence_order: i32,
    pub row_type: String, // "file" | "component"
    pub file_id: Option<String>,
    pub config_json: Option<String>,
    pub label_override: Option<String>,
    pub created_at: String,
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCaseRequest {
    pub name: String,
    pub case_type: String, // "affidavit" | "bundle"
    pub content_json: Option<String>,
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
pub struct CreateEntryRequest {
    pub case_id: String,
    pub sequence_order: i32,
    pub row_type: String,
    pub file_id: Option<String>,
    pub config_json: Option<String>,
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
    pub case_id: String,
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
            commands::list_cases,
            commands::create_case,
            commands::delete_case,
            // File commands
            commands::list_files,
            commands::create_file,
            commands::get_file,
            commands::update_file,
            commands::delete_file,
            // Entry commands
            commands::list_entries,
            commands::create_entry,
            commands::update_entry,
            commands::delete_entry,
            commands::reorder_entries,
            // PDF commands
            commands::extract_pdf_metadata,
            commands::extract_document_info,
            commands::generate_auto_description,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
