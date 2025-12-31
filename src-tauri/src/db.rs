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
