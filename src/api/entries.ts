/**
 * Entries API
 *
 * Functions for artifact entry operations.
 */

import { invoke } from "@tauri-apps/api/core";
import type { ArtifactEntry, CompileResult, TOCEntry } from "./types";

export async function listEntries(caseId: string): Promise<ArtifactEntry[]> {
  try {
    return await invoke<ArtifactEntry[]>("list_entries", { caseId });
  } catch (e) {
    console.error("[API] Failed to list entries:", e);
    return [];
  }
}

export async function createEntry(
  caseId: string,
  sequenceOrder: number,
  rowType: "file" | "component",
  fileId?: string,
  configJson?: string,
  labelOverride?: string,
): Promise<ArtifactEntry | null> {
  try {
    return await invoke<ArtifactEntry>("create_entry", {
      request: {
        case_id: caseId,
        sequence_order: sequenceOrder,
        row_type: rowType,
        file_id: fileId,
        config_json: configJson,
        label_override: labelOverride,
      },
    });
  } catch (e) {
    console.error("[API] Failed to create entry:", e);
    return null;
  }
}

export async function updateEntry(
  id: string,
  sequenceOrder?: number,
  configJson?: string,
  labelOverride?: string,
): Promise<ArtifactEntry | null> {
  try {
    return await invoke<ArtifactEntry>("update_entry", {
      request: {
        id,
        sequence_order: sequenceOrder,
        config_json: configJson,
        label_override: labelOverride,
      },
    });
  } catch (e) {
    console.error("[API] Failed to update entry:", e);
    return null;
  }
}

export async function deleteEntry(id: string): Promise<boolean> {
  try {
    await invoke("delete_entry", { id });
    return true;
  } catch (e) {
    console.error("[API] Failed to delete entry:", e);
    return false;
  }
}

export async function reorderEntries(
  caseId: string,
  entryIds: string[],
): Promise<ArtifactEntry[]> {
  try {
    return await invoke<ArtifactEntry[]>("reorder_entries", {
      request: {
        case_id: caseId,
        entry_ids: entryIds,
      },
    });
  } catch (e) {
    console.error("[API] Failed to reorder entries:", e);
    return [];
  }
}

export async function compileBundle(
  caseId: string,
  bundleName: string,
  outputPath?: string,
): Promise<CompileResult | null> {
  try {
    return await invoke<CompileResult>("compile_bundle", {
      request: {
        case_id: caseId,
        bundle_name: bundleName,
        output_path: outputPath,
      },
    });
  } catch (e) {
    console.error("[API] Failed to compile bundle:", e);
    return null;
  }
}

export async function previewToc(caseId: string): Promise<TOCEntry[]> {
  try {
    return await invoke<TOCEntry[]>("preview_toc", {
      request: { case_id: caseId },
    });
  } catch (e) {
    console.error("[API] Failed to preview TOC:", e);
    return [];
  }
}

