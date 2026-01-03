//! Database schema and migrations

use sqlx::{Pool, Sqlite};

/// Run all database migrations
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
        let cases_exists: bool = sqlx::query_scalar::<_, i32>(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='cases'",
        )
        .fetch_one(pool)
        .await
        .map(|count| count > 0)
        .unwrap_or(false);

        if cases_exists {
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

