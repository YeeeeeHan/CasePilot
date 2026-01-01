import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MasterIndex, type IndexEntry } from "./MasterIndex";

describe("MasterIndex", () => {
  const mockEntries: IndexEntry[] = [
    {
      id: "1",
      rowType: "document",
      description: "Email from John",
      date: "14 Feb 2025",
      disputed: false,
      pageStart: 1,
      pageEnd: 5,
    },
    {
      id: "2",
      rowType: "document",
      description: "Contract",
      date: "21 Feb 2025",
      disputed: true,
      pageStart: 6,
      pageEnd: 10,
    },
    {
      id: "3",
      rowType: "document",
      description: "Invoice",
      date: "",
      disputed: false,
      pageStart: 11,
      pageEnd: 15,
    },
  ];

  const mockEntriesWithSections: IndexEntry[] = [
    {
      id: "sec-1",
      rowType: "section-break",
      sectionLabel: "TAB A - Pleadings",
      description: "",
      pageStart: 0,
      pageEnd: 0,
      disputed: false,
    },
    {
      id: "1",
      rowType: "document",
      description: "Statement of Claim",
      date: "14 Feb 2025",
      disputed: false,
      pageStart: 1,
      pageEnd: 5,
    },
    {
      id: "sec-2",
      rowType: "section-break",
      sectionLabel: "TAB B - Evidence",
      description: "",
      pageStart: 0,
      pageEnd: 0,
      disputed: false,
    },
    {
      id: "2",
      rowType: "document",
      description: "Email Evidence",
      date: "21 Feb 2025",
      disputed: false,
      pageStart: 6,
      pageEnd: 10,
    },
  ];

  describe("rendering", () => {
    it("renders table with all entries", () => {
      render(<MasterIndex entries={mockEntries} />);

      // Descriptions are in input fields
      expect(screen.getByDisplayValue("Email from John")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Contract")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Invoice")).toBeInTheDocument();
    });

    it("displays document numbers correctly", () => {
      render(<MasterIndex entries={mockEntries} />);

      // Document numbers should be visible (1., 2., 3.)
      expect(screen.getByText("1.")).toBeInTheDocument();
      expect(screen.getByText("2.")).toBeInTheDocument();
      expect(screen.getByText("3.")).toBeInTheDocument();
    });

    it("displays dates correctly", () => {
      render(<MasterIndex entries={mockEntries} />);

      expect(screen.getByDisplayValue("14 Feb 2025")).toBeInTheDocument();
      expect(screen.getByDisplayValue("21 Feb 2025")).toBeInTheDocument();
    });

    it("displays page ranges correctly", () => {
      render(<MasterIndex entries={mockEntries} />);

      expect(screen.getByText("1 - 5")).toBeInTheDocument();
      expect(screen.getByText("6 - 10")).toBeInTheDocument();
      expect(screen.getByText("11 - 15")).toBeInTheDocument();
    });

    it("shows empty state when no entries", () => {
      render(<MasterIndex entries={[]} />);

      expect(
        screen.getByText(/Use the toolbar below to add documents/),
      ).toBeInTheDocument();
    });

    it("displays total page count", () => {
      render(<MasterIndex entries={mockEntries} />);

      expect(screen.getByText(/15 pages/)).toBeInTheDocument();
    });

    it("renders section breaks with correct labels", () => {
      render(<MasterIndex entries={mockEntriesWithSections} />);

      expect(screen.getByDisplayValue("TAB A - Pleadings")).toBeInTheDocument();
      expect(screen.getByDisplayValue("TAB B - Evidence")).toBeInTheDocument();
    });

    it("displays section break letters (A., B.)", () => {
      render(<MasterIndex entries={mockEntriesWithSections} />);

      expect(screen.getByText("A.")).toBeInTheDocument();
      expect(screen.getByText("B.")).toBeInTheDocument();
    });
  });

  describe("interaction", () => {
    it("calls onSelectEntry when row is clicked", () => {
      const onSelectEntry = vi.fn();
      render(
        <MasterIndex entries={mockEntries} onSelectEntry={onSelectEntry} />,
      );

      const rows = screen.getAllByRole("row");
      // First row is header, second is first entry
      rows[1].click();

      expect(onSelectEntry).toHaveBeenCalledWith("1");
    });

    it("calls onDescriptionChange when description is edited", () => {
      const onDescriptionChange = vi.fn();
      render(
        <MasterIndex
          entries={mockEntries}
          onDescriptionChange={onDescriptionChange}
        />,
      );

      const input = screen.getByDisplayValue(
        "Email from John",
      ) as HTMLInputElement;
      fireEvent.change(input, { target: { value: "Updated Email" } });

      expect(onDescriptionChange).toHaveBeenCalledWith("1", "Updated Email");
    });

    it("calls onDateChange when date is edited", () => {
      const onDateChange = vi.fn();
      render(<MasterIndex entries={mockEntries} onDateChange={onDateChange} />);

      const input = screen.getByDisplayValue("14 Feb 2025") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "15 Feb 2025" } });

      expect(onDateChange).toHaveBeenCalledWith("1", "15 Feb 2025");
    });

    it("highlights selected entry", () => {
      render(<MasterIndex entries={mockEntries} selectedEntryId="2" />);

      const rows = screen.getAllByRole("row");
      // Check if the selected row has the accent background class
      expect(rows[2]).toHaveClass("bg-accent");
    });
  });

  describe("floating toolbar", () => {
    it("renders Add Document button", () => {
      render(<MasterIndex entries={mockEntries} />);

      expect(
        screen.getByRole("button", { name: /Add Document/i }),
      ).toBeInTheDocument();
    });

    it("renders Insert Section Break button", () => {
      render(<MasterIndex entries={mockEntries} />);

      expect(
        screen.getByRole("button", { name: /Section Break/i }),
      ).toBeInTheDocument();
    });

    it("calls onAddDocument when Add Document is clicked", () => {
      const onAddDocument = vi.fn();
      render(
        <MasterIndex entries={mockEntries} onAddDocument={onAddDocument} />,
      );

      const button = screen.getByRole("button", { name: /Add Document/i });
      button.click();

      expect(onAddDocument).toHaveBeenCalled();
    });

    it("calls onInsertSectionBreak when Section Break is clicked", () => {
      const onInsertSectionBreak = vi.fn();
      render(
        <MasterIndex
          entries={mockEntries}
          onInsertSectionBreak={onInsertSectionBreak}
        />,
      );

      const button = screen.getByRole("button", { name: /Section Break/i });
      button.click();

      expect(onInsertSectionBreak).toHaveBeenCalled();
    });
  });

  describe("drag and drop", () => {
    it("renders drag handles for each entry", () => {
      render(<MasterIndex entries={mockEntries} />);

      const dragHandles = screen.getAllByLabelText(/Drag to reorder/i);
      expect(dragHandles).toHaveLength(3);
    });

    it("drag handles have grab cursor styling", () => {
      render(<MasterIndex entries={mockEntries} />);

      const dragHandles = screen.getAllByLabelText(/Drag to reorder/i);
      dragHandles.forEach((handle) => {
        expect(handle).toHaveClass("cursor-grab");
      });
    });

    it("renders drag handles for section breaks too", () => {
      render(<MasterIndex entries={mockEntriesWithSections} />);

      // 2 section breaks + 2 documents = 4 drag handles
      const dragHandles = screen.getAllByLabelText(/Drag to reorder/i);
      expect(dragHandles).toHaveLength(4);
    });
  });

  describe("accessibility", () => {
    it("has proper table structure", () => {
      render(<MasterIndex entries={mockEntries} />);

      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getAllByRole("row")).toHaveLength(4); // 1 header + 3 entries
    });

    it("description inputs are keyboard accessible", () => {
      render(<MasterIndex entries={mockEntries} />);

      const inputs = screen.getAllByRole("textbox");
      expect(inputs.length).toBeGreaterThanOrEqual(3);
    });
  });
});
