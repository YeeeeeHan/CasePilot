This are insights from my lawyer friend - what are the changes to be made?

```
Yee Han, [1/1/26 1:11 PM]
ehhh ask you JH is there such a thing as a disputed evidence in the bundle?

Jun Hao DHS, [1/1/26 1:35 PM]
Yes there is

Jun Hao DHS, [1/1/26 1:36 PM]
U usually put those near the end and label it

Yee Han, [1/1/26 1:39 PM]
label with a tag?

Yee Han, [1/1/26 1:40 PM]
or like use a software label with a word at the top of the document

Jun Hao DHS, [1/1/26 1:48 PM]
Just label it in the content page as disputed can alrdy

Yee Han, [1/1/26 1:50 PM]
got it

Yee Han, [1/1/26 1:55 PM]
btw, when you import documents into the bundle, does the metadata matter?

Yee Han, [1/1/26 1:55 PM]
like let's say the client send you "Myemail.pdf"

Yee Han, [1/1/26 1:55 PM]
do you have to rename it to more structured format like "yeehan_email_2025.pdf"

Jun Hao DHS, [1/1/26 2:00 PM]
As long as it shows up in the final pdf it doesnt matter
```

Based on your lawyer friend's insights, here are the validated changes for the UI. The feedback confirms two critical things: **"Disputed" status is mandatory**, but **perfect file renaming is unnecessary work.**

### 1. Change: "Description" is King (Decouple from Filename)

The lawyer confirmed: _"As long as it shows up in the final pdf it doesnt matter"._

- **The Insight:** Lawyers don't care if the source file is named `scan_001.pdf`. They only care that the **Table of Contents (TOC)** says "Email from Client dated 12 Jan".
- **The UI Fix:**
- **Stop forcing file renaming.** In your Inspector or Index, separate **"Source File"** (read-only) from **"Description"** (editable).
- **Auto-Fill, Don't Overwrite:** When `Myemail.pdf` is imported, auto-fill the _Description_ field with "Myemail", but let the user change the _Description_ to "Plaintiff's Email" without touching the original filename.
- **Why:** This kills the need for a "Triage" stage dedicated to file management. The "Triage" becomes purely about **drafting the TOC entry**.

### 2. Change: "Disputed" is just a TOC Label

The lawyer confirmed: _"Just label it in the content page as disputed can alrdy"._

- **The Insight:** You don't need complex watermarking or metadata tags on the file itself. It is purely a formatting requirement for the final Index.
- **The UI Fix:**
- **Keep the Status Column:** Your "Agreed/Disputed" column in the Master Index is correct and necessary.
- **Functionality:** Selecting "Disputed" should simply append the text `(Disputed)` or `(Non-Agreed)` to the Description in the final generated PDF Index.
- **Sorting Helper:** Since the lawyer mentioned, _"usually put those near the end"_, add a **"Sort: Move Disputed to Bottom"** button in the column header menu to automate this manual task.

### 3. Change: Replace "Staging Area" with "Right-Rail Inspector"

Your previous instinct to remove the "Staging Area" is now doubly validated. Since the user doesn't need to "clean up" filenames before bundling, a dedicated visual zone for "Unprocessed" files is wasted space.

- **The New Workflow:**

1. **Unified List:** Drop files directly into the Case. They appear in the sidebar or a "Drafts" folder.
2. **Inspector Action:** Click a file → The **Right-Rail Inspector** opens.
3. **The Edit:** In the Inspector, you don't rename the file. You just type the **"Bundle Description"** (e.g., "Contract") and toggle **"Status: Disputed"**.
4. **The Move:** Drag it into the Bundle sequence.

### Summary of Revisions

| Feature          | Old Logic (Assumption)                           | New Logic (Validated by Lawyer)                               |
| ---------------- | ------------------------------------------------ | ------------------------------------------------------------- |
| **Filename**     | User must rename `scan1.pdf` to be professional. | User ignores filename; edits **TOC Description** only.        |
| **Staging Zone** | Required to "fix" files before bundling.         | **Delete it.** Use Inspector to edit Descriptions on the fly. |
| **Disputed**     | Complex tag?                                     | **Simple Toggle.** Just appends text to the TOC line.         |
| **Sorting**      | Manual drag-and-drop.                            | **Auto-Sort.** "Move Disputed to End" button.                 |
