# Stage 9 Pt. 3 — Bidirectional Sync Processing

**Handover date:** 4 November 2026  
**Project:** Google to Notion n8n Sync  
**Status:** DEV event intake and deduplicated ledger proved; propagation decisions not implemented.  
**Next conversation:** Stage 9 Pt. 3 — Bidirectional Sync Processing

## 1. Verified checkpoint

- Both Notion and Google changes are captured and registered in the dedicated PostgreSQL `sync_events` ledger.
- PostgreSQL check returned **Google / REVIEW: 7; Notion / IGNORED: 1; Notion / RECEIVED: 1** (**9 total**).
- Re-running the Google event-registration node with the same seven records did **not** increase counts: PostgreSQL unique `event_key` deduplication **PASSED**. Notion duplicate-event test also passed.
- The Notion RECEIVED event is an authentic `Event Date` edit for `BR-S-000001`. **RECEIVED means queued, not propagated**.
- **Neither Session date writer is authorised for automatic updates. Both should remain disabled** until controlled direction selection is complete. Earlier one-way date writes were tested individually but an old temporary IF filter caused an incorrect reversal when both directions were left active.

## 2. Architectural authority and guardrails

- DEV host: `martin`; LIVE host: `luther`. **DEV only** until promotion is formally approved.
- Local DEV checkout: `~/Documents/DEV/repos/Google-to-Notion-n8n-Sync-DEV` (branch reported `feature/ft-sessions`). Main checkout also exists under `~/Documents/DEV/repos/`.
- Architecture register: `ARCHITECTURE-AUTHORITY-DEV-GNn8n.md` in DEV checkout root. **Consult it and actual repository layout before recommending new paths/services.**
- Existing directories: `infrastructure/n8n/compose.yaml`, `infrastructure/n8n/workflows/`, `infrastructure/postgres/compose.yaml`, `infrastructure/postgres/migrations/001_sync_ledger.sql`.
- Do **not** access `miscellaneous-files` / “Miscellaneous Files” or `.gitignore` without explicit prior permission.
- Most recent **deliberate** edit wins on eligible shared fields after handover regardless of Google/Notion origin, except explicit ownership restrictions. Do not infer ordering from mere differing values or a Notion *page-level* last-edited timestamp.
- Permanent `BR-S-`, `BR-A-`, `BR-F-` external IDs are canonical; never use spreadsheet row position or Notion title as identity.
- Distinguish change history, current mismatch, pending work and completed writes. Avoid feedback loops; suppress self-generated events and preserve idempotency.
- Notion page-title refresh from authoritative Reading Unit / Location / Event Date is planned. Existing Session comparison falls back to parsing the stale title for Unit and Location when Notion helper properties are empty; **do not authorise bidirectional Unit/Location writes using that fallback**.

## 3. DEV infrastructure

- n8n container `n8n`, version shown in Compose `docker.n8n.io/n8nio/n8n:2.32.6`, port 5678; n8n's internal database remains its own SQLite file. No migration of n8n internal storage.
- Independent PostgreSQL container `br-sync-postgres` (`postgres:16-alpine`), database `br_sync_dev`, user `br_sync_app`, Docker-managed volume `postgres_br_sync_pgdata`, health **healthy**.
- Docker network `br-sync-dev-net`: contains `n8n` and `br-sync-postgres`. n8n Postgres credential connection test passed; credential currently may display as **`Postgres account`** (suggested clearer name `DEV — BR Sync PostgreSQL`; do not recreate).
- PostgreSQL secrets are kept locally under `~/Documents/DEV/repos/System Scripts/config/google-notion-sync/postgres-dev.env`; this checkout's directory locally excluded through `.git/info/exclude`. Do not disclose secrets.
- Cloudflare healthy DEV tunnel `theologenius-martin-dev` with host networking. Public receiver path restricted to `https://n8n-dev.theologenius.com/webhook/dev-br-notion-changes` (path `^/webhook/dev-br-notion-changes$`); root publicly returned 404, while inactive production webhook previously returned n8n registration 404 as expected. Mattermost route unaffected.

## 4. Data and ledger

**DEV Google workbook:** `DEV VERSION Bible Facilitation Roster`, spreadsheet ID `1bXkN49Z9rTkfXaHrZ5PaIB2uqRG9qfk4Qhc3JyORrKA`.
- `Sessions — Sync`: `Session ID`, `Date`, `Location`, `Reading Unit`, `Session Status`.
- `Assignments — Sync`: assignment records, permanent `Assignment ID`.
- `FacMaster`: facilitator records, permanent `Facilitator External ID`; `Active?` is formula-based and must not be overwritten.
- `SyncChangeLog` (gid `1811042601`): A `Changed At`, B `Entity`, C `External ID`, D `Field`, E `New Value`, F `Previous Value`, G `Origin`, H `Cell`, I `Event ID`. Existing historical entries were assigned UUIDs. New entries receive UUIDs via Apps Script `Utilities.getUuid()`. The updated `getRange(nextRow,1,records.length,9)` fixed an initial 9-values/8-columns error.
- Apps Script project named `DEV_BibleFacilitation_SyncAutomation`; function/installed `On edit` trigger `devCaptureSyncEdit`. Captures human edits across the above three tabs, excluding identity/header/formula cells; does not capture Google Sheets API writes, formula recomputation, or edits made by other scripts. Multi-cell paste previous values may be unavailable. Important to consider automated planning/form scripts later.

**DEV Notion:**
- Event Instances data source: `655cf0f3-93cd-4d72-920a-ad0805d06242`.
- Facilitation Assignments data source: `d31c840a-3bcf-4113-97dc-1526ebb9eac6`.
- Team Members data source: `c08cd0af-3a20-4bf5-9deb-b2f3db272ab9`.
- Test Session `BR-S-000001`, page ID `3eac267d-550f-8156-b1f3-ce4a290a06ac`.

**PostgreSQL migration `001_sync_ledger.sql`:**
- `sync_events`: unique `event_key`, origin, entity type, external ID, Notion page ID, changed timestamp/fields/payload, processing status, received/processed timestamps.
- `sync_field_state`: `(entity_type,external_id,field_name)` primary key, last successful shared value/time/event.
- `sync_operations`: updates attempted, target, status, timing/errors.
- Present verified row counts **Google REVIEW 7; Notion IGNORED 1; Notion RECEIVED 1**. These are **test/history**, not licence to replay.

## 5. n8n workflows and exact nodes

### `DEV-BR-Notion-Change-Receiver` (separate shared receiver)
Published production webhook and tested actual signed Notion `page.properties_updated` event. Route:
1. `Webhook` (POST `dev-br-notion-changes`, Raw Body enabled)
2. `DEV — Verify Notion Signature HMAC` (Crypto; private verification secret in credential)
3. `DEV — Notion Signature Valid` (IF; legitimate delivery went True)
4. `DEV — Identify Notion Change` (Code; classifies page and data source, changed property IDs, timestamp; keeps `safeToWrite:false`)
5. `DEV — Resolve Notion Property` (HTTP GET `/v1/data_sources/{{ $json.dataSourceId }}`; **Generic Bearer** `DEV — Notion API 2026`, `Notion-Version: 2026-03-11`; predefined `Notion Theologenius` credential forced old version `2022-02-22` and caused HTTP 400)
6. `DEV — Map Notion Property Names` (Code; URL-decodes internal property IDs and resolves schema names)
7. `DEV — Classify Notion Sync Fields` (Code; Session `Event Date` and `Instance Status` sync candidates; `Instance Notes` Notion-only; unknown mappings REVIEW, no write authority)
8. `DEV — Resolve Notion External ID` (HTTP GET `/v1/pages/{{ $json.pageId }}`; newer API credential)
9. `DEV — Extract Notion External ID` (Code; `Session External ID` → `BR-S-000001`, identity check)
10. `DEV — Register Notion Sync Event` (Postgres; upsert only missing external ID on conflict, otherwise dedup; Notion-only event IGNORED, date event RECEIVED).

Verification event token was rotated after an earlier secret appeared in chat. **Never paste current verification token or API token in conversation**. Real event classification verified changed property `Instance Notes` as internal ID `%3C%3CtM` and `NO_SYNC_REQUIRED`.

### `DEV-BR-Sessions-Sync`
Existing records: 80 Sessions. Core path Google `Get row(s) in DEV sheet` + Notion `Get many database pages` → original `Merge` → `DEV — Session Change Detection` (Code; 80 MATCH when dates agree). Existing comparison detects differences but **cannot establish edit origin**. The Notion `name` contains a stale old date; actual `property_event_date.start` is authoritative.

Diagnostic branch: `DEV — Read Google Change Log` → `DEV — Select Google Session Date Changes` → `DEV — Join Session Changes` (Merge append of 80 comparisons + Google edit) → `DEV — Evaluate Session Date Origin` (Code; diagnostic `safeToWrite:false`) → `DEV — Read Notion Session Metadata` (HTTP GET Notion page; page-level timestamp only).

Google ledger branch: `DEV — Read Google Change Log` → `DEV — Prepare Google Events` (Code; generates eventKey from `Event ID`, mapped fields, `status:REVIEW`, `valid`, `safeToWrite:false`) → `DEV — Register Google Sync Events` (Postgres Execute Query, query parameters, `ON CONFLICT(event_key) DO NOTHING`). Seven Google entries registered, rerun proved no duplicates.

**Date write nodes:** `DEV — PATCH Notion Session Date` (HTTP) and `DEV — Update Google Session Date` (Google Sheets; formerly `Update row in sheet`) remain **disabled**. Old `DEV — Notion Date Changed` IF contains a hard-coded test date `2027-01-14` and must not be used for operational routing. `DEV — Google Date Changed` detects mismatch without source-origin check. Do not activate either pending proper decision logic.

Other existing workflows: `DEV-BR-Assignments-Sync`, `DEV-BR-Facilitators-Sync` (do not rebuild unnecessarily).

## 6. Exact next work for Stage 9 Pt. 3

1. **Checkpoint and preserve current verified work**: ensure current n8n versions/DEV repo files are saved correctly (repository workflow JSON exports may be older than editor), and update architecture register as needed.
2. Design minimal **event consumer** in n8n/PostgreSQL: fetch only unprocessed eligible events, dedup/replay semantics, resolve authoritative current field value and record identity, distinguish actual deliberate edits from sync-generated writes. Ensure `REVIEW` test entries are not automatically replayed.
3. **Last-edit-wins engine** for shared fields: compare verified Google and Notion property-level event timestamps, last-synced state, real current values; settle ambiguous ordering conservatively. Beware delayed delivery, timestamp precision, race conditions, page-level edits, and Google edits made by Apps Script/API (which are not captured by On edit trigger).
4. Add transactionally safe operation status/retry and idempotent writer gates; only then re-enable Google/Notion Session date update paths and perform controlled bidirectional tests on DEV.
5. Resolve canonical Notion Reading Unit/Location relation mapping and page-title refresh; then expand to Assignments and Facilitators with verified field-ownership maps and allowed values.
6. Add Notion exception/health dashboard as a management view later; PostgreSQL remains canonical technical ledger.
7. Document/backup/commit reviewed changes and formal promotion gate; **no LIVE modifications**.

**Suggested first prompt for next conversation:** “Continue Stage 9 Pt. 3 from this handover. Start by reviewing the verified ledger state and propose the smallest safe implementation for consuming pending events and selecting a Session date update direction. Do not re-run infrastructure setup or activate writers.”
