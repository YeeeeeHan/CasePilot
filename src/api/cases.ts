/**
 * Cases API
 *
 * Functions for case CRUD operations.
 */

import { invoke } from "@tauri-apps/api/core";
import type { Case, Document } from "./types";

export async function listCases(): Promise<Case[]> {
  try {
    return await invoke<Case[]>("list_cases");
  } catch (e) {
    console.error("[API] Failed to list cases:", e);
    return [];
  }
}

export async function createCase(
  name: string,
  caseType: "affidavit" | "bundle",
  contentJson?: string,
): Promise<Case | null> {
  try {
    return await invoke<Case>("create_case", {
      request: { name, case_type: caseType, content_json: contentJson },
    });
  } catch (e) {
    console.error("[API] Failed to create case:", e);
    return null;
  }
}

export async function deleteCase(id: string): Promise<boolean> {
  try {
    await invoke("delete_case", { id });
    return true;
  } catch (e) {
    console.error("[API] Failed to delete case:", e);
    return false;
  }
}

export async function listDocuments(caseId: string): Promise<Document[]> {
  try {
    return await invoke<Document[]>("list_documents", { caseId });
  } catch (e) {
    console.error("[API] Failed to list documents:", e);
    return [];
  }
}

export async function createDocument(
  caseId: string,
  name: string,
): Promise<Document | null> {
  try {
    return await invoke<Document>("create_document", {
      request: { case_id: caseId, name },
    });
  } catch (e) {
    console.error("[API] Failed to create document:", e);
    return null;
  }
}

export async function loadDocument(id: string): Promise<Document | null> {
  try {
    return await invoke<Document>("load_document", { id });
  } catch (e) {
    console.error("[API] Failed to load document:", e);
    return null;
  }
}

export async function saveDocument(
  id: string,
  content: string,
): Promise<Document | null> {
  try {
    return await invoke<Document>("save_document", {
      request: { id, content },
    });
  } catch (e) {
    console.error("[API] Failed to save document:", e);
    return null;
  }
}

export async function deleteDocument(id: string): Promise<boolean> {
  try {
    await invoke("delete_document", { id });
    return true;
  } catch (e) {
    console.error("[API] Failed to delete document:", e);
    return false;
  }
}
