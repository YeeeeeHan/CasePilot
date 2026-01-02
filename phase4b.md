Phase 4B Complete

Build successful. Here's what was implemented:

New Files Created

| File                                  | Purpose                                             |
| ------------------------------------- | --------------------------------------------------- |
| src/components/editor/ExhibitNode.tsx | Custom TipTap node extension for exhibit references |

Modified Files

| File                                         | Changes                                                                                       |
| -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| src/components/workbench/AffidavitEditor.tsx | Added drag-drop handling, cursor tracking, duplicate detection                                |
| src/components/workbench/Workbench.tsx       | Added cursor-following PDF preview using EvidenceCanvas                                       |
| src/components/sidebar/RepositoryPanel.tsx   | Added draggable + onDragStart for file items                                                  |
| src/App.tsx                                  | Added isFileReferencedInAffidavit() for delete protection, passed availableFiles to Workbench |

Features Implemented

| Feature                  | Status                                                                     |
| ------------------------ | -------------------------------------------------------------------------- |
| ExhibitNode extension    | Inline node storing fileId, fileName, filePath                             |
| Drag-drop insertion      | Drag from Files panel → drop in editor → inserts exhibit                   |
| Cursor-following preview | Click/move cursor to exhibit → right panel shows that PDF                  |
| Duplicate detection      | Same file dropped twice → toast "already referenced"                       |
| Delete protection        | Cannot delete file referenced in any affidavit (disabled with error toast) |

Deferred

| Feature                | Reason                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------- |
| Slash command /exhibit | Requires @tiptap/suggestion package + autocomplete UI. Drag-drop covers the use case. |

---

Want me to add the slash command? It requires:

1. npm install @tiptap/suggestion
2. Building a file picker popup
3. Autocomplete filtering

Let me know if you want to proceed with that, or if drag-drop is sufficient for now.
