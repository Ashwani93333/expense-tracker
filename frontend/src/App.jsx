import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ExpenseProvider, useExpense } from './context/ExpenseContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { GroupsPage } from './pages/GroupsPage';
import { GroupDetailPage } from './pages/GroupDetailPage';
import { BudgetSettingsPage } from './pages/BudgetSettingsPage';
import { NotificationSettingsPage } from './pages/NotificationSettingsPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { ExpenseTable } from './components/expenses/ExpenseTable';
import { ReceiptScanner } from './components/receipts/ReceiptScanner';
import { AnalyticsCharts } from './components/analytics/AnalyticsCharts';
import { CategoriesManager } from './components/categories/CategoriesManager';
import { ExpenseFormModal } from './components/expenses/ExpenseFormModal';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const Toast = ({ message, type = 'success' }) => {
  const colors = {
    success: { border: '#10b981', icon: '#059669', bg: '#ecfdf5', text: '#065f46' },
    error:   { border: '#f43f5e', icon: '#dc2626', bg: '#fef2f2', text: '#991b1b' },
    info:    { border: '#3b82f6', icon: '#2563eb', bg: '#eff6ff', text: '#1e40af' },
  };
  const c = colors[type] || colors.success;
  const Icon = type === 'error' ? AlertCircle : type === 'info' ? Info : CheckCircle2;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 18px',
      borderRadius: '12px',
      background: c.bg,
      border: `1px solid ${c.border}`,
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
      minWidth: '280px',
      maxWidth: '420px',
    }}>
      <Icon size={20} color={c.icon} style={{ flexShrink: 0 }} />
      <span style={{ color: c.text, fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.4 }}>
        {message}
      </span>
    </div>
  );
};

const AuthLoader = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '16px',
    background: '#f8fafc',
  }}>
    <div className="spinner spinner-lg" style={{ borderTopColor: 'var(--accent)' }} />
    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Restoring session...</p>
  </div>
);

const AppContent = () => {
  const { activeTab, toastMessage } = useExpense();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-body)' }}>
      <Navbar />

      <div style={{ display: 'flex', flex: 1, maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
        <Sidebar />

        <main style={{ flex: 1, padding: '24px 28px', minWidth: 0, overflowX: 'hidden' }}>
          {activeTab === 'dashboard'      && <DashboardPage />}
          {activeTab === 'expenses'       && <ExpenseTable />}
          {activeTab === 'groups'         && <GroupsPage />}
          {activeTab === 'group-detail'   && <GroupDetailPage />}
          {activeTab === 'budget-settings'&& <BudgetSettingsPage />}
          {activeTab === 'notification-settings' && <NotificationSettingsPage />}
          {activeTab === 'scan'           && <ReceiptScanner />}
          {activeTab === 'analytics'      && <AnalyticsCharts />}
          {activeTab === 'categories'     && <CategoriesManager />}
        </main>
      </div>

      <ExpenseFormModal />
      <NotificationDrawer />

      {toastMessage && (
        <div className="toast-container" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, animation: 'slideIn 0.3s ease' }}>
          <Toast message={toastMessage.message} type={toastMessage.type} />
        </div>
      )}
    </div>
  );
};

const AuthGatedApp = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <AuthLoader />;

  if (!isAuthenticated) return <OnboardingPage />;

  return (
    <ExpenseProvider>
      <AppContent />
    </ExpenseProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AuthGatedApp />
    </AuthProvider>
  );
}
