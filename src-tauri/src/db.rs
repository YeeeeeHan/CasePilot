//! Database layer for CasePilot v2.0
//!
//! Schema Overview:
//! - `cases`: Top-level container for a legal matter
//! - `files`: Raw PDF assets (the repository)
//! - `artifacts`: Containers like Affidavits or Bundles
//! - `artifact_entries`: Polymorphic links (file | component | nested artifact)

use sqlx::{Pool, Sqlite};

use crate::{Artifact, ArtifactEntry, Case, File};

// ============================================================================
// MIGRATIONS
// ============================================================================

pub async fn run_migrations(pool: &Pool<Sqlite>) -> Result<(), String> {
    // Enable foreign keys
    sqlx::query("PRAGMA foreign_keys = ON")
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to enable foreign keys: {}", e))?;

    // Cases: Top-level container
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS cases (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
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

    // Artifacts: Containers (affidavit | bundle)
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS artifacts (
            id TEXT PRIMARY KEY,
            case_id TEXT NOT NULL,
            artifact_type TEXT NOT NULL CHECK(artifact_type IN ('affidavit', 'bundle')),
            name TEXT NOT NULL,
            content_json TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to create artifacts table: {}", e))?;

    // Artifact Entries: Polymorphic links
    // row_type determines which FK is used:
    //   - 'file': uses file_id
    //   - 'component': uses config_json (cover page, divider, TOC)
    //   - 'artifact': uses ref_artifact_id (nested artifact)
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS artifact_entries (
            id TEXT PRIMARY KEY,
            artifact_id TEXT NOT NULL,
            sequence_order INTEGER NOT NULL,
            row_type TEXT NOT NULL CHECK(row_type IN ('file', 'component', 'artifact')),
            file_id TEXT,
            config_json TEXT,
            ref_artifact_id TEXT,
            label_override TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE,
            FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
            FOREIGN KEY (ref_artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE
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
        "SELECT id, name, created_at, updated_at FROM cases ORDER BY updated_at DESC",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list cases: {}", e))
}

pub async fn create_case(pool: &Pool<Sqlite>, name: &str) -> Result<Case, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query("INSERT INTO cases (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)")
        .bind(&id)
        .bind(name)
        .bind(&now)
        .bind(&now)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to create case: {}", e))?;

    Ok(Case {
        id,
        name: name.to_string(),
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
// ARTIFACT CRUD
// ============================================================================

pub async fn list_artifacts(pool: &Pool<Sqlite>, case_id: &str) -> Result<Vec<Artifact>, String> {
    sqlx::query_as::<_, Artifact>(
        "SELECT id, case_id, artifact_type, name, content_json, created_at, updated_at
         FROM artifacts WHERE case_id = ? ORDER BY updated_at DESC",
    )
    .bind(case_id)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list artifacts: {}", e))
}

pub async fn list_artifacts_by_type(
    pool: &Pool<Sqlite>,
    case_id: &str,
    artifact_type: &str,
) -> Result<Vec<Artifact>, String> {
    sqlx::query_as::<_, Artifact>(
        "SELECT id, case_id, artifact_type, name, content_json, created_at, updated_at
         FROM artifacts WHERE case_id = ? AND artifact_type = ? ORDER BY updated_at DESC",
    )
    .bind(case_id)
    .bind(artifact_type)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list artifacts: {}", e))
}

pub async fn create_artifact(
    pool: &Pool<Sqlite>,
    case_id: &str,
    artifact_type: &str,
    name: &str,
    content_json: Option<&str>,
) -> Result<Artifact, String> {
    if !["affidavit", "bundle"].contains(&artifact_type) {
        return Err(format!(
            "Invalid artifact_type: {}. Must be 'affidavit' or 'bundle'",
            artifact_type
        ));
    }

    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        "INSERT INTO artifacts (id, case_id, artifact_type, name, content_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(case_id)
    .bind(artifact_type)
    .bind(name)
    .bind(content_json)
    .bind(&now)
    .bind(&now)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to create artifact: {}", e))?;

    Ok(Artifact {
        id,
        case_id: case_id.to_string(),
        artifact_type: artifact_type.to_string(),
        name: name.to_string(),
        content_json: content_json.map(|s| s.to_string()),
        created_at: now.clone(),
        updated_at: now,
    })
}

pub async fn get_artifact(pool: &Pool<Sqlite>, id: &str) -> Result<Artifact, String> {
    sqlx::query_as::<_, Artifact>(
        "SELECT id, case_id, artifact_type, name, content_json, created_at, updated_at
         FROM artifacts WHERE id = ?",
    )
    .bind(id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Artifact not found: {}", e))
}

pub async fn update_artifact(
    pool: &Pool<Sqlite>,
    id: &str,
    name: Option<&str>,
    content_json: Option<&str>,
) -> Result<Artifact, String> {
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        "UPDATE artifacts SET
            name = COALESCE(?, name),
            content_json = ?,
            updated_at = ?
         WHERE id = ?",
    )
    .bind(name)
    .bind(content_json)
    .bind(&now)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to update artifact: {}", e))?;

    get_artifact(pool, id).await
}

pub async fn delete_artifact(pool: &Pool<Sqlite>, id: &str) -> Result<(), String> {
    sqlx::query("DELETE FROM artifacts WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to delete artifact: {}", e))?;
    Ok(())
}

// ============================================================================
// ARTIFACT ENTRY CRUD
// ============================================================================

pub async fn list_entries(
    pool: &Pool<Sqlite>,
    artifact_id: &str,
) -> Result<Vec<ArtifactEntry>, String> {
    sqlx::query_as::<_, ArtifactEntry>(
        "SELECT id, artifact_id, sequence_order, row_type, file_id, config_json, ref_artifact_id, label_override, created_at
         FROM artifact_entries WHERE artifact_id = ? ORDER BY sequence_order ASC",
    )
    .bind(artifact_id)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list entries: {}", e))
}

pub async fn create_entry(
    pool: &Pool<Sqlite>,
    artifact_id: &str,
    sequence_order: i32,
    row_type: &str,
    file_id: Option<&str>,
    config_json: Option<&str>,
    ref_artifact_id: Option<&str>,
    label_override: Option<&str>,
) -> Result<ArtifactEntry, String> {
    if !["file", "component", "artifact"].contains(&row_type) {
        return Err(format!(
            "Invalid row_type: {}. Must be 'file', 'component', or 'artifact'",
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
        "artifact" if ref_artifact_id.is_none() => {
            return Err("ref_artifact_id is required when row_type is 'artifact'".to_string())
        }
        _ => {}
    }

    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        "INSERT INTO artifact_entries (id, artifact_id, sequence_order, row_type, file_id, config_json, ref_artifact_id, label_override, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(artifact_id)
    .bind(sequence_order)
    .bind(row_type)
    .bind(file_id)
    .bind(config_json)
    .bind(ref_artifact_id)
    .bind(label_override)
    .bind(&now)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to create entry: {}", e))?;

    Ok(ArtifactEntry {
        id,
        artifact_id: artifact_id.to_string(),
        sequence_order,
        row_type: row_type.to_string(),
        file_id: file_id.map(|s| s.to_string()),
        config_json: config_json.map(|s| s.to_string()),
        ref_artifact_id: ref_artifact_id.map(|s| s.to_string()),
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
        "SELECT id, artifact_id, sequence_order, row_type, file_id, config_json, ref_artifact_id, label_override, created_at
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
    artifact_id: &str,
    entry_ids: Vec<String>,
) -> Result<Vec<ArtifactEntry>, String> {
    for (index, entry_id) in entry_ids.iter().enumerate() {
        sqlx::query("UPDATE artifact_entries SET sequence_order = ? WHERE id = ? AND artifact_id = ?")
            .bind(index as i32)
            .bind(entry_id)
            .bind(artifact_id)
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to reorder entry {}: {}", entry_id, e))?;
    }

    list_entries(pool, artifact_id).await
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
        let case = create_case(&pool, "Smith v Jones").await.unwrap();
        assert_eq!(case.name, "Smith v Jones");
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
        let case = create_case(&pool, "Test Case").await.unwrap();

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
        let case = create_case(&pool, "Test Case").await.unwrap();
        create_file(&pool, &case.id, "/path/file.pdf", "file.pdf", None, None)
            .await
            .unwrap();

        delete_case(&pool, &case.id).await.unwrap();
        let files = list_files(&pool, &case.id).await.unwrap();
        assert!(files.is_empty());
    }

    // Artifact tests

    #[tokio::test]
    async fn test_artifact_crud() {
        let pool = setup_test_db().await;
        let case = create_case(&pool, "Test Case").await.unwrap();

        // Create affidavit
        let affidavit = create_artifact(
            &pool,
            &case.id,
            "affidavit",
            "Affidavit of John Smith",
            Some(r#"{"type": "doc", "content": []}"#),
        )
        .await
        .unwrap();
        assert_eq!(affidavit.artifact_type, "affidavit");

        // Create bundle
        let bundle = create_artifact(&pool, &case.id, "bundle", "Agreed Bundle", None)
            .await
            .unwrap();
        assert_eq!(bundle.artifact_type, "bundle");

        // List all
        let artifacts = list_artifacts(&pool, &case.id).await.unwrap();
        assert_eq!(artifacts.len(), 2);

        // List by type
        let bundles = list_artifacts_by_type(&pool, &case.id, "bundle")
            .await
            .unwrap();
        assert_eq!(bundles.len(), 1);

        // Update
        let updated = update_artifact(
            &pool,
            &affidavit.id,
            Some("AEIC of John Smith"),
            Some(r#"{"type": "doc", "content": [{"type": "paragraph"}]}"#),
        )
        .await
        .unwrap();
        assert_eq!(updated.name, "AEIC of John Smith");

        // Delete
        delete_artifact(&pool, &bundle.id).await.unwrap();
        let artifacts = list_artifacts(&pool, &case.id).await.unwrap();
        assert_eq!(artifacts.len(), 1);
    }

    #[tokio::test]
    async fn test_artifact_invalid_type() {
        let pool = setup_test_db().await;
        let case = create_case(&pool, "Test Case").await.unwrap();

        let result = create_artifact(&pool, &case.id, "invalid", "Test", None).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid artifact_type"));
    }

    // Artifact Entry tests

    #[tokio::test]
    async fn test_entry_file_type() {
        let pool = setup_test_db().await;
        let case = create_case(&pool, "Test Case").await.unwrap();
        let file = create_file(&pool, &case.id, "/path/file.pdf", "file.pdf", Some(5), None)
            .await
            .unwrap();
        let bundle = create_artifact(&pool, &case.id, "bundle", "Test Bundle", None)
            .await
            .unwrap();

        // Create file entry
        let entry = create_entry(
            &pool,
            &bundle.id,
            0,
            "file",
            Some(&file.id),
            None,
            None,
            Some("Tab 1"),
        )
        .await
        .unwrap();

        assert_eq!(entry.row_type, "file");
        assert_eq!(entry.file_id, Some(file.id));
        assert_eq!(entry.label_override, Some("Tab 1".to_string()));
    }

    #[tokio::test]
    async fn test_entry_component_type() {
        let pool = setup_test_db().await;
        let case = create_case(&pool, "Test Case").await.unwrap();
        let bundle = create_artifact(&pool, &case.id, "bundle", "Test Bundle", None)
            .await
            .unwrap();

        // Create cover page component
        let entry = create_entry(
            &pool,
            &bundle.id,
            0,
            "component",
            None,
            Some(r#"{"template": "cover_v1", "title": "Agreed Bundle"}"#),
            None,
            None,
        )
        .await
        .unwrap();

        assert_eq!(entry.row_type, "component");
        assert!(entry.config_json.is_some());
    }

    #[tokio::test]
    async fn test_entry_artifact_type() {
        let pool = setup_test_db().await;
        let case = create_case(&pool, "Test Case").await.unwrap();
        let affidavit = create_artifact(&pool, &case.id, "affidavit", "AEIC", None)
            .await
            .unwrap();
        let bundle = create_artifact(&pool, &case.id, "bundle", "Test Bundle", None)
            .await
            .unwrap();

        // Nest affidavit inside bundle
        let entry = create_entry(
            &pool,
            &bundle.id,
            0,
            "artifact",
            None,
            None,
            Some(&affidavit.id),
            None,
        )
        .await
        .unwrap();

        assert_eq!(entry.row_type, "artifact");
        assert_eq!(entry.ref_artifact_id, Some(affidavit.id));
    }

    #[tokio::test]
    async fn test_entry_validation() {
        let pool = setup_test_db().await;
        let case = create_case(&pool, "Test Case").await.unwrap();
        let bundle = create_artifact(&pool, &case.id, "bundle", "Test Bundle", None)
            .await
            .unwrap();

        // Missing file_id for file type
        let result = create_entry(&pool, &bundle.id, 0, "file", None, None, None, None).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("file_id is required"));

        // Missing config_json for component type
        let result = create_entry(&pool, &bundle.id, 0, "component", None, None, None, None).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("config_json is required"));
    }

    #[tokio::test]
    async fn test_entry_reorder() {
        let pool = setup_test_db().await;
        let case = create_case(&pool, "Test Case").await.unwrap();
        let bundle = create_artifact(&pool, &case.id, "bundle", "Test Bundle", None)
            .await
            .unwrap();

        let f1 = create_file(&pool, &case.id, "/1.pdf", "1.pdf", None, None)
            .await
            .unwrap();
        let f2 = create_file(&pool, &case.id, "/2.pdf", "2.pdf", None, None)
            .await
            .unwrap();
        let f3 = create_file(&pool, &case.id, "/3.pdf", "3.pdf", None, None)
            .await
            .unwrap();

        let e1 = create_entry(&pool, &bundle.id, 0, "file", Some(&f1.id), None, None, None)
            .await
            .unwrap();
        let e2 = create_entry(&pool, &bundle.id, 1, "file", Some(&f2.id), None, None, None)
            .await
            .unwrap();
        let e3 = create_entry(&pool, &bundle.id, 2, "file", Some(&f3.id), None, None, None)
            .await
            .unwrap();

        // Reorder: 3, 1, 2
        let reordered = reorder_entries(&pool, &bundle.id, vec![e3.id, e1.id, e2.id])
            .await
            .unwrap();

        assert_eq!(reordered[0].file_id, Some(f3.id));
        assert_eq!(reordered[0].sequence_order, 0);
        assert_eq!(reordered[1].file_id, Some(f1.id));
        assert_eq!(reordered[1].sequence_order, 1);
        assert_eq!(reordered[2].file_id, Some(f2.id));
        assert_eq!(reordered[2].sequence_order, 2);
    }

    #[tokio::test]
    async fn test_entry_cascade_delete() {
        let pool = setup_test_db().await;
        let case = create_case(&pool, "Test Case").await.unwrap();
        let bundle = create_artifact(&pool, &case.id, "bundle", "Test Bundle", None)
            .await
            .unwrap();
        let file = create_file(&pool, &case.id, "/file.pdf", "file.pdf", None, None)
            .await
            .unwrap();

        create_entry(&pool, &bundle.id, 0, "file", Some(&file.id), None, None, None)
            .await
            .unwrap();

        // Deleting artifact should cascade delete entries
        delete_artifact(&pool, &bundle.id).await.unwrap();
        let entries = list_entries(&pool, &bundle.id).await.unwrap();
        assert!(entries.is_empty());
    }
}
