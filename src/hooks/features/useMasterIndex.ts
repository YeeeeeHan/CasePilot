/**
 * useMasterIndex Hook
 *
 * Manages master index entries: loading, reordering, creation, deletion.
 * Includes loadEntriesFromDb function.
 * Extracted from App.tsx to reduce component complexity.
 */

import type { IndexEntry } from '@/lib/pagination';
import { recalculatePageRanges, reorderArray } from '@/lib/pagination';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useInvoke, type ArtifactEntry, type CaseFile } from '../useInvoke';

export function useMasterIndex() {
  const { listEntries, createEntry, deleteEntry, reorderEntries } = useInvoke();

  const [indexEntries, setIndexEntries] = useState<IndexEntry[]>([]);
  const previousIndexEntriesRef = useRef<IndexEntry[]>([]);

  // Helper to load entries from DB and convert to IndexEntry format
  const loadEntriesFromDb = useCallback(
    async (caseId: string, files: CaseFile[]): Promise<IndexEntry[]> => {
      const dbEntries = await listEntries(caseId);
      if (dbEntries.length === 0) return [];

      const fileMap = new Map(files.map((f) => [f.id, f]));

      const entries: IndexEntry[] = dbEntries
        .sort(
          (a: ArtifactEntry, b: ArtifactEntry) =>
            a.sequence_order - b.sequence_order
        )
        .map((entry: ArtifactEntry) => {
          let config: Record<string, unknown> = {};
          if (entry.config_json) {
            try {
              config = JSON.parse(entry.config_json);
            } catch {
              // Ignore parse errors
            }
          }

          if (entry.row_type === 'file' && entry.file_id) {
            const file = fileMap.get(entry.file_id);
            const pageCount = file?.page_count || 1;
            return {
              id: entry.id,
              rowType: 'document' as const,
              fileId: entry.file_id,
              filePath: file?.path || '',
              description:
                (config.description as string) ||
                file?.original_name ||
                'Unknown',
              date: (config.date as string) || '',
              pageStart: 1,
              pageEnd: pageCount,
              disputed: (config.disputed as boolean) || false,
            };
          }

          if (entry.row_type === 'component') {
            const template = config.template as string;
            if (template === 'section-break') {
              return {
                id: entry.id,
                rowType: 'section-break' as const,
                sectionLabel: (config.sectionLabel as string) || 'Section',
                description: '',
                pageStart: 1,
                pageEnd: 1,
                disputed: false,
              };
            }
            if (template === 'cover-page') {
              return {
                id: entry.id,
                rowType: 'cover-page' as const,
                description: (config.description as string) || 'Cover Page',
                tiptapContent: config.tiptapContent as string | undefined,
                generatedPageCount: (config.generatedPageCount as number) || 1,
                pageStart: 1,
                pageEnd: 1,
                disputed: false,
              };
            }
            if (template === 'divider') {
              return {
                id: entry.id,
                rowType: 'divider' as const,
                description: (config.description as string) || 'Blank Page',
                tiptapContent: config.tiptapContent as string | undefined,
                generatedPageCount: (config.generatedPageCount as number) || 1,
                pageStart: 1,
                pageEnd: 1,
                disputed: false,
              };
            }
          }

          return {
            id: entry.id,
            rowType: 'document' as const,
            fileId: entry.file_id,
            description: 'Unknown',
            date: '',
            pageStart: 1,
            pageEnd: 1,
            disputed: false,
          };
        });

      const result = recalculatePageRanges(entries);
      setIndexEntries(result);
      return result;
    },
    [listEntries]
  );

  const handleReorderEntries = useCallback(
    async (activeCaseId: string, fromIndex: number, toIndex: number) => {
      previousIndexEntriesRef.current = indexEntries;
      let reordered = reorderArray(indexEntries, fromIndex, toIndex);
      reordered = recalculatePageRanges(reordered);
      setIndexEntries(reordered);

      const entryIds = reordered
        .filter((e) => e.rowType === 'document')
        .map((e) => e.id);
      const result = await reorderEntries(activeCaseId, entryIds);

      if (result.length === 0 && entryIds.length > 0) {
        setIndexEntries(previousIndexEntriesRef.current);
        toast.error('Failed to reorder. Changes reverted.');
        return;
      }

      toast.success(`Moved to position ${toIndex + 1}`, {
        description: 'All page numbers recalculated automatically.',
        action: {
          label: 'Undo',
          onClick: async () => {
            if (previousIndexEntriesRef.current.length > 0) {
              const previousIds = previousIndexEntriesRef.current
                .filter((e) => e.rowType === 'document')
                .map((e) => e.id);
              await reorderEntries(activeCaseId, previousIds);
              setIndexEntries(previousIndexEntriesRef.current);
              previousIndexEntriesRef.current = [];
              toast.info('Reorder undone');
            }
          },
        },
        duration: 5000,
      });
    },
    [indexEntries, reorderEntries]
  );

  const handleDeleteEntry = useCallback(
    async (entryId: string) => {
      const entry = indexEntries.find((e) => e.id === entryId);

      if (
        entry?.rowType === 'section-break' ||
        entry?.rowType === 'cover-page' ||
        entry?.rowType === 'divider'
      ) {
        const updatedEntries = indexEntries.filter((e) => e.id !== entryId);
        const recalculated = recalculatePageRanges(updatedEntries);
        setIndexEntries(recalculated);

        const typeLabels: Record<string, string> = {
          'section-break': 'Section break',
          'cover-page': 'Cover page',
          divider: 'Blank page',
        };
        toast.success(`${typeLabels[entry.rowType]} removed`);
        return;
      }

      const success = await deleteEntry(entryId);
      if (success) {
        const updatedEntries = indexEntries.filter((e) => e.id !== entryId);
        const recalculated = recalculatePageRanges(updatedEntries);
        setIndexEntries(recalculated);
        toast.success('Document removed from bundle');
      } else {
        toast.error('Failed to remove document from bundle');
      }
    },
    [indexEntries, deleteEntry]
  );

  const handleAddToIndex = useCallback(
    async (activeCaseId: string, file: CaseFile) => {
      let lastDocPageEnd = 0;
      for (let i = indexEntries.length - 1; i >= 0; i--) {
        if (indexEntries[i].rowType === 'document') {
          lastDocPageEnd = indexEntries[i].pageEnd;
          break;
        }
      }
      const pageStart = lastDocPageEnd + 1 || 1;
      const pageCount = file.page_count || 1;
      const pageEnd = pageStart + pageCount - 1;
      const sequenceOrder = indexEntries.filter(
        (e) => e.rowType === 'document'
      ).length;

      const configJson = JSON.stringify({
        description: file.original_name,
        date: '',
        disputed: false,
      });

      const entry = await createEntry(
        activeCaseId,
        sequenceOrder,
        'file',
        file.id,
        configJson,
        `Tab ${sequenceOrder + 1}`
      );

      if (!entry) {
        toast.error('Failed to add document to index');
        return null;
      }

      const newEntry: IndexEntry = {
        id: entry.id,
        rowType: 'document',
        fileId: file.id,
        filePath: file.path,
        description: file.original_name,
        date: '',
        pageStart,
        pageEnd,
        disputed: false,
      };

      setIndexEntries((prev) => [...prev, newEntry]);
      toast.success(`Added "${file.original_name}" to bundle`);
      return newEntry;
    },
    [indexEntries, createEntry]
  );

  const handleInsertSectionBreak = useCallback(
    async (activeCaseId: string) => {
      const sectionCount = indexEntries.filter(
        (e) => e.rowType === 'section-break'
      ).length;
      const nextLetter = String.fromCharCode(65 + sectionCount);
      const defaultLabel = `TAB ${nextLetter}`;

      const configJson = JSON.stringify({
        template: 'section-break',
        sectionLabel: defaultLabel,
      });

      const dbEntry = await createEntry(
        activeCaseId,
        indexEntries.length,
        'component',
        undefined,
        configJson
      );

      if (!dbEntry) {
        toast.error('Failed to add section break');
        return null;
      }

      const newSectionBreak: IndexEntry = {
        id: dbEntry.id,
        rowType: 'section-break',
        sectionLabel: defaultLabel,
        description: '',
        pageStart: 1,
        pageEnd: 1,
        disputed: false,
      };

      setIndexEntries((prev) =>
        recalculatePageRanges([...prev, newSectionBreak])
      );
      toast.success(`Added section break: ${defaultLabel}`);
      return newSectionBreak;
    },
    [indexEntries, createEntry]
  );

  const handleInsertCoverPage = useCallback(
    async (activeCaseId: string) => {
      const configJson = JSON.stringify({
        template: 'cover-page',
        description: 'Cover Page',
        generatedPageCount: 1,
      });

      const dbEntry = await createEntry(
        activeCaseId,
        0,
        'component',
        undefined,
        configJson
      );

      if (!dbEntry) {
        toast.error('Failed to add cover page');
        return null;
      }

      const newCoverPage: IndexEntry = {
        id: dbEntry.id,
        rowType: 'cover-page',
        description: 'Cover Page',
        generatedPageCount: 1,
        pageStart: 1,
        pageEnd: 1,
        disputed: false,
      };

      setIndexEntries((prev) => {
        const updated = [newCoverPage, ...prev];
        return recalculatePageRanges(updated);
      });
      toast.success('Added cover page');
      return newCoverPage;
    },
    [createEntry]
  );

  const handleInsertDivider = useCallback(
    async (activeCaseId: string) => {
      const dividerCount = indexEntries.filter(
        (e) => e.rowType === 'divider'
      ).length;
      const defaultTitle = `Blank Page ${dividerCount + 1}`;

      const configJson = JSON.stringify({
        template: 'divider',
        description: defaultTitle,
        generatedPageCount: 1,
      });

      const dbEntry = await createEntry(
        activeCaseId,
        indexEntries.length,
        'component',
        undefined,
        configJson
      );

      if (!dbEntry) {
        toast.error('Failed to add blank page');
        return null;
      }

      const newDivider: IndexEntry = {
        id: dbEntry.id,
        rowType: 'divider',
        description: defaultTitle,
        generatedPageCount: 1,
        pageStart: 1,
        pageEnd: 1,
        disputed: false,
      };

      setIndexEntries((prev) => {
        const updated = [...prev, newDivider];
        return recalculatePageRanges(updated);
      });
      toast.success(`Added blank page: ${defaultTitle}`);
      return newDivider;
    },
    [indexEntries, createEntry]
  );

  const handleDescriptionChange = useCallback(
    (entryId: string, description: string) => {
      setIndexEntries((prev) =>
        prev.map((e) => {
          if (e.id !== entryId) return e;
          if (e.rowType === 'section-break') {
            return { ...e, sectionLabel: description };
          }
          return { ...e, description };
        })
      );
    },
    []
  );

  const handleDateChange = useCallback((entryId: string, date: string) => {
    setIndexEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, date } : e))
    );
  }, []);

  const handleDisputedChange = useCallback(
    (entryId: string, disputed: boolean) => {
      setIndexEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, disputed } : e))
      );
    },
    []
  );

  const handleTiptapContentChange = useCallback(
    (entryId: string, content: string, pageCount: number) => {
      setIndexEntries((prev) => {
        const updated = prev.map((e) =>
          e.id === entryId
            ? { ...e, tiptapContent: content, generatedPageCount: pageCount }
            : e
        );
        return recalculatePageRanges(updated);
      });
    },
    []
  );

  const clearEntries = useCallback(() => {
    setIndexEntries([]);
  }, []);

  return {
    indexEntries,
    setIndexEntries,
    loadEntriesFromDb,
    handleReorderEntries,
    handleDeleteEntry,
    handleAddToIndex,
    handleInsertSectionBreak,
    handleInsertCoverPage,
    handleInsertDivider,
    handleDescriptionChange,
    handleDateChange,
    handleDisputedChange,
    handleTiptapContentChange,
    clearEntries,
  };
}
