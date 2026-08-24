# Frontend — React SPA

React 18 · Vite 5 · plain CSS with design tokens. No router — navigation is a **tab-based** single page driven by context state.

## 1. Application Shell

```
main.jsx
└── App.jsx
    └── AuthProvider                     # session gate
        ├── OnboardingPage               # unauthenticated: login / signup / feature demo
        └── ExpenseProvider              # authenticated app data
            ├── Navbar                   # top bar, month switcher, notification bell
            ├── Sidebar                  # tab navigation (activeTab)
            ├── <main> — activeTab switch:
            │     dashboard → DashboardPage
            │     expenses  → ExpenseTable
            │     groups    → GroupsPage
            │     group-detail → GroupDetailPage
            │     budget-settings · notification-settings
            │     scan → ReceiptScanner
            │     analytics → AnalyticsCharts
            │     categories → CategoriesManager
            ├── ExpenseFormModal          # global add-expense modal
            ├── NotificationDrawer        # in-app notifications panel
            └── Toast                     # global toast (success/error/info)
```

## 2. State Management (Context API)

### `AuthContext.jsx`
* `currentUser`, `isAuthenticated`, `isLoading` (session restore via `authApi.me()`).
* `login()`, `signup()`, `logout()`, `updateCurrentUser()`.

### `ExpenseContext.jsx` — the data hub
| Category | Contents |
|---|---|
| Data | `expenses` (personal), `categories`, `groups`, `notifications`, `personalBudgetStatus`, `unreadNotifCount` |
| Sync | **`dataVersion` + `bumpDataVersion()`** — incremented after every mutation; pages watch it and refetch instantly (no global store needed) |
| UI | `activeTab`, `activeGroupId`, `currentMonth`, toast queue, modal flags (`isAddModalOpen`, `isNotifDrawerOpen`, group/budget/invite modals) |
| Actions | `fetchAll`, `addExpense`, `deleteExpense`, `settleSplitShare`, group actions (`createGroup`, `joinGroup`, `leaveGroup`, `removeMember`, `updateMemberRole`, **`updateGroupInfo`**), budgets (`updateGroupBudget`, `updateMemberBudgetCap`, `updatePersonalBudget`), categories, notifications, receipt scan simulation |

**Data flow pattern:** component calls an action → action hits the API via `services/api.js` → updates local state optimistically where safe → `bumpDataVersion()` → dependent pages refetch.

## 3. API Client (`services/api.js`)

* Thin wrapper over native `fetch`; base URL from `VITE_API_BASE_URL`.
* Auto-attaches `Authorization: Bearer <token>` from `localStorage` (`expense_tracker_token`); exports `getToken/setToken/clearToken`.
* Query-param builder, FormData support (receipt upload), 204 handling, and rich errors (`err.status`, `err.data.message`) surfaced by toasts.
* Namespaced endpoints: `authApi`, `usersApi`, `categoriesApi`, `expensesApi` (incl. `review(id,{action,note})` for approvals), `groupsApi` (members, invites, expenses incl. `?status=`, budgets, reports), `budgetsApi`, `categoryLimitsApi`, `notificationsApi`, `systemApi`.

## 4. Feature Walkthrough

### Expenses
* **`components/expenses/ExpenseTable.jsx`** — date-grouped card list with search, category pills, Personal/Group filter; split chips show settled state (green) with inline "Settle" button for the user's own share.
* **`ExpenseFormModal.jsx`** — amount/description/category/date, optional group split section (paid-by select, EQUAL/PERCENT/CUSTOM editor with sum validation ±0.5).

### Groups & Admin Verification Workflow
* **`pages/GroupsPage.jsx`** — grid of `GroupCard`s, create/join modals.
* **`pages/GroupDetailPage.jsx`** — header (avatar, role badge, member/spent/currency stats, invite code, expiry countdown with expired/expiring-soon alerts) and five sub-tabs:

| Sub-tab | Highlights |
|---|---|
| Overview | Category breakdown bars, top expenses, **admin-only Group Expiry setter** (instantly syncs to context via `updateGroupInfo`) |
| Expenses | Per-expense status badge (**Pending Approval / Verified / Rejected**), amber/red row tinting, rejection reason display, "Verified by …" line, **admin Verify Payment / Reject controls with mandatory reason input**, plus the admin banner *"N payments awaiting your approval"* with Review Now shortcut |
| Members | Role badges, promote/demote, remove, leave |
| Settlements | "Who owes whom" rows (approved expenses only) |
| Budget | Group progress bar + per-member caps editable by admins |

Role logic: `const isAdmin = members.find(m => m.userId === currentUser.id)?.role === 'ADMIN'` — every admin control is gated on it; the backend re-enforces authorization.

### Budgets & Analytics
* `BudgetSettingsPage` + `components/budget/*` (progress bars, alert banners using `status-ok/warning/exceeded` classes).
* `AnalyticsCharts` / `TopSpendersCard` — Recharts visualizations of personal/group spend.

### Notifications
* `NotificationDrawer` lists in-app notifications with unread highlighting; bell shows `unreadNotifCount`; settings page toggles channels/alert types.

### Receipt Scan & Categories
* `ReceiptScanner` uploads a photo (`expensesApi.scan` → Gemini OCR) into a pre-filled draft.
* `CategoriesManager` + `CategorySearchSelect` manage custom categories with icons.

## 5. Styling System (`src/index.css`)

No Tailwind/CSS-in-JS — semantic classes + CSS custom properties:

| Token group | Examples |
|---|---|
| Surfaces | `--bg-body --bg-card --bg-surface --bg-muted` |
| Lines & text | `--border --border-accent --text-primary --text-secondary --text-muted --text-faint` |
| Accent | `--accent (#2563eb) --accent-light` |
| Radius/shadow/motion | `--r-sm…--r-full --shadow-sm/--shadow-modal --t-fast` |

Common classes: `btn btn-primary/secondary/ghost/danger/emerald (+btn-xs/sm/lg/icon)`, `badge badge-blue/green/amber/red/violet/indigo/emerald/rose`, `card`, `input-field/input-label/input-group`, `modal-backdrop`, `progress-track/progress-fill`, `skeleton`, `spinner(-sm/md/lg)`. Inline styles reference tokens (e.g. `color: 'var(--text-muted)'`). Currency is formatted with `toLocaleString('en-IN')` (₹). Icons come from `lucide-react`.

## 6. Configuration

```bash
cp .env.example .env      # then set:
VITE_API_BASE_URL=http://localhost:8080
VITE_GEMINI_API_KEY=       # optional client-side AI features
```

## 7. Run

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production bundle → dist/
npm run preview   # serve the build locally
```
