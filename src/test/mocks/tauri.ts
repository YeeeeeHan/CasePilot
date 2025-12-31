import { vi } from "vitest";
import type { Case, Document } from "@/hooks/useInvoke";

// Get the mocked invoke function from the global mock
export const getMockInvoke = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return vi.mocked((globalThis as any).__TAURI_INTERNALS__?.invoke ?? vi.fn());
};

// Helper factories for creating test data
export const mockCase = (overrides?: Partial<Case>): Case => ({
  id: crypto.randomUUID(),
  name: "Test Case",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const mockDocument = (overrides?: Partial<Document>): Document => ({
  id: crypto.randomUUID(),
  case_id: crypto.randomUUID(),
  name: "Test Document",
  content: "",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Type for the mocked invoke function
type InvokeArgs = {
  list_cases: void;
  create_case: { request: { name: string } };
  list_documents: { caseId: string };
  create_document: { request: { case_id: string; name: string } };
  load_document: { id: string };
  save_document: { request: { id: string; content: string } };
  delete_case: { id: string };
  delete_document: { id: string };
};

type InvokeReturn = {
  list_cases: Case[];
  create_case: Case;
  list_documents: Document[];
  create_document: Document;
  load_document: Document;
  save_document: Document;
  delete_case: void;
  delete_document: void;
};

// Create a type-safe mock invoke helper
export function createMockInvoke() {
  const handlers: Partial<{
    [K in keyof InvokeArgs]: (
      args: InvokeArgs[K],
    ) => Promise<InvokeReturn[K]> | InvokeReturn[K];
  }> = {};

  const mockFn = vi.fn(
    async <K extends keyof InvokeArgs>(
      cmd: K,
      args?: InvokeArgs[K],
    ): Promise<InvokeReturn[K]> => {
      const handler = handlers[cmd];
      if (handler) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return handler(args as any) as any;
      }
      throw new Error(`Unhandled command: ${cmd}`);
    },
  );

  return {
    invoke: mockFn,
    on: <K extends keyof InvokeArgs>(
      cmd: K,
      handler: (
        args: InvokeArgs[K],
      ) => Promise<InvokeReturn[K]> | InvokeReturn[K],
    ) => {
      handlers[cmd] = handler;
    },
    reset: () => {
      mockFn.mockReset();
      Object.keys(handlers).forEach(
        (key) => delete handlers[key as keyof InvokeArgs],
      );
    },
  };
}

// Common mock setups for typical test scenarios
export function setupCrudMocks(initialCases: Case[] = []) {
  let cases = [...initialCases];
  let documents: Document[] = [];

  const mock = createMockInvoke();

  mock.on("list_cases", () => cases);

  mock.on("create_case", ({ request }) => {
    const newCase = mockCase({ name: request.name });
    cases.push(newCase);
    return newCase;
  });

  mock.on("delete_case", ({ id }) => {
    cases = cases.filter((c) => c.id !== id);
    documents = documents.filter((d) => d.case_id !== id);
  });

  mock.on("list_documents", ({ caseId }) => {
    return documents.filter((d) => d.case_id === caseId);
  });

  mock.on("create_document", ({ request }) => {
    const newDoc = mockDocument({
      case_id: request.case_id,
      name: request.name,
    });
    documents.push(newDoc);
    return newDoc;
  });

  mock.on("load_document", ({ id }) => {
    const doc = documents.find((d) => d.id === id);
    if (!doc) throw new Error(`Document not found: ${id}`);
    return doc;
  });

  mock.on("save_document", ({ request }) => {
    const doc = documents.find((d) => d.id === request.id);
    if (!doc) throw new Error(`Document not found: ${request.id}`);
    doc.content = request.content;
    doc.updated_at = new Date().toISOString();
    return doc;
  });

  mock.on("delete_document", ({ id }) => {
    documents = documents.filter((d) => d.id !== id);
  });

  return {
    mock,
    getCases: () => cases,
    getDocuments: () => documents,
  };
}
