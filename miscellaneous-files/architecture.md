# Google ↔ Notion Facilitation Sync — Master Architecture

> **Document status:** Authoritative architectural handover  
> **Baseline date:** 8 September 2026  
> **Scope:** Bible Reading facilitation planning, publication, structured Google records, Notion records, future cross-platform synchronization, annual close, archives, and growth-location planning  
> **Current delivery state:** Native Google and Notion structures are substantially established; 2026 structured alignment is complete; cross-platform n8n automation has not yet begun; Stage 6 is closed and the full annual-close rehearsal is deferred to the 2026 Close Schedule.

---

## 1. Document Authority and Decision Precedence

This document consolidates the current Notion planning page, its linked operating and stage pages, and the two supplied conversation records into one architecture.

Where sources conflict, the following precedence applies:

1. A later explicit decision supersedes an earlier proposal or interim implementation.
2. A verified implemented state supersedes an earlier plan.
3. A final simplification supersedes an earlier, more elaborate design.
4. Unresolved matters remain explicitly unresolved; they are not converted into architectural decisions by inference.
5. Physical artefacts left behind by a superseded design do not make that design authoritative.

The following later decisions therefore govern this handover:

- The aligned 2026 baseline is 65 Sessions and 227 Assignments, not the earlier 60/191 or 63/205 intermediate states.
- The 2026 Google-to-Notion Assignment migration is complete through `BR-A-000227`.
- The legacy Notion properties `Event Lead` and `Group Leads` are retired after migration; their earlier temporary retention was a migration safeguard, not the final model.
- `Sem1_2026` has been repaired and validated through column `V`; the earlier description of it as an incomplete interim archive is superseded.
- Stage 6 is closed. Its full rehearsal is intentionally deferred to the future 2026 Close Schedule.
- The standalone Annual Close Controller and enterprise-style governance system were rejected.
- The final annual-close implementation is a small reusable `AnnualClose.gs` module, two durable archives, and one compact Freeze Report.

---

## 2. Purpose and Architectural Outcome

The system manages the full operational chain from facilitator intake and human roster planning to structured Session and Assignment records that can be synchronized with Notion.

Its central design outcome is:

> The Pretty Roster remains flexible, visual, and human-operated, while `BR-F`, `BR-S`, and `BR-A` provide stable semantic identity underneath it.

The architecture is initially centred on the Bible Reading programme but distinguishes the wider domain of facilitation from the narrower Bible Reading operational stream.

The system must:

- Preserve the Senior Pastor’s practical, visual roster workflow.
- Create stable, platform-neutral identities for people, Sessions, and Assignments.
- Keep Google capable of operating without Notion or n8n.
- Keep Notion capable of representing its own broader facilitated-event domain.
- Synchronize shared operational facts without forcing feature symmetry between platforms.
- Preserve historical evidence without reconstructing low-value history for completeness alone.
- Support safe annual close, archiving, recommissioning, succession, and future location growth.

---

## 3. Governing Architectural Principles

### 3.1 Native-first and platform-independent

- Use Google-native capabilities for Google-side operation where practical.
- Use Notion-native capabilities for Notion-side operation where practical.
- Use n8n only for cross-platform transport, orchestration, or a genuine native capability gap.
- Do not make n8n the only place where business meaning or operational rules exist.
- Google must remain operational if Notion is disconnected, n8n fails, or synchronization is deliberately disabled.
- Google and Notion do not require identical functionality; they require an unambiguous shared representation of common operational facts.

### 3.2 Stable semantic identity

- Cross-platform identity must use `BR-F`, `BR-S`, and `BR-A`, never titles, row numbers, display names, cell addresses, or platform-native IDs.
- IDs are opaque, immutable, sequential, and allowed to contain chronological gaps.
- Retrospective records may receive later numbers than newer-dated records.
- Numeric neatness never justifies renumbering or reverse authority.

### 3.3 Flexible human surface, controlled publication

- The Pretty Roster is a human planning and operating surface, not the structured database itself.
- Free planning and operational publication are distinct states.
- Operators may move, swap, correct, and reorganize people within a Session where semantic intent remains unambiguous.
- Restrictions are introduced only where ambiguity could create incorrect structured history.
- The system automates certainty and stops at ambiguity.

### 3.4 Preview-first and idempotent

- Every consequential write path is preceded by a read-only Preview.
- Preview reports intended creates, updates, replacements, removals, no-changes, and problems as applicable.
- A successful publish followed by an unchanged Preview must produce a clean no-op.
- No annual archive, publication, migration, or removal is considered trustworthy without repeat-safe behaviour and explicit validation.

### 3.5 Minimum necessary data

- The facilitation system stores only the personal/contact data required for operation.
- Upstream church data must not be copied wholesale merely because it is available.
- Contact data may later be separated into a more restricted asset only if security or succession requirements justify it.

### 3.6 History without overengineering

- Historical identities and relationships are retained rather than deleted.
- Pre-2026 Assignment history is not reconstructed merely for completeness.
- The practical structured Assignment cutover year is 2026.
- Historical Programme Items, Series, Sessions, and Event Instances may be retained even when detailed earlier Assignments are not.

---

## 4. System Boundary and End-to-End Flow

### 4.1 Facilitator flow

`Church Master → FacIntake → FacMaster → FacilitatorLists → Pretty Roster`

### 4.2 Session flow

`Pretty Roster planning row → Session Preview → Session Publish → Sessions — Sync → Notion Journey Event Instance`

### 4.3 Assignment flow

`Pretty Roster person + role colour → Assignment Preview → Assignment Publish → Assignments — Sync → Notion Facilitation Assignment`

### 4.4 Synchronization boundary

Future synchronization will move only structured shared facts between:

- Google `Sessions — Sync` and Notion Journey Event Instances.
- Google `Assignments — Sync` and Notion Facilitation Assignments.
- Google `FacMaster` and the corresponding operational facilitator fields in Notion Team Members.

The automation must not scrape arbitrary visual layout when a structured Google handover layer exists.

---

## 5. Conceptual Data Model

### 5.1 Core entities

| Entity | Meaning | Portable identity |
| --- | --- | --- |
| Facilitator | A persistent person record available to the facilitation domain | `BR-F-000001` |
| Programme Item / Catalogue Unit | Reusable reading, series unit, coaching unit, induction, refresher, or other reusable content | Not part of the BR-F/S/A identity family |
| Session | One occurrence in the Bible Reading facilitation operational stream | `BR-S-000001` |
| Assignment | One facilitator serving in one explicit role for one Session | `BR-A-000001` |

### 5.2 Core relationship

`Programme / Item → Session occurrence → Facilitation Assignment`

- A reusable Item exists independently of a particular event date.
- A Session is one real-world occurrence.
- An Assignment joins one Facilitator to one Session in one explicit Role.
- Facilitator capability belongs on the Facilitator record.
- The Role actually performed belongs on the Assignment.

### 5.3 Domain boundary

- Every Bible Reading `BR-A` is a Notion Facilitation Assignment.
- Not every Notion Facilitation Assignment belongs to the Bible Reading roster stream.
- A Notion Event Instance may exist without `BR-S`.
- Facilitator Coaching is the canonical facilitated-but-outside-roster example.
- Vision Casting is the canonical non-reading-but-inside-roster-stream example.

---

## 6. Authority and Source-of-Truth Map

| Fact or activity | Authoritative surface | Notes |
| --- | --- | --- |
| Free human planning | Pretty Roster | Becomes operational only at explicit publication |
| Facilitator intake candidates | `FacIntake` | Append-only intake surface |
| Operational facilitator record | `FacMaster` | Google authority for `BR-F` allocation |
| Location-specific facilitator dropdowns | `FacilitatorLists` | Derived helper only; never manually maintained as a second master |
| Session external identity | Google allocator / `Sessions — Sync` | Stored in Notion as `Session External ID` |
| Assignment external identity | Google allocator / `Assignments — Sync` | Stored in Notion as `Assignment External ID` |
| Per-session facilitator Role | Structured Assignment | Roster cell colour is the human input signal |
| Notion-native relations and platform IDs | Notion | Internal only; not cross-platform identity |
| Human historical roster presentation | Roster Archive | Hard-value archive copies |
| Structured closed-year history | DATA ARCHIVE | Session, Assignment, and referenced Facilitator snapshots |

Google must not accept reverse Notion authority merely to keep external ID sequences visually aligned.

---

## 7. External Identity Architecture

### 7.1 Namespaces

| Namespace | Entity | Example |
| --- | --- | --- |
| `BR-F` | Facilitator | `BR-F-000032` |
| `BR-S` | Session | `BR-S-000065` |
| `BR-A` | Assignment | `BR-A-000227` |

### 7.2 Allocation rules

- Google is the allocator for all three namespaces.
- Each entity type has its own next-number counter in the shared Google-side allocator/registry.
- Counters are stored outside the Pretty Roster, in the protected system layer.
- IDs are issued only through controlled promotion, publication, or approved backfill.
- IDs are never reset at semester change, annual close, archive, or recommissioning.
- Gaps are allowed.
- Once allocated, an ID remains attached to the same semantic entity.
- Platform-native IDs remain internal and may coexist with the external IDs.

### 7.3 Semantic identity boundaries

- A Session retains its `BR-S` through corrections to date, Item, or status when it remains the same real-world occurrence.
- An Assignment may retain its `BR-A` through an unambiguous within-Session cell move, swap, or Role correction.
- An Assignment cannot retain its `BR-A` when moved to a different Session.
- A genuine replacement receives a new `BR-A`; the original remains in history.
- `Source Sheet` and `Source Cell` are provenance, not identity.

---

## 8. Google Workbook Architecture

### 8.1 Environments and durable assets

| Asset | Purpose | Current identity |
| --- | --- | --- |
| `Bible Facilitation Roster` | Live operational workbook | Owned by Mike Wu; Martin Hansell has shared access |
| `SAFE Copy of Bible Facilitation Roster@20260903` | Controlled development, rehearsal, and acceptance environment | Spreadsheet ID `1bXkN49Z9rTkfXaHrZ5PaIB2uqRG9qfk4Qhc3JyORrKA` |
| `Bible Facilitation Roster ARCHIVE` | Human-readable completed roster history | Spreadsheet ID `12slmDBZnZ3JjVUIfSvNTxwlNxoJdiqOTVT7xq29xdv4` |
| `Bible Facilitation DATA ARCHIVE` | Structured closed-year data and Freeze Report evidence | Spreadsheet ID `1K2MGsgUq88QdgBHyCe63DWW54rMOFdwNvwgV2AUPbJw` |

The two archive workbooks are durable assets. They are extended annually rather than recreated each year. A successor Roster Archive should be started only after roughly ten years or when size/performance warrants it.

### 8.2 Current SAFE Copy tabs

- `Front Page`
- `Sem1_2027`
- `Sem2_2027`
- `Sem2_2026`
- `Sem1_2026`
- `Location Planning`
- `FacilitatorLists`
- `FacMaster`
- `FacIntake`
- `Sessions — Sync`
- `Assignments — Sync`
- `SysAdmin`
- `Easter_Retreat_2026`
- `SG Min Team`

### 8.3 Surface responsibilities

| Surface | Responsibility |
| --- | --- |
| `Front Page` | Concise human operating guide, system flow, sheet responsibilities, role colours, safety rules, and source-of-truth boundaries |
| Semester tabs | Pretty Roster planning and operation |
| `Location Planning` | Non-operational proposal intake for locations |
| `FacIntake` | Append-only upstream facilitator intake |
| `FacMaster` | Canonical Google operational facilitator master |
| `FacilitatorLists` | Derived location/stream dropdown lists |
| `Sessions — Sync` | Structured Session register |
| `Assignments — Sync` | Structured Assignment register |
| `SysAdmin` | Allocator state, checkpoints, run metadata, and protected technical configuration |
| `Easter_Retreat_2026` | Special-event operational surface with a legitimate non-semester layout |

### 8.4 Retired Google structures

- `SOURCE` is retired.
- `FacIntake` now operates independently of the temporary migration bridge.
- `Facilitators_Available` no longer acts as an ambiguous helper/master.
- Facilitator facts must not be maintained manually in `FacilitatorLists`.

---

## 9. Facilitator Intake and Master Data

### 9.1 Intake pipeline

- Church Master remains the upstream people source.
- `FacIntake` is separate from the operational master.
- Intake is append-only and baseline-safe.
- Historical seeded intake is the accepted baseline.
- Only rows after the established checkpoint are considered new.
- Phone remains copyable contact data but is not a duplicate-suppression key because historical phone alignment was unreliable.
- Intake uses deterministic matching and one-person/one-ID rules.
- `SysAdmin` records the live checkpoint and run/audit state.

### 9.2 Operational master schema

`FacMaster` contains:

- `Facilitator External ID`
- `First Name`
- `Last Name`
- `Display Name`
- `Active?`
- `Sites`
- `Facilitation Roles`
- `Email`
- `Contact Number`
- `Live Date`
- `Review Notes`
- `Match Key`
- `Facilitator Status`
- `Available From`
- `Available Until`

### 9.3 Field semantics

- `Display Name` is the human-facing roster value.
- `Match Key` supports deterministic identity matching and absorbs display-name variation.
- `Sites` determines stream/location availability.
- `Facilitation Roles` is a multi-select capability set, not a hierarchical maximum role.
- `Live Date` is operational participation, distinct from intake/signup timestamp.
- Availability windows may constrain roster eligibility without deleting the Facilitator.

### 9.4 Lifecycle vocabulary

- `Prospective`
- `Invited`
- `Developing`
- `Active`
- `Paused`
- `Stepped Down`
- `Left`
- `Retired`

Roster eligibility is derived from lifecycle and active state. Historical Facilitators remain resolvable by `BR-F` while being absent from current dropdowns.

### 9.5 Current identity baseline

- Current and historical Facilitators are allocated through `BR-F-000032`.
- The next Facilitator number in `SysAdmin` is 33.
- Historical records retained for Assignment resolution include John Yang, Alvin Tan, Sean Beh, Abhra Bhattacharjee, and Ken Ng.
- Chyi Tan is retained as an active occasional stand-in.

---

## 10. Pretty Roster Contract

### 10.1 Human operating model

- The Pretty Roster remains the primary planning and roster-operation interface.
- Facilitator slots are neutral. `Facilitator 1`, `Facilitator 2`, and later slots do not determine Role.
- Role is represented visually by the facilitator cell’s approved colour and structurally by the published Assignment.
- Visual organisation may remain flexible if structured publication is reliable.
- Human judgement remains authoritative in genuinely ambiguous cases.

### 10.2 Item vocabulary

- The human-facing roster header is `Item`.
- `Item` intentionally covers both reading units and genuine operational-stream items such as Vision Casting.
- Notion may retain the more formal term `Programme Item`.
- Google and Notion labels need not be identical when semantics remain unambiguous.
- Structured sync-table headers must not be renamed casually; script dependencies must be checked first.

### 10.3 Completion presentation

- Completed Sessions grey the Date cell only.
- Facilitator role colours remain visible as historical role evidence.
- Whole-row greying that destroys role evidence is prohibited.

### 10.4 Layout support

- `Sem1_2026` uses the older four-slot layout.
- `Sem2_2026` uses eight neutral facilitator slots.
- The accepted Assignment publisher supports both layouts.
- The 2027 tabs use the latest 23-column format and eight visible facilitator slots, `B:I`.

---

## 11. Role and Colour Architecture

### 11.1 Canonical Role vocabulary

- `Lead / Announce`
- `Newcomer Support`
- `Facilitate`
- `L-Plate`
- `L-Plate Support`

`Replacement` is not a Role. It is an Assignment Type and temporary workflow condition.

### 11.2 Colour contract

| Role or cue | Hex | Meaning |
| --- | --- | --- |
| Lead / Announce | `#FFD966` | Actual Role |
| Newcomer Support | `#A4C2F4` | Actual Role |
| Facilitate | `#B6D7A8` | Actual Role |
| L-Plate | `#F6B26B` | Actual Role |
| L-Plate Support | `#D5A6BD` | Actual Role; support is a separate Assignment |
| Replacement cue | `#E06666` | Temporary workflow signal only; not a Role |

After successful replacement publication, the red cue is replaced by the canonical colour of the Role actually assigned.

### 11.3 Role buttons

- Role-key dropdown cells have been replaced by clickable role-button cells on `Sem2_2026`, `Sem1_2027`, and `Sem2_2027`.
- On `Sem2_2026`, button rows are 14 and 30 and facilitator cells are `B:I`.
- The operator selects one or more facilitator cells, pauses briefly, and clicks a Role button.
- The button applies the corresponding approved colour.
- The user’s distinctive button formatting is part of the UI contract and must not be overwritten.
- Google Sheets notes cannot provide rich-text warnings; detailed plain-text notes remain on buttons and the prominent formatted warning belongs on `Front Page`.

### 11.4 Role scope exclusions

- Incidental duties such as `Dinner` are not added to the facilitation-role ontology without a genuine system requirement.
- `L-Plate` and `L-Plate Support` are separate Assignments.
- Support is never inferred or silently created.
- No formal “supports whom” relation currently exists.

---

## 12. Session Architecture

### 12.1 Publication boundary

- A Pretty Roster row may exist as planning without being a Session.
- Operational publication requires at least Date and Location/day stream.
- Reading Unit/Item may legitimately be unknown at initial publication and added later to the same `BR-S`.
- `Publish?` is a gate, not silent publication.
- Publication occurs through the explicit Preview and Publish actions.
- Excluded/non-operational rows receive no ID unless deliberately brought into scope.
- Historical backfill and prospective publication are separate operating modes.

### 12.2 `Sessions — Sync` schema

| Column | Meaning |
| --- | --- |
| `Session ID` | Immutable `BR-S` |
| `Date` | Session date |
| `Location` | Tuesday, Thursday, Singapore, or future approved stream |
| `Reading Unit` / Item value | Optional at initial handover; structured enrichment later |
| `Session Status` | Current operational state, including `Scheduled` and `Completed` |

### 12.3 Meaning of `BR-S`

`BR-S` means a Session occupying the Bible Reading facilitation operational stream. It does not mean that every such Session must contain a Bible Reading unit.

Therefore:

- Ordinary Bible Reading Sessions use `BR-S`.
- Vision Casting that replaces normal Bible Reading evenings and uses the normal roster/roles uses `BR-S`.
- Separate Facilitator Coaching does not use `BR-S` by default.

### 12.4 Current Session baseline

- 2026 is complete through `BR-S-000065`.
- This includes ordinary Bible Reading, three Vision Casting Sessions, and the two Easter Retreat Sessions.
- Previously issued Sessions were not renumbered when retrospective records were admitted.

---

## 13. Assignment Architecture

### 13.1 Definition

One Assignment equals:

`one Session + one Facilitator + one explicit Role`

The current operational model allows one occurrence of a Facilitator per Session. Multiple simultaneous roles for one Facilitator in one Session are not presently supported.

### 13.2 `Assignments — Sync` schema

| Column | Meaning |
| --- | --- |
| `Assignment ID` | Immutable `BR-A` |
| `Session ID` | Related `BR-S` |
| `Facilitator ID` | Related `BR-F` |
| `Facilitator Name` | Display-only lookup |
| `Role` | Canonical Role |
| `Assignment Type` | `Original` or `Replacement` |
| `Confirmation` | Confirmation/replacement workflow state |
| `Notification Sent` | Reminder audit value |
| `Confirmed At` | Stamp-once confirmation timestamp |
| `Replaces Assignment ID` | Original `BR-A` replaced by this Assignment |
| `Source Sheet` | Provenance only |
| `Source Cell` | Provenance only |
| `Notes` | Human notes; never parsed as structured Reading Unit data |
| `Assignment State` | `Active`, `Replaced`, or `Removed` |

### 13.3 Canonical vocabularies

**Assignment Type**

- `Original`
- `Replacement`

**Assignment State**

- `Active`
- `Replaced`
- `Removed`

**Confirmation**

- `Not Requested`
- `Awaiting Confirmation`
- `Confirmed`
- `Seeking Replacement`
- `Replacement Found`
- `No Response`

`Please Replace` is superseded by `Seeking Replacement`.

### 13.4 Correction and movement rules

| Situation | Required result |
| --- | --- |
| Same Facilitator, same Session, different cell | Preserve `BR-A` if correspondence is unambiguous |
| Same Facilitator, same Session, Role correction | Update and preserve `BR-A` |
| Same Facilitator, same Session, move plus Role correction | Update and preserve `BR-A` when unambiguous |
| Two-person swap or multiple within-Session moves | Preserve identities where semantic matching is unambiguous |
| Cleared published cell | Retain record and set `Assignment State = Removed` |
| Exact restoration of a Removed Assignment | Reactivate the same `BR-A` only when Session, Facilitator, Role, Source Sheet, and Source Cell all match |
| Move to a different Session | Remove old Assignment and create a new `BR-A` |
| Same Facilitator appears twice in one Session | Report a Problem and skip mutation for the entire affected Session |

### 13.5 Replacement workflow

1. Preserve the original Assignment.
2. Change the original `Assignment State` to `Replaced` when the successor takes over.
3. Preserve the original confirmation timestamp.
4. Set the original confirmation workflow to `Seeking Replacement`, then `Replacement Found` as appropriate.
5. Create a new Assignment with a new `BR-A`.
6. Set the new `Assignment Type` to `Replacement`.
7. Set `Replaces Assignment ID` to the original `BR-A`.
8. Assign the actual Role the replacement will perform.
9. Restore the canonical actual-Role colour after successful publication.

Capability rules:

- If the original Role is valid for the replacement, preserve it.
- If it is invalid and exactly one viable Role exists, deterministic resolution is permitted.
- If several Roles are plausible, stop for human choice.
- If support is required, it must be entered as a separate explicit Assignment.
- Recovery logic must not duplicate a replacement after partial or stale publication.

### 13.6 Current Assignment publisher baseline

- The accepted baseline is publisher version 7.
- It retains capability-aware replacement handling, narrow reactivation, same-Session movement, Role correction, and multiple rearrangements.
- It adds the per-Session duplicate-Facilitator guard.
- Future amendments must begin from the exact current source, not a reconstructed script.

### 13.7 Current Assignment baseline

- The permanent 2026 register is complete through `BR-A-000227`.
- The earlier proof/test allocations are not authoritative.
- Known replacement history, including the chain from original `BR-A-000123` to replacement `BR-A-000192`, must remain intact.

---

## 14. Confirmation and Communication Architecture

### 14.1 Confirmation lifecycle

1. New Assignment: `Not Requested`.
2. Reminder sent: record `Notification Sent` and set `Awaiting Confirmation`.
3. Positive response: set `Confirmed` and stamp `Confirmed At` once.
4. Cannot serve: set `Seeking Replacement`.
5. Replacement accepted: set original to `Replacement Found` as appropriate and create the separate Replacement Assignment.
6. No response by chase threshold: surface `Chase Due`; do not automatically set `No Response`.
7. `No Response` remains a human decision.

### 14.2 Response-channel design

- The preferred design to investigate is a small response form or secure confirmation links in the reminder.
- Facilitators should not require access to Notion or the operational Google workbook.
- Structured response capture is preferred over initially interpreting free-text replies.
- Direct message-reply handling may be considered only if the selected platform offers reliable webhook/API events.

### 14.3 Still open

- Reminder delivery channel.
- Form versus one-click links versus messaging response.
- Initial reminder lead time.
- Chase threshold.
- Time zone and escalation/reporting details for the reminder workflow.

---

## 15. Notion Architecture

### 15.1 Canonical databases

- `Journey Event Instances`
- `Team Members`
- `Facilitation Assignments`
- `Catalogue`

### 15.2 Journey Event Instances

Relevant structure includes:

- Event Instance title
- Event Date
- Category
- Instance Status
- Programme Item
- Team Location
- `Session External ID`
- Facilitation Assignments relation
- Annual-close fields: `Freeze State`, `Freeze ID`, `Frozen At`

Rules:

- `Session External ID` stores `BR-S`.
- Once assigned, cross-platform matching uses `BR-S`, not title/date matching.
- Categories are broader than the `BR-S` namespace.
- An Event Instance may exist without `BR-S`.
- Vision Casting in the Bible Reading operational stream receives `BR-S`.
- Facilitator Coaching remains outside the `BR-S` namespace by default.

### 15.3 Team Members

Relevant facilitator structure includes:

- `Facilitator External ID`
- Availability for Tuesday, Thursday, and Singapore
- Multi-select `Facilitation Roles`
- `Facilitator Status`
- `Available From`
- `Available Until`

Rules:

- `Facilitator External ID` stores `BR-F`.
- Google allocates `BR-F`.
- Display-name variations such as Jess/Jessica, Tiff/Tiffany, and Tim/Timothy must be resolved by `BR-F`, not literal name equality.

### 15.4 Facilitation Assignments

Relevant properties include:

- Assignment title
- `Assignment External ID`
- Native Notion Assignment ID
- `Assignment State`
- `Assignment Type`
- `Confirmation`
- `Confirmed At`
- Event Instance relation
- Facilitator relation
- `Notes`
- `Notification Sent`
- `Replaces Assignment ID`
- `Role`
- Annual-close fields: `Freeze State`, `Freeze ID`, `Frozen At`

Rules:

- `Assignment External ID` stores `BR-A` and is the portable identity.
- Native Notion Assignment IDs remain internal.
- The Event Instance relation is resolved by `BR-S`.
- The Facilitator relation is resolved by `BR-F`.
- Replacement history mirrors Google.

### 15.5 Legacy property disposition

- `Event Lead` and `Group Leads` were retained temporarily while 2026 structured Assignments were validated.
- The 2026 migration is now complete through `BR-A-000227`.
- The legacy properties are retired and are not part of the target architecture.
- They must not be reintroduced as substitutes for one-row-per-facilitator-per-Role Assignments.

### 15.6 2026 alignment state

- Google and Notion are aligned through `BR-S-000065` and `BR-A-000227`.
- The Easter Retreat mini-series is represented in both structured systems.
- The Facilitator Coaching exception is normalized directly in Notion outside the `BR-S`/`BR-A` roster namespace.
- Earlier proof Assignment artefacts do not form part of the active register.

---

## 16. Catalogue and Programme Structure

- The reusable content database is named `Catalogue`.
- `Reading Units – Review` is retired terminology.
- `Book/Series` distinguishes biblical books and broader series.
- Genesis may be treated as a Series where needed.
- Coaching, induction, and refresher activities may be Catalogue units.
- Reusable units do not require `From` and `To` dates.
- Internal series order must be preserved.
- A short-title property supports compact views.
- Acts units begin at 1; the spurious `Acts 29` is removed.
- Ruth and Esther form the series `Ruth & Esther`, ordered Ruth then Esther.
- The remaining 2026 structure was three Ruth units followed by five Esther units.

---

## 17. Special Event Decisions

### 17.1 Vision Casting

Vision Casting is represented by the ordinary Session and Assignment model when it:

- Replaces normal Bible Reading evenings.
- Occupies ordinary Pretty Roster rows.
- Uses the regular facilitation team.
- Uses normal facilitation Roles.

Final treatment:

- Remove the earlier exclusion state deliberately.
- Preview and publish through the ordinary Session path.
- Publish Assignments through the ordinary Assignment path.
- Do not create a special sync model or renumber earlier IDs.

### 17.2 Facilitator Coaching

- Facilitator Coaching is a genuine facilitated activity.
- It is excluded from the Pretty Roster.
- It may use the broader Notion Facilitation Assignment model.
- It does not receive `BR-S` or `BR-A` merely to resemble Bible Reading.

### 17.3 Easter Retreat 2026

- `Easter_Retreat_2026` is legitimate Bible Reading material and part of the structured 2026 history.
- It remains a special operational surface rather than being forced into a semester layout.
- It contains one Session per day across two days.
- Facilitators work in pairs and each serves twice.
- Row 2 is Lead on Day 1; row 3 is Lead on Day 2; pair members switch Lead and Support.
- Day 1 passages: Luke 22:39–71 and Luke 23:13–49.
- Day 2 passages: 1 Kings 19:1–18 and 1 Samuel 1:1–28.
- Repeated names across the two days are separate real service instances, not accidental duplicates.

---

## 18. 2027 and Growth-Location Architecture

### 18.1 2027 roster baseline

- `Sem1_2027` and `Sem2_2027` exist in the SAFE Copy.
- They were created from the latest-format template and cleared of inherited 2026 dates, people, Items, notes, publication choices, IDs, states, and cell notes.
- No placeholder `BR-S` or `BR-A` identities were issued.
- Summary formulas on the new tabs use all eight visible slots, `B:I`.
- The source `Sem2_2026` summary defect remains untouched pending regression review: its visible slots are `B:I`, while existing formulas count only `B:E`.

### 18.2 Capacity

- The planned maximum is 10 facilitator roles and 15 events.
- The current latest template exposes eight slots and 34 planning rows across Tuesday, Thursday, and Singapore blocks.
- Empty reserved rows/columns may be prepared as capacity only.
- Further hidden facilitator columns or rows are deferred until publisher/parser assumptions are audited.

### 18.3 Location Planning boundary

| Surface | Authority | Prohibition |
| --- | --- | --- |
| `Location Planning` | Local ideas, proposed dates/readings/team, and readiness for central review | Cannot publish, allocate BR identities, or become the operational roster |
| Primary roster tabs | Approved scheduling and operational presentation | Must not absorb unapproved proposals silently |
| Structured sync tabs | Published operational identity and state | Must not contain placeholder future identities |

The planning-state path is:

`Idea → Discussing → Ready for central review → Approved for promotion → Promoted`

Rules:

- Locations include Kuala Lumpur, Singapore, Hong Kong, and Other.
- One consolidated Facilitator master supports people who serve in multiple locations.
- Planning areas must be visibly and structurally distinct from the primary roster.
- They must expose approved-but-not-promoted and overdue proposals.
- Promotion into the primary roster must be deliberate and human-authorized.
- Only the primary roster may publish `BR-S` and `BR-A`.

### 18.4 Still open

- Exact visual/function boundary preventing shadow rosters.
- Exact human approval and promotion mechanism.
- Publisher/parser compatibility with expanded capacity.
- Whether to add hidden facilitator slots 9–12 and additional Session rows.
- Preservation of the misspelt `Faciliator` header until parser dependency is ruled out.

---

## 19. Annual Close and Archive Architecture

### 19.1 Archive separation

| Archive | Purpose |
| --- | --- |
| `Bible Facilitation Roster ARCHIVE` | Human-facing yearly, semester, and legitimate special-event roster copies as hard values |
| `Bible Facilitation DATA ARCHIVE` | Closed-year Session and Assignment snapshots, referenced Facilitator identity data, and annual validation evidence |

The archives remain separate because they serve different audiences. One compact Freeze Report connects them.

### 19.2 Vocabulary

- **Soft Close:** Correction-only period after ordinary operations finish.
- **Correction Window:** 7–31 January following the completed year.
- **Hard Freeze:** Validated historical state after the correction window.
- **Freeze Report:** Compact PASS/FAIL evidence for the completed archive.
- **Recommissioning:** Removal or exclusion of closed-year material from current operation after archives and current-year continuity have been proven.

### 19.3 Final annual sequence

1. Complete factual corrections during 7–31 January.
2. Create a full safety copy.
3. Copy completed-year semester and legitimate special-event tabs to the Roster Archive.
4. Convert archived roster formulas to hard values.
5. Copy all Sessions dated in the closing year to the DATA ARCHIVE.
6. Copy every Assignment belonging to those archived Session IDs.
7. Copy enough Facilitator identity data to resolve every referenced `BR-F`.
8. Validate values, counts, identities, relationships, formulas, errors, and source matches.
9. Produce one compact PASS/FAIL Freeze Report.
10. Protect the archived material.
11. Mark the included Notion Sessions and Assignments `Hard Frozen` so routine synchronization ignores them.
12. Exclude the closed year from current operational processing.
13. Prove the new year continues to operate correctly.
14. Retain the untouched completed-year source through 30 April as a recovery/observation buffer.
15. Remove or recommission old operational material only after a clean Preview.

### 19.4 Archive safeguards

- Copy before removal.
- Never overwrite an existing archive tab silently.
- Archive roster evidence as hard values with no formulas or cell errors.
- Select Assignments by their archived Session IDs, not guessed Assignment dates.
- Validate Session uniqueness, Assignment uniqueness, Assignment-to-Session relations, and Assignment-to-Facilitator resolution.
- Never reset `BR-F`, `BR-S`, or `BR-A` counters.
- Do not archive Notion-only facilitated activities outside the roster namespace merely because they use Facilitation Assignments.
- Hard freeze and source removal are separate moments.
- No source material is removed before current-year dependency testing passes.

### 19.5 `AnnualClose.gs` baseline

Version 2 is installed in the SAFE Copy with three public operations:

| Operation | Responsibility |
| --- | --- |
| `previewAnnualClose()` | Read-only report of year, counts, existing/missing archive tabs, and blocking issues |
| `archiveAnnualClose()` | Manual, confirmed creation of missing hard-value archive material without overwriting or deleting source data |
| `validateAnnualArchive()` | Validation of both archives and production of the compact annual result |

Rules:

- The module remains small and reusable.
- Year and source tab names are configuration values.
- It is not a separate administrative application.
- `archiveAnnualClose()` is hard-blocked before 1 February 2027 in Hong Kong time.
- There is no bypass switch.
- Only Preview has been used against the current 2026 state; no real 2026 archive execution has occurred.

### 19.6 Current archive evidence

- Preview passed with 65 Sessions, 227 Assignments, 29 referenced Facilitators, and 0 issues.
- `Easter_Retreat_2026` is a validated exact hard-value archive with no formulas or cell errors.
- `Sem1_2026!A1:V44` is validated with 679 populated archive cells, 0 source-value mismatches, 0 formulas, 0 cell errors, and 0 formatting mismatches across added columns `S:V`.
- Added hard-value columns are `Publish?`, `Session ID`, `Publish State`, and `Location`.
- `Sem2_2026` remains operational and must not be placed in the genuine archive before completion of the semester and correction process.

### 19.7 Freeze Report

The final report is compact and contains:

- Year.
- Source and target identities.
- Session, Assignment, and referenced-Facilitator counts.
- ID ranges.
- Validation checks.
- Exceptions.
- Timestamp.
- Person who checked the close.
- Overall `PASS` or `FAIL`.

Detailed provisional registers may remain physically present in the DATA ARCHIVE, but they are not mandatory annual workflow. No cryptographic digest, multi-command approval system, or enterprise-grade separation of duties is required.

### 19.8 Stage 6 disposition

- Stage 6 is closed.
- No archive, validation, rehearsal, or source-removal action is currently due.
- The full rehearsal belongs in the future `2026 Close Schedule`.
- The rehearsal will occur in the SAFE Copy and isolated test assets before any live action.
- The schedule must reconcile an early-January provisional rehearsal with the 7–31 January correction window and the production archive lock on 1 February.
- The production date lock must not be weakened merely to conduct the rehearsal.

---

## 20. Closed-Year Behaviour in Notion

- `Freeze State`, `Freeze ID`, and `Frozen At` exist on Journey Event Instances and Facilitation Assignments.
- Existing records were not accidentally closed when these properties were created.
- These fields provide lightweight record-level freeze evidence and current-view/sync exclusion.
- They do not imply a formal state-machine or enterprise authorization architecture.
- At annual close, included records are marked `Hard Frozen` only after both archives validate.
- Hard-frozen records remain historically accessible but are ignored by routine current operations and synchronization.
- Later factual corrections must be deliberate, documented, and followed by archive rebuild/revalidation where affected.

---

## 21. Automation Architecture and Delivery Gates

### 21.1 n8n role

n8n may eventually:

- Transport structured shared facts between Google and Notion.
- Orchestrate confirmation/reminder workflows.
- Bridge genuine capability gaps not sensibly handled natively.

n8n must not:

- Allocate competing portable identities.
- Interpret the Pretty Roster when structured sync tables already express the facts.
- become the sole owner of business rules.
- Be introduced before manual contracts and identities are stable.

### 21.2 Automation prerequisites

Cross-platform automation begins only after:

- Google structures and identity rules are stable.
- Notion schemas are aligned.
- The 2026 migration baseline is clean.
- Manual Session and Assignment publication passes.
- Edge cases are acceptance-tested.
- Conflict handling and sync authority are explicitly decided.

### 21.3 Still open

- Exact conflict-resolution rule when Google and Notion change the same shared fact before synchronization completes.
- Final direction and cadence for ongoing synchronization.
- Final authority for Facilitator availability and capability edits.

---

## 22. Script Ownership, Change Control, and Documentation

### 22.1 Change-control rule

- Do not amend Apps Script without discussing the exact change with the user first.
- Explain why the change is needed and identify the affected functions or sections.
- Obtain agreement before modification.
- Modify only the agreed sections from the exact current source.
- Do not reconstruct whole scripts from memory.
- Do not use a separate cloud-browser sign-in merely to paste code.

### 22.2 Preferred installation workflow

1. Prepare the agreed paste-ready change.
2. The user opens Apps Script in their own authenticated browser.
3. The user pastes or replaces the agreed file.
4. Review the change together.
5. Run only the agreed safe function.

Script work should also support the user’s learning rather than becoming invisible implementation.

### 22.3 Documentation layers

| Layer | Purpose |
| --- | --- |
| Google `Front Page` | Concise ordinary operator guidance |
| Notion design and operating pages | Architecture, decisions, stage state, and handover context |
| Stage 10 professional documentation | Full operating guide, administrator runbook, data dictionary, architecture diagrams, testing, troubleshooting, release, recovery, and succession |

### 22.4 `Scripts Explained` requirement

Stage 10 must document:

- Each function and its purpose.
- End-to-end execution flow.
- Read and write locations.
- Identity allocation and preservation.
- Triggers and configuration.
- Dependencies and protected ranges.
- Safety stops.
- Deployment and versioning.
- Controlled changes.
- Operator and ownership transitions.

---

## 23. Validation and Acceptance Standards

### 23.1 General pattern

1. Define the rule.
2. Change only the SAFE Copy or agreed script section.
3. Run Preview.
4. Test a bounded edge case.
5. Publish only if clean.
6. Repeat Preview to prove idempotency.
7. Record actual evidence before marking the requirement complete.

### 23.2 Required edge-case behaviour

- Same-Session movement preserves Assignment identity when unambiguous.
- Same-Session Role correction preserves Assignment identity.
- Move plus Role correction preserves Assignment identity when unambiguous.
- Multiple simultaneous moves and two-person swaps are supported.
- Exact restoration of a Removed Assignment reactivates the same identity.
- Duplicate Facilitator within one Session blocks the entire Session.
- Cross-Session movement creates a new Assignment and removes the old one.
- Replacement preserves predecessor history and creates a linked successor.
- Replacement Role ambiguity blocks for human resolution.
- Required support is explicit.
- Vision Casting publishes through the ordinary path once deliberately admitted.
- Completed Sessions preserve role colours.
- Inactive historical Facilitators remain resolvable.
- All supported Tuesday, Thursday, and Singapore streams use the same Assignment architecture.

### 23.3 Mismatch diagnostic order

1. Inspect roster person and colour.
2. Resolve the Session.
3. Resolve `BR-F`.
4. Check Role detection.
5. Check whether a structured Assignment exists.
6. Check Assignment State, including `Replaced`.
7. Run Assignment Preview.
8. Publish only after the Preview explains the intended correction.

---

## 24. Explicitly Rejected and Superseded Architecture

The following must not be revived without a new, explicit architectural decision:

### 24.1 Identity and data model

- Platform-native IDs as cross-system identity.
- Row, column, source cell, title, date, or display name as durable identity.
- Roster slot as Role.
- Replacement as a Role.
- Automatic support inference.
- Synchronizing legacy `Event Lead` / `Group Leads` as sufficient Assignment data.
- Reconstructing all pre-2026 Assignments merely for completeness.
- Renumbering retrospective Sessions or Assignments for chronological appearance.
- Reverse Notion-to-Google writes solely to align number sequences.
- Issuing placeholder IDs for future planning.

### 24.2 Operational scope

- Forcing every facilitated Notion event into the Bible Reading Pretty Roster.
- Forcing Facilitator Coaching into the `BR-S`/`BR-A` namespace by default.
- A special Vision Casting sync architecture.
- Separate Vision Casting publisher scripts or manually hard-coded IDs.
- Broadening Role vocabulary with incidental historical duties such as Dinner.

### 24.3 Automation and workflow

- Building one giant n8n automation before native structures stabilize.
- Treating the Pretty Roster as the only machine-readable database.
- Silent publication from a checkbox alone.
- Guessing through duplicate or ambiguous Facilitator cases.
- Whole-script rewrites for bounded edge cases.
- Invisible Apps Script changes without prior discussion.

### 24.4 Archive and governance

- Archiving `Sem2_2026` before completion.
- Running `archiveAnnualClose()` merely because Preview passes.
- Bypassing the 1 February date lock.
- Overwriting existing archive tabs.
- Keeping live formulas as archival evidence.
- Removing source material immediately after archive creation.
- Treating hard freeze as immediate deletion.
- A three-month delay before creating the actual hard archive.
- The earlier 7–20 January correction window.
- Three separate SAFE Copy rehearsals.
- A standalone Annual Close Controller workbook.
- Separate development and production Controllers.
- A special Mike-owned Controller asset.
- Cryptographic validation digests.
- A six-stage formal state machine.
- Mandatory command-based operational and technical sign-offs.
- Mandatory append-only approval registers and protected approver configuration.
- Enterprise-style segregation of annual-close duties.

---

## 25. Current Implementation Baseline

### 25.1 Complete or established

- Stable `BR-F`, `BR-S`, and `BR-A` identity strategies.
- `FacIntake`, `FacMaster`, `FacilitatorLists`, and `SysAdmin` separation.
- `SOURCE` retirement.
- `Sessions — Sync` and 14-column `Assignments — Sync`.
- 2026 Session history through `BR-S-000065`.
- 2026 Assignment history through `BR-A-000227`.
- Google-to-Notion 2026 structured alignment.
- Easter Retreat structured representation.
- Vision Casting integration through the ordinary publisher.
- Legacy Notion `Event Lead` and `Group Leads` retirement.
- Role-button interface on `Sem2_2026`, `Sem1_2027`, and `Sem2_2027`.
- New 2027 semester tabs without inherited operational identities.
- Initial `Location Planning` proposal register.
- Roster Archive and DATA ARCHIVE.
- Validated `Sem1_2026` and `Easter_Retreat_2026` archive evidence.
- `AnnualClose.gs` version 2 and clean read-only Preview.
- Stage 6 closure and deferral of the full rehearsal to the 2026 Close Schedule.

### 25.2 Not yet implemented or not yet final

- Cross-platform n8n synchronization.
- Reminder and confirmation-response automation.
- Exact Google/Notion simultaneous-edit conflict rule.
- Final Facilitator availability/capability edit authority.
- Location proposal promotion controller and reporting.
- Expanded 2027 hidden capacity after parser audit.
- Production migration from SAFE Copy and full rollback rehearsal.
- Stage 10 professional documentation package.
- The actual 2026 annual close.
- The detailed 2026 Close Schedule.

### 25.3 Known operational issue requiring bounded follow-up

The later diagnostic record identified a small set of roster/Assignment mismatches involving Chee Yong, Teri, and Wai Kit on `Sem2_2026`. No corrective publication was performed. This is an operational reconciliation item, not a change to the architecture. It must be handled with the standard diagnostic order and Assignment Preview before any publication.

---

## 26. Roadmap Dependencies

### 26.1 Before n8n

- Complete remaining manual confirmation/reporting decisions.
- Resolve bounded Assignment reconciliation issues.
- Prove the current native contracts manually.
- Define simultaneous-edit conflict resolution.

### 26.2 Before production cutover

- Audit differences between SAFE Copy and live workbook.
- Inventory tabs, scripts, triggers, validations, named ranges, permissions, and protected ranges.
- Decide what live content is preserved, superseded, archived, or excluded.
- Create a verified pre-cutover backup.
- Rehearse migration and rollback.
- Migrate without resetting any identity counter.
- Preserve legitimate 2027 planning already present in the SAFE Copy.
- Recreate and verify script, trigger, permission, and archive targets.
- Run production acceptance across Sessions, Assignments, moves, removals, replacements, special events, and cross-platform synchronization.
- Retain the SAFE Copy as the controlled development and acceptance environment after cutover.

### 26.3 Before the real 2026 close

- Build the 2026 Close Schedule.
- Resolve the early-January rehearsal versus 1 February archive-lock interaction without weakening production safeguards.
- Complete the 7–31 January factual correction window.
- Rebuild/revalidate archive candidates affected by corrections.
- Complete isolated Archive and Validate rehearsals.
- Verify 2027 operation with closed-year data excluded.

---

## 27. Handover Rules for Future Work

- Work on one bounded item at a time.
- Begin from the exact current workbook and script baseline.
- Do not repeatedly reopen or rewrite large design documents for small tasks.
- Keep implementation status accurate so completed work is not re-presented as pending.
- Update the actual parent roadmap item when status changes, not only a child procedure page.
- Use ordinary discussion for design, explanation, and navigation.
- Use connected-action workflows only when a real Notion, Google, or file mutation is required.
- Treat acceptance evidence, not code completion, as the definition of done.

---

## 28. Source Register

| Ref | Source | Role in synthesis |
| --- | --- | --- |
| N1 | [Google/Notion Sync Planning](https://app.notion.com/p/32ec267d550f8037a76cd21f93c8e497) | Current planning baseline, implementation state, roadmap, open decisions |
| N2 | [Bible Facilitation Roster — Operating Notes](https://app.notion.com/p/3d2c267d550f8141b4a7cb9b00cd6797) | Human-operating contract, role colours, authority, publisher baseline |
| N3 | [Stage 6 — Annual Close & Archive Procedure](https://app.notion.com/p/3d3c267d550f81f3a6dfcf56753a357c) | Annual-close design, archive separation, script functions, safeguards |
| N4 | [Stage 12 — 2027 Roster & Growth-Location Design](https://app.notion.com/p/3d3c267d550f817486a5f02dbe670cba) | 2027 tabs, capacity, location-planning authority boundary |
| C1 | `ChatGPT_Conversation_1.md` | Detailed architecture and edge-case decision extract |
| C2 | `ChatGPT_Conversation_2.md` | Later annual-close, governance simplification, and final Stage 6 decisions |

---

## 29. Final Architectural Statement

The system is not a visual spreadsheet synchronized wholesale into Notion. It is a layered operational architecture:

- The Pretty Roster supports human planning and intuitive operation.
- `FacMaster`, `Sessions — Sync`, and `Assignments — Sync` hold explicit operational meaning.
- `BR-F`, `BR-S`, and `BR-A` preserve identity across Google, Notion, corrections, replacements, archival, and succession.
- Notion provides the broader event, people, relationship, reporting, and knowledge context.
- n8n will eventually transport structured shared facts without becoming the owner of those facts.
- Two distinct archives preserve both human-readable roster evidence and structured historical truth.
- Annual close is a small, preview-first, validated housekeeping procedure rather than a separate governance system.

This architecture deliberately protects both sides of the operating reality: human flexibility above, stable semantic structure below.
