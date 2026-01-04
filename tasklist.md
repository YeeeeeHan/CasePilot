## Past changes

Summary of Fixes

1. DraftingCanvas Sticky Headers Fixed (EntryPreviewFactory.tsx:70-81, DraftingCanvas.tsx:185-191)

Root Cause: The wrapper <div className="... overflow-hidden ..."> was blocking position: sticky.

Fix:

- Removed the wrapper div with overflow-hidden from EntryPreviewFactory
- Passed className directly to DraftingCanvas (matching EvidenceCanvas pattern)
- Updated DraftingCanvas header to match EvidenceCanvas exactly: z-10 ... rounded-t-lg sticky

2. Bundle Order Persistence Fixed (useMasterIndex.ts:128-131, 146)

Root Cause: handleReorderEntries was filtering to only include rowType === "document", excluding section-breaks, cover-pages, and dividers.

Fix:

- Changed reordered.filter((e) => e.rowType === "document").map((e) => e.id)
- To reordered.map((e) => e.id) (includes ALL entry types)
- Also fixed the undo handler to include all entry IDs

3. Scroll Compatibility Verified

Confirmed correct setup:

- PreviewPane → Only scroll container (ScrollArea)
- DraftingCanvas → No overflow (removed previously)
- A4PageContainer → No overflow (parent handles scrolling)
- Sticky headers work correctly in all components

Completed Tasks

2. MasterIndex.tsx

- Sticky section-break rows: Added sticky top-[41px] z-[5] shadow-sm to section-break TableRow styling

3. index.css + DraftingCanvas.tsx

- A4-relative font scaling: Added .a4-editor CSS class that scales fonts using var(--page-scale) and applies Times New Roman (legal standard)
- Applied a4-editor class to DraftingCanvas's A4Page

4. useMasterIndex.ts

- Divider guard: Prevents adding a blank page if the last entry is already a divider
- Cover page guard: Prevents adding more than one cover page
- Singapore legal template: Cover page now uses ePD 2021 compliant format with court name, suit number, parties, and document title centered

5. Auto-Pagination Logic (Plan)

The current architecture already handles multi-page content correctly:

- usePageBreakDetection hook calculates page count based on TipTap content height
- generatedPageCount is stored on cover-page/divider entries
- recalculatePageRanges uses this to compute proper page spans

No linked entries needed - a single entry with generatedPageCount: 3 will correctly span pages 1-3, and subsequent entries will start at page 4. The visual page breaks are rendered by the A4Page component's aspect ratio constraints combined with the CSS overflow behavior.

1. Inspector Closed by Default ✓

Location: src/App.tsx:50
const [inspectorOpen, setInspectorOpen] = useState(false);
No useEffect auto-opens it. It opens only when user clicks a file (intentional UX). 2. Compact VS Code-like Fonts ✓

2. Compact VS Code-like Fonts ✓

Location: EntryInspector.tsx & FileInspector.tsx

- Inputs: h-6 text-xs px-2
- Section headers: text-[10px]
- Labels: text-[11px]
- Checkboxes: h-3.5 w-3.5
- Padding: p-2, py-1, space-y-0.5

3. PDF Thumbnail Preview ✓

Location: EntryInspector.tsx:102-120 & FileInspector.tsx:52-70
<Document file={pdfUrl} onLoadError={() => setThumbnailError(true)}>
<Page pageNumber={1} width={200} renderTextLayer={false} renderAnnotationLayer={false} />
</Document>

4. Mode-Aware Metadata Fields ✓

Location: EntryInspector.tsx

- Bundle mode: Shows Description, Date, Disputed
- Affidavit mode: Shows Description, Exhibit Label (hides Date/Disputed)
  {isAffidavit && !isSectionBreak && (/_ Exhibit Label field _/)}
  {!isAffidavit && !isSectionBreak && (/_ Date field _/)}
  {!isAffidavit && !isSectionBreak && (/_ Disputed checkbox _/)}
  The IndexEntry type already has exhibitLabel?: string at src/types/domain.ts:41.

5. Date Format "DD/month/YYYY" ✓

Location: EntryInspector.tsx:37-55
function formatDateString(input: string): string {
// Returns format like "10/october/2025"
return `${day}/${month.toLowerCase()}/${year}`;
}
Input is type="text" (not date picker), formats on blur.

---

Summary: The Inspector refactoring is complete. All components already match your specifications.

Repository Features

1. Multi-Select & Keyboard Navigation (src/App.tsx, src/components/sidebar/RepositoryPanel.tsx, src/components/sidebar/RepositoryItem.tsx)

- Changed selectedFileId to selectedFileIds: Set<string> for multi-selection
- Shift+Click for range selection
- Cmd/Ctrl+Click for toggle selection
- ArrowUp/ArrowDown keyboard navigation
- Selection count badge in header ("X selected")
- Multi-select context menu with "Add [n] files to Bundle/Affidavit" and "Delete [n] files"

2. Folder/File Greying Out in Affidavit Mode (src/App.tsx)

- Added referencedFileIds computed from TipTap content using regex matching
- Files are greyed out if they're in linkedFileIds (bundle) OR referencedFileIds (affidavit)
- Unified behavior between bundle and affidavit modes

3. File Deduplication (src/hooks/features/useFileRepository.ts)

- Added generateUniqueName() helper to append (1), (2), etc.
- Duplicate detection before file creation
- Confirmation dialog when dropping duplicate files
- Handles batch drops with internal collision prevention

Case Features

4. Case Naming on Creation (src/App.tsx, src/hooks/features/useCaseManager.ts)

- Added name parameter to handleCreateCase
- Prompts user for case name with default based on type
- Falls back to "New Bundle" or "New Affidavit" if empty

5. Visual Differentiation for Case Types (src/components/zones/ProjectSwitcher.tsx, src/App.tsx)

- Added case_type to ProjectCase interface
- FileText icon (blue border) for Affidavits
- FileStack icon (amber border) for Bundles
- Tooltip shows both name and type
- Colored left border for quick visual identification

Summary of Fixes

1. Folder Creation & Background Context Menu

File: src/components/sidebar/RepositoryPanel.tsx

- Wrapped file tree in a <ContextMenu> that shows "New Folder" option on background right-click
- Multi-select options now appear in the same menu when multiple files are selected

2. Double-Click Behavior

File: src/App.tsx

- Modified handleFileDoubleClick to check workbenchMode
- In affidavit mode: calls editorRef.current.insertExhibit()
- In bundle mode: calls handleAddFileToIndex()

3. Grey Out Referenced Files

File: src/App.tsx

- Improved regex patterns in both referencedFileIds and isFileReferencedInAffidavit
- Now handles content as either string or object
- More robust pattern matching: /["']?fileId["']?\s*:\s*["']([^"']+)["']/gi

4. Highlight Visibility

File: src/components/sidebar/RepositoryItem.tsx

- Changed selected background from bg-accent to bg-neutral-200 dark:bg-neutral-700 for better contrast

5. Bulk Operations

Files: src/components/sidebar/RepositoryItem.tsx, src/components/sidebar/RepositoryPanel.tsx

- Added multi-select props to RepositoryItem component
- Individual file context menu now shows bulk options when multiple files are selected and file is part of selection

6. Repository File De-duplication

File: src/hooks/features/useFileRepository.ts

- Already implemented correctly - detects duplicates, shows confirm dialog, uses generateUniqueName

7. Keyboard Navigation Shift Support

Files: src/components/sidebar/RepositoryPanel.tsx, src/App.tsx

- Updated onKeyboardNavigation signature to accept modifiers: { shiftKey?: boolean }
- Shift+Arrow now expands selection range
- Plain Arrow clears selection and selects only the new file

8. Case Naming & Differentiation

File: src/components/zones/ProjectSwitcher.tsx

- Increased border thickness from 2px to 3px for better visibility
- Added colored icons (blue for affidavit, amber for bundle) when case is not active

Summary of Changes

1. Folder Creation - Fixed ✅

Issue: prompt() doesn't work reliably in Tauri's webview, causing folder creation to silently fail.

Changes:

- src/components/sidebar/RepositoryPanel.tsx:
  - Added dialog state for folder creation (folderDialogOpen, newFolderName)
  - Added dialog state for folder rename (renameDialogOpen, renameFolderName)
  - Added Dialog component UI for folder creation and rename
  - Changed onCreateFolder prop signature from (parentId) to (name, parentId)
  - Replaced all prompt() calls with proper dialogs
- src/App.tsx:
  - Updated handleCreateFolder to accept (name, parentId) instead of calling prompt()

2. Affidavit File Greying - Fixed ✅

Issue: The regex parsing for finding referenced files was fragile.

Changes:

- src/App.tsx:
  - Imported extractExhibitFileIds from ExhibitNode.tsx
  - Updated referencedFileIds computation to use the proper helper function
  - Updated isFileReferencedInAffidavit to use the same helper

The extractExhibitFileIds function properly parses both JSON (TipTap document tree) and HTML (data-file-id attributes) formats.

3. Bulk Delete Confirmation - Fixed ✅

Issue: No confirmation dialog before deleting multiple files.

Changes:

- src/App.tsx:
  - Imported confirm from @tauri-apps/plugin-dialog
  - Added confirmation dialog in handleDeleteMultipleFiles that shows:
    - Number of files to be deleted
    - Warning if files are in the Master Index
  - Dialog uses Tauri's native confirm with kind: "warning"

4. Duplicate File Cancel - Fixed ✅

Issue: window.confirm may not work properly in Tauri, causing cancel to not stop the operation.

Changes:

- src/hooks/features/useFileRepository.ts:
  - Imported confirm from @tauri-apps/plugin-dialog
  - Replaced window.confirm with Tauri's native confirm dialog
  - Uses await confirm() with proper async handling

Summary of Changes

1. General UI

- Repository header: Removed the FolderOpen icon, kept just "Repository" text with standardized uppercase styling (src/components/sidebar/RepositoryPanel.tsx:361)

2. Inspector CTAs

- FileInspector: Moved "Add to Bundle" button to the TOP, before PDF preview and file info (src/components/zones/FileInspector.tsx:51-60)
- EntryInspector: Moved "Remove from Bundle" button to the TOP, before PDF preview and metadata (src/components/zones/EntryInspector.tsx:101-109)

3. MasterIndex Toolbar

- Removed "Add Document" and "Remove" buttons from the toolbar - actions now only in Inspector panel
- Kept structure buttons: Tabs, Blank Page, Templates dropdown, Compile Bundle

4. MasterIndex Sticky TABs

- Fixed transform issue: Only apply transform when actually dragging - CSS transform breaks sticky positioning
- Updated section breaks to use z-20 and solid bg-muted background (src/components/zones/MasterIndex.tsx:107-134)

5. Repository Drag Preview

- Exact DOM clone: Changed from text-only preview to cloning the actual element with icons (src/components/sidebar/RepositoryItem.tsx:105-129)
- Added buttonRef for proper element targeting

6. Drag-and-Drop Debugging

- Added comprehensive console logging to:
  - RepositoryItem.tsx drag start
  - useMasterIndexDnD.ts drop handler
  - AffidavitEditor.tsx dragover/drop handlers
- These logs will help debug any remaining drag-drop issues by showing:
  - Available data types
  - Raw/parsed data
  - Handler execution flow

Build verified successful.
