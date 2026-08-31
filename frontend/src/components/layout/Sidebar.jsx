import React, { useState } from 'react';
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
  Wallet,
  Settings,
  Download,
  FileText,
  ChevronDown,
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
    label: 'Money',
    items: [
      { id: 'expenses',         label: 'Expenses',      icon: ReceiptText },
      { id: 'budget-settings',  label: 'Budgets',       icon: Target },
      { id: 'categories',       label: 'Categories',    icon: Tag },
    ],
  },
  {
    label: 'Groups',
    items: [
      { id: 'groups',       label: 'Groups',       icon: Users, badgeKey: 'groups' },
    ],
  },
  {
    label: 'AI',
    items: [
      { id: 'scan',             label: 'Scan Receipt',     icon: ScanLine, highlight: true },
    ],
  },
  {
    label: 'Settings',
    items: [
      { id: 'notification-settings', label: 'Notifications', icon: BellRing },
    ],
  },
];

const EXPORT_OPTIONS = [
  { id: 'personal', label: 'Personal Expenses', icon: FileText, description: 'Export your personal expense data' },
  { id: 'group', label: 'Group Expenses', icon: Users, description: 'Export group expense reports' },
];

export const Sidebar = () => {
  const { activeTab, setActiveTab, groups, setIsExportModalOpen, setExportModalType } = useExpense();
  const [isExportExpanded, setIsExportExpanded] = useState(false);

  const isActive = (id) => activeTab === id || (id === 'groups' && activeTab === 'group-detail');

  const handleExportClick = (type) => {
    setExportModalType(type);
    setIsExportModalOpen(true);
  };

  const getBadge = (key) => {
    if (key === 'groups') return groups.length || null;
    return null;
  };

  return (
    <aside className="desktop-sidebar" style={{
      width: 'var(--sidebar-width)',
      flexShrink: 0,
      background: '#ffffff',
      borderRight: '1px solid #e5e5e5',
      boxShadow: '4px 0 24px -4px rgba(0,0,0,0.06)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 12px',
      height: 'calc(100vh - var(--header-height))',
      position: 'sticky',
      top: 'var(--header-height)',
      alignSelf: 'flex-start',
    }}>

      {NAV_SECTIONS.map(section => (
        <div key={section.label} style={{ marginBottom: '24px' }}>
          {/* Section Label */}
          <div style={{
            fontSize: '0.65rem', fontWeight: 700, color: '#737373',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            paddingLeft: '12px', marginBottom: '6px',
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
                className={`sidebar-nav-item ${active ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 'var(--r-md)', width: '100%',
                  border: 'none', marginBottom: '2px',
                  background: active ? 'rgba(183, 255, 0, 0.12)' : 'transparent',
                  color: active ? '#1a1a1a' : '#404040',
                  fontWeight: active ? 600 : 500,
                  fontSize: '0.855rem',
                  cursor: 'pointer',
                  transition: 'var(--t-fast)',
                  fontFamily: 'var(--font)',
                  textAlign: 'left',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
                    e.currentTarget.style.color = '#1a1a1a';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#404040';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon
                    size={17}
                    color={active ? '#1a1a1a' : item.highlight ? 'var(--accent)' : 'inherit'}
                    className="sidebar-icon"
                  />
                  <span className="sidebar-label">{item.label}</span>
                  {item.highlight && !active && (
                    <span style={{
                      fontSize: '0.58rem', fontWeight: 800,
                      padding: '2px 6px', borderRadius: '99px',
                      background: 'rgba(183, 255, 0, 0.12)',
                      color: 'var(--accent)',
                      letterSpacing: '0.04em',
                    }}>
                      AI
                    </span>
                  )}
                </div>
                {badge != null && badge > 0 && (
                  <span style={{
                    fontSize: '0.68rem', fontWeight: 700,
                    padding: '2px 7px', borderRadius: '99px',
                    background: active ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.06)',
                    color: active ? '#1a1a1a' : '#737373',
                  }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}

      {/* Export Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          fontSize: '0.65rem', fontWeight: 700, color: '#737373',
          textTransform: 'uppercase', letterSpacing: '0.1em',
          paddingLeft: '12px', marginBottom: '6px',
        }}>
          Export
        </div>

        {/* Export Toggle Button */}
        <button
          onClick={() => setIsExportExpanded(!isExportExpanded)}
          className={`sidebar-nav-item ${isExportExpanded ? 'active' : ''}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 12px', borderRadius: 'var(--r-md)', width: '100%',
            border: 'none', marginBottom: '2px',
            background: isExportExpanded ? 'rgba(183, 255, 0, 0.12)' : 'transparent',
            color: isExportExpanded ? '#1a1a1a' : '#404040',
            fontWeight: isExportExpanded ? 600 : 500,
            fontSize: '0.855rem',
            cursor: 'pointer',
            transition: 'var(--t-fast)',
            fontFamily: 'var(--font)',
            textAlign: 'left',
            position: 'relative',
          }}
          onMouseEnter={e => {
            if (!isExportExpanded) {
              e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
              e.currentTarget.style.color = '#1a1a1a';
            }
          }}
          onMouseLeave={e => {
            if (!isExportExpanded) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#404040';
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Download size={17} color={isExportExpanded ? '#1a1a1a' : 'inherit'} className="sidebar-icon" />
            <span className="sidebar-label">Export Data</span>
          </div>
          <ChevronRight
            size={14}
            style={{
              transform: isExportExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              color: '#a3a3a3',
            }}
          />
        </button>

        {/* Export Sub-Items */}
        {isExportExpanded && (
          <div style={{ paddingLeft: '8px', marginTop: '4px' }}>
            {EXPORT_OPTIONS.map(option => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => handleExportClick(option.id)}
                  className="sidebar-nav-item"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 12px', borderRadius: 'var(--r-md)', width: '100%',
                    border: 'none', marginBottom: '2px',
                    background: 'transparent',
                    color: '#404040',
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'var(--t-fast)',
                    fontFamily: 'var(--font)',
                    textAlign: 'left',
                    position: 'relative',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
                    e.currentTarget.style.color = '#1a1a1a';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#404040';
                  }}
                >
                  <Icon size={15} color="#737373" className="sidebar-icon" />
                  <div className="sidebar-label">
                    <div style={{ fontWeight: 600 }}>{option.label}</div>
                    <div style={{ fontSize: '0.7rem', color: '#a3a3a3', marginTop: '1px' }}>{option.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom spacer */}
      <div style={{ flex: 1 }} />

      {/* API Status badge */}
      <div style={{
        padding: '12px', borderRadius: 'var(--r-lg)',
        background: 'rgba(255,255,255,0.03)', border: '1px solid #1a1a1a',
        margin: '8px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#737373' }}>Connected</span>
        </div>
        <p style={{ fontSize: '0.68rem', color: '#525252', lineHeight: 1.5 }}>
          API · JWT auth
        </p>
      </div>
    </aside>
  );
};
