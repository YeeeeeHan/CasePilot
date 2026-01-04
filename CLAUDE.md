# CasePilot: Bundle Compliance Automator for Singapore Litigation

## Project Overview

CasePilot is a desktop application that automates the tedious, error-prone process of assembling court-compliant document bundles. Instead of spending 200+ hours in Adobe Acrobat ensuring page numbers match Table of Contents entries, paralegals and associates get automatic pagination, dynamic TOC generation, and ePD 2021 compliance validation.

**Philosophy**:

1.  **Decouple Data**: A file is just a blob; an Artifact (Affidavit/Bundle) is the context.
2.  **Relationship Manager**: CasePilot is not just an editor; it manages the relationship between the **Evidence** and the **Narrative** (Bundle/Affidavit).

> "It's not about Multimedia; it's about Pagination." — User Research, Dec 2024

## Past changes and task list

# Bundle mode

## Bundle previews

- [x] blank page still have "Content continues on this page...". That page containing this string should not exist until user types content overflowing the first blank page document!!!
- [x] Sticky tab header should remain through the whole duration until it hits the next tab, not only within the tab page
- [x] Sticky headers - should show 2 stick tabs at once (1) Tab sticky header (2) Item sticky header (pdf/cover page/ Table of contents etc)
- [x] Remove tab icons in tab page in the middle of the page
- [x] "Evidence (Read-only)" should be changed to "Description (Read-only)"
- [x] blank page sticky header and pdf sticky header formatting should be as similar as possible, both should show the number of pages on the left in grey, i.e. "Evidence (Read-only)- 1 page" and "Document - 1 page" or "Cover Page - 2 page" or "Table of Contents - 2 page"
- [x] The sticky headers front size should be smaller
- [x] blank documents should respect the A4 relative formatting - i.e. the default font typography should not be too big
- [x] On app start up, when i zoom in from 100% to 110%, it seems like the page becomes smaller instead. Afterwards the zooms work as normal. I think there's an issue with the bundle preview width on start up
- [ ] bundle previews of PDFs or documents. The headers should indicate index number too

## Master index

- [x] If there is a blank page at the bottom of the index, prevent adding a blank page subtly
- [x] Inspector - compact the fonts to squeeze more info - it should mimic the vscode file explorer font size
- [x] Inspector - should have a picture preview of the first page of the PDF.
- [x] Inspector - ability to edit metadata - be sensible about what metadata should be displayed - for bundle, it's the description, date, etc. For affiadvit, it's the Exhibit tag?
- [x] add and remove from bundle/exhibit button should be made more accesible (maybe at the top?)
- [x] Master index tabs rows should be sticky as you scroll down (i.e. Tab A sticks to the top as you scroll, replaced by tab once you hit it)
  - **Fix**: Added floating sticky section header that tracks scroll position and shows current section label
- [x] when dragging rows, row lines SHOULD NOT disappear
  - **Fix**: Changed drag styling to use `outline` instead of border, added explicit `border-b` class
- [x] use @tanstack/react-table for table for future (see Migration Plan below)
  - **Completed**: Migrated MasterIndex to @tanstack/react-table with flexRender columns and @tanstack/react-virtual for row virtualization (100+ entries)
- [x] TABs should be sticky to the top as users scroll. TOP PRIORITY!!! HAVE BEEN TRYING MANY TIMES BUT YOU ARE NOT DOING IT!! STILL DOESN'T WORK!!! IT'S FAILING SILENTLY?!??!
  - **Root cause**: `<tr>` elements inside `<table>` don't support sticky reliably. **Solution**: Floating sticky header outside table structure
- [ ] Help me devise a way to resolve multiple blank pages in the master index (it should be handled by a continuous auto paginated tiptap editor)

# Inspector

- [x] Inspector - Should closed by default
- [x] preview should maintain the file's dimensions and center the div within the inspecto
- [ ] inspector height should be adjustable

# Repository

- [x] file referenced in repository in affidavit mode should be greyed out
- [x] should allow multiple cursor selection - "add 5 files to bundles" - "add 5 files to exhibit"
- [x] Naturally, right click operations should apply for all selected files.
- [x] Should allow keyboard movement up and down for the "highlight" of the files. it would behave the same as clicking on the file (i.e. inspector updates)
- [x] When i double click a file in affidavit mode, it adds to bundle instead
- [x] bulk right operations are still buggy - delete operation, adding to affidavit/bundle
- [x] right click on file explorer background should also be possible, not only on the files
- [x] keyboard movements should render the previous highlighted one unavailable unless holding onto shift
- [x] When i drag files, i want a translucent duplicate to be moving around with my cursor.
- [ ] greyed backgorund of highlighted file is too light against the white background
- [ ] If you import a new file that is the same name - double confirm with a using react instead of system UI "are you sure?" If user proceed to add it, add a de-duplication numner (1) (2)... so on so forth. Consider the case of multiple file adds too
- [ ] create folders UX should mimic vscode. create a placeholder folder at the top of the directory with a blinking cursor. If user clicks away the placeholder folder disappears and nothing happens. If the user types something then create the folder as per normal
- [ ] add or delete files from repository double confirm should be shown using react instead of system UI
- [ ] Drag and drog to add to bundle index/ exhibit still is not working. TOP PRIORITY!!! HAVE BEEN TRYING MANY TIMES BUT YOU ARE NOT DOING IT!! STILL DOESN'T WORK!!! IT'S FAILING SILENTLY?!??!

# Case roganisation

- [x] UX - think of how to name cases - now it's all named "new case"
- [x] One-look way to differentiate between cases (whether it's affidavit or bundle)

# General UI

- [x] Repositoy, Master index, preview, inspector should all have the same formatting
- [x] Right click menu and on hover formatting shout be roughly similar
- [x] Toast description is grey - should be more readable

Affidavit mode

- [x] affidavit cursor somehow is overlapping with exhibitNode
- [x] Improve exhibit node UI - how it is seen should be same as how it is printed
- [x] the preview of the affidavit exhibit should not change when cursor is clicked away - how would lawyers continue to type and reference like that?
- [x] add button to export affidavit to .docx (at the bottom? make it similar to bundle master index panel UI)
- [x] Add an auto exhibit builder/ section that is contiguous to the affidavit editor, aligning with the format of https://epd2021-supremecourt.judiciary.gov.sg/
- [ ] imported exhibits are not persisting on reload
- [ ] affidavit editor should be pagination
- [ ] PDF is cut off in preview - it should always show the full width
- [ ] PDF view is unstable, shows `Failed to load PDF file.` at times
- [ ] export to .docx not working
