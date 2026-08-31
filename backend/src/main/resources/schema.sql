-- ================= USERS =================
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    avatar_url      VARCHAR(500),
    role            VARCHAR(20) NOT NULL DEFAULT 'ROLE_USER',
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================= CATEGORIES =================
CREATE TABLE IF NOT EXISTS categories (
    id              UUID PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    icon            VARCHAR(50),
    color           VARCHAR(20),
    is_default      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================= GROUPS =================
CREATE TABLE IF NOT EXISTS groups (
    id              UUID PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    created_by      UUID NOT NULL REFERENCES users(id),
    currency_code   VARCHAR(3) DEFAULT 'INR',
    invite_code     VARCHAR(12) UNIQUE NOT NULL,
    invite_expires_at TIMESTAMP WITH TIME ZONE,
    expires_at      TIMESTAMP WITH TIME ZONE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================= GROUP MEMBERS =================
CREATE TABLE IF NOT EXISTS group_members (
    id              UUID PRIMARY KEY,
    group_id        UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    joined_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id)
);

-- ================= GROUP INVITES =================
CREATE TABLE IF NOT EXISTS group_invites (
    id              UUID PRIMARY KEY,
    group_id        UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    invited_email   VARCHAR(255),
    invited_by      UUID NOT NULL REFERENCES users(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    token           VARCHAR(64) UNIQUE NOT NULL,
    expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================= GROUP BUDGETS =================
CREATE TABLE IF NOT EXISTS group_budgets (
    id              UUID PRIMARY KEY,
    group_id        UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    "month"         DATE NOT NULL,
    total_budget    NUMERIC(14,2) NOT NULL,
    set_by          UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, "month")
);

-- ================= GROUP MEMBER BUDGETS =================
CREATE TABLE IF NOT EXISTS group_member_budgets (
    id              UUID PRIMARY KEY,
    group_id        UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "month"         DATE NOT NULL,
    budget_limit    NUMERIC(14,2) NOT NULL,
    set_by          UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id, "month")
);

-- ================= PERSONAL BUDGETS =================
CREATE TABLE IF NOT EXISTS user_budgets (
    id              UUID PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id     UUID REFERENCES categories(id),
    "month"         DATE NOT NULL,
    budget_limit    NUMERIC(14,2) NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category_id, "month")
);

-- ================= EXPENSES =================
CREATE TABLE IF NOT EXISTS expenses (
    id              UUID PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id),
    category_id     UUID REFERENCES categories(id),
    group_id        UUID REFERENCES groups(id) ON DELETE SET NULL,
    paid_by         UUID REFERENCES users(id),
    amount          NUMERIC(12,2) NOT NULL,
    description     TEXT,
    expense_date    DATE NOT NULL,
    split_type      VARCHAR(20),
    receipt_url     VARCHAR(500),
    status          VARCHAR(20) NOT NULL DEFAULT 'APPROVED',
    reviewed_by     UUID REFERENCES users(id),
    reviewed_at     TIMESTAMP WITH TIME ZONE,
    review_note     VARCHAR(500),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================= EXPENSE SPLITS =================
CREATE TABLE IF NOT EXISTS expense_splits (
    id              UUID PRIMARY KEY,
    expense_id      UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id),
    share_amount    NUMERIC(12,2) NOT NULL,
    share_percent   NUMERIC(5,2),
    is_settled      BOOLEAN DEFAULT FALSE,
    settled_at      TIMESTAMP WITH TIME ZONE,
    UNIQUE(expense_id, user_id)
);

-- ================= GROUP MONTHLY REPORTS =================
CREATE TABLE IF NOT EXISTS group_monthly_reports (
    id                  UUID PRIMARY KEY,
    group_id            UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    "month"               DATE NOT NULL,
    total_spent         NUMERIC(14,2) NOT NULL,
    total_budget        NUMERIC(14,2),
    category_breakdown  TEXT,
    member_breakdown    TEXT,
    top_merchants       TEXT,
    generated_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, "month")
);

-- ================= USER NOTIFICATION SETTINGS =================
-- Exactly one settings row per user.
CREATE TABLE IF NOT EXISTS user_notification_settings (
    id                              UUID PRIMARY KEY,
    user_id                         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    in_app_notifications            BOOLEAN DEFAULT TRUE,
    email_notifications             BOOLEAN DEFAULT TRUE,
    overall_budget_enabled          BOOLEAN DEFAULT TRUE,
    overall_budget_thresholds       TEXT,
    overall_budget_threshold_type   VARCHAR(10) DEFAULT 'PERCENTAGE',
    category_budget_enabled         BOOLEAN DEFAULT TRUE,
    category_budget_thresholds      TEXT,
    category_budget_threshold_type  VARCHAR(10) DEFAULT 'PERCENTAGE',
    total_expenditure_enabled       BOOLEAN DEFAULT FALSE,
    total_expenditure_thresholds    TEXT,
    total_expenditure_threshold_type VARCHAR(10) DEFAULT 'AMOUNT',
    monthly_summary_enabled         BOOLEAN DEFAULT FALSE,
    budget_update_enabled           BOOLEAN DEFAULT TRUE,
    expiry_date_update_enabled      BOOLEAN DEFAULT TRUE,
    payment_approval_enabled        BOOLEAN DEFAULT TRUE,
    created_at                      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at                      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_notification_settings_user UNIQUE (user_id)
);

-- ================= CATEGORY EXPENSE LIMITS =================
-- Per-user, per-category monthly spending notification limits.
CREATE TABLE IF NOT EXISTS category_expense_limits (
    id              UUID PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id     UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    limit_amount    NUMERIC(12,2) NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category_id)
);

-- ================= BUDGET NOTIFICATION EVENTS =================
-- Idempotency ledger: prevents duplicate threshold notifications per budget period.
-- dedup_key is computed by the application as
--   month|threshold|notificationType|userId|budgetId|categoryId|groupId
-- (null ids are represented by '-' so NULLs do not defeat the unique constraint,
--  which PostgreSQL would otherwise treat as distinct).
-- The UNIQUE constraint on dedup_key is the source of truth (survives concurrent
-- expense requests).
CREATE TABLE IF NOT EXISTS budget_notification_events (
    id                  UUID PRIMARY KEY,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    budget_id           UUID,
    category_id         UUID REFERENCES categories(id),
    group_id            UUID,
    "month"             DATE NOT NULL,
    threshold           INTEGER NOT NULL,
    notification_type   VARCHAR(50) NOT NULL,
    dedup_key           VARCHAR(255) NOT NULL,
    triggered_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_budget_notification_event_dedup UNIQUE (dedup_key)
);

-- ================= MONTHLY NOTIFICATION LOGS =================
-- Prevents duplicate monthly summary emails.
CREATE TABLE IF NOT EXISTS monthly_notification_logs (
    id                  UUID PRIMARY KEY,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "month"             DATE NOT NULL,
    notification_type   VARCHAR(50) NOT NULL,
    sent_at             TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_monthly_notification_log UNIQUE (user_id, "month", notification_type)
);

-- ================= NOTIFICATIONS =================
CREATE TABLE IF NOT EXISTS notifications (
    id              UUID PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(50) NOT NULL,
    title           VARCHAR(200) NOT NULL,
    message         TEXT,
    reference_id    UUID,
    reference_type  VARCHAR(50),
    is_read         BOOLEAN DEFAULT FALSE,
    read_at         TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================= BACKWARD-COMPATIBLE COLUMN ADDITIONS =================
-- Category classification metadata (keywords as JSON array in TEXT, matching existing TEXT-JSON convention).
ALTER TABLE categories ADD COLUMN IF NOT EXISTS keywords TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Expense classification provenance.
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category_source VARCHAR(20);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category_confidence DOUBLE PRECISION;

-- Receipt deduplication: SHA-256 hash of the receipt file.
-- PostgreSQL partial-index WHERE clause is omitted so the same DDL also runs
-- on H2 (test profile). NULL hashes remain unindexed-equivalent because NULLs
-- are always distinct in a unique index.
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_hash VARCHAR(64);
CREATE UNIQUE INDEX IF NOT EXISTS idx_expenses_receipt_hash ON expenses(receipt_hash);

-- Invite email delivery tracking.
ALTER TABLE group_invites ADD COLUMN IF NOT EXISTS email_status VARCHAR(20);
ALTER TABLE group_invites ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE group_invites ADD COLUMN IF NOT EXISTS email_failure_reason TEXT;

-- Group expiry date.
ALTER TABLE groups ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Notification threshold type fields.
ALTER TABLE user_notification_settings ADD COLUMN IF NOT EXISTS overall_budget_threshold_type VARCHAR(10) DEFAULT 'PERCENTAGE';
ALTER TABLE user_notification_settings ADD COLUMN IF NOT EXISTS category_budget_threshold_type VARCHAR(10) DEFAULT 'PERCENTAGE';
ALTER TABLE user_notification_settings ADD COLUMN IF NOT EXISTS total_expenditure_threshold_type VARCHAR(10) DEFAULT 'AMOUNT';

-- Group notification settings.
ALTER TABLE user_notification_settings ADD COLUMN IF NOT EXISTS budget_update_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE user_notification_settings ADD COLUMN IF NOT EXISTS expiry_date_update_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE user_notification_settings ADD COLUMN IF NOT EXISTS payment_approval_enabled BOOLEAN DEFAULT TRUE;

-- ================= BACKWARD-COMPATIBLE BUDGET EVENT MIGRATION =================
-- Upgrade pre-existing budget_notification_events tables (created by an older
-- schema revision) to the dedup_key-based idempotency design. The table is empty
-- in practice (no code ever wrote to it before this release).
ALTER TABLE budget_notification_events ADD COLUMN IF NOT EXISTS dedup_key VARCHAR(255);
ALTER TABLE budget_notification_events DROP CONSTRAINT IF EXISTS uk_budget_notification_event;
UPDATE budget_notification_events SET dedup_key = "month" || '|' || threshold || '|' || notification_type
       || '|' || user_id || '|' || COALESCE(budget_id::text, '-') || '|' || COALESCE(category_id::text, '-') || '|' || COALESCE(group_id::text, '-')
       WHERE dedup_key IS NULL;
ALTER TABLE budget_notification_events ALTER COLUMN dedup_key SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uk_budget_notification_event_dedup ON budget_notification_events(dedup_key);

-- ================= INDEXES =================
CREATE INDEX IF NOT EXISTS idx_budget_notification_events_lookup ON budget_notification_events(user_id, "month");
CREATE INDEX IF NOT EXISTS idx_monthly_notification_logs_user ON monthly_notification_logs(user_id, "month");
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id, status);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id, status);
CREATE INDEX IF NOT EXISTS idx_expenses_group_date ON expenses(group_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expense_splits_user ON expense_splits(user_id, is_settled);
CREATE INDEX IF NOT EXISTS idx_group_member_budgets_lookup ON group_member_budgets(group_id, user_id, "month");
CREATE INDEX IF NOT EXISTS idx_user_budgets_lookup ON user_budgets(user_id, "month");
CREATE INDEX IF NOT EXISTS idx_group_invites_token ON group_invites(token);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_created_by ON categories(created_by);
CREATE INDEX IF NOT EXISTS idx_category_expense_limits_user ON category_expense_limits(user_id);
