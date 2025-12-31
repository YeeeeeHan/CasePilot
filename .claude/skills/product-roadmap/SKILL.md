---
name: product-roadmap
description: MVP phases, feature prioritization criteria, and roadmap for CasePilot. Use when deciding what to build next, scoping features, or evaluating trade-offs.
allowed-tools: Read, Grep
---

# Product Roadmap & Prioritization

## MVP Phases

### Phase 1: Editor Foundation
**Goal**: Replace Word for basic legal drafting

| Feature | Priority | Complexity | Notes |
|---------|----------|------------|-------|
| TipTap editor setup | P0 | Medium | Core canvas |
| Basic text formatting | P0 | Low | Bold, italic, headings |
| Local file save/load | P0 | Medium | SQLite persistence |
| Case sidebar (file browser) | P1 | Medium | Navigate case files |
| Manual exhibit linking | P1 | Medium | Insert exhibit refs by hand |

**Success Metric**: Lawyer can draft a 10-page affidavit without switching to Word.

---

### Phase 2: Intelligence Layer
**Goal**: AI that understands the case

| Feature | Priority | Complexity | Notes |
|---------|----------|------------|-------|
| Cmd+K basic (rewrite/expand) | P0 | High | Core AI interaction |
| Local LLM integration | P0 | High | llama.cpp sidecar |
| PDF text extraction | P1 | Medium | pdfium in Rust |
| Vector search (LanceDB) | P1 | High | Semantic retrieval |
| Auto exhibit renumbering | P1 | Medium | ExhibitRegistry |

**Success Metric**: Lawyer uses Cmd+K 10+ times per document.

---

### Phase 3: Trust & Polish
**Goal**: Lawyers trust the output enough to file

| Feature | Priority | Complexity | Notes |
|---------|----------|------------|-------|
| Source-to-Cite hover cards | P0 | Medium | Provenance visibility |
| Compiler errors (validation) | P0 | Medium | Pre-export checks |
| Split-view evidence viewer | P1 | Medium | Cmd+Click to view |
| Diff preview for AI changes | P1 | Low | Review before accept |
| Undo/redo for AI actions | P1 | Low | Safety net |

**Success Metric**: Zero rejected filings due to missing exhibits.

---

### Phase 4: Onboarding Magic
**Goal**: 5-minute time-to-value

| Feature | Priority | Complexity | Notes |
|---------|----------|------------|-------|
| Smart Unbundler | P0 | High | PDF → individual assets |
| Timeline view | P1 | Medium | Chronological layout |
| Word import (.docx) | P1 | Medium | Migration path |
| Auto-link existing refs | P2 | High | "Tab 4" → actual file |

**Success Metric**: Lawyer imports case and sees value in < 5 minutes.

---

### Phase 5: Singapore Compliance
**Goal**: eLitigation-ready exports

| Feature | Priority | Complexity | Notes |
|---------|----------|------------|-------|
| PDF export with bookmarks | P0 | Medium | Court requirement |
| Auto-pagination | P0 | Medium | Page X of Y |
| Certificate of Exhibits | P1 | Low | Auto-generated index |
| Margin/font validation | P1 | Low | Practice Directions |
| Bundle cover page | P2 | Low | Nice to have |

**Success Metric**: Exported PDF accepted by eLitigation without manual fixes.

---

## Prioritization Framework

### Priority Levels

| Level | Meaning | Decision Criteria |
|-------|---------|-------------------|
| P0 | Must have for phase | Blocks user from core task |
| P1 | Should have | Significantly improves experience |
| P2 | Nice to have | Polish, can defer |
| P3 | Future | Not in current phase scope |

### Prioritization Questions

When evaluating a feature, ask:

1. **Frequency**: How often will users need this?
   - Daily use → P0/P1
   - Weekly → P1/P2
   - Rare → P2/P3

2. **Pain Level**: How bad is the workaround?
   - No workaround exists → P0
   - Workaround is painful → P1
   - Workaround is tolerable → P2

3. **Trust Impact**: Does this affect lawyer confidence?
   - Directly affects filing accuracy → P0
   - Affects perceived reliability → P1
   - Cosmetic → P2/P3

4. **Build vs Buy**: Can we use existing solutions?
   - Must build custom → Raises complexity estimate
   - Library exists → Reduces complexity

### Complexity Levels

| Level | Meaning | Typical Scope |
|-------|---------|---------------|
| Low | 1-2 days | Single component, clear implementation |
| Medium | 3-5 days | Multiple components, some unknowns |
| High | 1-2 weeks | Cross-cutting, architectural impact |
| Very High | 2+ weeks | Research required, high risk |

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

### 1. "While We're At It" Syndrome
> "Since we're building exhibit linking, let's also add automatic citation formatting"

**Rule**: Each feature ships independently. Don't bundle unrelated scope.

### 2. Partner-First Design
> "Partners will want a dashboard showing all cases"

**Rule**: Build for the Junior Associate first. They're the power users. Partners get "review mode" later.

### 3. Premature Optimization
> "We need to support 10,000-page bundles"

**Rule**: Optimize for the common case (50-500 pages). Handle edge cases with graceful degradation.

### 4. Feature Parity with Word
> "Word has mail merge, we need mail merge"

**Rule**: Only build Word features that lawyers actually use for litigation. Skip the rest.

---

## Current Phase Checklist

Use this to track progress within the current phase:

### Phase 1 Status: [Not Started / In Progress / Complete]

- [ ] TipTap editor renders
- [ ] Can type and format text
- [ ] Save to SQLite works
- [ ] Load from SQLite works
- [ ] Sidebar shows case files
- [ ] Can insert exhibit reference (manual)

### Phase 2 Status: [Not Started / In Progress / Complete]

- [ ] Cmd+K opens floating menu
- [ ] Local LLM responds to prompts
- [ ] Can search case files semantically
- [ ] Exhibit renumbering works
- [ ] PDF text extraction works

*(Continue for each phase)*

---

## Decision Log

Track major product decisions here:

| Date | Decision | Rationale | Alternatives Considered |
|------|----------|-----------|------------------------|
| 2024-XX | Start with Windows target | 90% of SG law firms use Windows | Mac-first, Web-first |
| 2024-XX | Use TipTap over Slate | Better docs, ProseMirror foundation | Slate, Lexical, custom |
| 2024-XX | Local-first architecture | Lawyer privacy concerns | Cloud-first, hybrid |

---

## Success Metrics by Phase

| Phase | North Star Metric | Target |
|-------|------------------|--------|
| 1 | Documents drafted in CasePilot | 10 complete affidavits |
| 2 | Cmd+K invocations per doc | 10+ per document |
| 3 | Filing rejection rate | 0% due to exhibit errors |
| 4 | Time to first value | < 5 minutes |
| 5 | eLitigation acceptance rate | 100% first-try |
