use sqlx::{Pool, Sqlite};
use crate::{Case, Document, Exhibit};

pub async fn run_migrations(pool: &Pool<Sqlite>) -> Result<(), String> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS cases (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            master_index_json TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to create cases table: {}", e))?;

    // Add master_index_json column if it doesn't exist (migration for existing DBs)
    let has_master_index_column = sqlx::query_scalar::<_, i32>(
        "SELECT COUNT(*) FROM pragma_table_info('cases') WHERE name = 'master_index_json'"
    )
    .fetch_one(pool)
    .await
    .unwrap_or(0);

    if has_master_index_column == 0 {
        sqlx::query("ALTER TABLE cases ADD COLUMN master_index_json TEXT")
            .execute(pool)
            .await
            .ok(); // Ignore error if column already exists
    }

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            case_id TEXT NOT NULL,
            name TEXT NOT NULL,
            content TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to create documents table: {}", e))?;

    // Check if exhibits table has new schema (status column)
    // If not, drop and recreate with new schema
    let has_status_column = sqlx::query_scalar::<_, i32>(
        "SELECT COUNT(*) FROM pragma_table_info('exhibits') WHERE name = 'status'"
    )
    .fetch_one(pool)
    .await
    .unwrap_or(0);

    if has_status_column == 0 {
        // Drop old table if exists (has old schema or doesn't exist)
        sqlx::query("DROP TABLE IF EXISTS exhibits")
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to drop old exhibits table: {}", e))?;
    }

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS exhibits (
            id TEXT PRIMARY KEY,
            case_id TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('unprocessed', 'processed', 'bundled')),
            file_path TEXT NOT NULL,
            label TEXT,
            sequence_index INTEGER,
            page_count INTEGER,
            description TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to create exhibits table: {}", e))?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS bundles (
            id TEXT PRIMARY KEY,
            case_id TEXT NOT NULL,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to create bundles table: {}", e))?;

    Ok(())
}

pub async fn list_cases(pool: &Pool<Sqlite>) -> Result<Vec<Case>, String> {
    let rows = sqlx::query_as::<_, Case>(
        "SELECT id, name, master_index_json, created_at, updated_at FROM cases ORDER BY updated_at DESC"
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list cases: {}", e))?;

    Ok(rows)
}

pub async fn create_case(pool: &Pool<Sqlite>, name: &str) -> Result<Case, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        "INSERT INTO cases (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)"
    )
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
        master_index_json: None,
        created_at: now.clone(),
        updated_at: now,
    })
}

pub async fn save_master_index(
    pool: &Pool<Sqlite>,
    case_id: &str,
    master_index_json: &str,
) -> Result<(), String> {
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        "UPDATE cases SET master_index_json = ?, updated_at = ? WHERE id = ?"
    )
    .bind(master_index_json)
    .bind(&now)
    .bind(case_id)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to save master index: {}", e))?;

    Ok(())
}

pub async fn load_master_index(
    pool: &Pool<Sqlite>,
    case_id: &str,
) -> Result<Option<String>, String> {
    let result = sqlx::query_scalar::<_, Option<String>>(
        "SELECT master_index_json FROM cases WHERE id = ?"
    )
    .bind(case_id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Failed to load master index: {}", e))?;

    Ok(result)
}

pub async fn list_documents(pool: &Pool<Sqlite>, case_id: &str) -> Result<Vec<Document>, String> {
    let rows = sqlx::query_as::<_, Document>(
        "SELECT id, case_id, name, content, created_at, updated_at FROM documents WHERE case_id = ? ORDER BY updated_at DESC"
    )
    .bind(case_id)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list documents: {}", e))?;

    Ok(rows)
}

pub async fn create_document(
    pool: &Pool<Sqlite>,
    case_id: &str,
    name: &str,
) -> Result<Document, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        "INSERT INTO documents (id, case_id, name, content, created_at, updated_at) VALUES (?, ?, ?, '', ?, ?)"
    )
    .bind(&id)
    .bind(case_id)
    .bind(name)
    .bind(&now)
    .bind(&now)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to create document: {}", e))?;

    // Update case updated_at
    sqlx::query("UPDATE cases SET updated_at = ? WHERE id = ?")
        .bind(&now)
        .bind(case_id)
        .execute(pool)
        .await
        .ok();

    Ok(Document {
        id,
        case_id: case_id.to_string(),
        name: name.to_string(),
        content: String::new(),
        created_at: now.clone(),
        updated_at: now,
    })
}

pub async fn load_document(pool: &Pool<Sqlite>, id: &str) -> Result<Document, String> {
    let doc = sqlx::query_as::<_, Document>(
        "SELECT id, case_id, name, content, created_at, updated_at FROM documents WHERE id = ?"
    )
    .bind(id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Document not found: {}", e))?;

    Ok(doc)
}

pub async fn save_document(
    pool: &Pool<Sqlite>,
    id: &str,
    content: &str,
) -> Result<Document, String> {
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query("UPDATE documents SET content = ?, updated_at = ? WHERE id = ?")
        .bind(content)
        .bind(&now)
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to save document: {}", e))?;

    load_document(pool, id).await
}

pub async fn delete_case(pool: &Pool<Sqlite>, id: &str) -> Result<(), String> {
    // Documents will be cascade deleted
    sqlx::query("DELETE FROM cases WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to delete case: {}", e))?;

    Ok(())
}

pub async fn delete_document(pool: &Pool<Sqlite>, id: &str) -> Result<(), String> {
    sqlx::query("DELETE FROM documents WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to delete document: {}", e))?;

    Ok(())
}

// Exhibit CRUD functions

pub async fn list_exhibits(pool: &Pool<Sqlite>, case_id: &str) -> Result<Vec<Exhibit>, String> {
    let rows = sqlx::query_as::<_, Exhibit>(
        "SELECT id, case_id, status, file_path, label, sequence_index, page_count, description, created_at, updated_at
         FROM exhibits WHERE case_id = ? AND status = 'bundled' ORDER BY sequence_index ASC"
    )
    .bind(case_id)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list exhibits: {}", e))?;

    Ok(rows)
}

pub async fn list_staging_files(pool: &Pool<Sqlite>, case_id: &str) -> Result<Vec<Exhibit>, String> {
    // Return ALL files for the case (including bundled) so users can see all files at all times
    // Bundled files are shown first (by sequence), then non-bundled by creation date
    let rows = sqlx::query_as::<_, Exhibit>(
        "SELECT id, case_id, status, file_path, label, sequence_index, page_count, description, created_at, updated_at
         FROM exhibits WHERE case_id = ?
         ORDER BY
           CASE WHEN status = 'bundled' THEN 0 ELSE 1 END,
           COALESCE(sequence_index, 999999),
           created_at DESC"
    )
    .bind(case_id)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list staging files: {}", e))?;

    Ok(rows)
}

#[allow(dead_code)]
pub async fn list_bundled_exhibits(pool: &Pool<Sqlite>, case_id: &str) -> Result<Vec<Exhibit>, String> {
    let rows = sqlx::query_as::<_, Exhibit>(
        "SELECT id, case_id, status, file_path, label, sequence_index, page_count, description, created_at, updated_at
         FROM exhibits WHERE case_id = ? AND status = 'bundled' ORDER BY sequence_index ASC"
    )
    .bind(case_id)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list bundled exhibits: {}", e))?;

    Ok(rows)
}

pub async fn create_exhibit(
    pool: &Pool<Sqlite>,
    case_id: &str,
    file_path: &str,
    status: &str,
    label: Option<&str>,
    sequence_index: Option<i32>,
    page_count: Option<i32>,
    description: Option<&str>,
) -> Result<Exhibit, String> {
    // Validate status
    if !["unprocessed", "processed", "bundled"].contains(&status) {
        return Err(format!("Invalid status: {}. Must be one of: unprocessed, processed, bundled", status));
    }

    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        "INSERT INTO exhibits (id, case_id, status, file_path, label, sequence_index, page_count, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(case_id)
    .bind(status)
    .bind(file_path)
    .bind(label)
    .bind(sequence_index)
    .bind(page_count)
    .bind(description)
    .bind(&now)
    .bind(&now)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to create exhibit: {}", e))?;

    Ok(Exhibit {
        id,
        case_id: case_id.to_string(),
        status: status.to_string(),
        file_path: file_path.to_string(),
        label: label.map(|s| s.to_string()),
        sequence_index,
        page_count,
        description: description.map(|s| s.to_string()),
        created_at: now.clone(),
        updated_at: now,
    })
}

pub async fn update_exhibit(
    pool: &Pool<Sqlite>,
    id: &str,
    status: Option<&str>,
    label: Option<&str>,
    sequence_index: Option<i32>,
    page_count: Option<i32>,
    description: Option<&str>,
) -> Result<Exhibit, String> {
    // Validate status if provided
    if let Some(s) = status {
        if !["unprocessed", "processed", "bundled"].contains(&s) {
            return Err(format!("Invalid status: {}. Must be one of: unprocessed, processed, bundled", s));
        }
    }

    let now = chrono::Utc::now().to_rfc3339();

    // Build dynamic UPDATE query - only update provided fields
    sqlx::query(
        "UPDATE exhibits
         SET status = COALESCE(?, status),
             label = ?,
             sequence_index = ?,
             page_count = ?,
             description = ?,
             updated_at = ?
         WHERE id = ?"
    )
    .bind(status)
    .bind(label)
    .bind(sequence_index)
    .bind(page_count)
    .bind(description)
    .bind(&now)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to update exhibit: {}", e))?;

    // Fetch and return the updated exhibit
    let exhibit = sqlx::query_as::<_, Exhibit>(
        "SELECT id, case_id, status, file_path, label, sequence_index, page_count, description, created_at, updated_at
         FROM exhibits WHERE id = ?"
    )
    .bind(id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Exhibit not found: {}", e))?;

    Ok(exhibit)
}

pub async fn update_exhibit_status(
    pool: &Pool<Sqlite>,
    id: &str,
    new_status: &str,
) -> Result<Exhibit, String> {
    // Validate status
    if !["unprocessed", "processed", "bundled"].contains(&new_status) {
        return Err(format!("Invalid status: {}. Must be one of: unprocessed, processed, bundled", new_status));
    }

    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        "UPDATE exhibits SET status = ?, updated_at = ? WHERE id = ?"
    )
    .bind(new_status)
    .bind(&now)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to update exhibit status: {}", e))?;

    // Fetch and return updated exhibit
    sqlx::query_as::<_, Exhibit>(
        "SELECT id, case_id, status, file_path, label, sequence_index, page_count, description, created_at, updated_at
         FROM exhibits WHERE id = ?"
    )
    .bind(id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Exhibit not found: {}", e))
}

pub async fn promote_to_bundled(
    pool: &Pool<Sqlite>,
    id: &str,
    label: &str,
    sequence_index: i32,
    description: Option<&str>,
) -> Result<Exhibit, String> {
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        "UPDATE exhibits
         SET status = 'bundled',
             label = ?,
             sequence_index = ?,
             description = ?,
             updated_at = ?
         WHERE id = ?"
    )
    .bind(label)
    .bind(sequence_index)
    .bind(description)
    .bind(&now)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to promote to bundled: {}", e))?;

    // Fetch and return updated exhibit
    sqlx::query_as::<_, Exhibit>(
        "SELECT id, case_id, status, file_path, label, sequence_index, page_count, description, created_at, updated_at
         FROM exhibits WHERE id = ?"
    )
    .bind(id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Exhibit not found: {}", e))
}

pub async fn delete_exhibit(pool: &Pool<Sqlite>, id: &str) -> Result<(), String> {
    sqlx::query("DELETE FROM exhibits WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to delete exhibit: {}", e))?;

    Ok(())
}

pub async fn reorder_exhibits(
    pool: &Pool<Sqlite>,
    case_id: &str,
    exhibit_ids: Vec<String>,
) -> Result<Vec<Exhibit>, String> {
    let now = chrono::Utc::now().to_rfc3339();

    // Update sequence_index for each exhibit based on new order
    for (index, exhibit_id) in exhibit_ids.iter().enumerate() {
        sqlx::query(
            "UPDATE exhibits SET sequence_index = ?, updated_at = ? WHERE id = ? AND case_id = ?"
        )
        .bind(index as i32)
        .bind(&now)
        .bind(exhibit_id)
        .bind(case_id)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to reorder exhibit {}: {}", exhibit_id, e))?;
    }

    // Return updated list
    list_exhibits(pool, case_id).await
}

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

        // Enable foreign keys for cascade delete
        sqlx::query("PRAGMA foreign_keys = ON")
            .execute(&pool)
            .await
            .unwrap();

        run_migrations(&pool).await.expect("Failed to run migrations");
        pool
    }

    #[tokio::test]
    async fn test_run_migrations_creates_tables() {
        let pool = setup_test_db().await;

        // Verify tables exist by querying them
        let result = sqlx::query("SELECT name FROM sqlite_master WHERE type='table' AND name='cases'")
            .fetch_optional(&pool)
            .await;
        assert!(result.is_ok());
        assert!(result.unwrap().is_some());
    }

    #[tokio::test]
    async fn test_create_case() {
        let pool = setup_test_db().await;

        let case = create_case(&pool, "Smith v Jones").await.unwrap();

        assert_eq!(case.name, "Smith v Jones");
        assert!(!case.id.is_empty());
        assert!(uuid::Uuid::parse_str(&case.id).is_ok());
    }

    #[tokio::test]
    async fn test_list_cases_empty() {
        let pool = setup_test_db().await;

        let cases = list_cases(&pool).await.unwrap();

        assert!(cases.is_empty());
    }

    #[tokio::test]
    async fn test_list_cases_returns_all() {
        let pool = setup_test_db().await;

        create_case(&pool, "Case 1").await.unwrap();
        create_case(&pool, "Case 2").await.unwrap();
        create_case(&pool, "Case 3").await.unwrap();

        let cases = list_cases(&pool).await.unwrap();

        assert_eq!(cases.len(), 3);
    }

    #[tokio::test]
    async fn test_list_cases_ordered_by_updated_at() {
        let pool = setup_test_db().await;

        let case1 = create_case(&pool, "First").await.unwrap();
        let _case2 = create_case(&pool, "Second").await.unwrap();

        // Update case1 to make it definitely more recent using a future timestamp
        sqlx::query("UPDATE cases SET updated_at = '2099-12-31T23:59:59Z' WHERE id = ?")
            .bind(&case1.id)
            .execute(&pool)
            .await
            .unwrap();

        let cases = list_cases(&pool).await.unwrap();

        // Most recently updated should be first
        assert_eq!(cases[0].name, "First");
        assert_eq!(cases[1].name, "Second");
    }

    #[tokio::test]
    async fn test_create_document() {
        let pool = setup_test_db().await;
        let case = create_case(&pool, "Test Case").await.unwrap();

        let doc = create_document(&pool, &case.id, "AEIC of Plaintiff").await.unwrap();

        assert_eq!(doc.name, "AEIC of Plaintiff");
        assert_eq!(doc.case_id, case.id);
        assert!(doc.content.is_empty());
    }

    #[tokio::test]
    async fn test_list_documents() {
        let pool = setup_test_db().await;
        let case = create_case(&pool, "Test Case").await.unwrap();

        create_document(&pool, &case.id, "Doc 1").await.unwrap();
        create_document(&pool, &case.id, "Doc 2").await.unwrap();

        let docs = list_documents(&pool, &case.id).await.unwrap();

        assert_eq!(docs.len(), 2);
    }

    #[tokio::test]
    async fn test_list_documents_only_returns_case_documents() {
        let pool = setup_test_db().await;
        let case1 = create_case(&pool, "Case 1").await.unwrap();
        let case2 = create_case(&pool, "Case 2").await.unwrap();

        create_document(&pool, &case1.id, "Case 1 Doc").await.unwrap();
        create_document(&pool, &case2.id, "Case 2 Doc").await.unwrap();

        let docs = list_documents(&pool, &case1.id).await.unwrap();

        assert_eq!(docs.len(), 1);
        assert_eq!(docs[0].name, "Case 1 Doc");
    }

    #[tokio::test]
    async fn test_load_document() {
        let pool = setup_test_db().await;
        let case = create_case(&pool, "Test Case").await.unwrap();
        let doc = create_document(&pool, &case.id, "Test Doc").await.unwrap();

        let loaded = load_document(&pool, &doc.id).await.unwrap();

        assert_eq!(loaded.id, doc.id);
        assert_eq!(loaded.name, "Test Doc");
    }

    #[tokio::test]
    async fn test_load_document_not_found() {
        let pool = setup_test_db().await;

        let result = load_document(&pool, "nonexistent-id").await;

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not found"));
    }

    #[tokio::test]
    async fn test_save_document() {
        let pool = setup_test_db().await;
        let case = create_case(&pool, "Test Case").await.unwrap();
        let doc = create_document(&pool, &case.id, "Test Doc").await.unwrap();

        let content = "<p>Legal content here</p>";
        let updated = save_document(&pool, &doc.id, content).await.unwrap();

        assert_eq!(updated.content, content);
        assert_ne!(updated.updated_at, doc.updated_at);
    }

    #[tokio::test]
    async fn test_save_and_load_document() {
        let pool = setup_test_db().await;
        let case = create_case(&pool, "Test Case").await.unwrap();
        let doc = create_document(&pool, &case.id, "Test Doc").await.unwrap();

        let content = "<p>I, John Smith, do solemnly affirm...</p>";
        save_document(&pool, &doc.id, content).await.unwrap();

        let loaded = load_document(&pool, &doc.id).await.unwrap();
        assert_eq!(loaded.content, content);
    }

    #[tokio::test]
    async fn test_delete_case() {
        let pool = setup_test_db().await;
        let case = create_case(&pool, "To Delete").await.unwrap();

        delete_case(&pool, &case.id).await.unwrap();

        let cases = list_cases(&pool).await.unwrap();
        assert!(cases.is_empty());
    }

    #[tokio::test]
    async fn test_delete_case_cascades_documents() {
        let pool = setup_test_db().await;
        let case = create_case(&pool, "Test Case").await.unwrap();
        create_document(&pool, &case.id, "Doc 1").await.unwrap();
        create_document(&pool, &case.id, "Doc 2").await.unwrap();

        delete_case(&pool, &case.id).await.unwrap();

        let docs = list_documents(&pool, &case.id).await.unwrap();
        assert!(docs.is_empty());
    }

    #[tokio::test]
    async fn test_delete_document() {
        let pool = setup_test_db().await;
        let case = create_case(&pool, "Test Case").await.unwrap();
        let doc = create_document(&pool, &case.id, "To Delete").await.unwrap();

        delete_document(&pool, &doc.id).await.unwrap();

        let result = load_document(&pool, &doc.id).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_delete_document_does_not_affect_others() {
        let pool = setup_test_db().await;
        let case = create_case(&pool, "Test Case").await.unwrap();
        let doc1 = create_document(&pool, &case.id, "Keep").await.unwrap();
        let doc2 = create_document(&pool, &case.id, "Delete").await.unwrap();

        delete_document(&pool, &doc2.id).await.unwrap();

        let docs = list_documents(&pool, &case.id).await.unwrap();
        assert_eq!(docs.len(), 1);
        assert_eq!(docs[0].id, doc1.id);
    }

    // Exhibit CRUD tests

    #[tokio::test]
    async fn test_create_exhibit() {
        let pool = setup_test_db().await;
        let case = create_case(&pool, "Test Case").await.unwrap();

        let exhibit = create_exhibit(
            &pool,
            &case.id,
            "/path/to/file.pdf",
            "bundled",
            Some("Tab 1"),
            Some(0),
            Some(5),
            Some("Email from John to Jane"),
        )
        .await
        .unwrap();

        assert_eq!(exhibit.status, "bundled");
        assert_eq!(exhibit.label, Some("Tab 1".to_string()));
        assert_eq!(exhibit.case_id, case.id);
        assert_eq!(exhibit.sequence_index, Some(0));
        assert_eq!(exhibit.page_count, Some(5));
        assert_eq!(exhibit.file_path, "/path/to/file.pdf");
        assert!(uuid::Uuid::parse_str(&exhibit.id).is_ok());
    }

    #[tokio::test]
    async fn test_list_exhibits_empty() {
        let pool = setup_test_db().await;
        let case = create_case(&pool, "Test Case").await.unwrap();

        let exhibits = list_exhibits(&pool, &case.id).await.unwrap();

        assert!(exhibits.is_empty());
    }

    #[tokio::test]
    async fn test_list_exhibits_ordered_by_sequence() {
        let pool = setup_test_db().await;
        let case = create_case(&pool, "Test Case").await.unwrap();

        // Create in reverse order
        create_exhibit(&pool, &case.id, "/path/file3.pdf", "bundled", Some("Tab 3"), Some(2), Some(1), None).await.unwrap();
        create_exhibit(&pool, &case.id, "/path/file1.pdf", "bundled", Some("Tab 1"), Some(0), Some(3), None).await.unwrap();
        create_exhibit(&pool, &case.id, "/path/file2.pdf", "bundled", Some("Tab 2"), Some(1), Some(2), None).await.unwrap();

        let exhibits = list_exhibits(&pool, &case.id).await.unwrap();

        assert_eq!(exhibits.len(), 3);
        assert_eq!(exhibits[0].label, Some("Tab 1".to_string()));
        assert_eq!(exhibits[1].label, Some("Tab 2".to_string()));
        assert_eq!(exhibits[2].label, Some("Tab 3".to_string()));
    }

    #[tokio::test]
    async fn test_list_exhibits_only_returns_case_exhibits() {
        let pool = setup_test_db().await;
        let case1 = create_case(&pool, "Case 1").await.unwrap();
        let case2 = create_case(&pool, "Case 2").await.unwrap();

        create_exhibit(&pool, &case1.id, "/path/file1.pdf", "bundled", Some("Case 1 Exhibit"), Some(0), None, None).await.unwrap();
        create_exhibit(&pool, &case2.id, "/path/file2.pdf", "bundled", Some("Case 2 Exhibit"), Some(0), None, None).await.unwrap();

        let exhibits = list_exhibits(&pool, &case1.id).await.unwrap();

        assert_eq!(exhibits.len(), 1);
        assert_eq!(exhibits[0].label, Some("Case 1 Exhibit".to_string()));
    }

    #[tokio::test]
    async fn test_update_exhibit() {
        let pool = setup_test_db().await;
        let case = create_case(&pool, "Test Case").await.unwrap();
        let exhibit = create_exhibit(&pool, &case.id, "/path/file.pdf", "bundled", Some("Tab 1"), Some(0), None, Some("Original")).await.unwrap();

        let updated = update_exhibit(&pool, &exhibit.id, None, Some("Tab A"), Some(5), None, Some("Updated description")).await.unwrap();

        assert_eq!(updated.label, Some("Tab A".to_string()));
        assert_eq!(updated.sequence_index, Some(5));
        assert_eq!(updated.description, Some("Updated description".to_string()));
        assert_ne!(updated.updated_at, exhibit.updated_at);
    }

    #[tokio::test]
    async fn test_delete_exhibit() {
        let pool = setup_test_db().await;
        let case = create_case(&pool, "Test Case").await.unwrap();
        let exhibit = create_exhibit(&pool, &case.id, "/path/file.pdf", "bundled", Some("Tab 1"), Some(0), None, None).await.unwrap();

        delete_exhibit(&pool, &exhibit.id).await.unwrap();

        let exhibits = list_exhibits(&pool, &case.id).await.unwrap();
        assert!(exhibits.is_empty());
    }

    #[tokio::test]
    async fn test_delete_case_cascades_exhibits() {
        let pool = setup_test_db().await;
        let case = create_case(&pool, "Test Case").await.unwrap();
        create_exhibit(&pool, &case.id, "/path/file1.pdf", "bundled", Some("Tab 1"), Some(0), None, None).await.unwrap();
        create_exhibit(&pool, &case.id, "/path/file2.pdf", "bundled", Some("Tab 2"), Some(1), None, None).await.unwrap();

        delete_case(&pool, &case.id).await.unwrap();

        let exhibits = list_exhibits(&pool, &case.id).await.unwrap();
        assert!(exhibits.is_empty());
    }

    #[tokio::test]
    async fn test_reorder_exhibits() {
        let pool = setup_test_db().await;
        let case = create_case(&pool, "Test Case").await.unwrap();

        let e1 = create_exhibit(&pool, &case.id, "/path/file1.pdf", "bundled", Some("First"), Some(0), None, None).await.unwrap();
        let e2 = create_exhibit(&pool, &case.id, "/path/file2.pdf", "bundled", Some("Second"), Some(1), None, None).await.unwrap();
        let e3 = create_exhibit(&pool, &case.id, "/path/file3.pdf", "bundled", Some("Third"), Some(2), None, None).await.unwrap();

        // Reorder: Third -> First -> Second
        let reordered = reorder_exhibits(&pool, &case.id, vec![e3.id.clone(), e1.id.clone(), e2.id.clone()]).await.unwrap();

        assert_eq!(reordered.len(), 3);
        assert_eq!(reordered[0].label, Some("Third".to_string()));
        assert_eq!(reordered[0].sequence_index, Some(0));
        assert_eq!(reordered[1].label, Some("First".to_string()));
        assert_eq!(reordered[1].sequence_index, Some(1));
        assert_eq!(reordered[2].label, Some("Second".to_string()));
        assert_eq!(reordered[2].sequence_index, Some(2));
    }
}
