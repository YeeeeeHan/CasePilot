/**
 * useFileRepository Hook
 *
 * Manages repository files: drop handling, creation, deletion, metadata extraction.
 * Extracted from App.tsx to reduce component complexity.
 */

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useInvoke, type CaseFile } from "../useInvoke";

export function useFileRepository() {
  const { listFiles, createFile, updateFile, deleteFile, extractPdfMetadata } =
    useInvoke();

  const [repositoryFiles, setRepositoryFiles] = useState<CaseFile[]>([]);
  const [repositoryExpanded, setRepositoryExpanded] = useState(true);

  const loadFiles = useCallback(
    async (caseId: string): Promise<CaseFile[]> => {
      const files = await listFiles(caseId);
      setRepositoryFiles(files);
      return files;
    },
    [listFiles],
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
  };
}
