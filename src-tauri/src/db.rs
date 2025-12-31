use sqlx::{Pool, Sqlite};
use crate::{Case, Document};

pub async fn run_migrations(pool: &Pool<Sqlite>) -> Result<(), String> {
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

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS exhibits (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            label TEXT NOT NULL,
            sequence_index INTEGER NOT NULL,
            file_path TEXT,
            description TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to create exhibits table: {}", e))?;

    Ok(())
}

pub async fn list_cases(pool: &Pool<Sqlite>) -> Result<Vec<Case>, String> {
    let rows = sqlx::query_as::<_, Case>(
        "SELECT id, name, created_at, updated_at FROM cases ORDER BY updated_at DESC"
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
        created_at: now.clone(),
        updated_at: now,
    })
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
}
