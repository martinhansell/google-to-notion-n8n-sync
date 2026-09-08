# Master Architecture Decision Extract

Status labels:

* **Final** — agreed operating architecture.
* **Implemented** — already present in Google Sheets, Apps Script, or Notion.
* **Deferred** — intentionally moved to the 2026 Close Schedule.
* **Superseded/Rejected** — discussed or temporarily adopted, but no longer part of the final architecture.
* **Unresolved** — known issue requiring later attention.

## 1. Core system boundaries

* **Final:** The system maintains two different kinds of historical evidence:

  * A human-readable copy of completed roster tabs.
  * Structured records of Sessions and Assignments used by the Google–Notion synchronization system.

* **Final:** These are stored separately:

  * `Bible Facilitation Roster ARCHIVE` — human-facing historical rosters.
  * `Bible Facilitation DATA ARCHIVE` — structured technical records and annual-close evidence.

* **Final:** The live operational workbook remains the `Bible Facilitation Roster`.

* **Final:** A `SAFE Copy` is used for testing annual-close behaviour before anything is attempted against the live workbook or genuine archives.

* **Final:** Archived roster material must be:

  * Copied before anything is removed.
  * Converted to hard values.
  * Free of formulas.
  * Free of cell errors.
  * Matched against its source.
  * Protected from accidental change after validation.

* **Final:** Structured IDs must never be reset or reused when a year is closed.

* **Final:** Closed-year records must be excluded from routine current-year processing without destroying the historical record.

---

## 2. Authoritative Google assets

* **Implemented:** Live workbook ownership:

  * Workbook: `Bible Facilitation Roster`
  * Owner: Mike Wu
  * Owner account: `m.wu1986@gmail.com`
  * Martin Hansell has shared access through `martin.hansell@gmail.com`.

* **Implemented:** SAFE Copy:

  * Name: `SAFE Copy of Bible Facilitation Roster@20260903`
  * Spreadsheet ID: `1bXkN49Z9rTkfXaHrZ5PaIB2uqRG9qfk4Qhc3JyORrKA`

* **Implemented:** Human-facing archive:

  * Name: `Bible Facilitation Roster ARCHIVE`
  * Spreadsheet ID: `12slmDBZnZ3JjVUIfSvNTxwlNxoJdiqOTVT7xq29xdv4`

* **Implemented:** Technical archive:

  * Name: `Bible Facilitation DATA ARCHIVE`
  * Spreadsheet ID: `1K2MGsgUq88QdgBHyCe63DWW54rMOFdwNvwgV2AUPbJw`

* **Final:** There will be no separate Annual Close Controller workbook.

* **Final:** Archive workbooks are durable system assets; they are not recreated every year.

* **Final:** Completed annual tabs should be moved or copied into the existing Roster Archive.

* **Final:** The broad archive preference is to continue adding years to the current archive and begin another archive workbook only after roughly ten years, rather than creating one workbook per year.

---

## 3. Workbook and tab vocabulary

* **Final naming vocabulary:**

  * `Roster` — the live human operational schedule.
  * `Roster Archive` — hard-value historical copies of roster tabs.
  * `DATA ARCHIVE` — structured Session and Assignment snapshots plus close evidence.
  * `SAFE Copy` — isolated rehearsal and testing workbook.
  * `Preview` — read-only assessment of what an operation would do.
  * `Annual Close` — the complete year-end archival procedure.
  * `Soft Close` — correction-only period after ordinary operations finish.
  * `Hard Freeze` — validated historical state after which archived material is treated as fixed.
  * `Freeze Report` — compact PASS/FAIL evidence that the archive was checked.
  * `Correction Window` — defined period in which factual corrections remain permissible.
  * `Recommissioning` — removal or exclusion of old operational material after archives have proved reliable.

* **Implemented SAFE Copy tabs relevant to this work:**

  * `Front Page`
  * `Sem1_2027`
  * `Sem2_2027`
  * `Sem2_2026`
  * `Sem1_2026`
  * `Location Planning`
  * `FacilitatorLists`
  * `FacMaster`
  * `FacIntake`
  * `Sessions — Sync`
  * `Assignments — Sync`
  * `SysAdmin`
  * `Easter_Retreat_2026`
  * `SG Min Team`

* **Implemented Roster Archive tabs relevant to 2026:**

  * `Sem1_2026`
  * `Easter_Retreat_2026`
  * Hidden safety copy: `Sem1_2026_PRE_REBUILD_20260906`

* **Final:** `Sem2_2026` must not be placed in the genuine archive until the semester and subsequent correction process have concluded.

---

## 4. Roster structure and future capacity

* **Final:** The 2027 semester tabs include capacity for:

  * Up to 10 facilitator roles.
  * Up to 15 events.

* **Final:** Placeholder rows and columns may be prepared in advance to support growth.

* **Final:** Planning areas are distinct from the primary roster.

* **Final:** Singapore planning may be shown separately while still remaining visible from the broader planning system.

* **Final:** The same pattern may later support Kuala Lumpur and Hong Kong.

* **Final:** Planning data must have a clear path for promotion into the primary roster; planning areas must not become disconnected shadow schedules.

* **Final:** The facilitator source remains consolidated rather than divided into separate location-specific people lists, allowing one facilitator to be available for multiple locations.

---

## 5. Session, Assignment, and facilitator identity

* **Final:** The structured sync architecture distinguishes:

  * Sessions — the event/session record.
  * Assignments — a facilitator’s role in a Session.
  * Facilitators — stable people records referenced by Assignments.

* **Implemented 2026 working counts at the time of the annual-close preview:**

  * 65 Sessions.
  * 227 Assignments.
  * 29 referenced Facilitators.

* **Implemented ID ranges at that point:**

  * Sessions: `BR-S-000001` through `BR-S-000065`
  * Assignments: `BR-A-000001` through `BR-A-000227`

* **Final:** IDs are persistent identities, not annual row numbers.

* **Final:** Closing or removing a year from routine operation must never cause the next ID to restart.

* **Final:** Validation must check that:

  * IDs are present where required.
  * IDs are unique.
  * Assignment-to-Session relationships remain valid.
  * Referenced facilitators resolve correctly.
  * Counts agree between source and archive.

---

## 6. Series, Catalogue, and event-classification decisions

* **Final:** The reusable reading-unit database is called the `Catalogue`.

* **Final:** The former `Reading Units – Review` naming was replaced by `Catalogue`.

* **Final:** `Book/Series` is the property used to distinguish biblical books and larger series.

* **Final:** Genesis may be treated as a Series where necessary.

* **Final:** Coaching, induction, and refresher activities may be represented as Catalogue units.

* **Final:** `From` and `To` date properties are not required for reusable Catalogue units.

* **Final:** Internal series order must be preserved.

* **Final:** A short-title property is retained for compact displays.

* **Final:** Acts units were renumbered from 1.

* **Final:** The spurious `Acts 29` unit was removed.

* **Logic shift:** Vision Casting entries were initially treated as non-Bible-Reading activities.

* **Final superseding decision:** Relevant Vision Casting events were ultimately represented through normal structured identities using `BR-S` and `BR-A` records.

* **Final:** `Facilitator Coaching` is a facilitated activity but is excluded from the `Pretty Roster`.

* **Final:** Legacy Notion properties `Event Lead` and `Group Leads` were recognized as historically useful and were not casually removed.

* **Final:** Ruth and Esther are grouped as the series `Ruth & Esther`.

* **Final:** Operational order is Ruth followed by Esther.

* **Final:** The remaining 2026 design comprised:

  * Three Ruth units.
  * Five Esther units.

---

## 7. Easter Retreat 2026 model

* **Final:** `Easter_Retreat_2026` is legitimate Bible Reading material, not an unrelated event to be excluded from the archive.

* **Final:** It is a mini-series with a structure different from a normal semester roster.

* **Final:** There is one session per day across two days.

* **Final:** Facilitators work in pairs.

* **Final:** Each pair contains two facilitators.

* **Final:** Each facilitator serves twice across the retreat.

* **Final role rotation:**

  * Row 2 represents Lead on Day 1.
  * Row 3 represents Lead on Day 2.
  * The pair switches Lead and Support roles between days.

* **Final passages:**

  * Day 1:

    * Luke 22:39–71
    * Luke 23:13–49
  * Day 2:

    * 1 Kings 19:1–18
    * 1 Samuel 1:1–28

* **Final:** Where the same facilitator appears on both days, both appearances must be preserved as separate Lead/Announce or other relevant assignments; these are not accidental duplicates.

---

## 8. Role-button architecture

* **Implemented:** Role-key dropdown cells were replaced with clickable role-button cells.

* **Implemented:** Role-button behaviour applies to:

  * `Sem2_2026`
  * `Sem1_2027`
  * `Sem2_2027`

* **Implemented for `Sem2_2026`:**

  * Role-key rows: 14 and 30.
  * Facilitator-cell range: columns `B:I`.
  * Six existing role keys are used.
  * The behaviour operates across the roster blocks using those key rows and facilitator ranges.

* **Implemented:** The role buttons use selection-change behaviour:

  1. Select the facilitator cell or cells.
  2. Pause briefly.
  3. Click the desired role button.
  4. The selected cells receive the corresponding role colour.

* **Implemented:** Existing names, dates, roles, locations, and publication fields were preserved when the button behaviour was introduced.

* **Implemented:** A live test was performed on an empty facilitator slot and the original state was restored afterward.

* **Implemented:** The button cells were formatted by the user to be visually distinct from ordinary roster cells.

* **Final edge-case instruction:** The user must pause briefly after selecting facilitator cells before clicking a role button because Google Sheets may suppress an extremely rapid selection-change event.

* **Implemented button note opening:**

  > 🔴 IMPORTANT — PAUSE FOR ONE BEAT…

* **Technical constraint:** Google Sheets notes cannot contain bold, colour, or other rich-text formatting.

* **Implemented workaround:** A bold, white-on-Replacement-Red warning banner was placed on the `Front Page`.

* **Implemented:** The detailed plain-text warning remains in the individual button notes.

* **Final:** The user’s distinctive button formatting must not be overwritten by later script or note changes.

---

## 9. Colour and assignment publication logic

* **Final:** Roster colour is operationally meaningful; it is not merely decorative formatting.

* **Final:** Role colour and Assignment data must remain aligned.

* **Final:** Replacement Red means replacement status and must not be interpreted as an ordinary role-colour update.

* **Final:** Adding or recolouring a facilitator in the roster does not by itself prove that the structured Assignment has been published.

* **Final:** The authoritative structured result must be checked in `Assignments — Sync`.

* **Final diagnostic sequence for mismatches:**

  1. Inspect the roster cell’s person and colour.
  2. Resolve the corresponding Session.
  3. Check facilitator identity.
  4. Check role detection.
  5. Check whether an Assignment exists.
  6. Check Assignment state, including `Replaced`.
  7. Run Assignment Preview before publishing.

* **Unresolved diagnosis recorded in this conversation:**

  * `Sem2_2026!C6` showed Chee Yong as `L-Plate Support`.
  * The Assignment register still showed Chee Yong’s earlier Assignment as `Replaced`.
  * Teri remained active as `Facilitate` against `C6`.
  * `Sem2_2026!H6` showed Teri as `L-Plate Support`, with the note “Supports Mike G.”
  * No Assignment was linked to `H6`.
  * `Sem2_2026!E4` showed Wai Kit in Replacement Red.
  * `Assignments — Sync` still described Wai Kit as `L-Plate`.
  * All other populated facilitator cells resolved to Assignments at the time of inspection.
  * No corrective publication was performed during that diagnosis.

* **Final safety rule:** When publication appears wrong, run Assignment Preview first; do not immediately run the publisher.

---

## 10. Archived roster validation

* **Final:** Current archived-copy validation applied only to:

  * `Sem1_2026`
  * `Easter_Retreat_2026`

* **Rejected:** Treating `Sem2_2026` as an archived asset before the semester has concluded.

* **Implemented:** `Easter_Retreat_2026` passed as a complete hard-value archive:

  * Exact source match.
  * No formulas.
  * No cell errors.
  * No known missing columns.

* **Initial finding:** Archived `Sem1_2026!A:R` matched the source exactly and contained no formulas or errors, but the copy lacked later operational columns `S:V`.

* **Implemented repair:** Columns `S:V` were added to archived `Sem1_2026` from the SAFE Copy.

* **Implemented column names:**

  * `S` — `Publish?`
  * `T` — `Session ID`
  * `U` — `Publish State`
  * `V` — `Location`

* **Final:** The added columns were copied as hard values, not formulas.

* **Implemented validation range:** `Sem1_2026!A1:V44`

* **Implemented final validation results:**

  * 679 populated archive cells.
  * 0 source-value mismatches.
  * 0 formulas.
  * 0 cell errors.
  * 0 formatting mismatches across the added `S:V` range.
  * Archive width is now 22 columns, `A:V`.

* **Final:** `Sem1_2026` and `Easter_Retreat_2026` are now valid hard-value archive evidence.

* **Final:** `Sem2_2026` remains operational and unarchived.

---

## 11. Final annual-close lifecycle

* **Final correction window:** 7–31 January following the completed year.

* **Superseded:** The earlier proposed 7–20 January correction window.

* **Final:** During the correction window:

  * Only factual corrections should be made to the closed year.
  * Corrections may address incorrect facilitators, roles, passages, dates, or similar historical facts.
  * Ordinary planning for the old year does not continue.
  * Any affected archive candidate must be rebuilt or revalidated.

* **Final target for genuine hard freeze:** After the correction window, originally framed as 1–7 February.

* **Final observation period:** Preserve the original completed-year material through 30 April as a recovery and confidence buffer.

* **Final:** Hard freeze and operational removal are separate moments:

  * The historical archive may be validated in February.
  * The original source material remains available until the observation period has passed.

* **Final annual sequence:**

  1. Complete the final year-end corrections.
  2. Create a safety copy.
  3. Copy the completed year’s roster tabs into the Roster Archive.
  4. Convert the archived roster copies to hard values.
  5. Copy the year’s Sessions and Assignments into the DATA ARCHIVE.
  6. Validate counts, IDs, relationships, formulas, errors, and source matches.
  7. Produce one compact PASS/FAIL Freeze Report.
  8. Protect the archived material.
  9. Exclude the closed year from routine current-year processing.
  10. Confirm that the new year continues to operate correctly.
  11. Retain the untouched source until 30 April.
  12. Remove or recommission old operational material only after a clean preview.

* **Final safeguards:**

  * Copy before removal.
  * Preserve hard values.
  * Validate both the human and structured archives.
  * Never reset IDs.
  * Never delete the source prematurely.
  * Do not overwrite an existing archive tab.
  * Preview before any consequential action.

---

## 12. Annual-close rehearsal

* **Final:** The full rehearsal was removed from immediate Stage 6 work.

* **Deferred:** It will be incorporated into the future `2026 Close Schedule`.

* **Final timing:** Early January 2027.

* **Final environment:** The rehearsal must run in the SAFE Copy before any live archival or removal action.

* **Final rehearsal scope:**

  * Run Preview.
  * Exercise archive creation against isolated test assets.
  * Validate the resulting archives.
  * Test exclusion of closed-year material from current operation.
  * Confirm that 2027 remains operational.
  * Confirm that no genuine archive or live source is overwritten.

* **Final gate:** Nothing should be removed from the live workbook until the rehearsal passes.

* **Final Stage 6 disposition:** Stage 6 is closed; no further Stage 6 work remains now.

* **Deferred:** The detailed 2026 Close Schedule has not yet been designed.

* **Unresolved timing interaction:** The agreed early-January rehearsal precedes the end of the 7–31 January correction window. It must therefore be treated as a rehearsal using provisional data, not the actual final freeze.

* **Unresolved script interaction:** `archiveAnnualClose()` is hard-blocked before 1 February 2027, while the full rehearsal is intended for early January. The 2026 Close Schedule must resolve how archive creation is rehearsed without weakening the production date lock or rewriting code casually.

---

## 13. `AnnualClose.gs`

* **Implemented:** `AnnualClose.gs` version 2 is installed in the SAFE Copy’s bound Apps Script project.

* **Implemented and tested user-facing functions:**

  * `previewAnnualClose()`
  * `archiveAnnualClose()`
  * `validateAnnualArchive()`

* **Final function responsibilities:**

  * `previewAnnualClose()`:

    * Read-only.
    * Reports the configured year.
    * Reports Session, Assignment, and referenced-Facilitator counts.
    * Identifies already-existing archive tabs.
    * Identifies archive tabs that are still missing.
    * Reports blocking issues.
    * Makes no changes.

  * `archiveAnnualClose()`:

    * Manual only.
    * Requires explicit confirmation.
    * Creates missing archive material.
    * Must not overwrite an existing archive tab.
    * Must archive roster content as hard values.
    * Must not delete or modify source tabs as part of the archive operation.

  * `validateAnnualArchive()`:

    * Validates the roster and structured archives.
    * Checks counts, IDs, relationships, formulas, errors, and source matching.
    * Produces the compact annual close result.

* **Implemented preview result:**

  ```json
  {
    "ready": true,
    "year": 2026,
    "sessions": 65,
    "assignments": 227,
    "facilitators": 29,
    "existingRosterTabs": [
      "Sem1_2026",
      "Easter_Retreat_2026"
    ],
    "missingRosterTabs": [
      "Sem2_2026"
    ],
    "issues": []
  }
  ```

* **Implemented:** The Preview showed `READY — preview made no changes`.

* **Implemented:** Version 2 contains a hard date lock.

* **Final date-lock rule:**

  * `archiveAnnualClose()` cannot run before 1 February 2027.
  * Time zone: Hong Kong time.
  * There is no bypass switch.
  * Attempting to run it early stops with:

    > Safety stop: this is a preview-only period.

* **Final:** Only Preview has been used for the current live-year test.

* **Explicitly not performed:** No real `archiveAnnualClose()` run has occurred.

* **Final:** The year and relevant tab names should be configuration values so that future annual use requires changing the year and tab configuration, not rewriting the entire module.

* **Final:** The module remains small and reusable; it must not evolve into a separate administrative application.

---

## 14. Closed-year handling in Notion

* **Implemented properties added to both `Journey Event Instances` and `Facilitation Assignments`:**

  * `Freeze State`
  * `Freeze ID`
  * `Frozen At`

* **Initially defined states:**

  * `Open`
  * `Soft Close`
  * `Hard Frozen`

* **Implemented safety check:** No existing 2026 records were accidentally marked closed when these properties were created.

* **Implemented counts checked at that point:**

  * 136 Event Instances.
  * 233 Assignments.
  * All remained open.

* **Final functional requirement:** Closed-year records must be excluded from routine synchronization and current operational views while remaining available for historical reconciliation.

* **Logic shift:** The three-state per-record model was initially accepted as a simple control model.

* **Later simplification:** A formal state machine was rejected as unnecessary complexity.

* **Current physical state:** The three Notion properties exist even though the larger state-machine concept was removed from the operating plan.

* **Unresolved architecture point:** The Master Architecture must eventually specify whether those properties remain the lightweight mechanism for excluding closed years or are merely unused legacy fields. They were not deleted in this conversation.

---

## 15. Freeze Report and DATA ARCHIVE structure

* **Implemented:** A permanent `Bible Facilitation DATA ARCHIVE` workbook was created.

* **Implemented tabs:**

  * `Freeze Report 2026`
  * `Freeze Runs`
  * `Freeze Checks`
  * `Freeze Sign-offs`
  * `Freeze Manifest`
  * `Freeze Exceptions`
  * `Corrections`
  * Year-specific Session snapshot schema
  * Year-specific Assignment snapshot schema
  * Year-specific Facilitator snapshot schema

* **Implemented provisional report status:**

  * Prominently labelled `PROVISIONAL — NOT FROZEN`.
  * No fabricated validation digest.
  * No fabricated human approvals.
  * Year-specific snapshot tabs remained empty pending a genuine close.

* **Implemented provisional evidence:**

  * 65 Sessions.
  * 227 Assignments.
  * 29 referenced Facilitators.
  * Seven checks passing.
  * One check pending.
  * One check failing.
  * Two checks not yet run.
  * Four blocking exceptions.

* **Logic shift:** The first report was designed as a detailed technical operating contract with multiple registers.

* **Final simplified purpose:** The annual Freeze Report is only needed once a year to confirm that the archive is complete, error-free, and checked before freezing the year.

* **Final report shape:** Compact PASS/FAIL report.

* **Final minimum content:**

  * Year.
  * Source and target identities.
  * Counts.
  * ID ranges.
  * Validation checks.
  * Exceptions.
  * Timestamp.
  * Who checked it.
  * Overall PASS or FAIL.

* **Final:** The user does not need to work through the provisional 2026 report now.

* **Superseded:** Treating the existing wall of register tabs as an annual operational burden.

* **Current physical-state caveat:** The detailed workbook tabs still exist; their existence does not make each register part of the final required annual process.

---

## 16. Governance logic and its simplification

* **Temporarily approved model:**

  * Operational approver: Mike Wu.
  * Operational alternate: Martin Hansell.
  * Technical approver: Martin Hansell.
  * Controller operator: Martin Hansell.
  * Controller asset owner: Mike Wu.
  * Martin could perform both approvals if necessary, recorded as a combined-role exception.

* **Temporarily approved account distinction:**

  * Mike: `m.wu1986@gmail.com`
  * Martin: `martin.hansell@gmail.com`

* **Temporarily proposed sign-off design:**

  * Append-only Freeze Runs register.
  * Operational sign-off.
  * Technical sign-off.
  * Matching validation digest.
  * Automatic invalidation of approvals when the archive changed.
  * Protected configuration table for operators and approvers.
  * Effective dates, changed-by, changed-at, and reason fields.
  * Failure when Google could not reliably identify the active user.

* **Final superseding decision:** This governance design was disproportionate and was removed.

* **Rejected:**

  * Formal multi-role authorization machinery.
  * Cryptographic validation digests.
  * Separate operational and technical sign-off commands.
  * Append-only approval registers as mandatory infrastructure.
  * Protected authority-configuration tables.
  * A controller-operator transfer system.
  * A special Mike-owned controller asset.
  * Requiring the annual close to behave like a regulated financial-control system.

* **Final lightweight human control:** The compact Freeze Report may record who checked the close and when, but it does not require enterprise-style approval infrastructure.

---

## 17. Controller concept

* **Initially proposed:** A standalone Annual Close Controller workbook containing:

  * Configuration.
  * Command menu.
  * Audit log.
  * Apps Script.
  * Sign-off controls.
  * Preview, build, validate, and freeze commands.

* **Initially proposed development model:**

  * Martin-owned development Controller.
  * SAFE Copy as the source.
  * Destructive functions disabled.
  * Later transfer or recreation under Mike’s account.

* **Practical ownership conclusion:** Mike cannot own a file created through Martin’s authenticated account unless ownership is transferred or Mike creates/copies it while authenticated.

* **Final:** A separate development Controller workbook is not required.

* **Final:** No Google Controller workbook was created.

* **Final:** No Controller Apps Script was installed.

* **Rejected:**

  * Standalone Controller workbook.
  * Development-versus-production Controller architecture.
  * Controller-specific ownership transfer.
  * Separate Controller command interface.
  * Complex audit and authorization infrastructure.
  * Rebuilding a Controller environment every year.

* **Final replacement:** A small reusable `AnnualClose.gs` module attached to the SAFE Copy for rehearsal and eventually used through a controlled annual procedure.

---

## 18. Script access and change-control decisions

* **Technical access distinction:**

  * The Google connector can inspect and edit Sheets.
  * It cannot expose or directly edit bound Apps Script source.
  * An authenticated browser can open the Apps Script editor.

* **Process failure acknowledged:** Apps Script was previously changed through the browser without clearly explaining the access-route change or preserving the user’s intended learning opportunity.

* **Final change-control rule:** Do not amend code without first discussing the exact change with the user.

* **Final:** If a rewrite appears necessary:

  * Explain why.
  * Identify the affected functions or sections.
  * Obtain agreement.
  * Modify only those sections in a controlled manner.

* **Final preferred installation workflow:**

  1. Prepare paste-ready code.
  2. User opens Apps Script in their own signed-in browser.
  3. User pastes or replaces the agreed file.
  4. Code is reviewed together.
  5. Only the agreed safe function is run.

* **Rejected operational route:** Signing the assistant into Google through a separate cloud browser merely to paste Apps Script.

* **Reason:** It creates unnecessary new-device authentication and two-step-verification friction.

* **Final:** Script changes should double as learning steps rather than being invisible implementation work.

---

## 19. Script documentation requirement

* **Final:** Stage 10 includes a dedicated `Scripts Explained` documentation requirement.

* **Final documentation coverage:**

  * Functions.
  * Purpose of each function.
  * End-to-end execution flow.
  * Data read locations.
  * Data write locations.
  * Identity and ID management.
  * Triggers.
  * Configuration values.
  * Dependencies.
  * Protections and safety stops.
  * Deployment.
  * Versioning.
  * How changes are made safely.
  * How operators or ownership change where relevant.

* **Final:** Documentation design will be developed later rather than improvised during active implementation.

---

## 20. Working-method decisions

* **Final:** Large documents should not be repeatedly reread unless necessary.

* **Final:** The full Google/Notion Sync Planning document should not be reopened merely to navigate the next small task.

* **Final:** If rereading the full history or planning document becomes genuinely necessary, approval must be sought first.

* **Final:** Work should proceed one bounded item at a time.

* **Final:** Status must be maintained accurately so completed steps are not repeatedly presented as pending.

* **Final:** Roadmap edits must update the actual parent Stage 6 checklist, not merely a child procedure page.

* **Final:** Ordinary Chat should be used for:

  * Discussion.
  * Decisions.
  * Explanations.
  * Roadmap navigation that does not require connector writes.

* **Final:** Work mode should be used deliberately when an action genuinely requires:

  * Editing Notion.
  * Editing Google Sheets.
  * Creating or modifying files.
  * Running connected tools.

* **Reason for this shift:** Repeated connector reads, large-document processing, redundant checks, and long rewrites consumed excessive processing allowance without proportionate benefit.

* **Final:** Future conversations should begin with a focused scope rather than carrying one indefinitely expanding implementation thread.

---

## 21. Explicitly rejected or superseded items

* Archiving `Sem2_2026` before the year is complete.
* Running `archiveAnnualClose()` merely because Preview passed.
* Allowing the archive function to run before 1 February 2027.
* A bypass for the date lock.
* Overwriting an existing archive tab.
* Keeping formulas in archival evidence.
* Removing live-year source material immediately after archive creation.
* Treating a hard freeze as equivalent to immediate source deletion.
* A three-month delay before creating the actual hard archive.
* The 7–20 January correction window.
* Three separate SAFE Copy rehearsals.
* A standalone Annual Close Controller workbook.
* A separate development Controller.
* A Mike-owned special administrative Controller asset.
* Cryptographic digests.
* A six-stage state machine.
* Formal command-based sign-offs.
* Multiple approval and audit registers as required workflow.
* Protected operator/approver configuration machinery.
* Enterprise-style separation of operational approver, technical approver, and controller operator as mandatory gates.
* Recreating a technical administration system every year.
* Editing Apps Script invisibly through the authenticated browser.
* Requiring the assistant to sign into Google solely to paste code.
* Rewriting whole scripts when a focused section change would suffice.
* Repeatedly rereading the full Notion planning document.
* Treating Google Sheets note text as capable of bold or coloured formatting.
* Assuming that a changed roster colour automatically creates or updates the structured Assignment.
* Treating Replacement Red as an ordinary role colour.
* Removing closed-year material before Preview and validation demonstrate that the new year still operates cleanly.

---

## 22. Final Stage 6 status

* **Final:** Stage 6 is closed.

* **Completed within Stage 6:**

  * Archive architecture established.
  * Roster Archive and DATA ARCHIVE established.
  * Existing `Sem1_2026` and `Easter_Retreat_2026` archive copies validated.
  * `Sem1_2026` extended through column `V`.
  * `AnnualClose.gs` version 2 installed in the SAFE Copy.
  * Read-only Preview tested successfully.
  * Early archive execution blocked until 1 February 2027.
  * Annual-close process simplified.
  * Over-engineered Controller and governance designs rejected.
  * Full rehearsal moved into the future 2026 Close Schedule.

* **Nothing presently due:** No further archive, script, validation, rehearsal, or removal action should occur now.

* **Next future planning object:** `2026 Close Schedule`.

* **Items that schedule must reconcile:**

  * Early-January rehearsal.
  * 7–31 January correction window.
  * 1 February production archive lock.
  * Final archive validation.
  * Compact Freeze Report.
  * Closed-year exclusion.
  * 2027 operational-continuity test.
  * Retention of original material through 30 April.
  * Safe eventual recommissioning.
  * The current conflict between the early-January rehearsal and the script’s 1 February archive lock.
