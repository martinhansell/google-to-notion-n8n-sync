
-- DEV Bible Reading Synchronisation Ledger
-- Migration 001

CREATE TABLE IF NOT EXISTS sync_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_key TEXT NOT NULL UNIQUE,
    origin TEXT NOT NULL
        CHECK (origin IN ('Google', 'Notion')),
    entity_type TEXT NOT NULL
        CHECK (entity_type IN
            ('Session', 'Assignment', 'Facilitator')),
    external_id TEXT,
    notion_page_id TEXT,
    changed_at TIMESTAMPTZ NOT NULL,
    changed_fields JSONB NOT NULL DEFAULT '[]',
    event_payload JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'RECEIVED'
        CHECK (status IN
            ('RECEIVED', 'APPLIED', 'IGNORED',
             'REVIEW', 'FAILED')),
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sync_events_pending
    ON sync_events (status, changed_at);

CREATE TABLE IF NOT EXISTS sync_field_state (
    entity_type TEXT NOT NULL,
    external_id TEXT NOT NULL,
    field_name TEXT NOT NULL,
    last_synced_value JSONB,
    last_synced_at TIMESTAMPTZ,
    last_event_key TEXT,
    PRIMARY KEY (entity_type, external_id, field_name)
);

CREATE TABLE IF NOT EXISTS sync_operations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id BIGINT REFERENCES sync_events(id),
    entity_type TEXT NOT NULL,
    external_id TEXT NOT NULL,
    field_name TEXT NOT NULL,
    target_system TEXT NOT NULL
        CHECK (target_system IN ('Google', 'Notion')),
    attempted_value JSONB,
    status TEXT NOT NULL
        CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT
);
