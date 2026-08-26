import React from 'react';
import { Bell, CheckCheck, X, AlertTriangle, Users, DollarSign, TrendingUp, Info } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';

const notifIconMap = {
  EXPENSE_SPLIT_ASSIGNED:           { icon: DollarSign,    bg: 'rgba(183,255,0,0.08)', color: '#B7FF00' },
  GROUP_JOIN_REQUEST:               { icon: Users,         bg: 'rgba(183,255,0,0.08)', color: '#B7FF00' },
  GROUP_BUDGET_SET:                 { icon: TrendingUp,    bg: 'rgba(34,197,94,0.08)', color: '#22c55e' },
  BUDGET_THRESHOLD_REACHED:         { icon: AlertTriangle, bg: 'rgba(245,158,11,0.08)', color: '#f59e0b' },
  BUDGET_EXCEEDED:                  { icon: AlertTriangle, bg: 'rgba(239,68,68,0.08)', color: '#ef4444' },
  CATEGORY_BUDGET_THRESHOLD_REACHED:{ icon: AlertTriangle, bg: 'rgba(245,158,11,0.08)', color: '#f59e0b' },
  CATEGORY_BUDGET_EXCEEDED:         { icon: AlertTriangle, bg: 'rgba(239,68,68,0.08)', color: '#ef4444' },
  CATEGORY_LIMIT_EXCEEDED:          { icon: AlertTriangle, bg: 'rgba(239,68,68,0.08)', color: '#ef4444' },
  TOTAL_EXPENDITURE_THRESHOLD_REACHED: { icon: AlertTriangle, bg: 'rgba(239,68,68,0.08)', color: '#ef4444' },
  GROUP_BUDGET_THRESHOLD_REACHED:   { icon: AlertTriangle, bg: 'rgba(245,158,11,0.08)', color: '#f59e0b' },
  GROUP_BUDGET_EXCEEDED:            { icon: AlertTriangle, bg: 'rgba(239,68,68,0.08)', color: '#ef4444' },
  MONTHLY_SUMMARY:                  { icon: TrendingUp,    bg: 'rgba(183,255,0,0.08)', color: '#B7FF00' },
};

const timeAgo = (isoStr) => {
  if (!isoStr) return '';
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const NotificationDrawer = () => {
  const { isNotifDrawerOpen, setIsNotifDrawerOpen, notifications, markNotifAsRead, markAllNotifsRead, unreadNotifCount } = useExpense();

  if (!isNotifDrawerOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={() => setIsNotifDrawerOpen(false)}
      style={{ justifyContent: 'flex-end', padding: 0, alignItems: 'stretch' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '380px', height: '100vh',
          display: 'flex', flexDirection: 'column',
          background: '#fff',
          borderLeft: '1px solid var(--border)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
          animation: 'slideIn 0.2s ease',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px', borderBottom: '1px solid var(--border)',
          background: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: '#050505', border: '1px solid #1a1a1a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bell size={16} color="#B7FF00" />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>Notifications</h3>
              {unreadNotifCount > 0 && (
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>{unreadNotifCount} unread</p>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {unreadNotifCount > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={markAllNotifsRead} style={{ fontSize: '0.75rem' }}>
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
            <button
              onClick={() => setIsNotifDrawerOpen(false)}
              style={{
                background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                cursor: 'pointer', color: 'var(--text-muted)',
                width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#050505', border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Bell size={24} color="#737373" />
              </div>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '4px', fontWeight: 700 }}>All caught up!</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No notifications yet.</p>
            </div>
          ) : (
            notifications.map(notif => {
              const cfg = notifIconMap[notif.type] || { icon: Info, bg: 'rgba(115,115,115,0.08)', color: '#737373' };
              const Icon = cfg.icon;
              return (
                <div
                  key={notif.id}
                  onClick={() => markNotifAsRead(notif.id)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    padding: '11px 12px', borderRadius: 'var(--r-lg)', marginBottom: '4px',
                    background: notif.isRead ? 'transparent' : 'rgba(183,255,0,0.04)',
                    border: `1px solid ${notif.isRead ? 'transparent' : 'rgba(183,255,0,0.1)'}`,
                    cursor: 'pointer', transition: 'var(--t-fast)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface)'}
                  onMouseLeave={e => e.currentTarget.style.background = notif.isRead ? 'transparent' : 'rgba(183,255,0,0.04)'}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                    background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={15} color={cfg.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
                      <h5 style={{
                        fontSize: '0.83rem', color: notif.isRead ? 'var(--text-secondary)' : 'var(--text-primary)',
                        fontWeight: notif.isRead ? 500 : 700, margin: 0,
                      }}>
                        {notif.title}
                      </h5>
                      {!notif.isRead && (
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#B7FF00', flexShrink: 0, marginTop: '4px' }} />
                      )}
                    </div>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '3px 0 0 0', lineHeight: 1.45 }}>
                      {notif.message || notif.body}
                    </p>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-faint)', display: 'block', marginTop: '4px' }}>
                      {timeAgo(notif.createdAt) || notif.time}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
