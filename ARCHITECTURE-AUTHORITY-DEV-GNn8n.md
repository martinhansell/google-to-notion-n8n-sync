# Architecture Authority — Google ↔ Notion n8n Sync
Status: Working guardrail • 2026-11-04

## Confirmed
- Development host: `martin`; production host: `luther`. Do not modify LIVE during DEV work.
- Development repositories are under `~/Documents/DEV/repos/`.
- Local project directories: `Google-to-Notion-n8n-Sync` and `Google-to-Notion-n8n-Sync-DEV`. Check their roles, branches and contents before file placement or commits.
- GitHub repository: `martinhansell/google-to-notion-n8n-sync`.
- Do **not** inspect `Miscellaneous Files` or `.gitignore` without express permission.
- DEV n8n: Docker container `n8n` on `martin`, port 5678; its own operational database is SQLite. Do not use that SQLite file as the synchronisation ledger.
- Cloudflare DEV tunnel: `theologenius-martin-dev`, host networking. `n8n-dev.theologenius.com` is restricted to the Notion webhook path. Preserve Mattermost and production routes.
- DEV sync processors: `DEV-BR-Sessions-Sync`, `DEV-BR-Assignments-Sync`, `DEV-BR-Facilitators-Sync`.
- Shared Notion receiver: `DEV-BR-Notion-Change-Receiver`; webhook authentication and property identification have been tested.
- Google DEV workbook contains `Sessions — Sync`, `Assignments — Sync`, `FacMaster`, and `SyncChangeLog`.
- Identity is by permanent external ID, never by row position or display title.
- Shared fields after handover: most recent *deliberate* edit wins, subject to explicit field restrictions. Unknown ordering must not be guessed.
- Both Session date writer nodes remain disabled pending safe direction-selection logic.
- Dedicated DEV PostgreSQL **container** approved for the event ledger; separate from n8n SQLite and AppFlowy, Mattermost, and Conversation Hub databases.
- Notion is the intended operational exception/health dashboard, not the authoritative machine event ledger.

## Not yet settled — verify before implementation
- Exact location for the new PostgreSQL Compose/deployment files within the existing DEV project layout.
- Dedicated PostgreSQL data-volume, port, and n8n connectivity details.
- DEV branch/checkout relationships and promotion process must be verified from Git rather than presumed.
- Last-edit event processing, deduplication, loop suppression, snapshot and recovery strategy are not yet implemented.
- Notion Reading Unit and Location resolution must use authoritative properties/relations, not a stale page title. Title refresh is a planned maintenance task.

## Mandatory pre-change check
Before proposing a new directory, Docker service, schema, environment setting, repo change or workflow rewrite:
1. Consult this register and the relevant existing project files.
2. Inspect actual host/repo/service state if needed.
3. Identify **confirmed**, **proposed** and **unresolved** details explicitly.
4. Make the smallest change consistent with DEV/LIVE isolation; do not invent paths.
