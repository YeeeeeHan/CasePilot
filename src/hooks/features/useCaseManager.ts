/**
 * useCaseManager Hook
 *
 * Manages case state: list, active selection, creation, deletion.
 * Extracted from App.tsx to reduce component complexity.
 */

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useInvoke,
  type Case as DbCase,
  type Document as DbDocument,
} from "../useInvoke";

export interface Document {
  id: string;
  name: string;
  caseId: string;
}

export interface Case {
  id: string;
  name: string;
  case_type: "affidavit" | "bundle";
  content_json: string | null;
  documents: Document[];
}

export function useCaseManager() {
  const { listCases, createCase, deleteCase, listDocuments } = useInvoke();

  const [cases, setCases] = useState<Case[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const activeCase = cases.find((c) => c.id === activeCaseId);

  // Load cases on mount
  useEffect(() => {
    const loadCasesOnMount = async () => {
      setIsLoading(true);
      const dbCases = await listCases();

      const casesWithDocs: Case[] = await Promise.all(
        dbCases.map(async (c: DbCase) => {
          const docs = await listDocuments(c.id);
          return {
            id: c.id,
            name: c.name,
            case_type: (c.case_type || "bundle") as "affidavit" | "bundle",
            content_json: c.content_json || null,
            documents: docs.map((d: DbDocument) => ({
              id: d.id,
              name: d.name,
              caseId: d.case_id,
            })),
          };
        }),
      );

      setCases(casesWithDocs);

      if (casesWithDocs.length > 0) {
        setActiveCaseId(casesWithDocs[0].id);
      }

      setIsLoading(false);
    };

    loadCasesOnMount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateCase = useCallback(
    async (caseType: "bundle" | "affidavit", name?: string) => {
      const caseName = name || "New Case";
      const newCase = await createCase(caseName, caseType);
      if (newCase) {
        const newCaseObj: Case = {
          id: newCase.id,
          name: newCase.name,
          case_type: newCase.case_type as "affidavit" | "bundle",
          content_json: newCase.content_json,
          documents: [],
        };
        setCases((prev) => [...prev, newCaseObj]);
        setActiveCaseId(newCase.id);
        toast.success(`Created "${caseName}"`);
        return newCaseObj;
      }
      toast.error("Failed to create case");
      return null;
    },
    [createCase],
  );

  const handleDeleteCase = useCallback(
    async (caseId: string): Promise<string | null> => {
      const success = await deleteCase(caseId);
      if (success) {
        const remainingCases = cases.filter((c) => c.id !== caseId);
        setCases(remainingCases);

        if (activeCaseId === caseId) {
          if (remainingCases.length > 0) {
            const nextCaseId = remainingCases[0].id;
            setActiveCaseId(nextCaseId);
            toast.success("Case deleted");
            return nextCaseId;
          } else {
            setActiveCaseId(null);
            toast.success("Case deleted");
            return null;
          }
        }
        toast.success("Case deleted");
      } else {
        toast.error("Failed to delete case");
      }
      return activeCaseId;
    },
    [activeCaseId, cases, deleteCase],
  );

  const handleSelectCase = useCallback((caseId: string) => {
    setActiveCaseId(caseId);
  }, []);

  const updateCaseContent = useCallback(
    (caseId: string, contentJson: string) => {
      setCases((prev) =>
        prev.map((c) =>
          c.id === caseId ? { ...c, content_json: contentJson } : c,
        ),
      );
    },
    [],
  );

  return {
    cases,
    activeCaseId,
    activeCase,
    isLoading,
    handleCreateCase,
    handleDeleteCase,
    handleSelectCase,
    updateCaseContent,
  };
}
