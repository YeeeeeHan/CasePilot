import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CaseSidebar } from "./CaseSidebar";
import type { Case } from "../../App";

describe("CaseSidebar", () => {
  const mockCases: Case[] = [
    {
      id: "1",
      name: "Smith v Jones",
      documents: [],
    },
    {
      id: "2",
      name: "Acme Corp Merger",
      documents: [
        { id: "d1", name: "AEIC of John", caseId: "2" },
        { id: "d2", name: "Bundle of Documents", caseId: "2" },
      ],
    },
  ];

  const defaultProps = {
    cases: mockCases,
    activeDocId: null,
    onSelectDocument: vi.fn(),
    onCreateCase: vi.fn(),
    onCreateDocument: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders all cases", () => {
      render(<CaseSidebar {...defaultProps} />);

      expect(screen.getByText("Smith v Jones")).toBeInTheDocument();
      expect(screen.getByText("Acme Corp Merger")).toBeInTheDocument();
    });

    it("renders documents under their case", () => {
      render(<CaseSidebar {...defaultProps} />);

      // Cases are expanded by default
      expect(screen.getByText("AEIC of John")).toBeInTheDocument();
      expect(screen.getByText("Bundle of Documents")).toBeInTheDocument();
    });

    it("shows 'No documents' for empty cases", () => {
      render(<CaseSidebar {...defaultProps} />);

      // Smith v Jones has no documents
      expect(screen.getByText("No documents")).toBeInTheDocument();
    });

    it("shows empty state when no cases", () => {
      render(<CaseSidebar {...defaultProps} cases={[]} />);

      expect(screen.getByText("No cases yet.")).toBeInTheDocument();
      expect(screen.getByText("Create your first case")).toBeInTheDocument();
    });
  });

  describe("case expansion", () => {
    it("cases are expanded by default", () => {
      render(<CaseSidebar {...defaultProps} />);

      // Documents should be visible without clicking
      expect(screen.getByText("AEIC of John")).toBeInTheDocument();
    });

    it("collapses case when clicked", async () => {
      const user = userEvent.setup();
      render(<CaseSidebar {...defaultProps} />);

      // Click the case to collapse
      await user.click(screen.getByText("Acme Corp Merger"));

      // Documents should be hidden
      expect(screen.queryByText("AEIC of John")).not.toBeInTheDocument();
    });

    it("expands case when clicked again", async () => {
      const user = userEvent.setup();
      render(<CaseSidebar {...defaultProps} />);

      // Collapse first
      await user.click(screen.getByText("Acme Corp Merger"));
      expect(screen.queryByText("AEIC of John")).not.toBeInTheDocument();

      // Expand again
      await user.click(screen.getByText("Acme Corp Merger"));
      expect(screen.getByText("AEIC of John")).toBeInTheDocument();
    });
  });

  describe("document selection", () => {
    it("calls onSelectDocument when document clicked", async () => {
      const user = userEvent.setup();
      render(<CaseSidebar {...defaultProps} />);

      await user.click(screen.getByText("AEIC of John"));

      expect(defaultProps.onSelectDocument).toHaveBeenCalledWith("d1");
    });

    it("highlights active document", () => {
      render(<CaseSidebar {...defaultProps} activeDocId="d1" />);

      const docItem = screen.getByText("AEIC of John").closest("div");
      expect(docItem).toHaveClass("bg-accent");
    });

    it("does not highlight inactive documents", () => {
      render(<CaseSidebar {...defaultProps} activeDocId="d1" />);

      const docItem = screen.getByText("Bundle of Documents").closest("div");
      expect(docItem).not.toHaveClass("bg-accent");
    });
  });

  describe("case creation", () => {
    it("calls onCreateCase when new case button clicked", async () => {
      const user = userEvent.setup();
      render(<CaseSidebar {...defaultProps} />);

      // Find the button by title
      const newCaseButton = screen.getByTitle("New Case");
      await user.click(newCaseButton);

      expect(defaultProps.onCreateCase).toHaveBeenCalled();
    });

    it("calls onCreateCase from empty state link", async () => {
      const user = userEvent.setup();
      render(<CaseSidebar {...defaultProps} cases={[]} />);

      await user.click(screen.getByText("Create your first case"));

      expect(defaultProps.onCreateCase).toHaveBeenCalled();
    });
  });

  describe("document creation", () => {
    it("calls onCreateDocument with case ID when add document button clicked", async () => {
      const user = userEvent.setup();
      render(<CaseSidebar {...defaultProps} />);

      // Hover to reveal the button (in real UI), then click by title
      const addButtons = screen.getAllByTitle("New Document");
      // First case has one button, second case has another
      await user.click(addButtons[1]); // Click on second case's button

      expect(defaultProps.onCreateDocument).toHaveBeenCalledWith("2");
    });

    it("does not collapse case when add document button clicked", async () => {
      const user = userEvent.setup();
      render(<CaseSidebar {...defaultProps} />);

      const addButtons = screen.getAllByTitle("New Document");
      await user.click(addButtons[1]);

      // Documents should still be visible (case not collapsed)
      expect(screen.getByText("AEIC of John")).toBeInTheDocument();
    });
  });
});
