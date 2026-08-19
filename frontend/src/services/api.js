// ─── Expense Tracker API Client ───────────────────────────────────────────────
// Base URL: http://localhost:8080
// Auth: JWT Bearer token stored in localStorage

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const TOKEN_KEY = 'expense_tracker_token';

// ─── Token Management ─────────────────────────────────────────────────────────
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// ─── Core Request Helper ──────────────────────────────────────────────────────
const request = async (method, path, body = null, params = null) => {
  const token = getToken();
  const url = new URL(`${BASE_URL}${path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, value);
      }
    });
  }

  const headers = {};

  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body !== null) {
    options.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  const response = await fetch(url.toString(), options);

  // Handle 204 No Content
  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authApi = {
  signup: (payload) => request('POST', '/api/auth/signup', payload),
  login: (payload) => request('POST', '/api/auth/login', payload),
  me: () => request('GET', '/api/auth/me'),
  logout: () => request('POST', '/api/auth/logout'),
};

// ─── User Profile API ─────────────────────────────────────────────────────────
export const usersApi = {
  getMe: () => request('GET', '/api/users/me'),
  updateMe: (payload) => request('PUT', '/api/users/me', payload),
  deleteMe: () => request('DELETE', '/api/users/me'),
  getNotificationSettings: () => request('GET', '/api/users/me/notification-settings'),
  updateNotificationSettings: (payload) => request('PUT', '/api/users/me/notification-settings', payload),
};

// ─── Categories API ───────────────────────────────────────────────────────────
export const categoriesApi = {
  list: () => request('GET', '/api/categories'),
  create: (payload) => request('POST', '/api/categories', payload),
  update: (id, payload) => request('PUT', `/api/categories/${id}`, payload),
  delete: (id) => request('DELETE', `/api/categories/${id}`),
};

// ─── Personal Expenses API ────────────────────────────────────────────────────
export const expensesApi = {
  list: (month) => request('GET', '/api/expenses', null, { month }),
  get: (id) => request('GET', `/api/expenses/${id}`),
  create: (payload) => request('POST', '/api/expenses', payload),
  update: (id, payload) => request('PUT', `/api/expenses/${id}`, payload),
  delete: (id) => request('DELETE', `/api/expenses/${id}`),
  summary: (month) => request('GET', '/api/expenses/summary', null, { month }),
  updateSplits: (id, splits) => request('PATCH', `/api/expenses/${id}/splits`, splits),
  settleSplit: (expenseId, userId) => request('PATCH', `/api/expenses/${expenseId}/splits/${userId}/settle`),
  scan: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('POST', '/api/expenses/receipt/analyze', formData);
  },
};

// ─── Groups API ───────────────────────────────────────────────────────────────
export const groupsApi = {
  list: () => request('GET', '/api/groups'),
  get: (id) => request('GET', `/api/groups/${id}`),
  create: (payload) => request('POST', '/api/groups', payload),
  update: (id, payload) => request('PATCH', `/api/groups/${id}`, payload),
  delete: (id) => request('DELETE', `/api/groups/${id}`),
  invite: (id, payload) => request('POST', `/api/groups/${id}/invites`, payload),
  getInvitePreview: (token) => request('GET', `/api/groups/invites/${token}`),
  resendInvite: (id, inviteId) => request('POST', `/api/groups/${id}/invites/${inviteId}/resend`),
  join: (payload) => request('POST', '/api/groups/join', payload),
  leave: (id) => request('POST', `/api/groups/${id}/leave`),
  removeMember: (id, userId) => request('DELETE', `/api/groups/${id}/members/${userId}`),
  updateMemberRole: (id, userId, payload) => request('PATCH', `/api/groups/${id}/members/${userId}/role`, payload),
  // Group Expenses
  listExpenses: (id, month) => request('GET', `/api/groups/${id}/expenses`, null, { month }),
  createExpense: (id, payload) => request('POST', `/api/groups/${id}/expenses`, payload),
  // Group Budget
  setBudget: (id, month, payload) => request('PUT', `/api/groups/${id}/budget`, payload, { month }),
  getBudgetStatus: (id, month) => request('GET', `/api/groups/${id}/budget/status`, null, { month }),
  setMemberBudget: (id, userId, month, payload) => request('PUT', `/api/groups/${id}/members/${userId}/budget`, payload, { month }),
  getMemberBudgets: (id, month) => request('GET', `/api/groups/${id}/members/budgets`, null, { month }),
  // Group Reports
  getSettlements: (id, month) => request('GET', `/api/groups/${id}/settlements`, null, { month }),
  getMonthlyReport: (id, month) => request('GET', `/api/groups/${id}/reports/monthly`, null, { month }),
  getAnalytics: (id, month) => request('GET', `/api/groups/${id}/reports/analytics`, null, { month }),
};

// ─── Personal Budgets API ─────────────────────────────────────────────────────
export const budgetsApi = {
  set: (month, payload) => request('PUT', '/api/users/me/budget', payload, { month }),
  getStatus: (month) => request('GET', '/api/users/me/budget/status', null, { month }),
};

// ─── Category Expense Limits API ──────────────────────────────────────────────
export const categoryLimitsApi = {
  list: () => request('GET', '/api/users/me/category-limits'),
  set: (categoryId, limitAmount) => request('PUT', `/api/users/me/category-limits/${categoryId}`, { limitAmount }),
  remove: (categoryId) => request('DELETE', `/api/users/me/category-limits/${categoryId}`),
};

// ─── Notifications API ────────────────────────────────────────────────────────
export const notificationsApi = {
  list: () => request('GET', '/api/notifications'),
  unreadCount: () => request('GET', '/api/notifications/unread-count'),
  markRead: (id) => request('PATCH', `/api/notifications/${id}/read`),
  markAllRead: () => request('PATCH', '/api/notifications/read-all'),
};

// ─── System API ───────────────────────────────────────────────────────────────
export const systemApi = {
  health: () => request('GET', '/api/system/health'),
  info: () => request('GET', '/api/system/info'),
};
