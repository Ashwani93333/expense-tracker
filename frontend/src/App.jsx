import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ExpenseProvider, useExpense } from './context/ExpenseContext';
import { IncomeProvider, useIncome } from './context/IncomeContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNavigation } from './components/layout/MobileNavigation';
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
import { IncomeFormModal } from './components/incomes/IncomeFormModal';
import { IncomePage } from './pages/IncomePage';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { ExportModal } from './components/exports/ExportModal';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const Toast = ({ message, type = 'success' }) => {
  const styles = {
    success: {
      border: '1px solid rgba(34, 197, 94, 0.3)',
      bg: '#0a0a0a',
      iconBg: 'rgba(34, 197, 94, 0.15)',
      iconColor: '#22c55e',
      textColor: '#e5e5e5',
      symbol: '✓',
    },
    error: {
      border: '1px solid rgba(239, 68, 68, 0.3)',
      bg: '#0a0a0a',
      iconBg: 'rgba(239, 68, 68, 0.15)',
      iconColor: '#ef4444',
      textColor: '#e5e5e5',
      symbol: '!',
    },
    info: {
      border: '1px solid rgba(183, 255, 0, 0.3)',
      bg: '#0a0a0a',
      iconBg: 'rgba(183, 255, 0, 0.1)',
      iconColor: '#B7FF00',
      textColor: '#e5e5e5',
      symbol: 'i',
    },
  };
  const s = styles[type] || styles.success;
  const Icon = type === 'error' ? AlertCircle : type === 'info' ? Info : CheckCircle2;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 18px',
      borderRadius: '14px',
      background: s.bg,
      border: s.border,
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)',
      minWidth: '280px',
      maxWidth: '420px',
      backdropFilter: 'blur(12px)',
      animation: 'slideUp 0.2s ease',
    }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: '8px',
        background: s.iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={16} color={s.iconColor} />
      </div>
      <span style={{ color: s.textColor, fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.4 }}>
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
    background: '#050505',
  }}>
    <div className="spinner spinner-lg" style={{ borderTopColor: 'var(--accent)' }} />
    <p style={{ color: '#737373', fontSize: '0.9rem', fontWeight: 600 }}>Restoring session...</p>
  </div>
);

const AppContent = () => {
  const { activeTab, toastMessage, isExportModalOpen, setIsExportModalOpen, exportModalType } = useExpense();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-page)', overflow: 'hidden' }}>
      <Navbar />

      <div style={{ display: 'flex', flex: 1, width: '100%', overflow: 'hidden' }}>
        <Sidebar />

        <main style={{
          flex: 1,
          padding: '28px 32px',
          paddingBottom: 'calc(28px + 70px)',
          minWidth: 0,
          overflowX: 'hidden',
          overflowY: 'auto',
          maxWidth: '1200px',
        }}
          className="main-content"
        >
          {activeTab === 'dashboard'      && <DashboardPage />}
          {activeTab === 'expenses'       && <ExpenseTable />}
          {activeTab === 'incomes'        && <IncomePage />}
          {activeTab === 'groups'         && <GroupsPage />}
          {activeTab === 'group-detail'   && <GroupDetailPage />}
          {activeTab === 'budget-settings'&& <BudgetSettingsPage />}
          {activeTab === 'notification-settings' && <NotificationSettingsPage />}
          {activeTab === 'scan'           && <ReceiptScanner />}
          {activeTab === 'analytics'      && <AnalyticsCharts />}
          {activeTab === 'categories'     && <CategoriesManager />}
        </main>
      </div>

      <MobileNavigation />

      <ExpenseFormModal />
      <IncomeFormModal />
      <NotificationDrawer />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        exportType={exportModalType}
      />

      {toastMessage && (
        <div className="toast-container" style={{ position: 'fixed', bottom: '90px', right: '24px', zIndex: 9999, animation: 'slideIn 0.3s ease' }}>
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
      <IncomeProvider>
        <AppContent />
      </IncomeProvider>
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
