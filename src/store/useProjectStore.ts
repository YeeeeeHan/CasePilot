/**
 * CasePilot v2.0 - Project Store (Phase 2)
 *
 * Zustand store that manages the project's state.
 * The "Brain" that replaces scattered useState in App.tsx.
 *
 * Core slices:
 * - cases: All cases in the project
 * - files: Raw PDF assets (The Repository)
 * - artifacts: Containers (Affidavits and Bundles)
 * - entries: Entries for the active artifact
 */

import { create } from "zustand";
import type { Case, File, Artifact, ArtifactEntry, Selection } from "../types";

// ============================================================================
// STATE INTERFACE
// ============================================================================

interface ProjectState {
  // Data
  cases: Case[];
  files: Map<string, File>;
  artifacts: Map<string, Artifact>;
  entries: ArtifactEntry[]; // Entries for activeArtifactId only

  // UI State
  activeCaseId: string | null;
  activeArtifactId: string | null;
  selection: Selection;
  isLoading: boolean;
}

interface ProjectActions {
  // Case actions
  setCases: (cases: Case[]) => void;
  addCase: (c: Case) => void;
  removeCase: (id: string) => void;
  setActiveCaseId: (id: string | null) => void;

  // File actions
  setFiles: (files: File[]) => void;
  addFile: (file: File) => void;
  updateFile: (file: File) => void;
  removeFile: (id: string) => void;

  // Artifact actions
  setArtifacts: (artifacts: Artifact[]) => void;
  addArtifact: (artifact: Artifact) => void;
  updateArtifact: (artifact: Artifact) => void;
  removeArtifact: (id: string) => void;
  setActiveArtifactId: (id: string | null) => void;

  // Entry actions
  setEntries: (entries: ArtifactEntry[]) => void;
  addEntry: (entry: ArtifactEntry) => void;
  updateEntry: (entry: ArtifactEntry) => void;
  removeEntry: (id: string) => void;
  reorderEntries: (entryIds: string[]) => void;

  // Selection actions
  setSelection: (selection: Selection) => void;
  clearSelection: () => void;

  // Loading state
  setLoading: (isLoading: boolean) => void;

  // Reset (for case switching)
  resetForCase: (caseId: string) => void;
}

export type ProjectStore = ProjectState & ProjectActions;

// ============================================================================
// STORE
// ============================================================================

export const useProjectStore = create<ProjectStore>((set) => ({
  // Initial state
  cases: [],
  files: new Map(),
  artifacts: new Map(),
  entries: [],
  activeCaseId: null,
  activeArtifactId: null,
  selection: { id: null, source: null },
  isLoading: true,

  // -------------------------------------------------------------------------
  // Case actions
  // -------------------------------------------------------------------------

  setCases: (cases) => set({ cases }),

  addCase: (c) => set((state) => ({ cases: [...state.cases, c] })),

  removeCase: (id) =>
    set((state) => ({
      cases: state.cases.filter((c) => c.id !== id),
      // Clear active if deleted
      activeCaseId: state.activeCaseId === id ? null : state.activeCaseId,
    })),

  setActiveCaseId: (id) => set({ activeCaseId: id }),

  // -------------------------------------------------------------------------
  // File actions
  // -------------------------------------------------------------------------

  setFiles: (files) => {
    const map = new Map<string, File>();
    files.forEach((f) => map.set(f.id, f));
    set({ files: map });
  },

  addFile: (file) =>
    set((state) => {
      const newFiles = new Map(state.files);
      newFiles.set(file.id, file);
      return { files: newFiles };
    }),

  updateFile: (file) =>
    set((state) => {
      const newFiles = new Map(state.files);
      newFiles.set(file.id, file);
      return { files: newFiles };
    }),

  removeFile: (id) =>
    set((state) => {
      const newFiles = new Map(state.files);
      newFiles.delete(id);
      return { files: newFiles };
    }),

  // -------------------------------------------------------------------------
  // Artifact actions
  // -------------------------------------------------------------------------

  setArtifacts: (artifacts) => {
    const map = new Map<string, Artifact>();
    artifacts.forEach((a) => map.set(a.id, a));
    set({ artifacts: map });
  },

  addArtifact: (artifact) =>
    set((state) => {
      const newArtifacts = new Map(state.artifacts);
      newArtifacts.set(artifact.id, artifact);
      return { artifacts: newArtifacts };
    }),

  updateArtifact: (artifact) =>
    set((state) => {
      const newArtifacts = new Map(state.artifacts);
      newArtifacts.set(artifact.id, artifact);
      return { artifacts: newArtifacts };
    }),

  removeArtifact: (id) =>
    set((state) => {
      const newArtifacts = new Map(state.artifacts);
      newArtifacts.delete(id);
      return {
        artifacts: newArtifacts,
        // Clear active if deleted
        activeArtifactId:
          state.activeArtifactId === id ? null : state.activeArtifactId,
      };
    }),

  setActiveArtifactId: (id) => set({ activeArtifactId: id }),

  // -------------------------------------------------------------------------
  // Entry actions
  // -------------------------------------------------------------------------

  setEntries: (entries) => set({ entries }),

  addEntry: (entry) =>
    set((state) => ({
      entries: [...state.entries, entry].sort(
        (a, b) => a.sequence_order - b.sequence_order,
      ),
    })),

  updateEntry: (entry) =>
    set((state) => ({
      entries: state.entries
        .map((e) => (e.id === entry.id ? entry : e))
        .sort((a, b) => a.sequence_order - b.sequence_order),
    })),

  removeEntry: (id) =>
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    })),

  reorderEntries: (entryIds) =>
    set((state) => {
      const entryMap = new Map(state.entries.map((e) => [e.id, e]));
      const reordered: ArtifactEntry[] = [];

      entryIds.forEach((id, index) => {
        const entry = entryMap.get(id);
        if (entry) {
          reordered.push({ ...entry, sequence_order: index });
        }
      });

      return { entries: reordered };
    }),

  // -------------------------------------------------------------------------
  // Selection actions
  // -------------------------------------------------------------------------

  setSelection: (selection) => set({ selection }),

  clearSelection: () => set({ selection: { id: null, source: null } }),

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  setLoading: (isLoading) => set({ isLoading }),

  // -------------------------------------------------------------------------
  // Reset for case switching
  // -------------------------------------------------------------------------

  resetForCase: (caseId) =>
    set({
      activeCaseId: caseId,
      activeArtifactId: null,
      files: new Map(),
      artifacts: new Map(),
      entries: [],
      selection: { id: null, source: null },
    }),
}));

// ============================================================================
// SELECTORS (for derived state)
// ============================================================================

/** Get all files as an array */
export const selectFilesArray = (state: ProjectState): File[] =>
  Array.from(state.files.values());

/** Get all artifacts as an array */
export const selectArtifactsArray = (state: ProjectState): Artifact[] =>
  Array.from(state.artifacts.values());

/** Get artifacts filtered by type */
export const selectArtifactsByType =
  (type: "affidavit" | "bundle") =>
  (state: ProjectState): Artifact[] =>
    Array.from(state.artifacts.values()).filter(
      (a) => a.artifact_type === type,
    );

/** Get the active artifact */
export const selectActiveArtifact = (state: ProjectState): Artifact | null =>
  state.activeArtifactId
    ? (state.artifacts.get(state.activeArtifactId) ?? null)
    : null;

/** Get a file by ID */
export const selectFileById =
  (id: string) =>
  (state: ProjectState): File | undefined =>
    state.files.get(id);

/** Get the active case */
export const selectActiveCase = (state: ProjectState): Case | undefined =>
  state.cases.find((c) => c.id === state.activeCaseId);
