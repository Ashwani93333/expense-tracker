# Backend — Spring Boot API

Java 21 · Spring Boot 3.3.3 · Maven wrapper (`mvnw`). Base package: `com.expensetracker`.

## 1. Architecture Overview

| Layer | Technology | Role |
|---|---|---|
| Runtime | Java 21 + Spring Boot 3.3.3 | Embedded Tomcat, auto-config, dependency injection |
| Build | Maven (wrapper `mvnw`) | Dependency management, multi-profile packaging |
| Web | Spring MVC (`spring-boot-starter-web`) | REST controllers, request validation, content negotiation |
| Security | Spring Security + JJWT 0.12.6 | Stateless JWT filter chain (HS256), BCrypt password hashing |
| Persistence | Spring Data JPA + Hibernate | Repository pattern, `ddl-auto: update`, schema.sql bootstrap |
| Database | PostgreSQL (prod) / H2 (test) | Relational storage with JSON converters for enums |
| Reactive client | Spring WebFlux (`WebClient`) | Gemini AI classification and receipt OCR calls |
| Email | Spring Mail + Thymeleaf | SMTP delivery, HTML templates for alerts and invites |
| Code gen | Lombok | `@Data`, `@Builder`, `@Slf4j` — excluded from production jar |
| Events | `ApplicationEventPublisher` + `@TransactionalEventListener` | Post-commit budget evaluation, idempotent alert dispatch |
| Scheduling | `@Scheduled` (cron) | Monthly summary job (1st of month at 02:00) |
| Error handling | `@RestControllerAdvice` + `GlobalExceptionHandler` | Uniform `{message, status, ...}` error responses |

**Design pattern — layered monolith:**

```
HTTP request
   │
   ▼
Controller (validate DTO, resolve @AuthenticationPrincipal)
   │
   ▼
Service (business logic, transactional, publishes events)
   │
   ▼
Repository (Spring Data JPA interface → Hibernate → PostgreSQL)
```

* Entities are never exposed directly — DTOs sit at every boundary.
* Authorization is service-layer driven (`GroupRoleGuard`), not annotation-based.
* Cross-cutting concerns (validation, security, exceptions) are handled by Spring-managed interceptors and advice.

## 2. Module Map

```
com.expensetracker
├── auth/            AuthController, AuthService, dto (LoginRequest, SignupRequest, AuthResponse, UserDto)
├── user/            profile CRUD + notification-settings endpoints
├── category/        CategoryService + DefaultCategorySeeder (auto-seeds on signup),
│                    CategoryKeywords (rule engine), dto
├── expense/         ExpenseController/Service, ExpenseSplitService,
│                    ExpenseCreatedEvent, dto (Create/Update/Split/ExpenseDto/ReviewExpenseRequest)
│    └── ocr/        ReceiptAnalysisController/Service (Gemini Vision via WebFlux)
├── group/           GroupController/Service, GroupRoleGuard, GroupInviteToken, dto
├── budget/          BudgetController/Service (personal), GroupBudgetController/Service,
│                    BudgetThresholdEvaluator, BudgetEvaluationListener, event recorder
├── notification/    NotificationService (facade), InAppNotificationService,
│                    EmailNotificationService, settings + category-limit controllers, dto
├── report/          GroupReportController/Service (monthly report, analytics), SettlementService
├── summary/         MonthlySummaryScheduler (cron: 0 0 2 1 * *)
├── classification/  ExpenseCategoryClassifier, RuleBasedCategoryClassifier, Gemini-backed classifier
├── storage/         FileSystemStorageService (receipt uploads under /uploads)
├── mail/            SmtpEmailService, EmailTemplateService (Thymeleaf), MoneyFormatter
├── security/        SecurityConfig, JwtAuthFilter, JwtUtils, CustomUserDetailsService, UserPrincipal
├── common/          DateRangeResolver — resolves month/year/custom-range params into [start,end]
├── system/          health & info endpoints
├── exception/       GlobalExceptionHandler + typed exceptions (AccessDenied, BadRequest,
│                    ResourceNotFound, UserAlreadyExists) → ErrorResponse JSON
├── model/           JPA entities (User, Expense, ExpenseSplit, ExpenseGroup, GroupMember,
│                    GroupInvite, budgets, Notification, …) + enums (Role) + JSON converters
└── repository/      Spring Data interfaces for every aggregate
```

Layering per feature: **Controller → Service → Repository**, with DTOs at the boundary and entities never exposed directly.

## 3. Security Pipeline

| Component | Responsibility |
|---|---|
| `SecurityConfig` | Stateless filter chain; CSRF off; CORS allow-list from `app.cors.allowed-origins`; public routes `/api/auth/**`, `/api/system/**`, `/h2-console/**`; everything else authenticated |
| `JwtAuthFilter` | Extracts `Authorization: Bearer`, validates with `JwtUtils` (HS256, `jwt.secret`, `jwt.expiration-ms`), loads `UserDetails`, populates `SecurityContext` |
| `CustomUserDetailsService` | Loads users by email for the `DaoAuthenticationProvider` |
| Passwords | BCrypt via `PasswordEncoder` bean |
| Controllers | Resolve the current `User` from `@AuthenticationPrincipal UserPrincipal` |

**Authorization** is service-layer based (no `@PreAuthorize` role rules needed):
* Global roles live on `users.role` (`ROLE_USER` default).
* Per-group authorization goes through **`GroupRoleGuard`**: `requireMember()` (ACTIVE membership) and `requireAdmin()` (ACTIVE + `role=ADMIN`) throw `AccessDeniedException` → mapped to HTTP 403 by `GlobalExceptionHandler`.

## 4. Data Model (key tables)

```
users ─────┬──< expenses >──── categories
           │        │
           │        ├──> groups (created_by)
           │        ├──> paid_by → users
           │        └──< expense_splits (UNIQUE(expense_id,user_id))
           ├──< group_members >──── groups   (UNIQUE(group_id,user_id))
           │        role: ADMIN|MEMBER, status: ACTIVE|LEFT|REMOVED
           ├──< group_invites (token, expires_at)
           ├──< user_budgets / group_budgets / group_member_budgets (per month)
           ├──< notifications (type,title,message,reference_id,is_read)
           └──< user_notification_settings (channel toggles)

expenses:
  id, user_id, category_id, group_id (NULL = personal), paid_by, amount,
  description, expense_date, split_type(EQUAL|PERCENT|CUSTOM), receipt_url,
  category_source(RULE_BASED|AI|USER|FALLBACK), category_confidence,
  status(PENDING|APPROVED|REJECTED, DEFAULT 'APPROVED'),          ← approval workflow
  reviewed_by → users, reviewed_at, review_note(500), timestamps
```

Schema bootstrap: `resources/schema.sql` (`CREATE TABLE IF NOT EXISTS`, runs always). Existing databases evolve through Hibernate `ddl-auto: update`. Test profile (`h2`) uses H2 in PostgreSQL mode with `ddl-auto: none`.

## 5. REST Surface (summary)

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/signup · login · logout`, `GET /api/auth/me` |
| Users | `GET/PUT/DELETE /api/users/me`, notification settings, category limits |
| Categories | CRUD under `/api/categories` |
| Expenses | `POST/GET /api/expenses`, `GET/PUT/DELETE /api/expenses/{id}`, summary, `PATCH .../splits[/{userId}/settle]`, `POST /api/expenses/receipt/analyze`, **`PATCH /api/expenses/{id}/approval`** — list/summary accept `month|year|dateFrom&dateTo` |
| Groups | CRUD `/api/groups`, invites (`POST /{id}/invites`, resend, preview `/invites/{token}`), `POST /join`, members (remove, role, leave), **`GET /{id}/expenses?month|year|dateFrom&dateTo&status`** |
| Budgets | Personal `PUT/GET /api/users/me/budget(/status)`, group `PUT /api/groups/{id}/budget`, member caps — **GET (status) endpoints accept `month|year|dateFrom&dateTo`** |
| Reports | `GET /api/groups/{id}/settlements · reports/monthly · reports/analytics` — all accept `month|year|dateFrom&dateTo` |

All errors return a consistent `{message, status, ...}` body via `GlobalExceptionHandler`.

## 5.1 Date Filtering (month / year / custom range)

Every read endpoint that aggregates spend (personal/groups expense lists, monthly summary, group reports/settlements/analytics, personal & group & member budget status) accepts the same three query-param shapes; `DateRangeResolver.resolve(month, year, dateFrom, dateTo)` turns them into a `[start, end]` `LocalDate` range:

| Mode | Params | Priority order (first match wins) |
|---|---|---|
| Custom range | `dateFrom` + `dateTo` (both `YYYY-MM-DD`) | 1 — both required together |
| Year | `year` (`YYYY`) | 2 — range = Jan 1st → Dec 31st |
| Month | `month` (`YYYY-MM`) | 3 — range = 1st → last day |
| Current month | *(none)* | 4 (default) |

**Rules**
* `dateFrom` without `dateTo` (or vice versa) → `400 Bad Request`.
* `dateTo < dateFrom` → `400 Bad Request`.
* `month`/`year` not in `YYYY-MM`/`YYYY` format → `400 Bad Request`.

**Budget aggregation** — budgets are *always stored per month* (`user_budgets`, `group_budgets`, `group_member_budgets` keyed by month). For a full-month view the response returns the verbatim monthly rows (real `budgetId`). For year/custom ranges the status endpoints **sum the monthly limits across every month the range overlaps** and return one aggregated row per scope (`budgetId`/member caps aggregated with no single-budget id). `GroupBudgetService.getGroupBudgetStatus` returns a `NO_BUDGET` status object (null `totalBudget`) instead of throwing when no budget exists in range.

## 6. Approval Workflow (group payment verification)

1. **Creation** (`ExpenseService.createExpense`)
   * Personal → `status = APPROVED`.
   * Group + creator is ACTIVE ADMIN → `APPROVED` with `reviewedBy = self`.
   * Group + regular member → `PENDING`.
2. **Aggregation safety** — repository queries that feed budgets/reports/settlements (`sumGroupExpensesForMonth`, `categoryBreakdownGroup`) filter `status = 'APPROVED'`; settlements iterate approved expenses only. Pending money never leaks into totals.
3. **Review** (`PATCH /api/expenses/{id}/approval`, body `{action, note}`)
   * Guard: reviewer must be ACTIVE ADMIN of the expense's group; only `PENDING` expenses reviewable.
   * `REJECT` requires a non-blank note (`@Size(max=500)`).
   * Outcome stored with reviewer + timestamp; owner receives in-app notification (`EXPENSE_APPROVED` / `EXPENSE_REJECTED`); approval republishes `ExpenseCreatedEvent` so deferred budget evaluation runs.
4. **Edit integrity** — a non-admin owner editing an `APPROVED` group expense resets it to `PENDING` (reviewer fields cleared).

## 7. Event-Driven Budget Evaluation

```
ExpenseService.createExpense()
      │  ApplicationEventPublisher
      ▼
ExpenseCreatedEvent(userId, groupId, date)
      │  @TransactionalEventListener(AFTER_COMMIT)
      ▼
BudgetEvaluationListener → BudgetThresholdEvaluator
      ├─ evaluatePersonalBudget(user, date)
      └─ evaluateGroupBudget(group, date)     // sums APPROVED expenses only
            │ thresholds crossed?
            ▼
      NotificationService.dispatchBudgetAlert(...)   // REQUIRES_NEW tx,
      ├─ in-app row                                  // email failures swallowed
      └─ SMTP alert (Thymeleaf template)
```

Because evaluation happens **after commit**, an alert failure can never roll back a saved expense. `BudgetNotificationEventRecorder` keeps alerts idempotent per threshold.

## 8. Notification Architecture

| Piece | Detail |
|---|---|
| Persistence | `notifications` table: recipient, type, title, message, referenceId/referenceType, isRead, readAt |
| In-app | `InAppNotificationService.createNotification()` — single insert, reused everywhere |
| Facade | `NotificationService.createNotification()` (in-app) and `dispatchBudgetAlert()` (channel-aware, REQUIRES_NEW) |
| Email | `EmailNotificationService` + Thymeleaf templates in `resources/templates/mail/` sent through `SmtpEmailService`; invite emails embed tokenized links built from `app.frontend.base-url` |
| Preferences | `user_notification_settings` toggles channels & alert types; enforced before dispatch |
| API | list / unread-count / mark-read / mark-read-all, ownership-checked |
| Types | `GROUP_INVITE`, `EXPENSE_SPLIT_ASSIGNED`, `EXPENSE_APPROVED`, `EXPENSE_REJECTED`, budget WARNING/EXCEEDED, monthly summary |

## 9. Classification & OCR Pipeline

1. Request carries explicit `categoryId`? → store with source `USER`, confidence 1.0.
2. Else `RuleBasedCategoryClassifier` matches `CategoryKeywords` against the description.
3. Unmatched text goes to the Gemini classifier (WebFlux client, `gemini.api.key`).
4. Below `CLASSIFICATION_AUTO_ASSIGN_THRESHOLD` the category is left unassigned (warn band between auto/warn thresholds); below fallback policy applies `Uncategorized`.
5. Receipts: multipart upload → Gemini Vision extraction (`ReceiptAnalysisService`) → draft suggestion returned to the UI.

## 10. Configuration Profiles

* `default` — PostgreSQL + `ddl-auto: update`, SQL init always, `show-sql: true`.
* `h2` — in-memory DB for tests (`./mvnw test`), schema.sql-driven, H2 console enabled.
* All secrets externalized through `.env` placeholders (see `backend/.env.example`).

## 11. Build & Run

```bash
./mvnw spring-boot:run          # dev server on :8080
./mvnw test                     # full test suite (H2)
./mvnw clean package            # production jar
java -jar target/backend-0.0.1-SNAPSHOT.jar
```
