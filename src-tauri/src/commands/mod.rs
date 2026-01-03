//! Command modules for CasePilot v2.0
//!
//! Each module exposes Tauri commands for a specific domain:
//! - case: Case CRUD operations
//! - file: File repository operations
//! - entry: Artifact entry operations (linking files to cases)
//! - pdf: PDF metadata extraction and analysis

pub mod case;
pub mod entry;
pub mod file;
pub mod pdf;

pub use case::*;
pub use entry::*;
pub use file::*;
pub use pdf::*;

