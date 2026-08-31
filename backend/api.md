# Expense Tracker — Complete API Reference

**Base URL**: `http://localhost:8080`  
**Auth**: All endpoints (except `/api/auth/**` and `/api/system/**`) require a `Bearer` JWT token in the `Authorization` header.

```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

---

## Table of Contents

1. [Auth](#1-auth)
2. [User Profile](#2-user-profile)
3. [Categories](#3-categories)
4. [Personal Expenses](#4-personal-expenses)
5. [Groups](#5-groups)
6. [Group Budgets & Member Caps](#6-group-budgets--member-caps)
7. [Personal Budgets](#7-personal-budgets)
8. [Group Settlements & Reports](#8-group-settlements--reports)
9. [Notifications](#9-notifications) — in-app list + [notification settings](#put-apiusersmenotification-settings)
10. [System](#10-system)
11. [How the Notification System Works](#how-the-notification-system-works) — event flow, channels, idempotency, reliability

---

## 1. Auth

### POST `/api/auth/signup`
Register a new user.

**Request**
```json
{
  "fullName": "Ashwani Kumar",
  "email": "ashwani@example.com",
  "password": "SecurePass@123",
  "avatarUrl": "https://example.com/avatars/ashwani.jpg"
}
```

**Response** `201 Created`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "fullName": "Ashwani Kumar",
    "email": "ashwani@example.com",
    "avatarUrl": "https://example.com/avatars/ashwani.jpg",
    "role": "ROLE_USER",
    "isActive": true,
    "createdAt": "2026-08-13T00:00:00+05:30"
  }
}
```

---

### POST `/api/auth/login`
Authenticate an existing user.

**Request**
```json
{
  "email": "ashwani@example.com",
  "password": "SecurePass@123"
}
```

**Response** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "fullName": "Ashwani Kumar",
    "email": "ashwani@example.com",
    "avatarUrl": "https://example.com/avatars/ashwani.jpg",
    "role": "ROLE_USER",
    "isActive": true,
    "createdAt": "2026-08-13T00:00:00+05:30"
  }
}
```

---

### GET `/api/auth/me`
Get the currently authenticated user.

**Response** `200 OK`
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "fullName": "Ashwani Kumar",
  "email": "ashwani@example.com",
  "avatarUrl": "https://example.com/avatars/ashwani.jpg",
  "role": "ROLE_USER",
  "isActive": true,
  "createdAt": "2026-08-13T00:00:00+05:30"
}
```

---

### POST `/api/auth/logout`
Logout (stateless — clears client token).

**Response** `200 OK`
```json
{
  "message": "Successfully logged out"
}
```

---

## 2. User Profile

### GET `/api/users/me`
Get the authenticated user's profile.

**Response** `200 OK`
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "fullName": "Ashwani Kumar",
  "email": "ashwani@example.com",
  "avatarUrl": "https://example.com/avatars/ashwani.jpg",
  "role": "ROLE_USER",
  "isActive": true,
  "createdAt": "2026-08-13T00:00:00+05:30"
}
```

---

### PUT `/api/users/me`
Update profile (name, avatar, or password).

**Request**
```json
{
  "fullName": "Ashwani Kumar Singh",
  "avatarUrl": "https://example.com/avatars/new-avatar.jpg",
  "currentPassword": "SecurePass@123",
  "newPassword": "NewPass@456"
}
```
> `currentPassword` + `newPassword` are only required when changing the password.

**Response** `200 OK`
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "fullName": "Ashwani Kumar Singh",
  "email": "ashwani@example.com",
  "avatarUrl": "https://example.com/avatars/new-avatar.jpg",
  "role": "ROLE_USER",
  "isActive": true,
  "createdAt": "2026-08-13T00:00:00+05:30"
}
```

---

### DELETE `/api/users/me`
Deactivate (soft-delete) the account.

**Response** `200 OK`
```json
{
  "message": "Account deactivated successfully"
}
```

---

## 3. Categories

### GET `/api/categories`
List all categories: system defaults plus the authenticated user's own custom categories.
Requires authentication.

**Response** `200 OK`
```json
[
  {
    "id": "cat-0001-0000-0000-000000000001",
    "name": "Food & Dining",
    "icon": "🍔",
    "color": "#FF6B6B",
    "isDefault": true,
    "keywords": ["swiggy", "zomato", "restaurant"],
    "createdByUserId": null,
    "createdByUserName": null,
    "createdAt": "2026-08-01T00:00:00+05:30"
  },
  {
    "id": "b3c4d5e6-f7a8-9012-bcde-f34567890123",
    "name": "Gaming Subscriptions",
    "icon": "🎮",
    "color": "#9B59B6",
    "isDefault": false,
    "keywords": ["steam", "psn"],
    "createdByUserId": "1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "createdByUserName": "Ashwani Kumar",
    "createdAt": "2026-08-13T10:30:00+05:30"
  }
]
```
> Default categories are seeded automatically on startup. `keywords` are used by the automatic category classifier.

---

### POST `/api/categories`
Create a custom category (owned by the authenticated user).

**Request**
```json
{
  "name": "Gaming Subscriptions",
  "icon": "🎮",
  "color": "#9B59B6",
  "keywords": ["steam", "psn"]
}
```

**Response** `201 Created`
```json
{
  "id": "b3c4d5e6-f7a8-9012-bcde-f34567890123",
  "name": "Gaming Subscriptions",
  "icon": "🎮",
  "color": "#9B59B6",
  "isDefault": false,
  "keywords": ["steam", "psn"],
  "createdByUserId": "1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "createdByUserName": "Ashwani Kumar",
  "createdAt": "2026-08-13T10:30:00+05:30"
}
```
> Cannot create a category whose name collides with a default category or an existing category of the same user (case-insensitive).

---

### PUT `/api/categories/{id}`
Update an existing category.

**Request**
```json
{
  "name": "Gaming & Subscriptions",
  "icon": "🕹️",
  "color": "#8E44AD"
}
```

**Response** `200 OK`
```json
{
  "id": "b3c4d5e6-f7a8-9012-bcde-f34567890123",
  "name": "Gaming & Subscriptions",
  "icon": "🕹️",
  "color": "#8E44AD",
  "isDefault": false,
  "createdAt": "2026-08-13T10:30:00+05:30"
}
```

---

### DELETE `/api/categories/{id}`
Delete a custom category (default categories cannot be deleted).

**Response** `204 No Content`

**Error** `400 Bad Request`
```json
{
  "timestamp": "2026-08-13T10:35:00+05:30",
  "status": 400,
  "error": "Bad Request",
  "message": "Cannot delete a default category",
  "path": "/api/categories/cat-0001-0000-0000-000000000001"
}
```

---

## 4. Personal Expenses

### POST `/api/expenses`
Create a personal expense (no group).

**Request**
```json
{
  "amount": 450.00,
  "description": "Lunch at Bikanervala",
  "expenseDate": "2026-08-13",
  "categoryId": "cat-0001-0000-0000-000000000001",
  "receiptUrl": null
}
```

**Response** `201 Created`
```json
{
  "id": "exp-11a11-0000-0000-000000000001",
  "userId": "1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "userName": "Ashwani Kumar",
  "categoryId": "cat-0001-0000-0000-000000000001",
  "categoryName": "Food & Dining",
  "categorySource": "RULE_BASED",
  "categoryConfidence": 0.9,
  "groupId": null,
  "groupName": null,
  "paidById": null,
  "paidByName": null,
  "amount": 450.00,
  "description": "Lunch at Bikanervala",
  "expenseDate": "2026-08-13",
  "splitType": null,
  "receiptUrl": null,
  "splits": null,
  "createdAt": "2026-08-13T12:00:00+05:30",
  "updatedAt": "2026-08-13T12:00:00+05:30"
}
```
> If `categoryId` is omitted, the category is resolved automatically (rule-based classifier + keyword matching; `categorySource` is `USER` when you pick explicitly, otherwise `RULE_BASED`, `AI`, or `FALLBACK`). `categoryConfidence` is the classifier's score. A fallback "Uncategorized" category is created lazily.

---

### POST `/api/expenses/receipt/analyze`
Scan a receipt image using OCR to automatically extract expense details (amount, date, description, category). Requires authentication.

**Request** `multipart/form-data`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | The receipt image (JPEG, PNG, etc.) |

**Response** `200 OK`
```json
{
  "merchantName": "Bikanervala",
  "totalAmount": 450.00,
  "date": "2026-08-13",
  "category": "Food & Dining",
  "categoryId": "cat-0001-0000-0000-000000000001",
  "categorySource": "RULE_BASED",
  "categoryConfidence": 0.9
}
```
> `category` is the AI's raw guess (nullable); `categoryId` is the resolved category after rule-based verification, `categorySource` is `RULE_BASED` | `AI` | `USER` | `FALLBACK`.

---

### GET `/api/expenses?month=2026-08`
List personal expenses (excludes group expenses) for the selected period.

**Query Parameters** — exactly one period shape applies; if multiple are sent, priority is `dateFrom+dateTo` → `year` → `month` → current month.
| Param | Type | Required | Example |
|-------|------|----------|---------|
| `month` | String | No (defaults to current month) | `2026-08` |
| `year` | String | No (year range: Jan 1 → Dec 31) | `2026` |
| `dateFrom` + `dateTo` | String | No (custom range, both required together) | `2026-08-10`, `2026-08-25` |

**Response** `200 OK`
```json
[
  {
    "id": "exp-1111-0000-0000-000000000001",
    "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "userName": "Ashwani Kumar",
    "categoryId": "cat-0001-0000-0000-000000000001",
    "categoryName": "Food & Dining",
    "groupId": null,
    "groupName": null,
    "paidById": null,
    "paidByName": null,
    "amount": 450.00,
    "description": "Lunch at Bikanervala",
    "expenseDate": "2026-08-13",
    "splitType": null,
    "receiptUrl": null,
    "splits": null,
    "createdAt": "2026-08-13T12:00:00+05:30",
    "updatedAt": "2026-08-13T12:00:00+05:30"
  },
  {
    "id": "exp-1111-0000-0000-000000000002",
    "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "userName": "Ashwani Kumar",
    "categoryId": "cat-0001-0000-0000-000000000002",
    "categoryName": "Transport",
    "groupId": null,
    "groupName": null,
    "paidById": null,
    "paidByName": null,
    "amount": 180.00,
    "description": "Uber to office",
    "expenseDate": "2026-08-13",
    "splitType": null,
    "receiptUrl": null,
    "splits": null,
    "createdAt": "2026-08-13T09:00:00+05:30",
    "updatedAt": "2026-08-13T09:00:00+05:30"
  }
]
```

---

### GET `/api/expenses/{id}`
Get a single expense by ID.

**Response** `200 OK`
```json
{
  "id": "exp-1111-0000-0000-000000000001",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "userName": "Ashwani Kumar",
  "categoryId": "cat-0001-0000-0000-000000000001",
  "categoryName": "Food & Dining",
  "groupId": null,
  "groupName": null,
  "amount": 450.00,
  "description": "Lunch at Bikanervala",
  "expenseDate": "2026-08-13",
  "splitType": null,
  "receiptUrl": null,
  "splits": null,
  "createdAt": "2026-08-13T12:00:00+05:30",
  "updatedAt": "2026-08-13T12:00:00+05:30"
}
```

---

### PUT `/api/expenses/{id}`
Update a personal expense (only owner can update).

**Request**
```json
{
  "amount": 520.00,
  "description": "Lunch at Bikanervala + dessert",
  "expenseDate": "2026-08-13",
  "categoryId": "cat-0001-0000-0000-000000000001"
}
```

**Response** `200 OK`
```json
{
  "id": "exp-1111-0000-0000-000000000001",
  "amount": 520.00,
  "description": "Lunch at Bikanervala + dessert",
  "expenseDate": "2026-08-13",
  "categoryId": "cat-0001-0000-0000-000000000001",
  "categoryName": "Food & Dining",
  "updatedAt": "2026-08-13T12:30:00+05:30"
}
```

---

### DELETE `/api/expenses/{id}`
Delete a personal expense (only owner can delete).

**Response** `204 No Content`

---

### GET `/api/expenses/summary?month=2026-08`
Period summary: total spent + per-category breakdown. Accepts the same period params as the list endpoint (`month` / `year` / `dateFrom`+`dateTo`).

**Response** `200 OK`
```json
{
  "totalSpent": 12450.00,
  "categoryBreakdown": [
    {
      "categoryId": "cat-0001-0000-0000-000000000001",
      "categoryName": "Food & Dining",
      "total": 4500.00
    },
    {
      "categoryId": "cat-0001-0000-0000-000000000002",
      "categoryName": "Transport",
      "total": 2800.00
    },
    {
      "categoryId": "b3c4d5e6-f7a8-9012-bcde-f34567890123",
      "categoryName": "Gaming & Subscriptions",
      "total": 1299.00
    },
    {
      "categoryId": "uncategorized",
      "categoryName": "Uncategorized",
      "total": 3851.00
    }
  ],
  "dateFrom": "2026-08-01",
  "dateTo": "2026-08-31",
  "label": "August 2026"
}
```
> `dateFrom`/`dateTo` echo the resolved range; `label` is a human-readable descriptor ("August 2026", "2026", or "10 Aug – 25 Aug 2026") for use in UI headings and export filenames. The legacy `month` field is replaced by these three keys.

---

### PATCH `/api/expenses/{id}/splits`
Edit the split allocation for an existing group expense.

**Request**
```json
[
  {
    "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "shareAmount": 400.00,
    "sharePercent": 40.00
  },
  {
    "userId": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
    "shareAmount": 350.00,
    "sharePercent": 35.00
  },
  {
    "userId": "c3d4e5f6-a7b8-9012-cdef-345678901234",
    "shareAmount": 250.00,
    "sharePercent": 25.00
  }
]
```

**Response** `200 OK`
```json
{
  "id": "exp-2222-0000-0000-000000000001",
  "amount": 1000.00,
  "description": "Team dinner",
  "splitType": "PERCENT",
  "splits": [
    {
      "id": "spl-aaaa-0000-0000-000000000001",
      "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "userName": "Ashwani Kumar",
      "shareAmount": 400.00,
      "sharePercent": 40.00,
      "isSettled": false,
      "settledAt": null
    },
    {
      "id": "spl-aaaa-0000-0000-000000000002",
      "userId": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
      "userName": "Priya Sharma",
      "shareAmount": 350.00,
      "sharePercent": 35.00,
      "isSettled": false,
      "settledAt": null
    },
    {
      "id": "spl-aaaa-0000-0000-000000000003",
      "userId": "c3d4e5f6-a7b8-9012-cdef-345678901234",
      "userName": "Rahul Verma",
      "shareAmount": 250.00,
      "sharePercent": 25.00,
      "isSettled": false,
      "settledAt": null
    }
  ]
}
```

---

### PATCH `/api/expenses/{id}/splits/{userId}/settle`
Mark a specific member's split share as settled.

**Response** `200 OK`
```json
{
  "id": "exp-2222-0000-0000-000000000001",
  "amount": 1000.00,
  "description": "Team dinner",
  "splits": [
    {
      "id": "spl-aaaa-0000-0000-000000000002",
      "userId": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
      "userName": "Priya Sharma",
      "shareAmount": 350.00,
      "isSettled": true,
      "settledAt": "2026-08-13T15:00:00+05:30"
    }
  ]
}
```

---

## 5. Groups

### POST `/api/groups`
Create a new group (creator becomes ADMIN automatically).

**Request**
```json
{
  "name": "Goa Trip 2026",
  "description": "Expenses for our Goa trip in August 2026",
  "currencyCode": "INR"
}
```

**Response** `201 Created`
```json
{
  "id": "grp-1111-0000-0000-000000000001",
  "name": "Goa Trip 2026",
  "description": "Expenses for our Goa trip in August 2026",
  "createdById": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "createdByName": "Ashwani Kumar",
  "currencyCode": "INR",
  "inviteCode": "GOATRIP8",
  "isActive": true,
  "createdAt": "2026-08-13T10:00:00+05:30",
  "memberCount": 1,
  "currentUserRole": "ADMIN"
}
```

---

### GET `/api/groups`
List all groups the current user belongs to.

**Response** `200 OK`
```json
[
  {
    "id": "grp-1111-0000-0000-000000000001",
    "name": "Goa Trip 2026",
    "description": "Expenses for our Goa trip in August 2026",
    "createdById": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "createdByName": "Ashwani Kumar",
    "currencyCode": "INR",
    "inviteCode": "GOATRIP8",
    "isActive": true,
    "createdAt": "2026-08-13T10:00:00+05:30",
    "memberCount": 4,
    "currentUserRole": "ADMIN"
  },
  {
    "id": "grp-1111-0000-0000-000000000002",
    "name": "Office Lunch Pool",
    "description": "Monthly office lunch expenses",
    "createdById": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
    "createdByName": "Priya Sharma",
    "currencyCode": "INR",
    "inviteCode": "OFFLNCH4",
    "isActive": true,
    "createdAt": "2026-08-01T09:00:00+05:30",
    "memberCount": 8,
    "currentUserRole": "MEMBER"
  }
]
```

---

### GET `/api/groups/{id}`
Get group details + member list.

**Response** `200 OK`
```json
{
  "group": {
    "id": "grp-1111-0000-0000-000000000001",
    "name": "Goa Trip 2026",
    "description": "Expenses for our Goa trip in August 2026",
    "createdById": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "createdByName": "Ashwani Kumar",
    "currencyCode": "INR",
    "inviteCode": "GOATRIP8",
    "isActive": true,
    "createdAt": "2026-08-13T10:00:00+05:30",
    "memberCount": 3,
    "currentUserRole": "ADMIN"
  },
  "members": [
    {
      "memberId": "mem-aaaa-0000-0000-000000000001",
      "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "userName": "Ashwani Kumar",
      "userEmail": "ashwani@example.com",
      "avatarUrl": "https://example.com/avatars/ashwani.jpg",
      "role": "ADMIN",
      "status": "ACTIVE",
      "joinedAt": "2026-08-13T10:00:00+05:30"
    },
    {
      "memberId": "mem-aaaa-0000-0000-000000000002",
      "userId": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
      "userName": "Priya Sharma",
      "userEmail": "priya@example.com",
      "avatarUrl": null,
      "role": "MEMBER",
      "status": "ACTIVE",
      "joinedAt": "2026-08-13T11:00:00+05:30"
    },
    {
      "memberId": "mem-aaaa-0000-0000-000000000003",
      "userId": "c3d4e5f6-a7b8-9012-cdef-345678901234",
      "userName": "Rahul Verma",
      "userEmail": "rahul@example.com",
      "avatarUrl": null,
      "role": "MEMBER",
      "status": "ACTIVE",
      "joinedAt": "2026-08-13T11:30:00+05:30"
    }
  ]
}
```

---

### PATCH `/api/groups/{id}`
Update group name/description (admin only).

**Request**
```json
{
  "name": "Goa Trip Aug 2026",
  "description": "Our amazing Goa trip — 15th to 20th August 2026"
}
```

**Response** `200 OK`
```json
{
  "id": "grp-1111-0000-0000-000000000001",
  "name": "Goa Trip Aug 2026",
  "description": "Our amazing Goa trip — 15th to 20th August 2026",
  "currencyCode": "INR",
  "inviteCode": "GOATRIP8",
  "isActive": true,
  "memberCount": 3,
  "currentUserRole": "ADMIN"
}
```

---

### DELETE `/api/groups/{id}`
Deactivate/archive a group (admin only).

**Response** `200 OK`
```json
{
  "message": "Group deactivated"
}
```

---

### POST `/api/groups/{id}/invites`
Generate an invite link/token for the group. When an email is provided, the invitation is sent over SMTP and the raw token is returned only once here.

**Request**
```json
{
  "email": "neha@example.com",
  "expiresAt": "2026-08-20T23:59:59+05:30"
}
```
> `email` and `expiresAt` are optional. If omitted, the invite is open (no email restriction) and expires in 7 days.

**Response** `201 Created`
```json
{
  "token": "8f3a2b1c9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a",
  "inviteCode": "GOATRIP8",
  "expiresAt": "2026-08-20T23:59:59+05:30",
  "inviteLink": "/api/groups/join?token=8f3a2b1c9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a",
  "emailStatus": "SENT"
}
```
> `token` is the raw 64-char invite token. Only a SHA-256 hash is stored server-side, so the raw token is shown exactly once — share it or resend via the resend endpoint below. `emailStatus` is `SENT`, `FAILED`, or `NONE` (no email requested).

---

### GET `/api/groups/invites/{token}`
Public preview of an invite (no authentication, no token material). Used by the frontend to show group/inviter details before the user joins.

**Response** `200 OK`
```json
{
  "groupName": "Goa Trip Aug 2026",
  "groupDescription": "Our amazing Goa trip — 15th to 20th August 2026",
  "inviterName": "Rahul Sharma",
  "expiresAt": "2026-08-20T23:59:59+05:30",
  "status": "PENDING",
  "expired": false
}
```

---

### POST `/api/groups/{id}/invites/{inviteId}/resend`
Regenerates a new raw token for an existing invite, revokes the previous link, and re-emails the invitation (if the invite has an email).

**Response** `200 OK`
```json
{
  "token": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a",
  "inviteLink": "/api/groups/join?token=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a",
  "emailStatus": "SENT"
}
```

---

### POST `/api/groups/join`
Join a group via invite code or invite token.

**Request — via short invite code**
```json
{
  "code": "GOATRIP8"
}
```

**Request — via long invite token**
```json
{
  "token": "8f3a2b1c9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a"
}
```

**Response** `200 OK`
```json
{
  "id": "grp-1111-0000-0000-000000000001",
  "name": "Goa Trip Aug 2026",
  "description": "Our amazing Goa trip — 15th to 20th August 2026",
  "currencyCode": "INR",
  "inviteCode": "GOATRIP8",
  "isActive": true,
  "memberCount": 4,
  "currentUserRole": "MEMBER"
}
```

---

### DELETE `/api/groups/{id}/members/{userId}`
Remove a member from the group (admin only). Historical expense splits are preserved.

**Response** `200 OK`
```json
{
  "message": "Member removed"
}
```

---

### POST `/api/groups/{id}/leave`
Current user leaves the group.

> **Note**: If you're the only admin, you must promote another member first.

**Response** `200 OK`
```json
{
  "message": "You have left the group"
}
```

**Error** `400 Bad Request` (last admin)
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "You are the only admin. Promote another member before leaving."
}
```

---

### PATCH `/api/groups/{id}/members/{userId}/role`
Promote or demote a member's role (admin only).

**Request**
```json
{
  "role": "ADMIN"
}
```
> Valid values: `"ADMIN"` or `"MEMBER"`

**Response** `200 OK`
```json
{
  "memberId": "mem-aaaa-0000-0000-000000000002",
  "userId": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
  "userName": "Priya Sharma",
  "userEmail": "priya@example.com",
  "role": "ADMIN",
  "status": "ACTIVE",
  "joinedAt": "2026-08-13T11:00:00+05:30"
}
```

---

### POST `/api/groups/{id}/expenses`
Log a group expense with splits. Triggers budget threshold evaluation.

**Request — EQUAL split**
```json
{
  "amount": 3600.00,
  "description": "Hotel Booking — Day 1",
  "expenseDate": "2026-08-15",
  "categoryId": "cat-0001-0000-0000-000000000005",
  "paidBy": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "splitType": "EQUAL",
  "splits": [
    { "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890", "shareAmount": 1200.00 },
    { "userId": "b2c3d4e5-f6a7-8901-bcde-f23456789012", "shareAmount": 1200.00 },
    { "userId": "c3d4e5f6-a7b8-9012-cdef-345678901234", "shareAmount": 1200.00 }
  ]
}
```

**Request — PERCENT split**
```json
{
  "amount": 1000.00,
  "description": "Team dinner",
  "expenseDate": "2026-08-15",
  "categoryId": "cat-0001-0000-0000-000000000001",
  "paidBy": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "splitType": "PERCENT",
  "splits": [
    { "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890", "shareAmount": 500.00, "sharePercent": 50.00 },
    { "userId": "b2c3d4e5-f6a7-8901-bcde-f23456789012", "shareAmount": 300.00, "sharePercent": 30.00 },
    { "userId": "c3d4e5f6-a7b8-9012-cdef-345678901234", "shareAmount": 200.00, "sharePercent": 20.00 }
  ]
}
```

**Request — CUSTOM split**
```json
{
  "amount": 2500.00,
  "description": "Scooter rentals",
  "expenseDate": "2026-08-16",
  "categoryId": "cat-0001-0000-0000-000000000002",
  "paidBy": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
  "splitType": "CUSTOM",
  "splits": [
    { "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890", "shareAmount": 1000.00 },
    { "userId": "b2c3d4e5-f6a7-8901-bcde-f23456789012", "shareAmount": 800.00 },
    { "userId": "c3d4e5f6-a7b8-9012-cdef-345678901234", "shareAmount": 700.00 }
  ]
}
```

**Response** `201 Created`
```json
{
  "id": "exp-2222-0000-0000-000000000001",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "userName": "Ashwani Kumar",
  "categoryId": "cat-0001-0000-0000-000000000005",
  "categoryName": "Accommodation",
  "groupId": "grp-1111-0000-0000-000000000001",
  "groupName": "Goa Trip Aug 2026",
  "paidById": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "paidByName": "Ashwani Kumar",
  "amount": 3600.00,
  "description": "Hotel Booking — Day 1",
  "expenseDate": "2026-08-15",
  "splitType": "EQUAL",
  "receiptUrl": null,
  "splits": [
    {
      "id": "spl-aaaa-0000-0000-000000000001",
      "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "userName": "Ashwani Kumar",
      "shareAmount": 1200.00,
      "sharePercent": null,
      "isSettled": false,
      "settledAt": null
    },
    {
      "id": "spl-aaaa-0000-0000-000000000002",
      "userId": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
      "userName": "Priya Sharma",
      "shareAmount": 1200.00,
      "sharePercent": null,
      "isSettled": false,
      "settledAt": null
    },
    {
      "id": "spl-aaaa-0000-0000-000000000003",
      "userId": "c3d4e5f6-a7b8-9012-cdef-345678901234",
      "userName": "Rahul Verma",
      "shareAmount": 1200.00,
      "sharePercent": null,
      "isSettled": false,
      "settledAt": null
    }
  ],
  "createdAt": "2026-08-15T10:00:00+05:30",
  "updatedAt": "2026-08-15T10:00:00+05:30"
}
```

---

### GET `/api/groups/{id}/expenses?month=2026-08`
List all group expenses for a given month (members only).

**Response** `200 OK`
```json
[
  {
    "id": "exp-2222-0000-0000-000000000001",
    "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "userName": "Ashwani Kumar",
    "categoryName": "Accommodation",
    "groupId": "grp-1111-0000-0000-000000000001",
    "groupName": "Goa Trip Aug 2026",
    "paidByName": "Ashwani Kumar",
    "amount": 3600.00,
    "description": "Hotel Booking — Day 1",
    "expenseDate": "2026-08-15",
    "splitType": "EQUAL",
    "splits": [ "..." ]
  },
  {
    "id": "exp-2222-0000-0000-000000000002",
    "userId": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
    "userName": "Priya Sharma",
    "categoryName": "Food & Dining",
    "groupId": "grp-1111-0000-0000-000000000001",
    "paidByName": "Priya Sharma",
    "amount": 1000.00,
    "description": "Team dinner",
    "expenseDate": "2026-08-15",
    "splitType": "PERCENT",
    "splits": [ "..." ]
  }
]
```

---

## 6. Group Budgets & Member Caps

### PUT `/api/groups/{id}/budget?month=2026-08`
Set or update the group's total monthly budget (admin only).

**Request**
```json
{
  "budgetLimit": 50000.00
}
```

**Response** `200 OK`
```json
{
  "groupId": "grp-1111-0000-0000-000000000001",
  "groupName": "Goa Trip Aug 2026",
  "month": "2026-08-01",
  "totalBudget": 50000.00,
  "totalSpent": 7100.00,
  "remaining": 42900.00,
  "percentUsed": 14.2,
  "status": "OK",
  "memberBreakdown": [
    {
      "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "userName": "Ashwani Kumar",
      "month": "2026-08-01",
      "budgetLimit": null,
      "spent": 2400.00,
      "remaining": null,
      "percentUsed": null,
      "status": null
    },
    {
      "userId": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
      "userName": "Priya Sharma",
      "month": "2026-08-01",
      "spent": 1500.00
    },
    {
      "userId": "c3d4e5f6-a7b8-9012-cdef-345678901234",
      "userName": "Rahul Verma",
      "month": "2026-08-01",
      "spent": 3200.00
    }
  ]
}
```

---

### GET `/api/groups/{id}/budget/status?month=2026-08`
Get live group budget utilization for a month.

**Response** `200 OK`
```json
{
  "groupId": "grp-1111-0000-0000-000000000001",
  "groupName": "Goa Trip Aug 2026",
  "month": "2026-08-01",
  "totalBudget": 50000.00,
  "totalSpent": 38500.00,
  "remaining": 11500.00,
  "percentUsed": 77.0,
  "status": "WARNING",
  "memberBreakdown": [
    {
      "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "userName": "Ashwani Kumar",
      "month": "2026-08-01",
      "budgetLimit": 20000.00,
      "spent": 16500.00,
      "remaining": 3500.00,
      "percentUsed": 82.5,
      "status": "WARNING"
    },
    {
      "userId": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
      "userName": "Priya Sharma",
      "month": "2026-08-01",
      "budgetLimit": 15000.00,
      "spent": 12000.00,
      "remaining": 3000.00,
      "percentUsed": 80.0,
      "status": "WARNING"
    },
    {
      "userId": "c3d4e5f6-a7b8-9012-cdef-345678901234",
      "userName": "Rahul Verma",
      "month": "2026-08-01",
      "budgetLimit": 15000.00,
      "spent": 10000.00,
      "remaining": 5000.00,
      "percentUsed": 66.7,
      "status": "OK"
    }
  ]
}
```

---

### PUT `/api/groups/{id}/members/{userId}/budget?month=2026-08`
Set a per-member spending cap inside the group (admin only).

**Request**
```json
{
  "budgetLimit": 20000.00
}
```

**Response** `200 OK`
```json
{
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "userName": "Ashwani Kumar",
  "month": "2026-08-01",
  "budgetLimit": 20000.00,
  "spent": 16500.00,
  "remaining": 3500.00,
  "percentUsed": 82.5,
  "status": "WARNING"
}
```

---

### GET `/api/groups/{id}/members/budgets?month=2026-08`
Get all member caps + utilization (any group member can view).

**Response** `200 OK`
```json
[
  {
    "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "userName": "Ashwani Kumar",
    "month": "2026-08-01",
    "budgetLimit": 20000.00,
    "spent": 16500.00,
    "remaining": 3500.00,
    "percentUsed": 82.5,
    "status": "WARNING"
  },
  {
    "userId": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
    "userName": "Priya Sharma",
    "month": "2026-08-01",
    "budgetLimit": 15000.00,
    "spent": 15200.00,
    "remaining": -200.00,
    "percentUsed": 101.3,
    "status": "EXCEEDED"
  }
]
```

---

## 7. Personal Budgets

### PUT `/api/users/me/budget?month=2026-08`
Set or update overall monthly budget (or per-category budget).

**Request — overall budget**
```json
{
  "budgetLimit": 30000.00
}
```

**Request — per-category budget**
```json
{
  "budgetLimit": 8000.00,
  "categoryId": "cat-0001-0000-0000-000000000001"
}
```

**Response** `200 OK`
```json
{
  "budgetId": "bud-aaaa-0000-0000-000000000001",
  "month": "2026-08-01",
  "budgetLimit": 30000.00,
  "spent": 12450.00,
  "remaining": 17550.00,
  "percentUsed": 41.5,
  "status": "OK",
  "categoryId": null,
  "categoryName": null
}
```

---

### GET `/api/users/me/budget/status?month=2026-08`
Get all personal budgets (overall + per-category) with live utilization.

**Response** `200 OK`
```json
[
  {
    "budgetId": "bud-aaaa-0000-0000-000000000001",
    "month": "2026-08-01",
    "budgetLimit": 30000.00,
    "spent": 24800.00,
    "remaining": 5200.00,
    "percentUsed": 82.7,
    "status": "WARNING",
    "categoryId": null,
    "categoryName": null
  },
  {
    "budgetId": "bud-aaaa-0000-0000-000000000002",
    "month": "2026-08-01",
    "budgetLimit": 8000.00,
    "spent": 4500.00,
    "remaining": 3500.00,
    "percentUsed": 56.3,
    "status": "OK",
    "categoryId": "cat-0001-0000-0000-000000000001",
    "categoryName": "Food & Dining"
  }
]
```

---

## 8. Group Settlements & Reports

### GET `/api/groups/{id}/settlements?month=2026-08`
Get the "who owes whom" net summary for the group (settled splits are excluded).

**Response** `200 OK`
```json
[
  {
    "fromUserId": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
    "fromUserName": "Priya Sharma",
    "toUserId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "toUserName": "Ashwani Kumar",
    "netAmount": 4200.00
  },
  {
    "fromUserId": "c3d4e5f6-a7b8-9012-cdef-345678901234",
    "fromUserName": "Rahul Verma",
    "toUserId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "toUserName": "Ashwani Kumar",
    "netAmount": 2800.00
  }
]
```

---

### GET `/api/groups/{id}/reports/monthly?month=2026-08`
Full monthly report: spend vs budget, category breakdown, member breakdown, top expenses.

**Response** `200 OK`
```json
{
  "groupId": "grp-1111-0000-0000-000000000001",
  "groupName": "Goa Trip Aug 2026",
  "month": "2026-08-01",
  "totalSpent": 38500.00,
  "totalBudget": 50000.00,
  "budgetPercentUsed": 77.0,
  "budgetStatus": "WARNING",
  "categoryBreakdown": [
    {
      "categoryId": "cat-0001-0000-0000-000000000005",
      "categoryName": "Accommodation",
      "total": 18000.00,
      "pctOfTotal": 46.8
    },
    {
      "categoryId": "cat-0001-0000-0000-000000000002",
      "categoryName": "Transport",
      "total": 9500.00,
      "pctOfTotal": 24.7
    },
    {
      "categoryId": "cat-0001-0000-0000-000000000001",
      "categoryName": "Food & Dining",
      "total": 8200.00,
      "pctOfTotal": 21.3
    },
    {
      "categoryId": null,
      "categoryName": "Uncategorized",
      "total": 2800.00,
      "pctOfTotal": 7.2
    }
  ],
  "memberBreakdown": [
    {
      "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "userName": "Ashwani Kumar",
      "spent": 16500.00,
      "budgetLimit": 20000.00,
      "pctUsed": 82.5
    },
    {
      "userId": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
      "userName": "Priya Sharma",
      "spent": 12000.00,
      "budgetLimit": 15000.00,
      "pctUsed": 80.0
    },
    {
      "userId": "c3d4e5f6-a7b8-9012-cdef-345678901234",
      "userName": "Rahul Verma",
      "spent": 10000.00,
      "budgetLimit": 15000.00,
      "pctUsed": 66.7
    }
  ],
  "topDescriptions": [
    { "description": "Hotel Booking — Day 1", "total": 9000.00 },
    { "description": "Hotel Booking — Day 2", "total": 9000.00 },
    { "description": "Flight tickets", "total": 7500.00 },
    { "description": "Scooter rentals", "total": 2500.00 },
    { "description": "Team dinner", "total": 1000.00 }
  ]
}
```

---

### GET `/api/groups/{id}/reports/analytics?month=2026-08`
Chart-ready analytics: category split, daily trend, top spenders.

**Response** `200 OK`
```json
{
  "groupId": "grp-1111-0000-0000-000000000001",
  "groupName": "Goa Trip Aug 2026",
  "month": "2026-08-01",
  "totalSpent": 38500.00,
  "categoryBreakdown": [
    { "categoryId": "cat-0001-0000-0000-000000000005", "categoryName": "Accommodation", "total": 18000.00 },
    { "categoryId": "cat-0001-0000-0000-000000000002", "categoryName": "Transport", "total": 9500.00 },
    { "categoryId": "cat-0001-0000-0000-000000000001", "categoryName": "Food & Dining", "total": 8200.00 }
  ],
  "dailyTrend": [
    { "date": "2026-08-15", "amount": 22500.00 },
    { "date": "2026-08-16", "amount": 9000.00 },
    { "date": "2026-08-17", "amount": 4500.00 },
    { "date": "2026-08-18", "amount": 2500.00 }
  ],
  "topSpenders": [
    {
      "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "userName": "Ashwani Kumar",
      "spent": 16500.00,
      "pctOfTotal": 42.9
    },
    {
      "userId": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
      "userName": "Priya Sharma",
      "spent": 12000.00,
      "pctOfTotal": 31.2
    },
    {
      "userId": "c3d4e5f6-a7b8-9012-cdef-345678901234",
      "userName": "Rahul Verma",
      "spent": 10000.00,
      "pctOfTotal": 26.0
    }
  ]
}
```

---

## 9. Notifications

### GET `/api/users/me/notification-settings`
Get the current user's notification preferences. Defaults are created automatically at signup (and lazily on first access), so this always returns a row.

**Response** `200 OK`
```json
{
  "userId": "1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "inAppNotifications": true,
  "emailNotifications": true,
  "overallBudgetEnabled": true,
  "overallBudgetThresholds": [80, 100],
  "categoryBudgetEnabled": true,
  "categoryBudgetThresholds": [80, 100],
  "totalExpenditureEnabled": false,
  "totalExpenditureThresholds": [],
  "monthlySummaryEnabled": false,
  "updatedAt": "2026-08-16T11:00:00+05:30"
}
```
> `overallBudgetThresholds` and `categoryBudgetThresholds` are **percentages** (1–100). `totalExpenditureThresholds` are **absolute amounts** in the user's currency. Threshold lists are de-duplicated and sorted ascending.

---

### PUT `/api/users/me/notification-settings`
Partial update — only the fields you send are changed.

**Request**
```json
{
  "emailNotifications": true,
  "overallBudgetThresholds": [85, 95, 100],
  "categoryBudgetEnabled": false,
  "totalExpenditureEnabled": true,
  "totalExpenditureThresholds": [25000, 50000],
  "monthlySummaryEnabled": true
}
```

**Response** `200 OK` — same shape as GET above.

> Percent thresholds outside 1–100 are dropped; an empty (or fully invalid) threshold list returns `400`. Total-expenditure thresholds only require a positive value.

---

### GET `/api/notifications`
List all notifications for the current user (newest first).

**Response** `200 OK`
```json
[
  {
    "id": "notif-0001-0000-0000-000000000001",
    "type": "EXPENSE_SPLIT_ASSIGNED",
    "title": "New expense split assigned",
    "message": "Ashwani Kumar logged an expense of ₹1200.00 that includes you.",
    "referenceId": "exp-2222-0000-0000-000000000001",
    "referenceType": "EXPENSE",
    "isRead": false,
    "readAt": null,
    "createdAt": "2026-08-15T10:00:05+05:30"
  },
  {
    "id": "notif-0001-0000-0000-000000000002",
    "type": "BUDGET_THRESHOLD_REACHED",
    "title": "Personal budget at 83%",
    "message": "You've used 83% of your monthly budget.",
    "referenceId": "bud-aaaa-0000-0000-000000000001",
    "referenceType": "USER_BUDGET",
    "isRead": false,
    "readAt": null,
    "createdAt": "2026-08-14T18:30:00+05:30"
  },
  {
    "id": "notif-0001-0000-0000-000000000003",
    "type": "GROUP_JOIN_REQUEST",
    "title": "Priya Sharma joined Goa Trip Aug 2026",
    "message": "Priya Sharma has joined your group.",
    "referenceId": "grp-1111-0000-0000-000000000001",
    "referenceType": "GROUP",
    "isRead": true,
    "readAt": "2026-08-13T12:00:00+05:30",
    "createdAt": "2026-08-13T11:00:00+05:30"
  }
]
```

---

### GET `/api/notifications/unread-count`
Get count of unread notifications.

**Response** `200 OK`
```json
{
  "count": 2
}
```

---

### PATCH `/api/notifications/{id}/read`
Mark a single notification as read.

**Response** `200 OK`
```json
{
  "id": "notif-0001-0000-0000-000000000001",
  "type": "EXPENSE_SPLIT_ASSIGNED",
  "title": "New expense split assigned",
  "message": "Ashwani Kumar logged an expense of ₹1200.00 that includes you.",
  "referenceId": "exp-2222-0000-0000-000000000001",
  "referenceType": "EXPENSE",
  "isRead": true,
  "readAt": "2026-08-13T16:45:00+05:30",
  "createdAt": "2026-08-15T10:00:05+05:30"
}
```

---

### PATCH `/api/notifications/read-all`
Mark all notifications as read.

**Response** `200 OK`
```json
{
  "message": "All notifications marked as read"
}
```

---

## 10. System

### GET `/api/system/health`
Health check endpoint (public).

**Response** `200 OK`
```json
{
  "status": "UP",
  "database": "UP",
  "timestamp": "2026-08-13T00:30:00+05:30",
  "uptimeSeconds": 3600
}
```

---

### GET `/api/system/info`
Application info (public).

**Response** `200 OK`
```json
{
  "applicationName": "expense-tracker-backend",
  "version": "1.0.0-MVP",
  "environment": "dev",
  "javaVersion": "21.0.2",
  "springBootVersion": "3.3.3"
}
```

---

## Error Responses

All error responses follow this structure:

```json
{
  "timestamp": "2026-08-13T10:00:00+05:30",
  "status": 400,
  "error": "Bad Request",
  "message": "Human-readable description of what went wrong",
  "path": "/api/expenses",
  "validationErrors": {
    "amount": "Amount must be greater than 0",
    "expenseDate": "Expense date is required"
  }
}
```

| HTTP Status | When |
|-------------|------|
| `400 Bad Request` | Validation failed, invalid split sums, bad month format |
| `401 Unauthorized` | Missing or invalid JWT token |
| `403 Forbidden` | Authenticated but not authorized (e.g., non-admin accessing admin endpoint) |
| `404 Not Found` | Resource (expense, group, category) not found |
| `409 Conflict` | Email already registered, duplicate category name |
| `500 Internal Server Error` | Unexpected server-side error |

---

## Notification Types Reference

| Type | Triggered When |
|------|----------------|
| `EXPENSE_SPLIT_ASSIGNED` | A group expense includes you in the split |
| `GROUP_JOIN_REQUEST` | A user joins your group |
| `GROUP_BUDGET_SET` | Admin sets/updates the group's monthly budget |
| `BUDGET_THRESHOLD_REACHED` | Personal budget reaches one of your configured `overallBudgetThresholds` (default 80%, 100%) |
| `CATEGORY_BUDGET_THRESHOLD_REACHED` | A category budget reaches one of your configured `categoryBudgetThresholds` |
| `TOTAL_EXPENDITURE_THRESHOLD_REACHED` | Your total spend (personal + group shares) reaches one of your configured `totalExpenditureThresholds` |
| `GROUP_BUDGET_THRESHOLD_REACHED` | Group budget reaches one of the configured thresholds |
| `MONTHLY_SUMMARY` | Monthly summary email sent on the 1st of the month (if `monthlySummaryEnabled`) |

> **Idempotency**: Budget threshold alerts are sent **at most once per month per threshold** (dedup keyed by month + threshold + type + budget/category/group) to prevent notification spam, even under concurrent expense requests. Threshold lists are user-configurable — not hard-coded to 80%/100%.

---

## Budget Status Values

| Status | Meaning |
|--------|---------|
| `OK` | Spent < 80% of budget |
| `WARNING` | Spent ≥ 80% and < 100% of budget |
| `EXCEEDED` | Spent ≥ 100% of budget |
| `NO_BUDGET` | No budget set for this month |

---

## How the Notification System Works

This section explains when and how notifications are produced and delivered, covering budget alerts, group events, expense splits, and the monthly summary.

### 1. What triggers a notification

| Producer | When |
|----------|------|
| Budget threshold evaluation | After any expense is created, budget usage is re-checked for the month |
| Group invite / join | A user joins or requests to join a group |
| Expense splits | A group expense that includes you in its split is created |
| Group budget changes | Admin sets/updates the group's monthly budget |
| Monthly summary job | Runs on the 1st of the month (if `monthlySummaryEnabled`) |

### 2. Budget alert flow (step by step)

1. `POST /api/expenses` creates and **commits** the expense in one database transaction (`ExpenseService.createExpense`).
2. After the commit, an `ExpenseCreatedEvent` is published.
3. `BudgetEvaluationListener` (an `@TransactionalEventListener` with `AFTER_COMMIT` + `fallbackExecution`) picks it up and, for the affected user (and group, if the expense belongs to one), runs `BudgetThresholdEvaluator`.
4. The evaluator compares the month's spending against every budget the user has:
   - **Personal overall budget** (`user_budgets` with no category)
   - **Per-category budgets** (`user_budgets` with a category)
   - **Total expenditure** = personal spend + the user's share of group expenses
   - **Group budget** and each member's cap (for group expenses)
5. Usage percent is computed (`spent / limit × 100`) and checked against the user's configured threshold lists (`overallBudgetThresholds`, `categoryBudgetThresholds`). For total expenditure, the configured values are absolute amounts. A threshold "fires" when `usage >= threshold`.
6. Each fired threshold is **idempotently recorded** in `budget_notification_events` — a `dedup_key` combining user + budget/category/group + month + threshold + type has a UNIQUE constraint. Recording runs in its own transaction (`REQUIRES_NEW`), so a concurrent duplicate request that loses the race simply sees the constraint violation and skips.
7. If this threshold was already reported for the month, nothing further happens. Otherwise the alert is dispatched to the enabled channels:
   - **In-app** (if `inAppNotifications`) — a row is written to the `notifications` table, surfaced by `GET /api/notifications`.
   - **Email** (if `emailNotifications`) — a budget-alert email is attempted.

> The dispatch step runs in its own fresh transaction (`REQUIRES_NEW`). Because evaluation happens in the `AFTER_COMMIT` phase, Spring may still report the already-committed expense transaction as "active"; committing the notification in its own transaction guarantees the in-app row is never silently discarded during transaction cleanup.

### 3. Channels

- **In-app notifications** are always stored locally and read through:
  - `GET /api/notifications` — list (newest first)
  - `GET /api/notifications/unread-count` — unread count
  - `PATCH /api/notifications/{id}/read` and `PATCH /api/notifications/read-all`
- **Email** is **best-effort**. The mail sender (`SmtpEmailService`) catches mail failures, logs them, and returns `false` — a broken SMTP server can never fail expense creation or break notification idempotency. Emails are only actually sent when SMTP is configured (see `.env.example` `MAIL_*` variables); without it the email channel fails silently and only in-app notifications appear. Templates are rendered with Thymeleaf (`mail/budget-alert.html`, `mail/category-budget-alert.html`, `mail/group-invite.html`, `mail/monthly-summary.html`).

### 4. Configurable thresholds

- `overallBudgetThresholds` and `categoryBudgetThresholds` are **percentages** (1–100).
- `totalExpenditureThresholds` are **absolute amounts**.
- Lists are de-duplicated, sorted ascending, and enforced by the `PUT /api/users/me/notification-settings` endpoint.
- Alerts are **at most once per month per threshold**, so lowering/adding a threshold triggers a new alert next time usage crosses it, but re-crossing the same threshold never spams.

### 5. Notification types

See the [Notification Types Reference](#notification-types-reference) table above. The budget-related types are `BUDGET_THRESHOLD_REACHED`, `BUDGET_EXCEEDED`, `CATEGORY_BUDGET_THRESHOLD_REACHED`, `CATEGORY_BUDGET_EXCEEDED`, `GROUP_BUDGET_THRESHOLD_REACHED`, `GROUP_BUDGET_EXCEEDED`, and `TOTAL_EXPENDITURE_THRESHOLD_REACHED`.

### 6. Reliability guarantees

| Guarantee | How |
|-----------|-----|
| Notification never blocks expense creation | Evaluation runs after commit; failures are caught and logged |
| No duplicate budget alerts | Unique `dedup_key` on `budget_notification_events` (concurrency-safe) |
| Email failure never loses the in-app alert | Email is sent in the same fresh transaction but its exceptions are swallowed |
| Alerts respect user preferences | Every dispatch checks `inAppNotifications` / `emailNotifications` and the per-budget enable flags |
| Missing settings can't crash evaluation | Defaults are created at signup and lazily on first access |
