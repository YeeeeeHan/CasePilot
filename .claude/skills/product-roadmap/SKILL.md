---
name: product-roadmap
description: MVP phases, feature prioritization criteria, and roadmap for CasePilot. Use when deciding what to build next, scoping features, or evaluating trade-offs.
allowed-tools: Read, Grep
---

# Product Roadmap & Prioritization

> **Strategic Pivot (Dec 2024)**: Full pivot from "AI-Native IDE" to "Bundle Compliance Automator"
> AI features moved to Phase 3+. Bundle compilation is Phase 1-2 priority.

## MVP Phases

### Phase 1: Editor + Basic Bundle

**Goal**: Basic editing AND bundle assembly (the core value)

| Feature                       | Priority | Complexity | Notes                          |
| ----------------------------- | -------- | ---------- | ------------------------------ |
| TipTap editor setup           | P0       | Medium     | Core canvas                    |
| PDF import and display        | P0       | Medium     | Import PDFs, show thumbnails   |
| **Dynamic Table of Contents** | P0       | Medium     | Auto-calculate page numbers    |
| SQLite schema (with bundles)  | P0       | Medium     | Cases, docs, exhibits, bundles |
| Case sidebar (file browser)   | P1       | Medium     | Drag-and-drop reordering       |
| Basic text formatting         | P1       | Low        | Bold, italic, headings         |

**Success Metric**: Assemble a 50-document bundle with correct TOC page numbers.

---

### Phase 2: Smart Bundle Compilation

**Goal**: The "Perfect Compiler" - automated pagination and compliance

| Feature                    | Priority | Complexity | Notes                                |
| -------------------------- | -------- | ---------- | ------------------------------------ |
| **Auto-pagination stamps** | P0       | High       | Inject "Page X of Y" into PDFs       |
| **Bundle PDF export**      | P0       | High       | Merge + paginate + bookmark          |
| **Late Insert handling**   | P0       | Medium     | Re-pagination or sub-numbering (45A) |
| Pagination validation      | P1       | Medium     | TOC matches PDF position             |
| Auto exhibit renumbering   | P1       | Medium     | ExhibitRegistry                      |
| PDF metadata extraction    | P1       | Medium     | Date, Sender, Recipient for TOC      |

**Success Metric**: Compile 500-page bundle with correct pagination in < 60 seconds.

---

### Phase 3: Intelligence Layer (AI Features)

**Goal**: AI that understands the case (deprioritized per user research)

| Feature                      | Priority | Complexity | Notes                 |
| ---------------------------- | -------- | ---------- | --------------------- |
| Cmd+K basic (rewrite/expand) | P0       | High       | Core AI interaction   |
| Local LLM integration        | P0       | High       | llama.cpp sidecar     |
| Vector search (LanceDB)      | P1       | High       | Semantic retrieval    |
| Source-to-Cite hover cards   | P1       | Medium     | Provenance visibility |
| Diff preview for AI changes  | P1       | Low        | Review before accept  |

**Success Metric**: Lawyer uses Cmd+K 10+ times per document.

---

### Phase 4: Onboarding Magic

**Goal**: 5-minute time-to-value

| Feature                 | Priority | Complexity | Notes                     |
| ----------------------- | -------- | ---------- | ------------------------- |
| Smart Unbundler         | P0       | High       | PDF → split + extract TOC |
| Timeline view           | P1       | Medium     | Chronological layout      |
| Word import (.docx)     | P1       | Medium     | Migration path            |
| Auto-link existing refs | P2       | High       | "Tab 4" → actual file     |

**Success Metric**: Lawyer imports case and sees value in < 5 minutes.

---

### Phase 5: Trust & Polish

**Goal**: Lawyers trust output enough to file

| Feature                    | Priority | Complexity | Notes                |
| -------------------------- | -------- | ---------- | -------------------- |
| Document version history   | P0       | Medium     | Auto-save, restore   |
| Split-view evidence viewer | P1       | Medium     | Cmd+Click to view    |
| Certificate of Exhibits    | P1       | Low        | Auto-generated index |
| Margin/font validation     | P1       | Low        | Practice Directions  |
| Bundle cover page          | P2       | Low        | Nice to have         |

**Success Metric**: 100% eLitigation acceptance rate, zero filing rejections.

---

## Prioritization Framework

### Priority Levels

| Level | Meaning             | Decision Criteria                 |
| ----- | ------------------- | --------------------------------- |
| P0    | Must have for phase | Blocks user from core task        |
| P1    | Should have         | Significantly improves experience |
| P2    | Nice to have        | Polish, can defer                 |
| P3    | Future              | Not in current phase scope        |

### Prioritization Questions

When evaluating a feature, ask:

1. **Bundle Compilation**: Does this help compile compliant bundles?
   - Directly enables bundle compilation → P0
   - Improves bundle quality → P1
   - Nice to have for bundles → P2

2. **Frequency**: How often will users need this?
   - Daily use → P0/P1
   - Weekly → P1/P2
   - Rare → P2/P3

3. **Pain Level**: How bad is the workaround?
   - No workaround exists → P0
   - Workaround is painful (e.g., manual pagination in Acrobat) → P0
   - Workaround is tolerable → P2

4. **Trust Impact**: Does this affect lawyer confidence?
   - Directly affects filing accuracy (pagination!) → P0
   - Affects perceived reliability → P1
   - Cosmetic → P2/P3

5. **Build vs Buy**: Can we use existing solutions?
   - Must build custom → Raises complexity estimate
   - Library exists → Reduces complexity

### Complexity Levels

| Level     | Meaning   | Typical Scope                          |
| --------- | --------- | -------------------------------------- |
| Low       | 1-2 days  | Single component, clear implementation |
| Medium    | 3-5 days  | Multiple components, some unknowns     |
| High      | 1-2 weeks | Cross-cutting, architectural impact    |
| Very High | 2+ weeks  | Research required, high risk           |

---

## Feature Scoping Template

When designing a new feature, document:

```markdown
## Feature: [Name]

### User Story

As a [Junior Associate / Partner], I want to [action] so that [benefit].

### Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### Out of Scope (Explicitly)

- Thing we're NOT doing
- Another thing we're NOT doing

### Dependencies

- Requires: [other feature]
- Blocked by: [technical constraint]

### Risks

- Risk 1: [description] → Mitigation: [approach]

### Phase

Phase [1-5] | Priority: P[0-3] | Complexity: [Low/Medium/High]
```

---

## Anti-Patterns to Avoid

### 1. "AI Writing First" Syndrome

> "Let's build the AI drafting features before bundle compilation"

**Rule**: Bundle compilation is the core value. AI is Phase 3+. Don't skip ahead.

### 2. "While We're At It" Syndrome

> "Since we're building exhibit linking, let's also add automatic citation formatting"

**Rule**: Each feature ships independently. Don't bundle unrelated scope.

### 3. Partner-First Design

> "Partners will want a dashboard showing all cases"

**Rule**: Build for the Junior Associate first. They're the power users. Partners get "review mode" later. (But remember: paralegals do the actual bundle work!)

### 4. Premature Optimization

> "We need to support 10,000-page bundles"

**Rule**: Optimize for the common case (50-500 pages). Handle edge cases with graceful degradation.

### 5. Feature Parity with Word

> "Word has mail merge, we need mail merge"

**Rule**: We're replacing Adobe Acrobat for bundles, not replacing Word for drafting.

---

## Current Phase Checklist

Use this to track progress within the current phase:

### Phase 1 Status: [Not Started / In Progress / Complete]

- [ ] TipTap editor renders
- [ ] Can import PDF files
- [ ] PDF thumbnails display
- [ ] Dynamic TOC shows documents with page numbers
- [ ] TOC page numbers are correct (THE critical check)
- [ ] Save to SQLite works
- [ ] Sidebar shows case files with drag-and-drop

### Phase 2 Status: [Not Started / In Progress / Complete]

- [ ] Can inject pagination stamps into PDFs
- [ ] Bundle PDF export works (merge + paginate + bookmark)
- [ ] Late insert re-paginates correctly
- [ ] Pagination validation catches mismatches
- [ ] Exhibit renumbering works
- [ ] PDF metadata extraction works

### Phase 3 Status: [Not Started / In Progress / Complete]

- [ ] Cmd+K opens floating menu
- [ ] Local LLM responds to prompts
- [ ] Can search case files semantically

_(Continue for each phase)_

---

## Decision Log

Track major product decisions here:

| Date       | Decision                         | Rationale                                               | Alternatives Considered                  |
| ---------- | -------------------------------- | ------------------------------------------------------- | ---------------------------------------- |
| 2024-XX    | Start with Windows target        | 90% of SG law firms use Windows                         | Mac-first, Web-first                     |
| 2024-XX    | Use TipTap over Slate            | Better docs, ProseMirror foundation                     | Slate, Lexical, custom                   |
| 2024-XX    | Local-first architecture         | Lawyer privacy concerns                                 | Cloud-first, hybrid                      |
| 2024-12-31 | Use llama.cpp with Rust bindings | Privacy-first, no API costs, streaming via Tauri events | Vercel AI SDK, LangChain, raw OpenAI API |
| 2024-12-31 | llama_cpp crate (edgenai)        | Active maintenance, async/streaming support, safe API   | llama-cpp-2, llama_cpp_rs                |

---

## Success Metrics by Phase

| Phase | North Star Metric              | Target                   |
| ----- | ------------------------------ | ------------------------ |
| 1     | Documents drafted in CasePilot | 10 complete affidavits   |
| 2     | Cmd+K invocations per doc      | 10+ per document         |
| 3     | Filing rejection rate          | 0% due to exhibit errors |
| 4     | Time to first value            | < 5 minutes              |
| 5     | eLitigation acceptance rate    | 100% first-try           |
