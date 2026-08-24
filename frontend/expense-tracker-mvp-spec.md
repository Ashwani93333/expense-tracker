1. hey check for instant update fileds when user click to sumbit or done etc process makr and updat ethe data at evry page ... and also updat ethe onboarding page make it long =er to scroll and add some animation show our feactures ai scab its budget expense all

Later on-- impact features

1. Recurring expenses — rent/subscriptions auto-created on schedule (Expense has no recurrence field yet)
2. CSV/PDF export — export expenses & group reports; also bank statement import
3. Dark mode — your styling is inline CSS vars, easy win via data-theme
4. Debt simplification — minimize transactions in SettlementService (A→B→C instead of 3 transfers)
Engagement / polish
5. Savings goals — target amount + progress bar, ties into existing budget alerts
6. Real-time group updates — WebSockets so members see new expenses/balances live
7. Comments/reactions on expenses — great for group disputes
8. Calendar view of expenses per month
Bigger bets
9. AI insights — spending anomaly detection, month-over-month forecast (you already have rule-based classification to build on)
10. Multi-currency support — travel groups with conversion rates
11. 2FA + OAuth login on top of JWT
12. PWA/offline mode — mobile-installable, queue expenses offline



# Expense Tracker — Group & Budget Extension Spec (React + Spring Boot)
**Extends**: the Web MVP Build Spec (Auth, Manual Entry, Receipt Scan, Categories, Day-wise View, Monthly Report, Analytics, Notifications).
**New scope**: Groups (create/join), group budgets, per-member budget limits inside a group, distributed/split expense tracking, personal budgets with spend-limit enforcement, budget-aware notifications.

---

## 1. New Feature Set (what's being added)

| # | Feature | Description |
|---|---|---|
| 1 | Personal budget | Every user can set an overall monthly budget (and optional per-category budgets) and track spend against it |
| 2 | Groups | A user can create a group or join one via invite code/link. A group has an admin (creator, promotable) and members |
| 3 | Group budget | Group admin sets a total group budget for a month; all members see live spend vs. that budget |
| 4 | Per-member budget inside a group | Admin (or the member, if allowed) sets an individual spend limit inside the group so no single member overspends the shared pool |
| 5 | Distributed / split expenses | An expense logged inside a group can be split across members (equal, percentage, or custom amount) with per-person owed/settled tracking |
| 6 | Group analytics | Category split, trend, top spenders, and budget-utilization view scoped to the group |
| 7 | Budget-aware notifications | Threshold (e.g. 80%) and over-budget alerts, both personal and group-scoped |
| 8 | Settlements (lightweight) | "Who owes whom" summary per group per month (no payment processing in this phase — marking as settled is manual) |

**Still OUT of scope** (unchanged from MVP, plus): real payment/settlement integration (UPI/Stripe payout), multi-currency conversion across group members, recurring expenses, export to PDF/CSV, offline-first sync.

---

## 2. How Groups & Budgets Work (product logic)

1. A user creates a group → becomes `ADMIN` automatically → gets a shareable `invite_code`.
2. Other users join via the invite code (or an emailed invite link) → become `MEMBER`.
3. The admin sets a **group budget** for the current month (a single `total_budget` number).
4. The admin can optionally allocate **per-member budget caps** that must sum to ≤ the group budget (soft-enforced in the UI, hard-validated in the backend).
5. Any member can log a **group expense**. At creation time they choose a split strategy:
   - `EQUAL` — divided evenly among selected members
   - `PERCENT` — custom percentage per member (must sum to 100)
   - `CUSTOM` — exact custom amount per member (must sum to the expense total)
6. Each split expense contributes to both the **group's total spend** and the **paying/owing member's individual spend** inside that group, which is checked against their per-member cap.
7. If a member's group spend crosses their cap (or the group crosses its total budget), a notification fires — the expense is still allowed to save (soft limit) but is flagged, matching how most budgeting apps behave (no hard blocking of legitimate spend).
8. A personal (non-group) budget works the same way but scoped to `user_id` only, independent of any group.

---

## 3. Database Schema Additions (PostgreSQL)

```sql
-- ================= GROUPS =================
CREATE TABLE groups (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    created_by      UUID NOT NULL REFERENCES users(id),
    currency_code   VARCHAR(3) DEFAULT 'INR',
    invite_code     VARCHAR(12) UNIQUE NOT NULL,   -- short shareable code
    invite_expires_at TIMESTAMPTZ,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ================= GROUP MEMBERS =================
CREATE TABLE group_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id        UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL DEFAULT 'MEMBER',  -- ADMIN | MEMBER
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | LEFT | REMOVED
    joined_at       TIMESTAMPTZ DEFAULT now(),
    UNIQUE(group_id, user_id)
);

-- ================= GROUP INVITES (email/link invites, distinct from the group's standing invite_code) =================
CREATE TABLE group_invites (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id        UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    invited_email   VARCHAR(255),
    invited_by      UUID NOT NULL REFERENCES users(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING | ACCEPTED | EXPIRED | REVOKED
    token           VARCHAR(64) UNIQUE NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ================= GROUP BUDGETS (one row per group per month) =================
CREATE TABLE group_budgets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id        UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    month           DATE NOT NULL,              -- first day of month
    total_budget    NUMERIC(14,2) NOT NULL,
    set_by          UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(group_id, month)
);

-- ================= PER-MEMBER BUDGET CAP INSIDE A GROUP =================
CREATE TABLE group_member_budgets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id        UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month           DATE NOT NULL,
    budget_limit    NUMERIC(14,2) NOT NULL,
    set_by          UUID NOT NULL REFERENCES users(id),  -- admin, or self if self-service allowed
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(group_id, user_id, month)
);

-- ================= PERSONAL (NON-GROUP) BUDGETS =================
CREATE TABLE user_budgets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id     UUID REFERENCES categories(id),   -- NULL = overall monthly budget
    month           DATE NOT NULL,
    budget_limit    NUMERIC(14,2) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, category_id, month)
);

-- ================= EXPENSES: extend existing table =================
ALTER TABLE expenses
    ADD COLUMN group_id     UUID REFERENCES groups(id) ON DELETE SET NULL,
    ADD COLUMN paid_by      UUID REFERENCES users(id),        -- who actually paid (defaults to user_id)
    ADD COLUMN split_type   VARCHAR(20);                      -- NULL | EQUAL | PERCENT | CUSTOM

-- ================= EXPENSE SPLITS (per-member share of a group expense) =================
CREATE TABLE expense_splits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id      UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id),
    share_amount    NUMERIC(12,2) NOT NULL,
    share_percent   NUMERIC(5,2),               -- populated only if split_type = PERCENT
    is_settled      BOOLEAN DEFAULT FALSE,
    settled_at      TIMESTAMPTZ,
    UNIQUE(expense_id, user_id)
);

-- ================= GROUP MONTHLY REPORT SNAPSHOT (precomputed, mirrors monthly_reports) =================
CREATE TABLE group_monthly_reports (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id            UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    month               DATE NOT NULL,
    total_spent         NUMERIC(14,2) NOT NULL,
    total_budget        NUMERIC(14,2),
    category_breakdown  JSONB,
    member_breakdown    JSONB,          -- [{user_id, name, spent, budget_limit, pct_used}]
    top_merchants       JSONB,
    generated_at        TIMESTAMPTZ DEFAULT now(),
    UNIQUE(group_id, month)
);

-- ================= INDEXES =================
CREATE INDEX idx_group_members_user ON group_members(user_id, status);
CREATE INDEX idx_group_members_group ON group_members(group_id, status);
CREATE INDEX idx_expenses_group_date ON expenses(group_id, expense_date DESC) WHERE group_id IS NOT NULL;
CREATE INDEX idx_expense_splits_user ON expense_splits(user_id, is_settled);
CREATE INDEX idx_group_member_budgets_lookup ON group_member_budgets(group_id, user_id, month);
CREATE INDEX idx_user_budgets_lookup ON user_budgets(user_id, month);
CREATE INDEX idx_group_invites_token ON group_invites(token);

-- ================= NOTIFICATIONS: extend allowed types =================
-- notifications.type now also includes:
--   GROUP_INVITE, GROUP_JOIN_REQUEST, GROUP_BUDGET_SET,
--   BUDGET_THRESHOLD_REACHED, BUDGET_EXCEEDED,
--   GROUP_BUDGET_THRESHOLD_REACHED, GROUP_BUDGET_EXCEEDED,
--   EXPENSE_SPLIT_ASSIGNED
```

**Data-integrity notes**
- `expense_splits` amounts must sum to `expenses.amount` for that expense — validated in `ExpenseSplitService`, not just the DB (Postgres `CHECK` across rows isn't practical; enforce in a `@Transactional` service method + a nightly reconciliation job).
- Deleting a group member (`status = REMOVED`) does **not** delete their historical `expense_splits` — keep them for report accuracy, just block new expenses from including that user.
- `group_member_budgets` caps are advisory (soft limit) unless the org later wants hard blocking — keep it soft for MVP+1 to avoid punishing legitimate spend.

---

## 4. New / Updated API Endpoints

### Groups
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/groups` | Create a group (creator becomes ADMIN) |
| GET | `/api/groups` | List groups the current user belongs to |
| GET | `/api/groups/{id}` | Group details + members |
| PATCH | `/api/groups/{id}` | Update group name/description (admin only) |
| DELETE | `/api/groups/{id}` | Archive/deactivate group (admin only) |
| POST | `/api/groups/{id}/invites` | Generate an email/link invite |
| POST | `/api/groups/join` | Join via invite code or invite token |
| DELETE | `/api/groups/{id}/members/{userId}` | Remove a member (admin only) |
| POST | `/api/groups/{id}/leave` | Current user leaves the group |
| PATCH | `/api/groups/{id}/members/{userId}/role` | Promote/demote ADMIN ↔ MEMBER |

### Budgets
| Method | Endpoint | Purpose |
|---|---|---|
| PUT | `/api/users/me/budget?month=2026-08` | Set/update personal overall (or per-category) budget |
| GET | `/api/users/me/budget/status?month=2026-08` | Personal budget vs. actual spend |
| PUT | `/api/groups/{id}/budget?month=2026-08` | Set/update group total budget (admin only) |
| GET | `/api/groups/{id}/budget/status?month=2026-08` | Group budget vs. actual spend, live |
| PUT | `/api/groups/{id}/members/{userId}/budget?month=2026-08` | Set a member's cap inside the group |
| GET | `/api/groups/{id}/members/budgets?month=2026-08` | All member caps + utilization for the group |

### Distributed / Group Expenses
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/groups/{id}/expenses` | Log a group expense with a `splits[]` payload |
| GET | `/api/groups/{id}/expenses?month=2026-08` | Group's day/month expense feed |
| PATCH | `/api/expenses/{id}/splits` | Edit an expense's split allocation |
| PATCH | `/api/expenses/{id}/splits/{userId}/settle` | Mark a member's share as settled |
| GET | `/api/groups/{id}/settlements?month=2026-08` | "Who owes whom" net summary |
| GET | `/api/groups/{id}/reports/monthly?month=2026-08` | Group monthly report (spend, budget, member breakdown) |
| GET | `/api/groups/{id}/reports/analytics?month=2026-08` | Chart-ready group analytics |

---

## 5. Backend Module Layout (additions)

```
com.expensetracker
├── group/
│   ├── GroupController.java
│   ├── GroupService.java
│   ├── GroupMemberService.java
│   ├── GroupInviteService.java          # invite code/token generation + validation
│   └── GroupRoleGuard.java              # @PreAuthorize-style admin checks
├── budget/
│   ├── BudgetController.java            # personal budget endpoints
│   ├── GroupBudgetController.java
│   ├── BudgetService.java               # shared calc logic (spend vs limit, % used)
│   └── BudgetThresholdEvaluator.java    # fires notifications at 80%/100% thresholds
├── expense/
│   ├── ExpenseSplitService.java         # validates & persists split allocations
│   └── SettlementService.java           # net owed/owes computation per group
├── report/
│   └── GroupReportService.java          # group_monthly_reports aggregation
└── notification/
    └── NotificationService.java         # extended with GROUP_* and BUDGET_* types
```

**Key backend behaviors**
- `ExpenseSplitService.createSplitExpense()` runs in a single transaction: insert `expenses` row → insert N `expense_splits` rows → recompute affected members' spend → call `BudgetThresholdEvaluator` for each affected member and the group.
- `BudgetThresholdEvaluator` is called on every expense write (personal or group) — cheap read of current-month aggregate (indexed), compares to `user_budgets`/`group_member_budgets`/`group_budgets`, and enqueues a notification job if a threshold (configurable, default 80% and 100%) is crossed for the first time this month (idempotency flag stored on the notification, or a `budget_alerts_sent` small table keyed by `(user_id/group_id, month, threshold)` to avoid duplicate spam).
- `GroupRoleGuard` centralizes the "must be ADMIN of this group" check used across budget-set, invite, and member-removal endpoints.

---

## 6. Backend Architecture & Scalability Notes ("how many users can it handle")

This stays a **modular monolith** (single Spring Boot deployable) through MVP+1 — splitting into microservices this early adds ops overhead without a real scaling need yet. Scale guidance:

| Stage | Approx. users | What's needed |
|---|---|---|
| MVP / early launch | Up to ~10K registered, ~1K daily active | Single Spring Boot instance (2 vCPU / 2GB is plenty), single Postgres (Neon free/starter tier), no caching layer needed. The indexes in §3 are enough. |
| Growth | ~10K–100K registered, ~10K DAU | Move to a managed Postgres with connection pooling (PgBouncer), add a Redis cache for hot reads — group budget status and monthly report snapshots are the two most-read, most-expensive aggregates. Horizontally scale the Spring Boot app behind a load balancer (stateless, JWT auth makes this trivial). |
| Scale-up | 100K+ registered, 50K+ DAU | Read replicas for Postgres for report/analytics queries (keep writes on primary). Move `MonthlyReportScheduler` / `GroupReportService` snapshot generation to an async worker/queue (e.g. a lightweight job runner or SQS-style queue) so report generation never blocks request threads. Consider partitioning `expenses` and `expense_splits` by month if a single group can have very high expense volume. |

**Group-specific scaling consideration**: `group_budgets`, `group_member_budgets`, and `expense_splits` are all narrow, indexed, low-row-count-per-group tables — a group's budget-status read is O(members) not O(all expenses) because it should read from `group_monthly_reports` (the precomputed snapshot), falling back to a live aggregation query only when the snapshot is stale (e.g. today's data before the next scheduled recompute). Recommend recomputing the snapshot on-write for a group's current month (cheap, since group expense volume is naturally small — dozens to low hundreds per month per group) rather than waiting for a nightly job, so budget bars feel real-time.

No hard architectural ceiling exists in this design until you're well past 500K+ users; the numbers above are practical staging points, not hard limits — treat them as "when to invest in the next layer," not capacity walls.

---

## 7. Frontend: New Pages & Components

```
src/
├── pages/
│   ├── GroupsPage.jsx            # list of groups user belongs to + "Create" / "Join" CTAs
│   ├── GroupDetailPage.jsx       # group dashboard: budget bar, member list, expense feed, tabs
│   ├── GroupAnalyticsPage.jsx    # group-scoped charts (reuses analytics components)
│   ├── GroupSettlementsPage.jsx  # "who owes whom" summary
│   └── BudgetSettingsPage.jsx    # personal budget setup (overall + per-category)
├── components/
│   ├── groups/
│   │   ├── GroupCard.jsx             # groups list item with budget mini-progress
│   │   ├── CreateGroupModal.jsx      # name, description, currency
│   │   ├── JoinGroupModal.jsx        # enter invite code
│   │   ├── InviteMemberModal.jsx     # generate/share invite link, email invite
│   │   ├── GroupMemberList.jsx       # avatars, roles, per-member budget usage
│   │   ├── GroupRoleBadge.jsx        # ADMIN / MEMBER pill
│   │   └── RemoveMemberConfirm.jsx
│   ├── budget/
│   │   ├── BudgetProgressBar.jsx     # reusable: label, spent, limit, color by % used
│   │   ├── BudgetForm.jsx            # set/edit a budget_limit (personal or group)
│   │   ├── MemberBudgetTable.jsx     # admin view: each member's cap + used%
│   │   └── BudgetAlertBanner.jsx     # inline warning when threshold crossed
│   ├── expenses/
│   │   ├── ExpenseSplitSelector.jsx  # EQUAL / PERCENT / CUSTOM toggle + per-member inputs
│   │   ├── SplitSummaryRow.jsx       # shows each member's share in the expense form/review
│   │   └── SettleShareButton.jsx     # mark a split as settled
│   └── analytics/
│       └── TopSpendersCard.jsx       # group-scoped equivalent of TopMerchantsCard
├── hooks/
│   ├── useGroups.js               # list/create/join/leave group
│   ├── useGroupMembers.js
│   ├── useGroupBudget.js          # group + per-member budget CRUD & status
│   ├── useUserBudget.js           # personal budget CRUD & status
│   ├── useExpenseSplits.js        # create/edit splits, settle
│   └── useSettlements.js
└── context/
    └── ActiveGroupContext.jsx     # currently selected group (persisted in localStorage/URL param)
```

**UI/UX notes**
- `BudgetProgressBar` is the one shared visual language across personal budgets, group budgets, and per-member caps: green (<70%), amber (70–99%), red (≥100%) — used on `DashboardPage`, `GroupDetailPage`, and `GroupCard`.
- Expense form (`ExpenseFormModal`) gets a new optional "Log to a group" toggle; selecting a group reveals `ExpenseSplitSelector` inline.
- `GroupDetailPage` tabs: **Overview** (budget bar + recent expenses), **Members** (list + per-member budget/usage, admin-only edit), **Analytics**, **Settlements**.
- Non-admin members can view but not edit the group budget or other members' caps unless the admin has enabled self-service caps (a group-level toggle you can add later — not MVP+1 default).

---

## 8. Notification Triggers (additions)

| Trigger | When | Channel |
|---|---|---|
| Added to a group | User accepts an invite / is added | In-app + Web Push |
| Group budget set/updated | Admin sets or changes the month's group budget | In-app (all members) |
| Group budget 80% reached | Group's aggregate monthly spend crosses 80% of `total_budget` | Web Push + in-app |
| Group budget exceeded | Group's aggregate spend crosses 100% | Web Push + in-app, flagged red |
| Personal budget 80% reached | User's own monthly spend crosses 80% of `user_budgets.budget_limit` | Web Push + in-app |
| Personal budget exceeded | Crosses 100% | Web Push + in-app |
| Member budget cap reached (group) | A member's own spend inside a group crosses their `group_member_budgets` cap | In-app to that member + admin |
| Expense split assigned | Someone logs a group expense that includes you in the split | In-app + Web Push |

---

## 9. Suggested Build Order (this extension, layered on top of MVP steps 1–9)

1. **Groups core** — `groups`, `group_members` tables, create/join/leave/list endpoints, `GroupsPage` + `CreateGroupModal` + `JoinGroupModal`.
2. **Group membership management** — invites (`group_invites`), member list, role promote/demote, `GroupMemberList`.
3. **Personal budgets** — `user_budgets` table, set/status endpoints, `BudgetSettingsPage`, `BudgetProgressBar` on `DashboardPage`.
4. **Group budgets** — `group_budgets`, `group_member_budgets`, admin-only set endpoints, budget status on `GroupDetailPage`.
5. **Split expenses** — extend `expenses` + new `expense_splits`, `ExpenseSplitService`, `ExpenseSplitSelector` in the expense form.
6. **Budget threshold notifications** — `BudgetThresholdEvaluator`, extend `notifications.type`, `BudgetAlertBanner`.
7. **Settlements** — `SettlementService` net-owed computation, `GroupSettlementsPage`, `SettleShareButton`.
8. **Group analytics & reports** — `group_monthly_reports`, `GroupReportService`, `GroupAnalyticsPage`, `TopSpendersCard`.
9. **Scale hardening** (only once real usage justifies it) — Redis cache for budget-status reads, PgBouncer, snapshot-on-write for `group_monthly_reports`.

---

## 10. Definition of Done (additions)

- [ ] User can create a group and receives a shareable invite code
- [ ] Another user can join that group via the invite code
- [ ] Group admin can set a total monthly group budget, visible to all members as a live progress bar
- [ ] Group admin can set (or the system enforces) a per-member spend cap inside the group, and members see their own usage against it
- [ ] Any member can log an expense to the group and split it EQUAL / PERCENT / CUSTOM across chosen members
- [ ] Each member's dashboard reflects their share of group expenses against their personal and/or group-member budget
- [ ] Users get a notification at 80% and 100% of a budget (personal or group), without duplicate spam within the same month
- [ ] A group's "who owes whom" settlement view is accurate and a member can mark their share as settled
- [ ] Group analytics page shows category split, spend trend, and top spenders scoped to that group