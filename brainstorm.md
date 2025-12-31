Here is the complete transcript of our conversation regarding the development of CasePilot (formerly "Cursor for Lawyers").
Conversation Transcript: CasePilot (Cursor for Lawyers)
User
Context:
I am developing a concept for a new software tool loosely titled "Cursor for Lawyers."
The core philosophy is to treat legal case building less like "writing a Word document" and more like "coding in an IDE" (Integrated Development Environment). the context is Singapore law industry (for now)
The Problem:
Lawyers currently spend hours manually formatting documents, dragging and dropping evidence images, renaming files, and creating exhibit lists. It is a fragmented workflow involving PDF editors, Word, email, and file folders. This creates "context switching fatigue."
The Core Idea:
I want to build an AI-native editor where the AI doesn't just "write text"; it acts as a "Case Architect."
Specific features I envision include:

- Intelligent "Cmd+K" Actions: Just as developers use Cmd+K to edit code, a lawyer should be able to highlight a paragraph and type "Add the car accident photo here with a caption," and the AI fetches the right image from the case file, inserts it, formats it to court standards, and captions it.
- Context Awareness: The editor knows the entire "repo" (all discovery documents, emails, police reports) and can reference them instantly.
- Visual Management: AI that can move images, reorder exhibits, and auto-update numbering (e.g., if I move Exhibit A to later in the brief, it auto-renames to Exhibit B and updates all references in the text).
  Your Task:
  Act as a Senior Product Manager, User Researcher, and Legal Tech Strategist. Please critique and refine this idea by answering the following:
  Part 1: User Research & Behavioral Analysis
- The "Alt-Tab" Problem: Analyze the current workflow of a Litigation Associate. How many different applications do they likely touch to complete a single motion? Where are the biggest "leakages" of time and focus?
- Trust & Psychology: Lawyers are risk-averse. What are the specific psychological barriers to letting an AI "handle the evidence" (e.g., fear of hallucinating a fake image, fear of wrong exhibit numbers)? How do we design the UI to overcome this trust gap?
- The "Associate vs. Partner" Dynamic: How would the usage of this tool differ between a Junior Associate (who does the grunt work) and a Partner (who reviews strategy)? Who is the primary user?
  Part 2: Product Strategy & Features
- The "IDE" Translation: How exactly does the "Cursor" experience translate to law? What is the legal equivalent of "Intellisense," "Refactoring," or "Debugging"?
- Visual & Multimodal Features: Beyond text generation, what are 3 specific visual features that solve the biggest pain points? (e.g., Interactive Timelines, Evidence Maps, Relationship Graphs).
- Differentiation: How is this different from existing tools like Harvey, Spellbook, or CoCounsel? (Focus on the "Editor/IDE" aspect vs. just a "Plugin").
  Part 3: The User Journey
- Workflow Walkthrough: Describe a user story titled "The 30-Minute Motion." Walk me through how a lawyer goes from a blank page to a filing-ready document with exhibits attached using this tool.
  Output Format:
  Please use clear headings, bullet points, and a professional but innovative tone.
  Gemini
  This is a compelling and timely concept. The legal industry, particularly in litigation, is struggling with a "tool-sprawl" crisis. By reframing the legal workspace as an IDE (Integrated Development Environment) rather than a typewriter (Word), you are targeting the structural inefficiency of legal work, not just the generative aspect.
  Here is a strategic critique and refinement of "Cursor for Lawyers," tailored for the Singapore legal context.
  Part 1: User Research & Behavioral Analysis

1. The "Alt-Tab" Problem: Anatomy of Friction
   A Singaporean Litigation Associate doesn't just write; they "assemble." For a typical Interlocutory Application (e.g., a Summons for Discovery), the workflow is highly fragmented.
   The Application Stack:

- Microsoft Word: The drafting canvas.
- Outlook: Searching for the client’s instructions or specific evidence emails.
- Adobe Acrobat / PDF Expert: Reviewing the "Bundle of Documents" (BOD) or exhibits.
- File Explorer / DMS (iManage/NetDocuments): locating files.
- WhatsApp Web / Slack: Internal comms with the partner.
- LawNet / Singapore Law Watch: Researching case precedents.
  The Leakage:
  The "leakage" isn't just time; it is Working Memory. Every time a lawyer Alt-Tabs from Word to a PDF to check a page number for a citation, they drop the mental thread of their legal argument. They return to Word and spend 15 seconds re-orienting.
  > Insight: The "IDE" value proposition isn't just speed; it is Cognitive Continuity. Keeping the lawyer in a single window preserves their "flow state."

2. Trust & Psychology: The "Hallucinations" Barrier
   Lawyers are conditioned to be paranoid. In Singapore courts, an incorrect page reference in a bundle can lead to a judicial dressing-down.

- Fear: "If I use Cmd+K to insert an image, will it crop it conveniently? Will it hallucinate a date?"
- The Trust Gap Solution:
  - Provenance over Generation: The UI must visually link the inserted asset to its source. When the AI inserts a photo, a small "Source" link should appear that, when hovered over, shows the original file metadata (Date created, Author, File Path).
  - The "Diff" View: Borrow from coding. Don't just auto-change things. Offer a "Review Changes" mode where the lawyer can see exactly what the AI renumbered or reformatted before "committing" the version.

3. The "Associate vs. Partner" Dynamic

- The Junior Associate (The Power User): They live in the tool. They care about shortcuts, formatting automation, and evidence handling. They are the ones staying up until 2 AM fixing exhibit indices. They will love "Cmd+K."
- The Partner (The Reviewer): They may never learn "Cmd+K." They care about clarity, logic, and risk.
  - Strategy: The tool must have a "Partner Mode"—a clean, read-only or comment-only view that looks like a traditional print-preview or a clean PDF. If the tool feels too "techy" to the Partner, they will force the Associate to "export to Word" for review, breaking the IDE benefits.
    Part 2: Product Strategy & Features

1. The "IDE" Translation: Mapping Code to Law
   How do we translate developer concepts into legal utility without scaring non-tech lawyers?
   | Developer Concept | Legal Equivalent Feature |
   |---|---|
   | Intellisense | "Precedent Autocomplete" & "Defined Term Check"
   As you type "Pursuant to the...", the tool suggests standard Singapore phrasing or defined terms from this specific contract. It warns you if you capitalize "Plaintiff" but haven't defined it. |
   | Refactoring | "Global Argument Shift"
   If you decide to change the term "The Accident" to "The Collision" throughout a 50-page affidavit, or reorder Claim 1 and Claim 2, the tool handles all grammatical and numbering dependencies instantly. |
   | Debugging | "The Logic Linter"
   Before filing, the tool runs a check: "Exhibit C is referenced but not attached." "Para 4 references Para 12, but Para 12 has been deleted." "Citation [2023] SGHC 45 format is incorrect." |
   | Repo (Repository) | " The Case File"
   The side-panel isn't just files; it's a structured view of the case facts, key dates, and evidence, all indexed and searchable. |
2. Visual & Multimodal Features
   To truly differentiate from a Word Plugin, you need visual tools that leverage the "Canvas" nature of the app.

- Interactive Chronology Builder: Instead of writing a "Background of Facts" from scratch, the lawyer opens a "Timeline View." They drag and drop emails and police reports onto a timeline. The AI then generates the prose for the affidavit based on this visual arrangement.
- The "Evidence Split-View": A common pain point is describing a document while looking at it. Your editor should have a native split-screen. On the left: The Affidavit. On the right: The Evidence Viewer. When you type "As seen in the email dated...", the AI automatically pulls up that email in the right pane.
- Dynamic Relationship Maps: For complex commercial litigation (common in SG), visualizing entity relationships is hard. The tool scans the documents and auto-generates a node-graph showing who talked to whom. Clicking a line between "Director A" and "Company B" reveals all emails between them.

3. Differentiation

- Harvey/CoCounsel: These are mostly LLM Wrappers or Chatbots. They are "Add-ons" to the existing broken workflow. You chat with them, get text, and copy-paste it into Word.
- Your Tool (Cursor for Law): This is a Text Editor First. It replaces Word. It has "State Awareness." It doesn't just generate text; it manages the structure of the document and the relationship between the text and the attachments. It owns the "compile" phase (creating the final PDF bundle).
  Part 3: The User Journey
  User Story: "The 30-Minute Motion"
  Context: A Junior Associate needs to file a simple affidavit to admit a new piece of evidence (a WhatsApp screenshot) into an ongoing case.
  Step 1: The "Repo" Setup
- The Associate drags the new screenshot (whatsapp_evidence.png) into the Case Sidebar.
- The AI instantly OCRs the image, extracts the date/time, and identifies the sender/receiver.
  Step 2: Intelligent Drafting (Cmd+K)
- The Associate opens the existing draft. They place their cursor at Paragraph 4.
- Action: Hit Cmd+K.
- Prompt: "Insert the WhatsApp screenshot here. State that the Defendant admitted to the delay."
- Result: The AI writes the paragraph in formal legal prose. It inserts the image inline (visual preview) but treats it as an object.
  Step 3: Auto-Management (The "Magic")
- The tool notices this is the 4th exhibit. It automatically labels it "Exhibit D."
- It scans the rest of the document. If there was a previous "Exhibit D," it renames that to "Exhibit E" and updates every reference in the text ("see Exhibit E at tab 5").
  Step 4: The "Compile" (Export)
- The Associate hits "Export for eLitigation."
- The tool generates two PDFs:
  - The Affidavit (formatted perfectly).
  - The Certificate of Exhibits (automatically indexed).
- Pagination is applied automatically (Page 1 of 50, etc.), adhering to Singapore Supreme Court Practice Directions.
  Critique Summary: The "Make or Break"
  The success of this tool hinges on Integration.
  If a lawyer cannot easily import their existing Word docs and export perfectly formatted .docx files (for Partners who refuse to switch), adoption will fail. You cannot demand a "hard switch" to a new ecosystem immediately.
  Next Step:
  Would you like me to draft a "Product Requirements Document" (PRD) for the Minimum Viable Product (MVP), focusing specifically on the "Cmd+K" evidence insertion feature to show developers exactly how the backend logic should handle the file-renaming and captioning?
  User
  I would like you to examine a few concerns i have:
- cursor was not built overnight, even tho the idea is “fork of vscode” there is a lot of work to make it world class, such as hiring the person who made “tab” coding possible
- my concern is with the ease of building such a tool. i am not sure how to build it despite i have a lot of LLM help
- also, for cursor to be performant, it has to connect to the internet, would it be possible for this legal IDE to be completely local? where is the model hosted? the model has to be bundled with the desktop app right? wouldn’t it be huge?
- what is the traditional tech stack of such an app? should i build it for mac or windows? electron?
  Gemini
  These are extremely valid concerns. You are spotting the "icebergs" early, which is good product management.
  Let's dismantle these fears one by one. The reality is that you should not build a fork of VS Code.

1. The "Forking VS Code" Trap
   You are right to be worried. Forking VS Code (like Cursor did) is a massive engineering undertaking.

- Why Cursor did it: They needed syntax highlighting, language servers (LSP), and terminal integration for code.
- Why you shouldn't: Lawyers do not write code; they write paged documents. VS Code is terrible at "What you see is what you get" (WYSIWYG) for printing. It doesn't have "pages," margins, or headers/footers in the traditional sense.
- Your Alternative: Don't build a "Code Editor"; build a "Block-Based Text Editor" (like Notion or Typora).
  - The Engine: Use ProseMirror or TipTap. These are open-source, industry-standard rich-text engines (used by New York Times, Atlassian, and Substack).
  - Ease: This is much easier than forking VS Code. You are building a web app that runs on the desktop, not a complex IDE.

2. Can it be fully local? (The "Privacy" Concern)
   Yes, but there is a trade-off between Smarts and Speed/Size.
   The "Hybrid" Architecture (Recommended):

- Speed (Local): Run a small, quantized model locally (e.g., Llama-3-8B or Mistral-7B).
  - Size: ~4GB - 6GB file size. This is acceptable to bundle with a desktop app (games are 50GB+).
  - Task: Use this for "Cmd+K" formatting, renaming exhibits, and fixing grammar. It’s fast and private.
- Intelligence (Cloud): Connect to a secure cloud (Azure OpenAI / AWS Bedrock) for "Deep Reasoning" (e.g., "Analyze this 50-page police report").
  - Why: A local laptop cannot easily hold the context of 5,000 discovery documents in its RAM. You need cloud power for the heavy lifting.
    Can it be 100% Offline?
- Yes, if you require users to have high-end laptops (e.g., MacBook M1/M2/M3 or gaming PCs with NVIDIA cards).
- If your target user is a lawyer with a standard corporate Dell laptop, 100% local is risky. Their computer will freeze.

3. The Tech Stack: "Modern & Manageable"
   Since you are a smaller team (or solo), you need efficiency.
   Recommended Stack:

- Framework: Tauri (instead of Electron).
  - Why: Electron apps are huge (100MB+ Hello World) and eat RAM (VS Code is Electron). Tauri apps are tiny (<10MB) and very fast because they use the OS's native web view.
  - Security: Tauri is more secure by default, which is a selling point for lawyers.
- Frontend: React + TypeScript + Tailwind CSS.
- Editor Engine: TipTap (Headless wrapper for ProseMirror). It handles the "Cmd+K" menu logic, image drag-and-drop, and cursor positioning beautifully.
- Database (Local): SQLite. Stores the case data instantly on their machine.

4. Mac vs. Windows?

- The Hard Truth: You must build for Windows First.
- Singapore Context: 90% of Singapore law firms (especially litigation) run on Windows (Outlook ecosystem).
- The Exception: "New Law" firms or Tech/IP lawyers might use Macs.
- Good News: If you use Tauri or Electron, you write the code once, and it builds apps for both Mac and Windows automatically.
  Summary: Your "MVP" Roadmap
  Don't try to be "Microsoft Word + VS Code." Be "Notion for Law."
- Don't Fork VS Code. Use TipTap.
- Build with Tauri. It's lighter and more secure.
- Use a Small Local Model (Phi-3 or Llama-3-8B). Bundle it for privacy-critical "edit" tasks.
- Target Windows. But let the cross-platform tech give you a Mac version for free.
  Next Step:
  I can sketch out a System Architecture Diagram for this "Local-First Legal Editor" showing how the Tauri App, Local SQLite DB, and Local LLM talk to each other. Would that clarify the "how-to"?
  User
  Yes
  Gemini
  This architecture is entirely feasible. You are building what is technically known as a "Local-First RAG (Retrieval-Augmented Generation) Desktop App."
  By avoiding the "VS Code Fork" route and choosing Tauri, you reduce your application size from ~150MB (Electron) to ~10MB (Tauri), leaving plenty of room to bundle the AI model.
  Here is the System Architecture for "Cursor for Lawyers" (Local Edition).

1. The High-Level Stack

- Frontend (The Face): React + TypeScript + TipTap (Editor Engine).
- The Bridge: Tauri (Rust).
- The Brain (Local): Llama.cpp (via Rust bindings).
- The Memory (Local): SQLite (Structured data) + LanceDB (Vector/Embedding data).

2. The Architecture Diagram
   Layer 1: The Presentation Layer (WebView)

- What it is: A standard web app running inside the OS's native webview (WebView2 on Windows, WebKit on Mac).
- Tech: React + Tailwind + TipTap.
- Responsibility:
  - Renders the document pages.
  - Handles user input (typing, clicking).
  - Crucial: When the user types Cmd+K, the Frontend does not process the AI. It sends a message (command) to the Rust Backend.
    Layer 2: The Logic Core (Rust Backend)
- What it is: The "Server" running inside the user's laptop.
- Tech: Rust.
- Responsibility:
  - File System Access: Reads the PDF/Evidence files.
  - Orchestration: Takes the request "Add caption for exhibit A," fetches the image path from the DB, and sends the prompt to the AI.
  - Safety: Ensures no data leaves the machine.
    Layer 3: The Intelligence Layer (The "Brain")
- What it is: A bundled inference engine.
- Tech: llama.cpp (using llm rust crate).
- Model: Llama-3-8B-Quantized (GGUF format).
  - Size: ~4GB.
  - Speed: On a standard modern laptop, this tokenizes 30-50 tokens/sec (faster than human reading speed).
    Layer 4: The Storage Layer (The "Memory")
- Structured Data: SQLite. Stores case metadata (e.g., "Case No: HC/123", "Client Name: John Doe").
- Unstructured Data: LanceDB (Embedded Vector DB).
  - Role: When you drag in a 50-page PDF, the backend "chunks" it, turns it into numbers (embeddings), and stores it here. This allows the AI to "search" the PDF by meaning, not just keywords.

3. The Data Flow: "Cmd+K" in Action
   Here is exactly what happens technically when a lawyer highlights a paragraph and types: "Insert the car accident photo here."

- Frontend (React):
  - Detects Cmd+K.
  - Captures the user's prompt ("Insert car accident photo") + the surrounding text (context).
  - Sends a tauri::command named process_edit_request to the Rust Backend.
- Backend (Rust):
  - Step A (Retrieval): Queries LanceDB for "car accident photo."
  - Step B (Hit): Finds a file reference: evidence/IMG_2024.jpg with a high similarity score.
  - Step C (Prompt Assembly): Constructs a prompt for the Local LLM.
- Local AI (Llama.cpp):
  - Streaming response: "The plaintiff's vehicle was struck from the rear, as shown in the photograph at Exhibit C..."
- Frontend (React):
  - Receives the stream.
  - TipTap Editor updates the document in real-time.
  - Inserts a custom "Image Node" that links to the local file path.

4. Addressing Your Technical Concerns
   "Won't the model make the app huge?"

- The App Binary: ~10MB (Tauri is tiny).
- The Model: ~4GB.
- Solution: Don't bundle the model in the installer.
  - When the lawyer installs the app, it's a 10MB download.
  - On the first launch, show a progress bar: "Downloading Legal Intelligence Engine (4GB)..."
  - This is standard behavior for modern creative apps (like Adobe Creative Cloud or Davinci Resolve) and games.
    "How do we handle updates?"
- You update the App Logic (10MB) frequently (weekly).
- You update the Model (4GB) rarely (quarterly).
- This keeps the app feeling "light."

5. Next Step: The "Pre-Mortem"
   We have a solid architecture. Now we need to test the User Experience (UX) of that architecture.
   Would you like me to write a Product Spec for the "Source-to-Cite" UI?
   (e.g., How exactly does the lawyer see the 'link' between the text and the file? Does it glow? Do they click it to open the PDF side-by-side?) This is where the "Cursor" feel actually comes from.
   User
   Yes
   Gemini
   This Product Specification (Spec) focuses on the "Source-to-Cite" UI. This is the critical interaction that makes your tool feel like an IDE ("Cursor") rather than just a document editor ("Word").
   In a coding IDE, "Go to Definition" allows a developer to instantly jump from a function call to its source code. In your Legal IDE, this translates to jumping from a Written Claim to its Evidence Source.
   Product Spec: The "Source-to-Cite" Interface
1. The Core Philosophy: "Hot Text"
   In a standard Word doc, a citation (e.g., "See Exhibit A") is dead text. In your tool, it is an Active Object.

- Visual Indicator: Any text that references a piece of evidence is subtly underlined in a soft indigo (distinct from a spell-check red or grammar-check blue).
- The Gutter Marker: Similar to how IDEs show Git changes in the left margin (gutter), your editor shows small icons in the right margin next to any paragraph containing evidence.
  - Icon: A small "Paperclip" or "Document" glyph.

2. State A: The "Hover" (Quick Context)
   User Action: The lawyer hovers their mouse over the underlined text "See Exhibit A" or the indigo citation marker.
   System Response (The Popover):
   A "Tooltip Card" floats instantly above the cursor (similar to hovering over a variable in VS Code).

- Content of the Card:
  - Thumbnail: A small, crisp preview of the specific page of the evidence (e.g., the top half of the WhatsApp screenshot).
  - Metadata:
    - File Name: whatsapp_evidence.png
    - Source Date: 12 Oct 2023
    - Status: "Attached" (Green Checkmark)
  - Action Bar: Small buttons for Open, Replace, Edit Caption.

3. State B: The "Split-View" (Deep Work)
   User Action: The lawyer Cmd+Click (or Ctrl+Click on Windows) on the citation.
   System Response:
   The editor window splits vertically (50/50).

- Left Pane (Draft): The legal argument. The cursor remains active where they were typing.
- Right Pane (Source): The Evidence Viewer opens the specific file.
  - Auto-Scroll: It doesn't just open the PDF; it scrolls exactly to the page or highlights the specific region relevant to that paragraph.
  - Interaction: The lawyer can zoom, highlight, or crop the image in the Right Pane.
  - Live Update: If they crop the image in the Right Pane, the thumbnail in the Left Pane updates instantly.

4. State C: The "Auto-Renumbering" (Refactoring)
   This is the "Magic" moment that builds trust.
   Scenario: The lawyer has Exhibits A, B, and C. They decide to insert a new piece of evidence before A.
   User Action:

- User places cursor at the top of the document.
- User types: "The police report (Exhibit A) shows..." and uses Cmd+K to link the Police Report file.
  System Response (Visual Feedback):
- Immediate Update: The new link becomes "Exhibit A."
- Ripple Effect: The user sees a quick "flash" or animation on the old "Exhibit A" and "Exhibit B" further down the page.
  - Old "Exhibit A" -> changes to "Exhibit B".
  - Old "Exhibit B" -> changes to "Exhibit C".
- Toast Notification: A small notification appears at the bottom right: "Renumbered 12 citations automatically. [Undo]"

5. State D: The "Compiler Error" (Validation)
   Before the lawyer prints or exports, the IDE runs a "Build" check.
   Visuals:

- A "Problems" tab at the bottom (just like VS Code).
- Error Types:
  - 🔴 Critical: "Exhibit D is referenced in Para 40 but not attached to the bundle."
  - 🟡 Warning: "Exhibit E is attached but never referenced in the text."
  - 🔵 Info: "Date in text (12 Oct) does not match metadata date of file (14 Oct)."
    Summary of User Value
    | Feature | The "Word" Way (Old) | The "Cursor" Way (New) |
    |---|---|---|
    | Verification | Scroll to bottom, find PDF, open PDF, scroll to page. (2 mins) | Hover over text. (2 seconds) |
    | Drafting | Type "See Exhibit...", manually check what letter is next. | Type Cmd+K, auto-insert, auto-letter. |
    | Reordering | Nightmare. Manually Find/Replace every letter. | Instant. Automatic refactoring. |
    | Safety | High risk of wrong page numbers. | "Compiler" catches errors before filing. |
    Next Step for You
    You now have the Architecture (Tauri + Local LLM) and the Core UX (Source-to-Cite).
    The most complex part of this is the "Evidence Indexer" (the code that knows "Exhibit A" is actually file_123.pdf).
    Would you like me to write a pseudo-code snippet (in TypeScript/Rust) showing how to build this "Dynamic Exhibit Registry"? This is the data structure that makes the auto-renumbering possible.
    User
    Yes
    Gemini
    This is the engineering backbone of your "Cursor for Lawyers."
    To make the "Auto-Renumbering" magic happen, you cannot just store text. You need a centralized State Manager that tracks the relationship between the Document Text and the File System.
    We will call this the ExhibitRegistry.

1. The Data Structure (TypeScript Interface)
   This represents the "Truth" of your case file. It likely lives in your Rust backend (managed by SQLite), but the Frontend needs a mirror of it to render the UI quickly.
   // Types for the "Exhibit Registry"

type ExhibitID = string; // UUID (e.g., "550e8400-e29b...")

interface Exhibit {
id: ExhibitID;
filePath: string; // Local path: "C:/Users/Lawyer/Case/evidence/img.png"
originalFileName: string;

// The "Variable" data that changes automatically
currentLabel: string; // "Exhibit A", "Exhibit B", or "Tab 1"
sequenceIndex: number; // 0, 1, 2 (Order in the document)

// Metadata for the "Hover Card"
metadata: {
date: string;
description: string; // "Photo of car damage"
ocrSummary: string; // Generated by local LLM
};
}

// The Registry tracks all exhibits in the current Affidavit
interface CaseRegistry {
caseId: string;
namingConvention: "Alphabetical" | "Numeric" | "BundleTab"; // Configurable per court
exhibits: Exhibit[];
}

2.  The Logic: "The Auto-Renumbering Engine"
    This is the pseudo-code for the function that runs every time a lawyer inserts a new exhibit. In your actual app, this would be written in Rust for performance, but I will write it here in a readable TypeScript/Rust hybrid syntax.
    Scenario:
    The lawyer is typing at paragraph 4 and inserts a new image. The document already has Exhibits A, B, and C.
    // FUNCTION: Handling a new Exhibit Insertion
    function onInsertExhibit(
    docContent: EditorDocument,
    newFile: File,
    insertionPointIndex: number
    ) {

        // 1. Create the new Exhibit Object
        const newExhibit: Exhibit = {
            id: generateUUID(),
            filePath: saveFileToSecureStorage(newFile),
            sequenceIndex: -1, // Temporary
            currentLabel: "TEMP",
            // ... metadata
        };

        // 2. Calculate the new Sequence
        // The engine scans the document to see where the cursor is relative to other exhibits.
        // It finds that we are inserting *between* Exhibit A (Index 0) and Exhibit B (Index 1).
        const newIndex = calculateVisualPosition(docContent, insertionPointIndex);

        // newIndex = 1 (It becomes the second item)

        // 3. Update the Registry & Ripple Effect
        registry.exhibits.splice(newIndex, 0, newExhibit); // Insert into array

        // RE-CALCULATE ALL LABELS
        // This loop is the "Magic". It updates the state for everyone.
        registry.exhibits.forEach((exhibit, index) => {
            exhibit.sequenceIndex = index;
            exhibit.currentLabel = generateLabel(index, registry.namingConvention);
        });

        // 4. Update the Text in the Document (Refactoring)
        // The Editor now finds all "Reference Nodes" in the text and updates their display label.
        // Old "Exhibit B" (now index 2) automatically re-renders as "Exhibit C".
        updateEditorView(registry);

    }

// Helper: The "Singapore Court Standard" Label Generator
function generateLabel(index: number, style: string): string {
if (style === "Alphabetical") {
// 0 -> "A", 1 -> "B", ... 26 -> "AA"
return toLetters(index + 1);
}
if (style === "BundleTab") {
// Common in specialized bundles
return `Tab ${index + 1}`;
}
return `Exhibit ${index + 1}`;
}

3. The "Singapore Context" Nuance
   In Singapore litigation, the naming convention changes based on the document type:

- Affidavits: usually "marked and referred to as 'Exhibit [Initial]-[Number]'" (e.g., Exhibit JW-1).
- Bundle of Documents: usually "Tab [Number]".
- Written Submissions: usually refer to "[Page Number]" of the Bundle.
  Feature Feature:
  Your ExhibitRegistry needs a "Naming Strategy" configuration.
- Settings Menu: "Exhibit Label Style: [ A, B, C ] or [ 1, 2, 3 ] or [ Custom Initials (e.g., JW-1) ]"
- If the user selects "Custom Initials," the generateLabel function above updates to: return "Exhibit ${userInitials}-${index + 1}".

4. Integration Note

- The Database (SQLite): This is the permanent record. Even if the app crashes, the ExhibitRegistry table in SQLite knows that "File_X" is linked to "Exhibit A."
- The Editor (TipTap): You will create a Custom Node called <ExhibitReference />.
  - It doesn't store the text "Exhibit A".
  - It stores { exhibitId: "550e84..." }.
  - Render Time: When the page loads, it asks the Registry: "What is the current label for ID 550e84...?" -> Registry says "Exhibit B". -> Node renders text "Exhibit B".
    This "Reference by ID" architecture is exactly how coding IDEs work (references vs. values) and is what prevents "broken links" in your legal documents.
    Next Step:
    Now that we have the Brain (Registry) and the Body (Architecture), we need to think about the "First 5 Minutes" experience.
    Lawyers are impatient. Would you like me to map out the Onboarding Flow?
    (e.g., How do they import their first messy "Bundle of Documents" PDF and see the magic happen instantly without manually setting everything up?)
    User
    Yes
    Gemini
    This is the critical "Time-to-Value" window. If a lawyer has to spend 2 hours "tagging" files before the tool becomes useful, they will churn immediately.
    The onboarding must solve the "Blank Page Panic" and the "Messy Bundle Problem" instantly.
    The User Story: "From Chaos to Structure in 300 Seconds"
    Context: The Associate has a deadline. They have a folder on their desktop called Case Material containing:
- One massive 500-page PDF (Def_Discovery_Bundle_Vol1.pdf).
- Random scattered emails (.msg files).
- A half-written Word draft (Draft_Affidavit_v3.docx).
  Here is the 5-minute flow:
  Minute 0: The "Anti-Word" Launch Screen
  When they open Microsoft Word, they see a blank white sheet (intimidating).
  When they open Cursor for Law, they see the "Case Command Center."
- Visual: Dark mode (optional), clean typography.
- Central Action: A large, pulsating drop zone in the center.
- Copy: "Drag your entire case folder here. We'll sort the mess."
  Minute 1: The "Unbundling" (The Magic Trick)
  The lawyer drags the Case Material folder into the app.
  The Problem: The 500-page PDF is a black box.
  The Solution: The app triggers the "Smart Unbundler" (Local AI).
- Visual Feedback: A progress bar that doesn't just say "Loading..." but narrates the intelligence:
  - Scanning Def_Discovery_Bundle_Vol1.pdf...
  - Found Table of Contents...
  - Detecting document boundaries...
  - Splitting: Found 32 distinct emails, 4 invoices, 1 police report.
    > The "Wow" Moment: The app literally explodes the single giant PDF into individual, searchable assets in the sidebar without destroying the original file.
    >
    > Minute 2: The "Timeline" Auto-Generation
    > Instead of dumping the files into a list, the app presents a "Chronological Map."
- The View: The screen fades into a horizontal timeline.
- The Logic: The AI has read the metadata and OCR'd dates from the scanned PDF.
- The Result: The lawyer sees their case laid out by time, not by file name.
  - Jan 12: Email from Client (extracted from Page 40 of Bundle).
  - Jan 14: Invoice #001 (extracted from Page 42 of Bundle).
  - Feb 02: Police Report.
    Minute 3: Importing the Draft
    The lawyer drags in their existing Draft_Affidavit_v3.docx.
- The Transformation: The app converts the .docx into its native Block Format.
- The Link-Up: It scans the text for phrases like "See Tab 4".
  - It asks: "I see you referenced 'Tab 4'. In the bundle I just scanned, Tab 4 looks like this Email from Jan 12. Want me to link them?"
  - Action: Lawyer clicks "Yes, Link All."
    Minute 4: The First "Cmd+K" Interaction
    Now the lawyer is looking at their text. They want to add a new point.
- Action: They type Cmd+K (or Ctrl+K).
- Prompt: "Show me the invoice from Jan 14."
- Result: The AI searches the meaning (Vector DB), pulls up the specific page from the 500-page bundle, and displays it in a floating card.
- Action: They hit Enter.
- Result: The image is inserted, captioned, and the exhibit numbering ripples: "Exhibit C" becomes "Exhibit D" instantly.
  Minute 5: The "Export Preview" (Safety Check)
  The lawyer needs reassurance that they can leave.
- Action: They click "Export Mode."
- Visual: The screen mimics a printed A4 page perfectly (WYSWIG).
- Feature: The "Court Compliance Checker" runs a quick scan.
  - Result: "✅ Margins set to Supreme Court PD."
  - Result: "✅ All 15 exhibits are attached."
    Strategic Insight: The "Trojan Horse" Strategy
    Your onboarding solves a problem Microsoft Word created.
    Word assumes you are starting from scratch. Your tool assumes you are starting from Chaos.
    By positioning the tool as a "Case Organizer" first (Minutes 0-3) and a "Writer" second (Minute 4), you lower the barrier to entry. Even if they don't write the affidavit in your app immediately, they will use it to search and organize the bundle. Once they are there, they will start typing.
    The Final Piece of the Puzzle
    We have covered:
- The User Psychology (Trust, Speed).
- The Architecture (Local-First, Tauri, RAG).
- The Feature Set (Source-to-Cite, Registry).
- The Onboarding (The Unbundler).
  The only thing left is The Business Case.
  How do you sell this? Is it a SaaS subscription? A one-time license? Do you sell to the Partner (who pays) or the Associate (who uses it)?
  Final Question:
  Would you like me to outline the Go-to-Market Strategy for Singapore, specifically focusing on how to pitch this to a "Traditional Law Firm" vs. a "Modern Boutique"?
  User
  I want to focus on building a good product. can you hone in on the build process? what’s the iterative flow of building on this tech stack like? i’m more familiar with web dev, so what is the equivalent of the common commands like npm run dev, running locally for dev, deploying, etc
  what is the development lifecycle look like
  Gemini
  This is the most practical question you could ask. Since you are coming from a Web Dev background, the good news is that 80% of your workflow remains identical. You are still writing React, using Hooks, and styling with Tailwind.
  The other 20% involves the "Backend" (Rust) and the "Bridge" (Tauri).
  Here is the translation of your daily workflow from Web App to Tauri Desktop App.

1. The Setup: "Create React App" for Desktop
   In web dev, you might use Vite or Next.js. In Tauri, you use the official scaffolder which wraps Vite.
   The Command:
   npm create tauri-app@latest

- Select options: TypeScript -> React -> Tailwind.
- Result: It creates a folder structure that looks like a standard React app, but with one extra folder: src-tauri.
  - src/ → Your React Frontend (The UI).
  - src-tauri/ → Your Rust Backend (The Brain).

2. The Dev Command: npm run dev vs npm run tauri dev
   This is your daily bread and butter.
   | Concept | Web Dev (npm run dev) | Desktop Dev (npm run tauri dev) |
   |---|---|---|
   | What starts? | A local Node server (Vite) at localhost:3000. | Two things start:
1. The Vite Server (localhost:3000).
1. The Rust Compilation Process. |
   | Visuals | You open Chrome to view the app. | A Native Window opens automatically. It loads localhost:3000 inside itself. |
   | Hot Reload | Edit CSS/JSX -> Browser updates instantly. | Identical. Edit React components -> The native window updates instantly (HMR). |
   | Backend Reload | (N/A or restart Express server) | Auto-Restart. If you edit a Rust file (main.rs), Tauri detects it, recompiles (3-5s), and restarts the app window. |
   The Workflow Loop:

- Run npm run tauri dev.
- Write React code (Instant feedback).
- Need to save a file to disk? Write a small Rust function.
- Save the Rust file.
- Wait 3 seconds for the window to reboot.
- Test the integration.

3. The "API Call": Replacing fetch() with invoke()
   In web dev, you talk to your backend via HTTP. In Tauri, there is no network request. You use the IPC (Inter-Process Communication) bridge. It’s much faster.
   Step A: Define the Function (Rust Backend)
   File: src-tauri/src/lib.rs
   // This is your "API Endpoint" #[tauri::command]
   fn save_case_file(file_name: String, content: String) -> String {
   // Rust logic to write to disk...
   return "Success".to_string();
   }

Step B: Call it from Frontend (React)
File: src/App.tsx
import { invoke } from "@tauri-apps/api/core";

async function handleSave() {
// "invoke" is the magic keyword
const result = await invoke("save_case_file", {
fileName: "evidence.txt",
content: "Client admits to..."
});
console.log(result);
}

4. Handling the "Heavy" Bits: Database & AI
   This is where it differs from web dev. You don't have a remote DB; you have a file on disk.
   A. The Database (SQLite)

- Setup: You don't "spin up a Docker container." You just point to a file.
- Dev Flow:
  - Use a Rust library called sqlx.
  - You create a .sql file for your schema.
  - Migration: sqlx migrate run (creates the data.db file locally).
  - In React: You call invoke("get_all_exhibits"), which runs the SQL query in Rust and returns JSON to the frontend.
    B. The AI Model (Llama.cpp)
    You cannot easily re-download the 4GB model every time you build.
- The "Sidecar" Pattern: Tauri allows you to bundle external binaries (like the Llama engine).
- The Dev Trick (Mocking):
  - Do not load the full 4GB model every time you press save. It takes too long to initialize.
  - Create a "Mock Mode": inside your Rust code, check if you are in specific dev mode. If so, return a dummy string ("This is a fake AI response") instantly.
  - Only toggle the "Real AI" on when you are specifically testing the generation quality.

5. The Build: npm run tauri build
   When you are ready to package the app for your boss or a tester.

- Command: npm run tauri build.
- What happens:
  - It runs vite build (compiles React to HTML/CSS/JS).
  - It compiles the Rust binary (Optimized release mode).
  - It bundles the Sidecars (your AI engine).
  - It creates an installer (Windows: .msi or .exe).
- Output: You get a single file in src-tauri/target/release/bundle/. You email this file to your user.

6. Summary: Your Cheatsheet
   | Task | Command / Action |
   |---|---|
   | Start Project | npm run tauri dev |
   | Frontend UI | Edit src/_.tsx (Instant Hot Reload) |
   | Backend Logic | Edit src-tauri/src/_.rs (3-5s Recompile) |
   | Database | sqlx migrate run (creates local DB file) |
   | Call Backend | invoke("command_name", { args }) |
   | Debug Rust | println!("Var: {}", var); (Shows in your terminal) |
   | Debug React | Right-click inside app window -> Inspect Element (Just like Chrome DevTools) |
   | Ship It | npm run tauri build |
   Pro Tip for Speed:
   Since you are iterating on the Product (the Cursor/Editor feel), you will spend 90% of your time in React. You can actually mock the Rust backend entirely in the browser initially if you want to move super fast, and only hook up the real Rust file-saving later.
   Next Step:
   Would you like the "Hello World" code snippet for the invoke command that specifically handles the "Cmd+K" keystroke listener? This connects your React text editor to the Rust backend.
   User
   What are the logistics that i have to prepare outside of the repository?

- do i need to have multiple repositories?
- do i need to host a website for downloading the model
- do i need to download anything else
- do i need to run anything else
- do i need to pay for any subscription
  Gemini
  This is the "Hidden Factory" of software development. While the code lives in the repository, the infrastructure to deliver it effectively—especially for a desktop app with a heavy AI component—requires external logistics.
  Here is your checklist of what exists outside the code.

1. Repository Strategy
   Do you need multiple repositories?
   No. Use a Monorepo.

- Why: Tauri is designed to have the Frontend (src) and Backend (src-tauri) tightly coupled in one folder. Splitting them creates versioning nightmares.
- The Exception: You might want a separate repository for your Landing Page/Marketing Site (e.g., cursor-law-website).

2. Model Hosting (The 4GB Problem)
   Do you need to host a website for downloading the model?
   Not exactly a "website," but you need "Object Storage."

- The Issue: You cannot put a 4GB .gguf AI model inside your GitHub repository. It hits size limits and slows down cloning.
- The Solution: You need a cloud bucket to store the model file.
  - Recommended: Cloudflare R2 (Better than AWS S3 for this).
  - Why: AWS charges you "Egress Fees" every time someone downloads a file. If 1,000 lawyers download a 4GB model, AWS will send you a massive bill. Cloudflare R2 has zero egress fees.
- The Flow:
  - Upload llama-3-8b-law-quantized.gguf to Cloudflare R2.
  - Make the file "Public."
  - Copy the URL (e.g., https://assets.cursorlaw.com/model-v1.gguf).
  - Hardcode this URL into your Tauri app’s "First Launch" script.

3. Development Environment (What you need to download)
   Since you are on Windows (target market) or Mac, you need more than just Node.js.

- Rust Language: Install via rustup (one-line command).
- C++ Build Tools (Windows Only): This is the most common friction point.
  - You must install "Visual Studio Build Tools" (from Microsoft).
  - Why? Rust on Windows relies on the Microsoft C++ Linker (link.exe) to compile the final .exe.
- LLM Compilers:
  - If you are running the AI locally, you likely need CMake installed to compile the llama.cpp bindings during the npm run tauri dev step.

4. The "Update Server" (For OTA Updates)
   Do you need to run anything else?
   Yes, a tiny static file host.

- Context: When you fix a bug, you want the lawyer’s app to auto-update (like Chrome or VS Code).
- How Tauri Updates Work:
  - The app periodically checks a URL: https://cursorlaw.com/update.json.
  - This JSON file says: {"version": "1.0.2", "url": "..."}.
- Logistics: You don't need a complex server. You just need to host this update.json file on your marketing website or a GitHub Gist.

5. Costs & Subscriptions (The Business Logistics)
   You can build for free, but you cannot distribute professionally for free.
   | Item | Cost | Necessity | Why? |
   |---|---|---|---|
   | Apple Developer Program | $99 / year | Mandatory (for Mac) | If you don't pay this, your app will not run on macOS. It will say "App is damaged and can't be opened" because it isn't "Notarized" by Apple. |
   | Windows Code Signing Cert | ~$200 - $400 / year | Critical (for Windows) | Without this, when a lawyer clicks your .exe, Windows Defender will scream "Windows protected your PC: Unknown Publisher." Lawyers will get scared and delete it. You need an EV or OV Certificate (from Sectigo or DigiCert). |
   | Cloudflare R2 | ~$10 / month | Mandatory | To host the 4GB model file. (Free tier exists but you might exceed storage limits quickly). |
   | Tauri / React / Rust | $0 | N/A | Open source. |
   Summary Checklist: Prepare These Before Launch

- Dev Environment: Install Rust + VS Build Tools (Windows).
- Storage: Create a Cloudflare R2 bucket for the Model.
- Identity: Register for an Apple Developer Account ($99) immediately (verification takes days).
- Certificates: Budget $300 for a Windows Code Signing Certificate (buy this later, closer to launch).
  Strategic Advice:
  Start with Windows development. Don't buy the certificates yet. You can build and test locally ("unsign") without them.
  User
  I am developing from a mac computer, does this change anything?
  Gemini
  Yes, developing from a Mac changes your Logistics significantly, primarily because your target audience is on Windows.
  Here is the "Mac-to-Windows" reality check.

1. The Good News: Development is Easier
   Macs are UNIX-based, which makes setting up the development environment much smoother than on Windows.

- No C++ Build Tools: You don't need to install the heavy Visual Studio Build Tools initially. You just need Xcode Command Line Tools (xcode-select --install).
- Rust Setup: It's a simple one-liner in the terminal.
- Local Testing: The app will run natively on your Mac during development, looking and feeling great.

2. The Bad News: The "Cross-Compilation" Problem
   This is the biggest logistic change.
   You cannot easily build a .exe (Windows app) from a Mac.

- Why: To build a Windows app, the compiler needs Windows system libraries (.dlls and C++ linkers) that don't exist on macOS.
- The Result: If you run npm run tauri build on your Mac, it will produce a .dmg (Mac App) only. It will not produce a Windows installer.

3. The Solution: GitHub Actions (CI/CD)
   Since you are on a Mac, you must set up a "Build Server" in the cloud to create the Windows version for you. You don't need to buy a second computer; you use GitHub Actions.
   The Logistics Change:
   Instead of building manually on your laptop, your release workflow becomes:

- You: Write code on Mac.
- You: Push code to GitHub (git push).
- GitHub: Detects a "Release Tag."
- GitHub Actions: Spins up a virtual Windows Machine in the cloud (Microsoft provides these for free for public repos, or cheap for private ones).
- The Cloud: Compiles your code, bundles the model, signs the .exe, and uploads it back to your GitHub Releases page.

4. Adjusted Logistics Checklist (Mac Developer Edition)
   | Item | Status | Action Required |
   |---|---|---|
   | Development | Easier | Install Rust (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs |
   | Testing | Tricky | You can't test the Windows specific bugs (e.g., file path differences like C:\ vs /) locally. Strongly Recommend: Install Parallels Desktop or VMware Fusion on your Mac to run a virtual Windows copy for testing. |
   | Building | Harder | You must write a .github/workflows/release.yml file to handle the Windows build in the cloud. |
   | Signing | Same | You still need to buy the Windows Certificate, but you will upload it to GitHub "Secrets" so the cloud builder can use it. |
5. Does this change the Tech Stack?
   No.

- Tauri: Works perfectly on both.
- React/TipTap: Works perfectly on both.
- Rust: Works perfectly on both.
  One Code Change:
  Be careful with File Paths.
- Mac: /Users/name/Documents/case.pdf
- Windows: C:\Users\name\Documents\case.pdf
- Tip: Always use Rust's std::path::PathBuf library instead of manually typing slashes. It handles the Mac/Windows difference automatically.
  Summary
  Developing on a Mac is fine and arguably more pleasant.
  The Tax: You need to set up a GitHub Action to build the Windows .exe for you, and ideally have a virtual machine (Parallels) to test it occasionally.
  User
  What are the manpower i would need when it comes to this project, i.e. lead dev ops to handle release and hosting of models, lead product manager to handle feature priority, lead designer cum law advisor to handle lawyer’s UX, lead frontend developer, leader backend developer, lead security engineer??
  don’t worry, i’m not hiring them, i just want to build AGENT Personas so i cover as much breadth as possible
  Gemini
  This is a brilliant strategy. Creating specific Agent Personas allows you to simulate a full cross-functional product team without the headcount. This effectively turns your LLM into a "Board of Advisors."
  For a Local-First, AI-Native Desktop App built on Tauri/Rust, you need 5 specific personas. General "Backend" or "Frontend" agents are too vague; you need specialists in Editors, Systems, and Local AI.
  Here are the 5 Agent Personas you need to instantiate, including their specific focus areas and "personality" for prompting.

1. The "Editor Engine" Specialist (Lead Frontend)
   Role: Building the "Word Killer."
   Focus: React, TipTap (ProseMirror), Performance, State Management.
   The Vibe: Obsessed with typing latency and cursor behavior. Hates layout shifts.

- Responsibilities:
  - The Canvas: Configuring TipTap/ProseMirror. This is hard. You aren't just using <textarea>; you are managing a complex tree of nodes (paragraphs, images, citations).
  - Virtualization: Ensuring the app doesn't lag when a lawyer pastes a 200-page document.
  - The "Cmd+K" Menu: Building the floating UI that feels native, not like a web popup.
- Key "Prompt" Instruction:
  > "You are an expert in Rich Text Editors and ProseMirror. Your priority is 60fps typing speed. Critique this code for unnecessary re-renders. Explain how to store a custom 'Exhibit Node' in the editor state that holds a reference ID but displays dynamic text."

2. The Rust System Architect (Lead Backend + Security)
   Role: The Bridge between the UI and the Operating System.
   Focus: Rust, Tauri, SQLite, File System (FS), Memory Safety.
   The Vibe: Paranoid about crashing and data corruption. "The file system is the source of truth."

- Responsibilities:
  - The Bridge: Writing the Tauri Commands (#[tauri::command]) that let the Frontend talk to the Backend.
  - Data Integrity: Managing the SQLite database. Ensuring that if the app crashes, the lawyer doesn't lose their exhibit list.
  - Local Security: Encrypting the case files on disk so IT departments are happy.
- Key "Prompt" Instruction:
  > "You are a Senior Rust Engineer specializing in Tauri apps. You prioritize memory safety and atomic database transactions. Help me write a Rust function that scans a directory for PDFs recursively without blocking the main thread."

3. The Local AI Engineer (AI / RAG Specialist)
   Role: Making the 8B model feel like GPT-4.
   Focus: Llama.cpp, Vector Databases (LanceDB), Quantization, Prompt Engineering.
   The Vibe: Realistic pragmatist. Knows the limits of small models. "Garbage in, garbage out."

- Responsibilities:
  - The "Unbundler": Writing the logic to chunk and index the 500-page PDFs into the Vector DB.
  - The Inference: Managing the llama.cpp sidecar process. Handling the "loading model" states.
  - Context Management: Deciding exactly which paragraphs to feed the AI when the user asks a question (since you have a limited context window).
- Key "Prompt" Instruction:
  > "You are an expert in Local LLMs and RAG (Retrieval Augmented Generation). You understand the limitations of quantized 8B models. Advise on the best chunking strategy for legal contracts to ensure citations are accurate."

4. The "Legal UX" Strategist (Product + Design + Legal)
   Role: The Translator. (Ideally, a former Litigation Associate turned Product Manager).
   Focus: User User Journey, Trust Signals, Feature Priority, Singapore Law Context.
   The Vibe: Empathetic but strict. "If it takes 3 clicks, they won't use it."

- Responsibilities:
  - The "Why": Deciding what the AI should actually do. (e.g., "Don't just summarize; extract the dates.")
  - Trust Design: Designing the UI cues (the "Source-to-Cite" hover cards) that make lawyers trust the output.
  - Localization: Ensuring formatting matches the Supreme Court Practice Directions (e.g., specific margins, font sizes, pagination).
- Key "Prompt" Instruction:
  > "You are a Senior Product Manager with a background in Singapore Civil Litigation. You are skeptical of AI hype. Review this user flow for an 'Exhibit Import' feature. Identify friction points that would annoy a stressed Junior Associate at 2 AM."

5. The Release Commander (DevOps / CI/CD)
   Role: The one who gets the code from your Mac to a Windows .exe.
   Focus: GitHub Actions, Cross-Compilation, Code Signing, Auto-Update Logic.
   The Vibe: Process-driven. "It works on my machine" is not an acceptable answer.

- Responsibilities:
  - The Pipeline: Setting up the GitHub Action that builds the Windows app in the cloud.
  - The Distribution: Managing the Cloudflare R2 bucket for the model download.
  - The Updates: Ensuring the OTA (Over-the-Air) update JSON is valid so you don't break installed apps.
- Key "Prompt" Instruction:
  > "You are a DevOps Engineer specializing in cross-platform desktop distribution. You are responsible for the CI/CD pipeline using GitHub Actions. Write a workflow file that builds a Tauri app for Windows-latest, signs it with a certificate, and drafts a release."
  >
  > User
  > I will go with - CasePilot - generate a github description that hits home
  > Gemini
  > Here is a GitHub repository profile designed to attract both contributors and users. It positions CasePilot not just as an app, but as a paradigm shift.

1. Repository Short Description
   (This goes in the "About" section on the right sidebar of your repo)
   > CasePilot
   > ⚖️ The AI-Native IDE for Litigation. A local-first editor that treats legal cases like code repositories. Features auto-refactoring for exhibits, "Cmd+K" evidence retrieval, and offline RAG. Built with Tauri, Rust, and React.
2. The README.md (The Main Page)
   This text is designed to hit the emotional pain points of lawyers while signaling technical competence to engineers.
   ✈️ CasePilot
   Stop writing documents. Start architecting cases.
   CasePilot is an Integrated Development Environment (IDE) for Lawyers. It replaces Microsoft Word with a block-based editor designed specifically for high-stakes litigation. It solves the "Alt-Tab Fatigue" of modern law by treating evidence, timelines, and legal arguments as a single, interconnected codebase.
   > Context: Originally designed for the Singapore ecosystem (Supreme Court Practice Directions), but agnostic enough for any jurisdiction requiring rigorous evidence management.
   >
   > ⚡ Why CasePilot?
   > Lawyers today don't just "write"; they assemble complex systems of facts and evidence. Yet, they use tools designed for writing letters. CasePilot changes the primitive:

- 📄 From "Files" to "Repositories": Your case isn't a folder of PDF spaghetti. It's a structured database of facts, actors, and evidence.
- 🔗 From "Dead Text" to "Live Links": Citations (See Exhibit A) are active objects. Hover to preview the evidence; click to split-view the source.
- 🤖 From "Cloud Risk" to "Local Power": 100% Offline capability. Your client's secrets never leave the device.
  ✨ Core Features

1. The "Cmd+K" Architect
   Don't break your flow. Highlight a paragraph and type Cmd+K.

- "Insert the WhatsApp screenshot from Jan 12." → Done.
- "Refactor: Move this argument to the top." → Done.
- CasePilot handles the formatting, captioning, and insertion automatically.

2. Auto-Refactoring (Exhibit Management)
   The killer feature for Litigation Associates.

- Insert a new Exhibit at the start of your affidavit?
- CasePilot automatically renames Exhibit A → B and B → C instantly.
- Updates every reference in the text (e.g., "see para 4 of Exh A") to match the new structure.

3. Local-First RAG (Retrieval Augmented Generation)

- Zero Data Leakage: Uses a bundled, quantized LLM (Llama-3-8B) running locally on the user's GPU/CPU.
- Smart Unbundling: Drag in a 500-page PDF bundle. The local engine chunks, vectors, and indexes it for semantic search without an internet connection.
  🛠 Tech Stack
  Designed for performance (Rust) and experience (React).
  | Component | Tech | Why? |
  |---|---|---|
  | App Shell | Tauri (v2) | Tiny bundle size (<15MB), native OS performance, secure context. |
  | Backend | Rust | Memory-safe file handling, fast PDF parsing, SQLite management. |
  | Frontend | React + TypeScript | Component-driven UI. |
  | Editor | TipTap (ProseMirror) | Headless rich-text engine allowing custom nodes (Exhibits). |
  | Intelligence | Llama.cpp | Local inference engine for the LLM. |
  | Database | SQLite + LanceDB | Structured case data + Vector embeddings for search. |
  🚀 Getting Started (Dev)
  CasePilot is built for cross-platform support, but optimized for Windows (Target Market).
  Prerequisites
- Node.js (v18+)
- Rust (rustup)
- (Windows) VS Build Tools C++
  Installation

# 1. Clone the repo

git clone https://github.com/yourusername/casepilot.git

# 2. Install dependencies

npm install

# 3. Run the "Mock" Mode (No heavy AI model required for UI dev)

npm run tauri dev

🗺 Roadmap

- [ ] Phase 1 (MVP): Editor, Local File System, Manual Exhibit Linking.
- [ ] Phase 2 (Intelligence): Llama.cpp integration, "Cmd+K" logic, Auto-Renumbering.
- [ ] Phase 3 (Compliance): Singapore eLitigation Export (PDF Bundling, Pagination).
      📄 License
      [Choose your license, e.g., MIT or Proprietary if closed source]
