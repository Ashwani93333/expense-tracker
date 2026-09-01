import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useExpense } from './ExpenseContext';
import { incomesApi } from '../services/api';
import { toQueryParams } from '../utils/dateFilter';

const IncomeContext = createContext(null);

export const IncomeProvider = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const { dateFilter } = useExpense();

  const [incomes, setIncomes] = useState([]);
  const [incomeSummary, setIncomeSummary] = useState(null);
  const [financialOverview, setFinancialOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);

  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchIncomes = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const params = toQueryParams(dateFilter);
      const [incomeList, summary, overview] = await Promise.allSettled([
        incomesApi.list(params),
        incomesApi.summary(params),
        incomesApi.overview(params),
      ]);

      if (incomeList.status === 'fulfilled') setIncomes(incomeList.value || []);
      if (summary.status === 'fulfilled') setIncomeSummary(summary.value);
      if (overview.status === 'fulfilled') setFinancialOverview(overview.value);
    } catch (err) {
      console.error('Failed to fetch incomes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, dateFilter]);

  useEffect(() => {
    if (isAuthenticated) fetchIncomes();
    else {
      setIncomes([]);
      setIncomeSummary(null);
      setFinancialOverview(null);
    }
  }, [isAuthenticated, fetchIncomes]);

  const addIncome = async (formData) => {
    try {
      const payload = {
        amount: parseFloat(formData.amount),
        description: formData.description,
        incomeDate: formData.incomeDate,
        source: formData.source,
        isRecurring: formData.isRecurring || false,
        frequency: formData.isRecurring ? formData.frequency : null,
        notes: formData.notes || null,
      };
      const newIncome = await incomesApi.create(payload);
      setIncomes(prev => [newIncome, ...prev]);
      fetchIncomes();
      showToast(`Income of ₹${parseFloat(formData.amount).toLocaleString('en-IN')} added!`);
      return newIncome;
    } catch (err) {
      showToast(err.message || 'Failed to add income', 'error');
      throw err;
    }
  };

  const updateIncome = async (id, formData) => {
    try {
      const payload = {
        amount: parseFloat(formData.amount),
        description: formData.description,
        incomeDate: formData.incomeDate,
        source: formData.source,
        isRecurring: formData.isRecurring || false,
        frequency: formData.isRecurring ? formData.frequency : null,
        notes: formData.notes || null,
      };
      const updated = await incomesApi.update(id, payload);
      setIncomes(prev => prev.map(i => i.id === id ? updated : i));
      fetchIncomes();
      showToast('Income updated!');
      return updated;
    } catch (err) {
      showToast(err.message || 'Failed to update income', 'error');
      throw err;
    }
  };

  const deleteIncome = async (id) => {
    try {
      await incomesApi.delete(id);
      setIncomes(prev => prev.filter(i => i.id !== id));
      fetchIncomes();
      showToast('Income deleted.');
    } catch (err) {
      showToast(err.message || 'Failed to delete income', 'error');
    }
  };

  const openAddIncome = () => {
    setEditingIncome(null);
    setIsIncomeModalOpen(true);
  };

  const openEditIncome = (income) => {
    setEditingIncome(income);
    setIsIncomeModalOpen(true);
  };

  return (
    <IncomeContext.Provider value={{
      incomes,
      incomeSummary,
      financialOverview,
      isLoading,
      dateFilter,
      isIncomeModalOpen,
      setIsIncomeModalOpen,
      editingIncome,
      setEditingIncome,
      toastMessage,
      addIncome,
      updateIncome,
      deleteIncome,
      openAddIncome,
      openEditIncome,
      fetchIncomes,
      showToast,
    }}>
      {children}
    </IncomeContext.Provider>
  );
};

export const useIncome = () => {
  const context = useContext(IncomeContext);
  if (!context) throw new Error('useIncome must be used within an IncomeProvider');
  return context;
};
