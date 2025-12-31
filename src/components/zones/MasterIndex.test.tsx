import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MasterIndex, type IndexEntry } from "./MasterIndex";

describe("MasterIndex", () => {
  const mockEntries: IndexEntry[] = [
    {
      id: "1",
      tabNumber: 1,
      description: "Email from John",
      status: "agreed",
      pageStart: 1,
      pageEnd: 5,
    },
    {
      id: "2",
      tabNumber: 2,
      description: "Contract",
      status: "disputed",
      pageStart: 6,
      pageEnd: 10,
    },
    {
      id: "3",
      tabNumber: 3,
      description: "Invoice",
      status: "agreed",
      pageStart: 11,
      pageEnd: 15,
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

    it("displays tab numbers correctly", () => {
      render(<MasterIndex entries={mockEntries} />);

      // Tab numbers should be visible in the table
      const tabCells = screen.getAllByRole("cell").filter((cell) => {
        const text = cell.textContent;
        return text === "1" || text === "2" || text === "3";
      });
      expect(tabCells.length).toBeGreaterThanOrEqual(3);
    });

    it("displays page ranges correctly", () => {
      render(<MasterIndex entries={mockEntries} />);

      expect(screen.getByText("pp. 1-5")).toBeInTheDocument();
      expect(screen.getByText("pp. 6-10")).toBeInTheDocument();
      expect(screen.getByText("pp. 11-15")).toBeInTheDocument();
    });

    it("displays status badges correctly", () => {
      render(<MasterIndex entries={mockEntries} />);

      const agreedBadges = screen.getAllByText("Agreed");
      const disputedBadges = screen.getAllByText("Disputed");

      expect(agreedBadges).toHaveLength(2);
      expect(disputedBadges).toHaveLength(1);
    });

    it("shows empty state when no entries", () => {
      render(<MasterIndex entries={[]} />);

      expect(
        screen.getByText("Drag files from staging to add to bundle"),
      ).toBeInTheDocument();
    });

    it("displays total page count", () => {
      render(<MasterIndex entries={mockEntries} />);

      expect(screen.getByText(/Total: 15 pages/)).toBeInTheDocument();
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

    it("calls onStatusToggle when status badge is clicked", () => {
      const onStatusToggle = vi.fn();
      render(
        <MasterIndex entries={mockEntries} onStatusToggle={onStatusToggle} />,
      );

      const agreedBadge = screen.getAllByText("Agreed")[0];
      agreedBadge.click();

      expect(onStatusToggle).toHaveBeenCalledWith("1");
    });

    it("highlights selected entry", () => {
      render(<MasterIndex entries={mockEntries} selectedEntryId="2" />);

      const rows = screen.getAllByRole("row");
      // Check if the selected row has the accent background class
      expect(rows[2]).toHaveClass("bg-accent");
    });
  });

  describe("drag and drop", () => {
    it("renders drag handles for each entry", () => {
      render(<MasterIndex entries={mockEntries} />);

      const dragHandles = screen.getAllByLabelText(/Reorder document/);
      expect(dragHandles).toHaveLength(3);
    });

    it("drag handles have correct ARIA labels", () => {
      render(<MasterIndex entries={mockEntries} />);

      expect(screen.getByLabelText("Reorder document 1")).toBeInTheDocument();
      expect(screen.getByLabelText("Reorder document 2")).toBeInTheDocument();
      expect(screen.getByLabelText("Reorder document 3")).toBeInTheDocument();
    });

    it("drag handles are draggable", () => {
      render(<MasterIndex entries={mockEntries} />);

      const dragHandles = screen.getAllByLabelText(/Reorder document/);
      dragHandles.forEach((handle) => {
        expect(handle).toHaveAttribute("draggable", "true");
      });
    });

    it("has drag handlers configured on grip buttons", () => {
      const onReorder = vi.fn();
      render(<MasterIndex entries={mockEntries} onReorder={onReorder} />);

      const dragHandles = screen.getAllByLabelText(/Reorder document/);

      // Check that drag handlers are present (can't fully test DragEvent in jsdom)
      dragHandles.forEach((handle) => {
        expect(handle.getAttribute("draggable")).toBe("true");
        expect(handle).toHaveClass("cursor-grab");
      });
    });
  });

  describe("accessibility", () => {
    it("has proper table structure", () => {
      render(<MasterIndex entries={mockEntries} />);

      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getAllByRole("row")).toHaveLength(4); // 1 header + 3 entries
      expect(screen.getAllByRole("columnheader")).toHaveLength(5);
    });

    it("description inputs are keyboard accessible", () => {
      render(<MasterIndex entries={mockEntries} />);

      const inputs = screen.getAllByRole("textbox");
      expect(inputs).toHaveLength(3);
      inputs.forEach((input) => {
        expect(input).toHaveAttribute("type", "text");
      });
    });

    it("status badges are clickable buttons", () => {
      render(<MasterIndex entries={mockEntries} />);

      const statusBadges = screen.getAllByText(/Agreed|Disputed/);
      statusBadges.forEach((badge) => {
        expect(badge).toHaveClass("cursor-pointer");
      });
    });
  });
});
