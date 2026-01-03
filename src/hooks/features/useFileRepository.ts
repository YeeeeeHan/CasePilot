/**
 * useFileRepository Hook
 *
 * Manages repository files: drop handling, creation, deletion, metadata extraction.
 * Also manages folder structure for Repository view only (not persisted to DB).
 * Extracted from App.tsx to reduce component complexity.
 */

import { useCallback, useState, useEffect } from "react";
import { toast } from "sonner";
import { useInvoke, type CaseFile } from "../useInvoke";

// Folder structure for Repository organization (not in DB)
export interface RepositoryFolder {
  id: string;
  name: string;
  parentId: string | null; // null = root level
}

// File-to-folder assignment
export interface FileFolderAssignment {
  [fileId: string]: string | null; // folderId or null for root
}

// Storage key helper
function getFolderStorageKey(caseId: string): string {
  return `casepilot_folders_${caseId}`;
}

function getAssignmentStorageKey(caseId: string): string {
  return `casepilot_folder_assignments_${caseId}`;
}

export function useFileRepository() {
  const { listFiles, createFile, updateFile, deleteFile, extractPdfMetadata } =
    useInvoke();

  const [repositoryFiles, setRepositoryFiles] = useState<CaseFile[]>([]);
  const [repositoryExpanded, setRepositoryExpanded] = useState(true);
  const [folders, setFolders] = useState<RepositoryFolder[]>([]);
  const [fileFolderAssignments, setFileFolderAssignments] =
    useState<FileFolderAssignment>({});
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);

  const loadFiles = useCallback(
    async (caseId: string): Promise<CaseFile[]> => {
      const files = await listFiles(caseId);
      setRepositoryFiles(files);
      setCurrentCaseId(caseId);

      // Load folders from localStorage
      try {
        const storedFolders = localStorage.getItem(getFolderStorageKey(caseId));
        if (storedFolders) {
          setFolders(JSON.parse(storedFolders));
        } else {
          setFolders([]);
        }

        const storedAssignments = localStorage.getItem(
          getAssignmentStorageKey(caseId),
        );
        if (storedAssignments) {
          setFileFolderAssignments(JSON.parse(storedAssignments));
        } else {
          setFileFolderAssignments({});
        }
      } catch {
        setFolders([]);
        setFileFolderAssignments({});
      }

      return files;
    },
    [listFiles],
  );

  // Persist folders to localStorage whenever they change
  useEffect(() => {
    if (currentCaseId) {
      localStorage.setItem(
        getFolderStorageKey(currentCaseId),
        JSON.stringify(folders),
      );
    }
  }, [folders, currentCaseId]);

  // Persist file-folder assignments to localStorage
  useEffect(() => {
    if (currentCaseId) {
      localStorage.setItem(
        getAssignmentStorageKey(currentCaseId),
        JSON.stringify(fileFolderAssignments),
      );
    }
  }, [fileFolderAssignments, currentCaseId]);

  // Create a new folder
  const createFolder = useCallback(
    (name: string, parentId: string | null = null): RepositoryFolder => {
      const newFolder: RepositoryFolder = {
        id: crypto.randomUUID(),
        name,
        parentId,
      };
      setFolders((prev) => [...prev, newFolder]);
      return newFolder;
    },
    [],
  );

  // Delete a folder (moves files to root, deletes nested folders)
  const deleteFolder = useCallback((folderId: string) => {
    // Get all descendant folder IDs
    const getDescendantIds = (
      parentId: string,
      allFolders: RepositoryFolder[],
    ): string[] => {
      const children = allFolders.filter((f) => f.parentId === parentId);
      return children.flatMap((c) => [
        c.id,
        ...getDescendantIds(c.id, allFolders),
      ]);
    };

    setFolders((prev) => {
      const descendantIds = getDescendantIds(folderId, prev);
      const idsToRemove = new Set([folderId, ...descendantIds]);
      return prev.filter((f) => !idsToRemove.has(f.id));
    });

    // Move files from deleted folders to root
    setFileFolderAssignments((prev) => {
      const updated = { ...prev };
      for (const [fileId, assignedFolderId] of Object.entries(updated)) {
        if (assignedFolderId === folderId) {
          updated[fileId] = null;
        }
      }
      return updated;
    });
  }, []);

  // Rename a folder
  const renameFolder = useCallback((folderId: string, newName: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, name: newName } : f)),
    );
  }, []);

  // Move a file to a folder
  const moveFileToFolder = useCallback(
    (fileId: string, folderId: string | null) => {
      setFileFolderAssignments((prev) => ({
        ...prev,
        [fileId]: folderId,
      }));
    },
    [],
  );

  // Get folder ID for a file
  const getFileFolderId = useCallback(
    (fileId: string): string | null => {
      return fileFolderAssignments[fileId] ?? null;
    },
    [fileFolderAssignments],
  );

  const handleFileDrop = useCallback(
    async (activeCaseId: string | null, filePaths: string[]) => {
      if (!activeCaseId) {
        toast.error("No active case selected");
        return;
      }

      const results = await Promise.all(
        filePaths.map(async (path) => {
          const name = path.split(/[\\/]/).pop() || path;
          return await createFile(activeCaseId, path, name);
        }),
      );

      const successfulFiles: CaseFile[] = [];
      const errors: string[] = [];

      for (const result of results) {
        if (result.file) {
          successfulFiles.push(result.file);
        } else if (result.error) {
          errors.push(result.error);
        }
      }

      if (successfulFiles.length > 0) {
        setRepositoryFiles((prev) => [...prev, ...successfulFiles]);
      }

      // Extract metadata asynchronously
      successfulFiles.forEach(async (file) => {
        const metadata = await extractPdfMetadata(file.path);
        if (metadata) {
          const updated = await updateFile(file.id, metadata.page_count);
          if (updated) {
            setRepositoryFiles((prev) =>
              prev.map((f) => (f.id === file.id ? updated : f)),
            );
          }
        }
      });

      if (errors.length > 0 && successfulFiles.length === 0) {
        toast.error(`Failed to add files: ${errors[0]}`);
      } else if (errors.length > 0) {
        toast.warning(
          `Added ${successfulFiles.length} file(s), ${errors.length} failed`,
          { description: errors[0] },
        );
      } else if (successfulFiles.length > 0) {
        toast.success(`Added ${successfulFiles.length} file(s) to repository`);
      }
    },
    [createFile, extractPdfMetadata, updateFile],
  );

  const handleDeleteRepositoryFile = useCallback(
    async (fileId: string): Promise<boolean> => {
      const success = await deleteFile(fileId);
      if (success) {
        setRepositoryFiles((prev) => prev.filter((f) => f.id !== fileId));
        toast.success("File deleted");
        return true;
      } else {
        toast.error("Failed to delete file");
        return false;
      }
    },
    [deleteFile],
  );

  const clearFiles = useCallback(() => {
    setRepositoryFiles([]);
    setFolders([]);
    setFileFolderAssignments({});
    setCurrentCaseId(null);
  }, []);

  return {
    repositoryFiles,
    setRepositoryFiles,
    repositoryExpanded,
    setRepositoryExpanded,
    loadFiles,
    handleFileDrop,
    handleDeleteRepositoryFile,
    clearFiles,
    // Folder management
    folders,
    fileFolderAssignments,
    createFolder,
    deleteFolder,
    renameFolder,
    moveFileToFolder,
    getFileFolderId,
  };
}
