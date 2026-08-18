import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  PieChart,
  Tag,
  Users,
  Target,
  TrendingUp,
  ScanLine,
  BellRing,
  ChevronRight,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard',  label: 'Dashboard',       icon: LayoutDashboard },
      { id: 'analytics',  label: 'Analytics',        icon: TrendingUp },
    ],
  },
  {
    label: 'Finance',
    items: [
      { id: 'expenses',         label: 'My Expenses',      icon: ReceiptText },
      { id: 'scan',             label: 'Scan Receipt',     icon: ScanLine, highlight: true },
      { id: 'budget-settings',  label: 'Budget',           icon: Target },
      { id: 'categories',       label: 'Categories',       icon: Tag },
      { id: 'notification-settings', label: 'Notification Alerts', icon: BellRing },
    ],
  },
  {
    label: 'Groups',
    items: [
      { id: 'groups',       label: 'My Groups',       icon: Users, badgeKey: 'groups' },
    ],
  },
];

export const Sidebar = () => {
  const { activeTab, setActiveTab, groups } = useExpense();

  const isActive = (id) => activeTab === id || (id === 'groups' && activeTab === 'group-detail');

  const getBadge = (key) => {
    if (key === 'groups') return groups.length || null;
    return null;
  };

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      flexShrink: 0,
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 10px',
      minHeight: 'calc(100vh - var(--header-height))',
      position: 'sticky',
      top: 'var(--header-height)',
      alignSelf: 'flex-start',
      overflowY: 'auto',
    }}>

      {NAV_SECTIONS.map(section => (
        <div key={section.label} style={{ marginBottom: '24px' }}>
          {/* Section Label */}
          <div style={{
            fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-faint)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            paddingLeft: '10px', marginBottom: '4px',
          }}>
            {section.label}
          </div>

          {/* Nav Items */}
          {section.items.map(item => {
            const Icon = item.icon;
            const active = isActive(item.id);
            const badge = getBadge(item.badgeKey);

            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 10px', borderRadius: 'var(--r-md)', width: '100%',
                  border: 'none', marginBottom: '1px',
                  background: active ? 'var(--accent-light)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: active ? 600 : 500,
                  fontSize: '0.855rem',
                  cursor: 'pointer',
                  transition: 'var(--t-fast)',
                  fontFamily: 'var(--font)',
                  textAlign: 'left',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'var(--bg-surface)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Icon
                    size={16}
                    color={active ? 'var(--accent)' : item.highlight ? 'var(--accent)' : 'var(--text-faint)'}
                    style={{ flexShrink: 0 }}
                  />
                  <span>{item.label}</span>
                  {item.highlight && !active && (
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 700,
                      padding: '1px 5px', borderRadius: '99px',
                      background: 'var(--accent-light)',
                      color: 'var(--accent)',
                    }}>
                      AI
                    </span>
                  )}
                </div>
                {badge != null && badge > 0 && (
                  <span style={{
                    fontSize: '0.68rem', fontWeight: 700,
                    padding: '1px 7px', borderRadius: '99px',
                    background: active ? 'rgba(37,99,235,0.15)' : '#f3f4f6',
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                  }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}

      {/* Bottom spacer */}
      <div style={{ flex: 1 }} />

      {/* API Status badge */}
      {/* <div style={{
        padding: '12px', borderRadius: 'var(--r-lg)',
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        margin: '8px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
          <span style={{ fontSize: '0.77rem', fontWeight: 600, color: 'var(--text-secondary)' }}>API Connected</span>
        </div>
        <p style={{ fontSize: '0.71rem', color: 'var(--text-faint)', lineHeight: 1.5 }}>
          localhost:8080 · JWT auth
        </p>
      </div> */}
    </aside>
  );
};
