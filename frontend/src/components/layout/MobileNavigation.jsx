import React from 'react';
import { LayoutDashboard, ReceiptText, ScanLine, TrendingUp, MoreHorizontal, Plus } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'expenses', label: 'Expenses', icon: ReceiptText },
  { id: 'scan', label: 'Scan', icon: ScanLine, isCenter: true },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'more', label: 'More', icon: MoreHorizontal },
];

export const MobileNavigation = () => {
  const { activeTab, setActiveTab, setIsAddModalOpen } = useExpense();

  const isActive = (id) => {
    if (id === 'more') return ['groups', 'budget-settings', 'notification-settings', 'categories', 'group-detail'].includes(activeTab);
    if (id === 'dashboard') return activeTab === 'dashboard';
    if (id === 'expenses') return activeTab === 'expenses';
    if (id === 'scan') return activeTab === 'scan';
    if (id === 'analytics') return activeTab === 'analytics';
    return activeTab === id;
  };

  const handleTap = (id) => {
    if (id === 'scan') {
      setActiveTab('scan');
    } else if (id === 'more') {
      setActiveTab('groups');
    } else {
      setActiveTab(id);
    }
  };

  return (
    <div className="mobile-nav mobile-only">
      {NAV_ITEMS.map(item => {
        const Icon = item.icon;
        const active = isActive(item.id);

        if (item.isCenter) {
          return (
            <button
              key={item.id}
              className="mobile-nav-item"
              onClick={() => handleTap(item.id)}
              style={{
                background: 'var(--accent)',
                color: '#050505',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                padding: 0,
                marginTop: '-20px',
                boxShadow: '0 4px 15px rgba(183, 255, 0, 0.3)',
                fontSize: 0,
                fontWeight: 0,
              }}
            >
              <Icon size={22} color="#050505" />
            </button>
          );
        }

        return (
          <button
            key={item.id}
            className={`mobile-nav-item ${active ? 'active' : ''}`}
            onClick={() => handleTap(item.id)}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
