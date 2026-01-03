---
name: singapore-legal-domain
description: Comprehensive Singapore civil litigation domain knowledge. Use for court formatting, document structure, Evidence Act rules, and ePD 2021 compliance.
allowed-tools: Read, Grep
---

# Singapore Legal Domain Reference

This skill provides comprehensive domain knowledge for Singapore civil litigation. Use it when you need to understand court requirements, document formats, or legal procedures.

---

## Quick Reference Tables

### Key Forms

| Form Number | Title                        | Appendix  | Purpose                                     |
| :---------- | :--------------------------- | :-------- | :------------------------------------------ |
| Form 29     | Order to Attend Court        | App A     | Compelling witness attendance (subpoena)    |
| Form 31     | Affidavit                    | App A     | Standard format for civil affidavits        |
| Form B7     | Expert Witness Template      | App B     | Mandatory structure for expert reports      |
| Form B13    | Notice of Objections to AEIC | App B     | Objecting to inadmissible content in AEICs  |
| Form B13A   | Notice to Admit Doc. Hearsay | App B     | Admitting hearsay documents under s32 EA    |
| Form 54     | Generic Affidavit            | FJC App A | Standard affidavit for Family Court matters |
| Form 15     | First Ancillary Affidavit    | FJC App A | Asset disclosure in divorce proceedings     |

### Court Jurisdictions

| Court                 | Claim Threshold | Key Characteristics                            |
| :-------------------- | :-------------- | :--------------------------------------------- |
| Supreme Court         | > $250,000      | Complex matters, SAPT rule, foreign evidence   |
| State Courts          | ≤ $250,000      | Volume focus, simplified tracks, expert panels |
| Family Justice Courts | N/A             | Therapeutic justice, standardized forms        |

### Document Types at a Glance

| Document                       | Acronym | Purpose                                   | Key Pain Point             |
| :----------------------------- | :------ | :---------------------------------------- | :------------------------- |
| Affidavit of Evidence-in-Chief | AEIC    | Sworn witness testimony with exhibits     | Exhibit renumbering        |
| Bundle of Documents            | BOD     | Master compilation of all trial documents | Pagination synchronization |
| Submissions                    | -       | Legal arguments and authorities           | Citation formatting        |

---

## The Five Ideals (ROC 2021)

Every procedural step must be measured against these operative principles from Order 3, Rule 1 of the Rules of Court 2021.

| Ideal                                | Implication for CasePilot Features                                    |
| :----------------------------------- | :-------------------------------------------------------------------- |
| **Fair Access to Justice**           | Full disclosure; hearsay notices filed promptly; no surprise tactics  |
| **Expeditious Proceedings**          | Strict AEIC deadlines; late filings rejected; timeline compliance     |
| **Cost-Effective Work**              | Evidence volume proportionate to claim; limit "paper wars"            |
| **Efficient Use of Court Resources** | Bundle all applications at SAPT stage; avoid multiple hearings        |
| **Fair and Practical Results**       | Technical errors (margins) can be fixed; substantive errors are fatal |

**Key Insight**: Minor non-compliance (e.g., margin errors) is often tolerated if 90% of the document is proper. But pagination mismatches and missing exhibits are substantive failures.

---

## Document Types

### Affidavit of Evidence-in-Chief (AEIC)

The AEIC is the vessel through which evidence is introduced in Singapore civil trials. It replaces oral examination-in-chief.

#### The "Own Words" Doctrine

- **Independent Recollection**: Evidence must be the witness's own testimony, not lawyer-coached
- **Language**: Drafted in witness's own words; interpreted to them in native language if needed
- **Personal Knowledge**: Deponent must distinguish personal knowledge from "information and belief"

#### Technical Formatting Requirements

| Requirement | Specification                              | Reference        |
| :---------- | :----------------------------------------- | :--------------- |
| Form        | Form 31 of Appendix A                      | ePD 2021 Part 10 |
| Margins     | 35mm on all four sides                     | Para 78          |
| Pagination  | Consecutive, top right corner              | Para 78          |
| Font        | Times New Roman, 12pt minimum              | Para 78          |
| Spacing     | Double-spaced (single for headings/quotes) | Para 78          |
| Photograph  | Colour photo of deponent, top left corner  | ROC 2021         |

#### The Identification Header

Top right corner of first page:

```
[Party]; [Name]; [Ordinal Number]; [Date]
Example: 1st Claimant; Lim Siew Lan; 2nd; 24.01.2025
```

### Bundle of Documents (BOD)

The Bundle is the master compilation of all documents from all parties for trial.

#### Structure

```
bundle.pdf
├── Cover Page
├── Master Content Page (overall index)
├── [Volume 1]
│   ├── Content Page (for this volume)
│   ├── Tab 1 - [Separator Page]
│   ├── Document 1 (pages 1-10)
│   ├── Tab 2 - [Separator Page]
│   ├── Document 2 (pages 11-25)
│   └── ...
├── [Volume 2]
│   ├── Content Page (for this volume)
│   └── ...
```

#### The Sacred Rule (ePD Para 78)

> **Index Page # == PDF Footer Page # == PDF Metadata Page #**

If the Table of Contents says a document starts on Page 15, the PDF page counter MUST show Page 15.

#### Volumes

Physical ring binders hold ~300-500 pages. eLitigation has file size limits (~20MB). Bundles exceeding these limits must be split into volumes with:

- Separate Table of Contents per volume
- Continuous pagination across volumes (Vol 1 ends p.500; Vol 2 starts p.501)

### Exhibits

Exhibits are attachments to affidavits proving the facts stated.

#### Marking Convention

| Style        | Example                   | Use Case            |
| :----------- | :------------------------ | :------------------ |
| Initials     | JW-1, JW-2, JW-3          | Standard affidavits |
| Alphabetical | Exhibit A, B, C... AA, AB | Alternative style   |
| Tab          | Tab 1, Tab 2, Tab 3       | Bundle of Documents |

#### Rules

- **Sequential Numbering**: If deponent files second affidavit, numbering continues (JW-15 if first ended at JW-14)
- **Table of Contents**: Mandatory if more than 10 exhibits
- **Colored Dividers**: Red for Claimants, Blue for Defendants (physical copies)
- **Non-Documentary**: Physical evidence (e.g., hard drive) must be labeled and photographed

### Tabs

A Tab is a divider (physical or digital bookmark) between documents in a bundle.

**Physical World**: Stiff cardstock with protruding label ("Tab 1", "Tab 2")
**Digital World**: PDF bookmarks + separator pages with "TAB X" printed

**Why Needed**: Judge will say "Counsel, turn to Tab 15." If your PDF doesn't have a bookmark at that spot, you're wasting the court's time.

---

## Evidence Act 1893

The Rules of Court govern _how_ evidence is presented; the Evidence Act governs _what_ can be presented.

### Relevancy

- **Facts in Issue**: Facts a party must prove to establish claim/defence
- **Relevant Facts**: Facts that make facts in issue probable or improbable
- **Res Gestae (s6)**: Evidence of facts forming part of the "same transaction"

### Hearsay Evidence

**General Rule**: Excluded. A witness cannot testify about what someone else said to prove the statement is true.

#### Statutory Exceptions (Section 32)

| Subsection | Category                    | Condition                                                 |
| :--------- | :-------------------------- | :-------------------------------------------------------- |
| s 32(1)(b) | Ordinary Course of Business | Statements made in routine of trade/profession            |
| s 32(1)(c) | Against Interest            | Statements against maker's pecuniary/proprietary interest |
| s 32(1)(j) | Unavailable Maker           | Maker is dead, abroad, or incapable                       |

#### Notice Requirements

- **Form B13A**: Notice for documentary hearsay
- **Form B13B**: Notice for non-documentary hearsay
- **Objections**: Opposing party must file counter-notice; otherwise evidence admitted by consent

### Opinion Evidence (Section 47)

- **General Rule**: Witnesses testify to facts, not opinions
- **Exception**: Expert opinion providing "substantial assistance" to the court
- **Format**: Experts must use Form B7 (Expert Witness Template)
- **Common Knowledge Exclusion**: If court can conclude from facts alone, expert inadmissible

### Legal Professional Privilege

- **Advice Privilege (s128)**: Protects confidential legal advice communications
- **Litigation Privilege**: Communications when litigation reasonably in prospect
- **Fraud Exception**: Privilege does not protect communications in furtherance of fraud

---

## Court-Specific Rules

### Supreme Court (High Court & Appellate Division)

**Jurisdiction**: Claims > $250,000, complex matters

| Feature                    | Requirement                                                                   |
| :------------------------- | :---------------------------------------------------------------------------- |
| SAPT Rule                  | All interlocutory applications in single block, 21 days after Case Conference |
| Foreign Evidence           | 8-week lead time for live video link applications                             |
| Affidavit Exchange Windows | Strictly within 21-day windows                                                |

### State Courts (District & Magistrates' Courts)

**Jurisdiction**: Claims ≤ $250,000

| Feature                | Requirement                                                  |
| :--------------------- | :----------------------------------------------------------- |
| Simplified Proceedings | Limited affidavit length and witness count                   |
| Expert Panel           | Maintained panel for recurring issues (e.g., motor accident) |
| Binding Colors         | Red/Blue plastic ring binding enforced                       |

### Family Justice Courts

**Jurisdiction**: Divorce, guardianship, family matters

| Feature                 | Requirement                                                   |
| :---------------------- | :------------------------------------------------------------ |
| Originating Application | Family matters commence via OA with affidavit                 |
| Form 54                 | Generic Affidavit (standardized template)                     |
| Form 15                 | First Ancillary Affidavit (structured asset disclosure)       |
| Sensitive Information   | Stricter redaction of children's details, safehouse addresses |

---

## eLitigation Technical Specifications

Singapore's eLitigation system is the mandatory electronic filing platform.

### PDF Requirements

| Specification | Requirement                                                 |
| :------------ | :---------------------------------------------------------- |
| Format        | PDF (not scanned if possible)                               |
| OCR           | Searchable text layer required                              |
| Resolution    | 300 DPI recommended for scans                               |
| File Size     | 10-20MB per chunk (varies by court)                         |
| Naming        | Logical names (e.g., "AEIC of Lim Siew Lan - 1st Claimant") |

### Pagination Rules

- Hard copy pagination MUST match PDF pagination exactly
- Every page numbered consecutively (including separators, exhibits)
- Position: Top right-hand corner

### Service Bureau

Physical interface for litigants without SingPass or during outages.

**The 4 PM Rule**: Documents submitted before 4:00 PM are processed same-day; after 4:00 PM → next working day.

---

## Oaths and Commissioning

### Commissioner for Oaths (CFO)

Affidavits must be sworn before an independent CFO.

| Item          | Fee |
| :------------ | :-- |
| Per affidavit | $25 |
| Per exhibit   | $5  |

### Interpretation

If deponent doesn't understand English:

- CFO or qualified interpreter must interpret contents
- Jurat must reflect interpretation
- Failure renders affidavit inadmissible

### Remote Commissioning

Permanently allowed post-pandemic.

**Protocol**:

1. Deponent and CFO both in Singapore
2. Deponent shows NRIC to camera
3. Deponent signs in view of CFO
4. Document couriered to CFO for signature

**Jurat**: Must state "Affirmed remotely on [date] in Singapore via live video link..."

---

## Official Links & Citations

### Primary Authoritative Sources

| Resource                          | URL                                                  | Purpose                                 |
| :-------------------------------- | :--------------------------------------------------- | :-------------------------------------- |
| Supreme Court Practice Directions | https://epd2021-supremecourt.judiciary.gov.sg        | Part 10: Evidence, Affidavits, Exhibits |
| State Courts Practice Directions  | https://epd2021-statecourts.judiciary.gov.sg         | Part VIII: Evidence                     |
| Family Justice Courts PD          | https://epd2024-familyjusticecourts.judiciary.gov.sg | Family proceedings                      |
| Singapore Statutes Online         | https://sso.agc.gov.sg                               | Evidence Act 1893, ROC 2021             |
| eLitigation                       | https://www.elitigation.sg                           | Filing portal, Cause Book Search        |

### Key Practice Directions Links

| Topic                 | URL                                                                                                    |
| :-------------------- | :----------------------------------------------------------------------------------------------------- |
| Part 10 (Evidence)    | https://epd2021-supremecourt.judiciary.gov.sg/part-10-evidence-witnesses-affidavits-and-exhibits       |
| Appendices (Forms)    | https://epd2021-supremecourt.judiciary.gov.sg/appendices                                               |
| Trial Documents Guide | https://www.judiciary.gov.sg/docs/default-source/civil-docs/state-courts-guide-for-trial-documents.pdf |
| Affidavit Preparation | https://www.judiciary.gov.sg/attending-court/prepare-affidavit                                         |
| CFO Services          | https://www.judiciary.gov.sg/services/commissioner-for-oaths-services                                  |

### Legal Research & Reference

| Resource           | URL                                                         | Purpose                           |
| :----------------- | :---------------------------------------------------------- | :-------------------------------- |
| LawNet (SAL)       | https://www.lawnet.sg                                       | Case law, Singapore Law Reports   |
| Evidence Act 1893  | https://sso.agc.gov.sg/Act/EA1893                           | Statutory text                    |
| Law Society Ethics | https://www.lawsociety.org.sg/for-lawyers/ethics-resources/ | Ethics guidance, lawyer directory |

### Academic & Secondary Sources

| Title                                   | URL                                                                                          |
| :-------------------------------------- | :------------------------------------------------------------------------------------------- |
| ROC 2021: Perspectives from the Bench   | https://journalsonline.academypublishing.org.sg/.../ArticleId/2022/                          |
| ROC 2021 Overview (Adsan Law)           | https://adsanlaw.com/wp-content/uploads/adsan-law-article-rules-of-court-2021-1.pdf          |
| Hearsay Rule Reappraisal (NUS Law)      | https://law.nus.edu.sg/sjls/wp-content/uploads/sites/14/2024/07/1319-1990-32-mal-dec-239.pdf |
| Evidence Q&A (Rahmat Lim)               | https://www.rahmatlim.com/openFile.html?url=media/9177/rules-of-evidence...                  |
| Evidence Act Consultation (MinLaw)      | https://www.mlaw.gov.sg/files/linkclickbd8a.pdf                                              |
| FJR 2024 Key Changes (Legal Aid Bureau) | https://lab.mlaw.gov.sg/files/LAB_FJR_2024_Slides.pdf                                        |
| Registrar's Circular 2025 (Affidavits)  | https://www.judiciary.gov.sg/docs/default-source/circulars/2025/...                          |

---

## CasePilot Implementation Notes

### What This Means for Bundle Compiler

1. **Pagination is Sacred**: THE #1 compliance requirement. TOC page # must match PDF position.
2. **Exhibit Continuity**: If same deponent files multiple affidavits, exhibit numbers continue.
3. **Tab Separators**: Digital bundles need both bookmarks AND separator pages.
4. **Volume Management**: Auto-split at ~500 pages or file size limits, maintain continuous pagination.
5. **90% Rule**: Minor formatting errors tolerable; pagination errors are substantive failures.

### Validation Priorities

| Priority | Check                               | ePD Reference |
| :------- | :---------------------------------- | :------------ |
| P0       | TOC page # matches PDF position     | Para 78       |
| P0       | All pages have pagination stamps    | Para 78       |
| P1       | 35mm margins                        | Para 78       |
| P1       | Times New Roman 12pt, double-spaced | Para 78       |
| P1       | Exhibit numbering is sequential     | Para 80       |
| P2       | Colored dividers (physical only)    | State Courts  |

---

## Version History

| Date       | Update                                                            |
| :--------- | :---------------------------------------------------------------- |
| 2024-12-31 | Initial creation from SG_Law_Practice_Links_Research.md synthesis |
