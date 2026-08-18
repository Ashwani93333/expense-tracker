import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  expensesApi,
  categoriesApi,
  groupsApi,
  budgetsApi,
  notificationsApi,
  usersApi,
} from '../services/api';

const ExpenseContext = createContext(null);

// Helper: get current month string like "2026-08"
const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const ExpenseProvider = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();

  // ─── Core Data State ────────────────────────────────────────────────────────
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [groups, setGroups] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [personalBudgetStatus, setPersonalBudgetStatus] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // ─── Data Version ────────────────────────────────────────────────────────────
  // Incremented after every mutation so every page (dashboard, group detail,
  // expense table, analytics) can react instantly and refetch what it needs.
  const [dataVersion, setDataVersion] = useState(0);
  const bumpDataVersion = useCallback(() => setDataVersion(v => v + 1), []);

  // ─── UI State ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isJoinGroupModalOpen, setIsJoinGroupModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  // ─── Toast Helper ───────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ─── Active Group ────────────────────────────────────────────────────────────
  const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0] || null;

  // ─── Initial Data Fetch ──────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const [cats, grps, notifs, budgetStatus] = await Promise.allSettled([
        categoriesApi.list(),
        groupsApi.list(),
        notificationsApi.list(),
        budgetsApi.getStatus(currentMonth),
      ]);

      if (cats.status === 'fulfilled') setCategories(cats.value || []);
      if (grps.status === 'fulfilled') {
        const groupList = grps.value || [];
        setGroups(groupList);
        if (groupList.length > 0 && !activeGroupId) {
          setActiveGroupId(groupList[0].id);
        }
      }
      if (notifs.status === 'fulfilled') setNotifications(notifs.value || []);
      if (budgetStatus.status === 'fulfilled') setPersonalBudgetStatus(budgetStatus.value || []);

      // Fetch expenses separately
      const expList = await expensesApi.list(currentMonth);
      setExpenses(expList || []);
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentMonth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAll();
    } else {
      // Clear data on logout
      setExpenses([]);
      setCategories([]);
      setGroups([]);
      setNotifications([]);
      setPersonalBudgetStatus([]);
    }
  }, [isAuthenticated, currentMonth]);

  // ─── Unread Count Refresh ────────────────────────────────────────────────────
  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationsApi.unreadCount();
      setUnreadNotifCount(data?.count ?? 0);
    } catch { /* silent */ }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshUnreadCount();
  }, [notifications]);

  // ─── Add Personal Expense ────────────────────────────────────────────────────
  const addExpense = async (formData) => {
    try {
      let newExpense;
      if (formData.groupId) {
        // Group expense
        const payload = {
          amount: parseFloat(formData.amount),
          description: formData.description,
          expenseDate: formData.expenseDate,
          categoryId: formData.categoryId,
          paidBy: formData.paidBy,
          splitType: formData.splitType || 'EQUAL',
          splits: formData.splits || [],
        };
        newExpense = await groupsApi.createExpense(formData.groupId, payload);
      } else {
        // Personal expense
        const payload = {
          amount: parseFloat(formData.amount),
          description: formData.description,
          expenseDate: formData.expenseDate,
          categoryId: formData.categoryId,
          receiptUrl: formData.receiptUrl || null,
        };
        newExpense = await expensesApi.create(payload);
      }

      setExpenses(prev => [newExpense, ...prev]);
      // Instantly refresh all data to update charts, budgets, and dashboard
      fetchAll();
      bumpDataVersion();
      showToast(`Expense "₹${parseFloat(formData.amount).toFixed(2)}" added successfully!`);
      return newExpense;
    } catch (err) {
      showToast(err.message || 'Failed to add expense', 'error');
      throw err;
    }
  };

  // ─── Delete Expense ──────────────────────────────────────────────────────────
  const deleteExpense = async (id) => {
    try {
      await expensesApi.delete(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      bumpDataVersion();
      showToast('Expense deleted successfully');
    } catch (err) {
      showToast(err.message || 'Failed to delete expense', 'error');
    }
  };

  // ─── Settle Split Share ──────────────────────────────────────────────────────
  const settleSplitShare = async (expenseId, userId) => {
    try {
      const updated = await expensesApi.settleSplit(expenseId, userId);
      setExpenses(prev => prev.map(e => {
        if (e.id === expenseId && e.splits) {
          return {
            ...e,
            splits: e.splits.map(s =>
              s.userId === userId ? { ...s, isSettled: true, settledAt: new Date().toISOString() } : s
            )
          };
        }
        return e;
      }));
      bumpDataVersion();
      showToast('Split share marked as settled! ✅');
    } catch (err) {
      showToast(err.message || 'Failed to settle split', 'error');
    }
  };

  // ─── Create Group ────────────────────────────────────────────────────────────
  const createGroup = async (groupData) => {
    try {
      const payload = {
        name: groupData.name,
        description: groupData.description || '',
        currencyCode: groupData.currencyCode || 'INR',
      };
      const newGroup = await groupsApi.create(payload);
      setGroups(prev => [...prev, newGroup]);
      setActiveGroupId(newGroup.id);
      bumpDataVersion();
      showToast(`Group "${newGroup.name}" created! Invite code: ${newGroup.inviteCode}`);
      return newGroup;
    } catch (err) {
      showToast(err.message || 'Failed to create group', 'error');
      throw err;
    }
  };

  // ─── Join Group ──────────────────────────────────────────────────────────────
  const joinGroup = async (input) => {
    const payload = typeof input === 'string'
      ? { code: input.trim().toUpperCase() }
      : {
          ...(input?.code ? { code: input.code.trim().toUpperCase() } : {}),
          ...(input?.token ? { token: input.token.trim() } : {}),
        };
    try {
      const grp = await groupsApi.join(payload);
      setGroups(prev => {
        const exists = prev.find(g => g.id === grp.id);
        if (exists) return prev.map(g => g.id === grp.id ? grp : g);
        return [...prev, grp];
      });
      setActiveGroupId(grp.id);
      bumpDataVersion();
      showToast(`Joined group "${grp.name}" successfully!`);
      return true;
    } catch (err) {
      showToast(err.message || 'Invalid invite code or link. Please try again.', 'error');
      return false;
    }
  };

  // ─── Leave Group ─────────────────────────────────────────────────────────────
  const leaveGroup = async (groupId) => {
    try {
      await groupsApi.leave(groupId);
      setGroups(prev => prev.filter(g => g.id !== groupId));
      const remaining = groups.filter(g => g.id !== groupId);
      if (remaining.length > 0) setActiveGroupId(remaining[0].id);
      else setActiveGroupId(null);
      bumpDataVersion();
      showToast('You have left the group.');
    } catch (err) {
      showToast(err.message || 'Failed to leave group', 'error');
    }
  };

  // ─── Remove Member ───────────────────────────────────────────────────────────
  const removeMember = async (groupId, userId) => {
    try {
      await groupsApi.removeMember(groupId, userId);
      // Refresh group details
      const updated = await groupsApi.get(groupId);
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, ...updated.group, members: updated.members } : g));
      bumpDataVersion();
      showToast('Member removed from group.');
    } catch (err) {
      showToast(err.message || 'Failed to remove member', 'error');
    }
  };

  // ─── Update Member Role ──────────────────────────────────────────────────────
  const updateMemberRole = async (groupId, userId, newRole) => {
    try {
      await groupsApi.updateMemberRole(groupId, userId, { role: newRole });
      // Refresh group
      const updated = await groupsApi.get(groupId);
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, ...updated.group, members: updated.members } : g));
      bumpDataVersion();
      showToast(`Member role updated to ${newRole}.`);
    } catch (err) {
      showToast(err.message || 'Failed to update role', 'error');
    }
  };

  // ─── Group Budget ────────────────────────────────────────────────────────────
  const updateGroupBudget = async (groupId, budgetLimit) => {
    try {
      await groupsApi.setBudget(groupId, currentMonth, { budgetLimit: parseFloat(budgetLimit) });
      bumpDataVersion();
      showToast(`Group budget updated to ₹${parseFloat(budgetLimit).toFixed(2)}.`);
    } catch (err) {
      showToast(err.message || 'Failed to update group budget', 'error');
    }
  };

  // ─── Member Budget Cap ───────────────────────────────────────────────────────
  const updateMemberBudgetCap = async (groupId, userId, capAmount) => {
    try {
      await groupsApi.setMemberBudget(groupId, userId, currentMonth, { budgetLimit: parseFloat(capAmount) });
      bumpDataVersion();
      showToast(`Member budget cap updated to ₹${parseFloat(capAmount).toFixed(2)}.`);
    } catch (err) {
      showToast(err.message || 'Failed to update member budget', 'error');
    }
  };

  // ─── Personal Budget ─────────────────────────────────────────────────────────
  const updatePersonalBudget = async (budgetLimit, categoryId = null) => {
    try {
      const payload = { budgetLimit: parseFloat(budgetLimit) };
      if (categoryId) payload.categoryId = categoryId;
      await budgetsApi.set(currentMonth, payload);
      // Refresh budget status
      const status = await budgetsApi.getStatus(currentMonth);
      setPersonalBudgetStatus(status || []);
      bumpDataVersion();
      showToast(`Budget updated to ₹${parseFloat(budgetLimit).toFixed(2)}.`);
    } catch (err) {
      showToast(err.message || 'Failed to update budget', 'error');
    }
  };

  // Legacy alias
  const updateCategoryBudget = (catId, limitAmount) => updatePersonalBudget(limitAmount, catId);

  // ─── Group Settlements ───────────────────────────────────────────────────────
  const calculateGroupSettlements = async (groupId) => {
    try {
      const settlements = await groupsApi.getSettlements(groupId, currentMonth);
      return settlements || [];
    } catch (err) {
      console.error('Failed to get settlements:', err);
      return [];
    }
  };

  // ─── Add Category ─────────────────────────────────────────────────────────────
  const addCategory = async (categoryData) => {
    try {
      const newCat = await categoriesApi.create({
        name: categoryData.name,
        icon: categoryData.icon || '📁',
        color: categoryData.color || '#6366f1',
      });
      setCategories(prev => [...prev, newCat]);
      bumpDataVersion();
      showToast(`Category "${newCat.name}" created!`);
      return newCat;
    } catch (err) {
      showToast(err.message || 'Failed to create category', 'error');
      throw err;
    }
  };

  // ─── Delete Category ──────────────────────────────────────────────────────────
  const deleteCategory = async (id) => {
    try {
      await categoriesApi.delete(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      bumpDataVersion();
      showToast('Category deleted.');
    } catch (err) {
      showToast(err.data?.message || err.message || 'Cannot delete this category', 'error');
    }
  };

  // ─── Notifications ────────────────────────────────────────────────────────────
  const markNotifAsRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  };

  const markAllNotifsRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* silent */ }
  };

  // ─── Receipt Scan (UI-only simulation — no backend endpoint) ─────────────────
  const processReceiptScan = (file, onSuccess) => {
    // Simulated OCR — creates a draft that user can confirm and then addExpense
    const templates = [
      { merchant: 'Reliance Smart', amount: 1850.00, date: new Date().toISOString().split('T')[0], categoryName: 'Groceries', confidence: 0.94 },
      { merchant: 'Croma Electronics', amount: 3499.00, date: new Date().toISOString().split('T')[0], categoryName: 'Shopping', confidence: 0.89 },
      { merchant: 'Swiggy Order', amount: 420.00, date: new Date().toISOString().split('T')[0], categoryName: 'Food & Dining', confidence: 0.97 },
    ];
    const template = templates[Math.floor(Math.random() * templates.length)];
    const cat = categories.find(c => c.name === template.categoryName) || categories[0];
    setTimeout(() => {
      onSuccess?.({
        merchant: template.merchant,
        amount: template.amount,
        date: template.date,
        categoryId: cat?.id,
        categoryName: cat?.name || template.categoryName,
        confidence: template.confidence,
        items: [],
      });
    }, 1800);
  };

  // ─── Derived Values ───────────────────────────────────────────────────────────
  const totalSpent = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const overallBudget = personalBudgetStatus.find(b => !b.categoryId);

  // Legacy personal budget shape for components that use it
  const personalBudget = {
    overallLimit: overallBudget?.budgetLimit || 0,
    spent: overallBudget?.spent || 0,
    remaining: overallBudget?.remaining || 0,
    percentUsed: overallBudget?.percentUsed || 0,
    status: overallBudget?.status || 'NO_BUDGET',
    categoryBudgets: personalBudgetStatus
      .filter(b => b.categoryId)
      .reduce((acc, b) => { acc[b.categoryId] = b.budgetLimit; return acc; }, {}),
  };

  return (
    <ExpenseContext.Provider value={{
      // Auth-derived
      currentUser,
      // Data
      expenses,
      setExpenses,
      categories,
      groups,
      activeGroupId,
      setActiveGroupId,
      activeGroup,
      personalBudget,
      personalBudgetStatus,
      notifications,
      unreadNotifCount,
      currentMonth,
      setCurrentMonth,
      // UI
      activeTab,
      setActiveTab,
      isLoading,
      isAddModalOpen,
      setIsAddModalOpen,
      isNotifDrawerOpen,
      setIsNotifDrawerOpen,
      isCreateGroupModalOpen,
      setIsCreateGroupModalOpen,
      isJoinGroupModalOpen,
      setIsJoinGroupModalOpen,
      isInviteModalOpen,
      setIsInviteModalOpen,
      isBudgetModalOpen,
      setIsBudgetModalOpen,
      toastMessage,
      // Data version (bumps after every mutation → pages refetch instantly)
      dataVersion,
      bumpDataVersion,
      // Actions
      addExpense,
      deleteExpense,
      settleSplitShare,
      createGroup,
      joinGroup,
      leaveGroup,
      removeMember,
      updateMemberRole,
      updateGroupBudget,
      updateMemberBudgetCap,
      updatePersonalBudget,
      updateCategoryBudget,
      calculateGroupSettlements,
      addCategory,
      deleteCategory,
      processReceiptScan,
      markNotifAsRead,
      markAllNotifsRead,
      showToast,
      fetchAll,
      totalSpent,
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) throw new Error('useExpense must be used within an ExpenseProvider');
  return context;
};
