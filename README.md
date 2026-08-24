# 💰 Finance Expense Tracker

A full-stack expense management platform for **personal finance** and **shared group spending** — with split settlements, budgets, an admin-verified payment workflow, smart categorization, receipt OCR, and a multi-channel notification system.

| Layer    | Technology                                                                 |
|----------|----------------------------------------------------------------------------|
| Frontend | React 18 · Vite 5 · Recharts · lucide-react · Context API · plain CSS (design tokens) |
| Backend  | Java 21 · Spring Boot 3.3 (Web, Security, Data JPA, Validation, Mail, Thymeleaf, WebFlux) |
| Security | JWT (jjwt 0.12) · BCrypt · Stateless sessions                              |
| Database | PostgreSQL (dev/prod) · H2 (in-memory test profile)                        |
| AI       | Google Gemini API (receipt OCR + category suggestion)                      |

> Deep dives: [`Backend.md`](./Backend.md) · [`Frontend.md`](./Frontend.md)

---

## 1. High-Level Architecture

```
┌───────────────────────────────┐         HTTPS / JSON          ┌──────────────────────────────────┐
│        React SPA (Vite)       │ ────────────────────────────► │      Spring Boot REST API        │
│                               │   Authorization: Bearer JWT   │          :8080                   │
│  AuthContext / ExpenseContext │ ◄──────────────────────────── │                                  │
│  api.js fetch client          │         JSON responses        │  Controllers → Services → Repos  │
│  Pages + modals + toasts      │                               │            │                     │
└───────────────────────────────┘                               │            ▼                     │
                                                                │      PostgreSQL / H2             │
                                                                │  (schema.sql + ddl-auto:update)  │
                                                                │                                  │
                                                                │  Side effects:                   │
                                                                │   • Gemini OCR  • SMTP mail      │
                                                                │   • Event bus (Spring Events)    │
                                                                │   • Cron scheduler               │
                                                                └──────────────────────────────────┘
```

* **Stateless API** — no server sessions; every request carries a JWT.
* **Event-driven side effects** — expense creation publishes `ExpenseCreatedEvent`; budget evaluation runs *after commit* so alert failures can never roll back a saved expense.
* **Schema management** — `schema.sql` (`CREATE TABLE IF NOT EXISTS`) bootstraps fresh databases; Hibernate `ddl-auto: update` evolves existing ones.

---

## 2. Tech Stack & Major Libraries

### Backend (`backend/pom.xml`)
| Library | Purpose |
|---|---|
| `spring-boot-starter-web` | REST controllers, JSON serialization |
| `spring-boot-starter-security` | Filter chain, BCrypt, method security |
| `spring-boot-starter-data-jpa` | Hibernate ORM + Spring Data repositories |
| `spring-boot-starter-validation` | `@Valid` bean validation on request DTOs |
| `spring-boot-starter-mail` + `thymeleaf` | SMTP email with HTML templates (`resources/templates/mail/`) |
| `spring-boot-starter-webflux` | Reactive HTTP client used to call the Gemini API |
| `jjwt` (api/impl/jackson) | JWT creation & parsing (HS256, 24h expiry) |
| `postgresql` / `h2` | Production driver / in-memory test profile |
| `lombok` | Boilerplate reduction |

### Frontend (`frontend/package.json`)
| Library | Purpose |
|---|---|
| `react` / `react-dom` 18 | UI (SPA, no router — tab-based navigation via context) |
| `vite` + `@vitejs/plugin-react` | Dev server & production bundler |
| `recharts` | Dashboard & analytics charts (pie/bar/trends) |
| `lucide-react` | Icon set used across all components |
| native `fetch` | API client (`src/services/api.js`) with Bearer token injection |

---

## 3. RBAC Flow (Role-Based Access Control)

Access control happens at **two levels**: global authentication (JWT) and per-group authorization (roles inside `group_members`).

```
                    ┌────────────────────────────┐
   HTTP request     │  JwtAuthFilter             │
  ────────────────► │  • reads Bearer token      │
                    │  • validates signature/exp │
                    │  • loads UserDetails       │
                    │  • sets SecurityContext    │
                    └─────────────┬──────────────┘
                                  ▼
                    ┌────────────────────────────┐
                    │  SecurityConfig            │
                    │  /api/auth/**   → public   │
                    │  /api/system/** → public   │
                    │  anything else  → 401 w/o  │
                    │                    token   │
                    └─────────────┬──────────────┘
                                  ▼
                    ┌────────────────────────────┐
                    │  Controller resolves User  │
                    │  from @AuthenticationPrinc.│
                    └─────────────┬──────────────┘
                                  ▼
              ┌───────────────────────────────────────────┐
              │  Service layer → GroupRoleGuard           │
              │  requireMember(groupId, userId):          │
              │      membership ACTIVE? else 403          │
              │  requireAdmin(groupId, userId):           │
              │      ACTIVE + role == ADMIN? else 403     │
              └───────────────────────────────────────────┘
```

### Roles

| Scope | Role | Granted by | Powers |
|---|---|---|---|
| Global (`users.role`) | `ROLE_USER` / `ROLE_ADMIN` | Signup defaults to `ROLE_USER` | Authenticated access to own data |
| Group (`group_members.role`) | `ADMIN` | Group creator gets it automatically; admins can promote/demote members | Invite/resend/remove members, change member roles, edit group name/description/**expiry date**, set group & per-member budgets, settle others' shares, **verify/reject member payments** |
| Group | `MEMBER` | Joining via invite code/link | Log personal + group expenses, view group data, manage own splits |

**Group-admin guarded endpoints:** update group (`PATCH /api/groups/{id}`), invites, remove member, member role change, group/member budgets, and payment approval (`PATCH /api/expenses/{id}/approval`). Ownership checks additionally ensure users can only edit/delete **their own** expenses and read only expenses of groups they belong to.

---

## 4. Major Flows

### 4.1 Authentication
1. `POST /api/auth/signup` → BCrypt-hashed user + default categories seeded → JWT returned.
2. `POST /api/auth/login` → verify credentials → JWT (24h).
3. Frontend stores the token in `localStorage`, attaches it to every request, restores the session on refresh via `GET /api/auth/me`.

### 4.2 Expense Lifecycle & Admin Verification Workflow
Every group payment passes through an approval gate controlled by group admins:

```
 MEMBER creates group expense          GROUP ADMIN creates expense
 ┌──────────────────────────┐          ┌──────────────────────────┐
 │ status = PENDING         │          │ status = APPROVED        │
 │ excluded from budgets /  │          │ (auto — admin trusted)   │
 │ reports / settlements    │          └────────────┬─────────────┘
 └────────────┬─────────────┘                       │
              ▼                                     │
   Admin sees "N payments awaiting approval" banner │
              ▼                                     │
   ┌─────────────────────────────┐                  │
   │ PATCH /api/expenses/{id}    │                  │
   │      /approval              │                  │
   │ {action: APPROVE|REJECT,    │                  │
   │  note}                      │                  │
   └──────┬───────────────┬──────┘                  │
          ▼               ▼                         
     APPROVED ✓      REJECTED ✗                     
   counts toward    owner notified                 
   everything       with reason                    
```

* Personal expenses are always `APPROVED` (no workflow).
* Editing an already-approved group expense by a non-admin resets it to `PENDING` (approval cannot be bypassed).
* Rejections require a reason; both decisions notify the expense owner in-app.
* Legacy rows default to `APPROVED` via DB column default.

### 4.3 Groups & Invites
1. Create group → unique 12-char invite code (+ optional group expiry date).
2. Share code or invite link/email (`POST /api/groups/{id}/invites` builds a tokenized URL using `APP_FRONTEND_BASE_URL`).
3. `POST /api/groups/join` redeems code/token → active membership.
4. Group expiry (admin-settable, visible to all members) blocks new joins and expenses once passed.

### 4.4 Splits & Settlements
* Split types: `EQUAL`, `PERCENT`, `CUSTOM` — amounts must sum exactly to the total.
* Each member's share tracks `isSettled`; owners settle their own share, admins can settle anyone's.
* Monthly settlement graph ("who owes whom") is computed only from **approved** expenses.

### 4.5 Budgets & Threshold Alerts
* Budget scopes: personal overall/category, group overall, per-member caps.
* After each expense commits, `BudgetThresholdEvaluator` compares spend vs. limits and dispatches WARNING/EXCEEDED alerts through enabled channels.

### 4.6 Notification System

```
                          trigger sources
   ┌────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐
   │ Group      │  │ Expense      │  │ Budget       │  │ Monthly summary    │
   │ invite     │  │ split assign │  │ thresholds   │  │ cron (0 0 2 1 * *) │
   └─────┬──────┘  │ + approve/   │  │ (after-commit│  └─────────┬──────────┘
         │         │ reject       │  │  listener)   │            │
         │         └──────┬───────┘  └──────┬───────┘            │
         ▼                ▼                 ▼                    ▼
   ┌────────────────────────────────────────────────────────────────────┐
   │                    NotificationService                             │
   │   createNotification()  /  dispatchBudgetAlert() (REQUIRES_NEW)    │
   └───────────────┬───────────────────────────────────┬────────────────┘
                   ▼                                   ▼
   ┌──────────────────────────┐         ┌──────────────────────────────┐
   │ InAppNotificationService │         │ EmailNotificationService     │
   │ rows in notifications    │         │ Thymeleaf HTML templates →   │
   │ table (type, title,      │         │ SMTP (respects user prefs,   │
   │ message, refId, isRead)  │         │ failures never propagate)    │
   └───────────┬──────────────┘         └──────────────────────────────┘
               ▼
   GET /api/notifications (+ unread-count, mark-read)
   → NotificationDrawer bell in the React UI
```

Notification types include: `GROUP_INVITE`, `EXPENSE_SPLIT_ASSIGNED`, `EXPENSE_APPROVED`, `EXPENSE_REJECTED`, budget threshold alerts, and monthly summaries. Users can toggle channels (in-app / email / per-alert-type) in notification settings.

### 4.7 Smart Categorization & Receipt OCR
1. Explicit `categoryId` wins (`USER` source).
2. Otherwise `RuleBasedCategoryClassifier` matches description keywords; Gemini classifies leftovers when configured; fallback category applied below confidence thresholds.
3. `source` (`RULE_BASED | AI | USER | FALLBACK`) and confidence are stored per expense; receipt scans (`POST /api/expenses/receipt/analyze`) extract merchant/amount/date via Gemini Vision.

---

## 5. Repository Layout

```
Finance-expense-tracker/
├── backend/                  # Spring Boot service (see Backend.md)
│   ├── src/main/java/com/expensetracker/
│   │   ├── auth/  user/  category/  expense/  group/  budget/
│   │   ├── notification/  report/  classification/  storage/
│   │   ├── mail/  summary/  system/  security/  exception/
│   │   ├── model/  repository/
│   └── src/main/resources/   # application.yml, schema.sql, mail templates
├── frontend/                 # React SPA (see Frontend.md)
│   └── src/ {components, context, pages, services}
└── README.md
```

## 6. Getting Started

### Prerequisites
Java 21 · Maven (wrapper included) · Node 18+ · PostgreSQL 14+

### Backend
```bash
cd backend
cp .env.example .env          # set DB creds + JWT_SECRET (openssl rand -hex 32)
./mvnw spring-boot:run        # http://localhost:8080
# tests (H2 in-memory):
./mvnw test
```

### Frontend
```bash
cd frontend
cp .env.example .env          # VITE_API_BASE_URL=http://localhost:8080
npm install
npm run dev                   # http://localhost:5173
```

## 7. Key Configuration (environment variables)

| Variable | Purpose |
|---|---|
| `SPRING_DATASOURCE_*` | PostgreSQL connection |
| `JWT_SECRET`, `JWT_EXPIRATION_MS` | Token signing key & lifetime |
| `GEMINI_API_KEY` | Receipt OCR + AI classification |
| `MAIL_*` | SMTP credentials for notification emails |
| `APP_FRONTEND_BASE_URL` | Base URL used inside invite/alert emails |
| `CLASSIFICATION_*` | Auto-assign/warn confidence thresholds, fallback category |
| `MONTHLY_SUMMARY_CRON` | Monthly report schedule (default: 1st, 02:00) |
| `VITE_API_BASE_URL` | Frontend → backend base URL |
