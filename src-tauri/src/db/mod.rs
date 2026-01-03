//! Database layer for CasePilot v2.0
//!
//! Schema Overview:
//! - `cases`: Top-level container (IS an Affidavit or Bundle)
//! - `files`: Raw PDF assets (the repository)
//! - `artifact_entries`: Polymorphic links (file | component)

mod queries;
mod schema;

pub use queries::*;
pub use schema::run_migrations;

