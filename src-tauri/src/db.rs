//! Database layer for CasePilot v2.0
//!
//! Schema Overview:
//! - `cases`: Top-level container (IS an Affidavit or Bundle)
//! - `files`: Raw PDF assets (the repository)
//! - `artifact_entries`: Polymorphic links (file | component)

use sqlx::{Pool, Sqlite};

use crate::{ArtifactEntry, Case, File};

// ============================================================================
// MIGRATIONS
// ============================================================================

pub async fn run_migrations(pool: &Pool<Sqlite>) -> Result<(), String> {
    // Enable foreign keys
    sqlx::query("PRAGMA foreign_keys = ON")
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to enable foreign keys: {}", e))?;

    // Check if we need to migrate from old schema (cases table without case_type column)
    let has_case_type: bool = sqlx::query_scalar::<_, i32>(
        "SELECT COUNT(*) FROM pragma_table_info('cases') WHERE name = 'case_type'",
    )
    .fetch_one(pool)
    .await
    .map(|count| count > 0)
    .unwrap_or(false);

    // If old schema exists without case_type, drop everything and start fresh
    if !has_case_type {
        // Check if cases table exists at all
        let cases_exists: bool = sqlx::query_scalar::<_, i32>(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='cases'",
        )
        .fetch_one(pool)
        .await
        .map(|count| count > 0)
        .unwrap_or(false);

        if cases_exists {
            // Old schema - drop all tables and recreate
            sqlx::query("DROP TABLE IF EXISTS artifact_entries")
                .execute(pool)
                .await
                .ok();
            sqlx::query("DROP TABLE IF EXISTS files")
                .execute(pool)
                .await
                .ok();
            sqlx::query("DROP TABLE IF EXISTS artifacts")
                .execute(pool)
                .await
                .ok();
            sqlx::query("DROP TABLE IF EXISTS cases")
                .execute(pool)
                .await
                .ok();
        }
    }

    // Cases: Top-level container (IS an Affidavit or Bundle)
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS cases (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            case_type TEXT NOT NULL CHECK(case_type IN ('affidavit', 'bundle')),
            content_json TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to create cases table: {}", e))?;

    // Files: Raw PDF assets
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS files (
            id TEXT PRIMARY KEY,
            case_id TEXT NOT NULL,
            path TEXT NOT NULL,
            original_name TEXT NOT NULL,
            page_count INTEGER,
            metadata_json TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to create files table: {}", e))?;

    // Artifact Entries: Polymorphic links to cases
    // row_type determines which FK is used:
    //   - 'file': uses file_id
    //   - 'component': uses config_json (cover page, divider, TOC)
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS artifact_entries (
            id TEXT PRIMARY KEY,
            case_id TEXT NOT NULL,
            sequence_order INTEGER NOT NULL,
            row_type TEXT NOT NULL CHECK(row_type IN ('file', 'component')),
            file_id TEXT,
            config_json TEXT,
            label_override TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
            FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to create artifact_entries table: {}", e))?;

    Ok(())
}

// ============================================================================
// CASE CRUD
// ============================================================================

pub async fn list_cases(pool: &Pool<Sqlite>) -> Result<Vec<Case>, String> {
    sqlx::query_as::<_, Case>(
        "SELECT id, name, case_type, content_json, created_at, updated_at FROM cases ORDER BY updated_at DESC",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list cases: {}", e))
}

pub async fn create_case(
    pool: &Pool<Sqlite>,
    name: &str,
    case_type: &str,
    content_json: Option<&str>,
) -> Result<Case, String> {
    if !["affidavit", "bundle"].contains(&case_type) {
        return Err(format!(
            "Invalid case_type: {}. Must be 'affidavit' or 'bundle'",
            case_type
        ));
    }

    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query("INSERT INTO cases (id, name, case_type, content_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(&id)
        .bind(name)
        .bind(case_type)
        .bind(content_json)
        .bind(&now)
        .bind(&now)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to create case: {}", e))?;

    Ok(Case {
        id,
        name: name.to_string(),
        case_type: case_type.to_string(),
        content_json: content_json.map(|s| s.to_string()),
        created_at: now.clone(),
        updated_at: now,
    })
}

pub async fn delete_case(pool: &Pool<Sqlite>, id: &str) -> Result<(), String> {
    sqlx::query("DELETE FROM cases WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to delete case: {}", e))?;
    Ok(())
}

// ============================================================================
// FILE CRUD
// ============================================================================

pub async fn list_files(pool: &Pool<Sqlite>, case_id: &str) -> Result<Vec<File>, String> {
    sqlx::query_as::<_, File>(
        "SELECT id, case_id, path, original_name, page_count, metadata_json, created_at
         FROM files WHERE case_id = ? ORDER BY created_at DESC",
    )
    .bind(case_id)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list files: {}", e))
}

pub async fn create_file(
    pool: &Pool<Sqlite>,
    case_id: &str,
    path: &str,
    original_name: &str,
    page_count: Option<i32>,
    metadata_json: Option<&str>,
) -> Result<File, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        "INSERT INTO files (id, case_id, path, original_name, page_count, metadata_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(case_id)
    .bind(path)
    .bind(original_name)
    .bind(page_count)
    .bind(metadata_json)
    .bind(&now)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to create file: {}", e))?;

    Ok(File {
        id,
        case_id: case_id.to_string(),
        path: path.to_string(),
        original_name: original_name.to_string(),
        page_count,
        metadata_json: metadata_json.map(|s| s.to_string()),
        created_at: now,
    })
}

pub async fn get_file(pool: &Pool<Sqlite>, id: &str) -> Result<File, String> {
    sqlx::query_as::<_, File>(
        "SELECT id, case_id, path, original_name, page_count, metadata_json, created_at
         FROM files WHERE id = ?",
    )
    .bind(id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("File not found: {}", e))
}

pub async fn update_file(
    pool: &Pool<Sqlite>,
    id: &str,
    page_count: Option<i32>,
    metadata_json: Option<&str>,
) -> Result<File, String> {
    sqlx::query("UPDATE files SET page_count = ?, metadata_json = ? WHERE id = ?")
        .bind(page_count)
        .bind(metadata_json)
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to update file: {}", e))?;

    get_file(pool, id).await
}

pub async fn delete_file(pool: &Pool<Sqlite>, id: &str) -> Result<(), String> {
    sqlx::query("DELETE FROM files WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to delete file: {}", e))?;
    Ok(())
}

// ============================================================================
// CASE ENTRY CRUD
// ============================================================================

pub async fn list_entries(
    pool: &Pool<Sqlite>,
    case_id: &str,
) -> Result<Vec<ArtifactEntry>, String> {
    sqlx::query_as::<_, ArtifactEntry>(
        "SELECT id, case_id, sequence_order, row_type, file_id, config_json, label_override, created_at
         FROM artifact_entries WHERE case_id = ? ORDER BY sequence_order ASC",
    )
    .bind(case_id)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list entries: {}", e))
}

pub async fn create_entry(
    pool: &Pool<Sqlite>,
    case_id: &str,
    sequence_order: i32,
    row_type: &str,
    file_id: Option<&str>,
    config_json: Option<&str>,
    label_override: Option<&str>,
) -> Result<ArtifactEntry, String> {
    if !["file", "component"].contains(&row_type) {
        return Err(format!(
            "Invalid row_type: {}. Must be 'file' or 'component'",
            row_type
        ));
    }

    // Validate that the correct field is provided for the row_type
    match row_type {
        "file" if file_id.is_none() => {
            return Err("file_id is required when row_type is 'file'".to_string())
        }
        "component" if config_json.is_none() => {
            return Err("config_json is required when row_type is 'component'".to_string())
        }
        _ => {}
    }

    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        "INSERT INTO artifact_entries (id, case_id, sequence_order, row_type, file_id, config_json, label_override, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(case_id)
    .bind(sequence_order)
    .bind(row_type)
    .bind(file_id)
    .bind(config_json)
    .bind(label_override)
    .bind(&now)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to create entry: {}", e))?;

    Ok(ArtifactEntry {
        id,
        case_id: case_id.to_string(),
        sequence_order,
        row_type: row_type.to_string(),
        file_id: file_id.map(|s| s.to_string()),
        config_json: config_json.map(|s| s.to_string()),
        label_override: label_override.map(|s| s.to_string()),
        created_at: now,
    })
}

pub async fn update_entry(
    pool: &Pool<Sqlite>,
    id: &str,
    sequence_order: Option<i32>,
    config_json: Option<&str>,
    label_override: Option<&str>,
) -> Result<ArtifactEntry, String> {
    sqlx::query(
        "UPDATE artifact_entries SET
            sequence_order = COALESCE(?, sequence_order),
            config_json = ?,
            label_override = ?
         WHERE id = ?",
    )
    .bind(sequence_order)
    .bind(config_json)
    .bind(label_override)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to update entry: {}", e))?;

    sqlx::query_as::<_, ArtifactEntry>(
        "SELECT id, case_id, sequence_order, row_type, file_id, config_json, label_override, created_at
         FROM artifact_entries WHERE id = ?",
    )
    .bind(id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Entry not found: {}", e))
}

pub async fn delete_entry(pool: &Pool<Sqlite>, id: &str) -> Result<(), String> {
    sqlx::query("DELETE FROM artifact_entries WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to delete entry: {}", e))?;
    Ok(())
}

pub async fn reorder_entries(
    pool: &Pool<Sqlite>,
    case_id: &str,
    entry_ids: Vec<String>,
) -> Result<Vec<ArtifactEntry>, String> {
    for (index, entry_id) in entry_ids.iter().enumerate() {
        sqlx::query("UPDATE artifact_entries SET sequence_order = ? WHERE id = ? AND case_id = ?")
            .bind(index as i32)
            .bind(entry_id)
            .bind(case_id)
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to reorder entry {}: {}", entry_id, e))?;
    }

    list_entries(pool, case_id).await
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::SqlitePoolOptions;

    async fn setup_test_db() -> Pool<Sqlite> {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .expect("Failed to create test database");

        run_migrations(&pool)
            .await
            .expect("Failed to run migrations");
        pool
    }

    // Case tests

    #[tokio::test]
    async fn test_case_crud() {
        let pool = setup_test_db().await;

        // Create
        let case = create_case(&pool, "Smith v Jones", "bundle", None)
            .await
            .unwrap();
        assert_eq!(case.name, "Smith v Jones");
        assert_eq!(case.case_type, "bundle");
        assert!(!case.id.is_empty());

        // List
        let cases = list_cases(&pool).await.unwrap();
        assert_eq!(cases.len(), 1);

        // Delete
        delete_case(&pool, &case.id).await.unwrap();
        let cases = list_cases(&pool).await.unwrap();
        assert!(cases.is_empty());
    }

    // File tests

    #[tokio::test]
    async fn test_file_crud() {
        let pool = setup_test_db().await;
        let case = create_case(&pool, "Test Case", "bundle", None)
            .await
            .unwrap();

        // Create
        let file = create_file(
            &pool,
            &case.id,
            "/path/to/invoice.pdf",
            "invoice.pdf",
            Some(5),
            Some(r#"{"date": "2024-01-15"}"#),
        )
        .await
        .unwrap();
        assert_eq!(file.original_name, "invoice.pdf");
        assert_eq!(file.page_count, Some(5));

        // List
        let files = list_files(&pool, &case.id).await.unwrap();
        assert_eq!(files.len(), 1);

        // Get
        let fetched = get_file(&pool, &file.id).await.unwrap();
        assert_eq!(fetched.id, file.id);

        // Update
        let updated = update_file(&pool, &file.id, Some(10), None).await.unwrap();
        assert_eq!(updated.page_count, Some(10));
        assert!(updated.metadata_json.is_none());

        // Delete
        delete_file(&pool, &file.id).await.unwrap();
        let files = list_files(&pool, &case.id).await.unwrap();
        assert!(files.is_empty());
    }

    #[tokio::test]
    async fn test_file_cascade_delete() {
        let pool = setup_test_db().await;
        let case = create_case(&pool, "Test Case", "bundle", None)
            .await
            .unwrap();
        create_file(&pool, &case.id, "/path/file.pdf", "file.pdf", None, None)
            .await
            .unwrap();

        delete_case(&pool, &case.id).await.unwrap();
        let files = list_files(&pool, &case.id).await.unwrap();
        assert!(files.is_empty());
    }

    // TODO: Artifact and Entry tests need to be rewritten for the new case-based model
    // where cases ARE artifacts (affidavit or bundle), and entries reference case_id directly.
}
