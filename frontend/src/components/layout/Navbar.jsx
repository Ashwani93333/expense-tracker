import React, { useState } from 'react';
import { Plus, Bell, Search, Wallet, Users, LogOut, User, ChevronDown, ScanLine } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const {
    setIsAddModalOpen,
    setIsNotifDrawerOpen,
    unreadNotifCount,
    setActiveTab,
  } = useExpense();
  const { currentUser, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
  };

  const avatarUrl = currentUser?.avatarUrl || null;
  const initials = currentUser?.fullName
    ? currentUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 200,
      height: 'var(--header-height)',
      background: 'var(--bg-header)',
      borderBottom: '1px solid var(--border)',
      boxShadow: 'var(--shadow-xs)',
    }}>
      <div style={{
        height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', gap: '16px',
      }}>

        {/* Brand */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0, userSelect: 'none' }}
          onClick={() => setActiveTab('dashboard')}
        >
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(37,99,235,0.30)',
          }}>
            <Wallet size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              ExpenseTracker
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Finance Suite
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
          <Search size={14} style={{
            position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-faint)',
          }} />
          <input
            type="text"
            placeholder="Search expenses, groups..."
            className="input-field"
            style={{ paddingLeft: '34px', fontSize: '0.83rem', borderRadius: 'var(--r-full)', height: '36px', padding: '0 14px 0 34px' }}
          />
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

          {/* Scan Receipt */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveTab('scan')}
            style={{ gap: '5px' }}
          >
            <ScanLine size={14} color="var(--accent)" />
            <span style={{ color: 'var(--accent)' }}>Scan</span>
          </button>

          {/* Add Expense */}
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setIsAddModalOpen(true)}
            id="add-expense-btn"
          >
            <Plus size={14} />
            Add Expense
          </button>

          {/* Notifications */}
          <button
            onClick={() => setIsNotifDrawerOpen(prev => !prev)}
            id="notif-bell-btn"
            style={{
              position: 'relative', width: '36px', height: '36px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: '1px solid var(--border-strong)',
              borderRadius: 'var(--r-md)', cursor: 'pointer', transition: 'var(--t-fast)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Bell size={16} color="var(--text-muted)" />
            {unreadNotifCount > 0 && (
              <span style={{
                position: 'absolute', top: '-3px', right: '-3px',
                minWidth: '16px', height: '16px', borderRadius: '99px',
                background: '#dc2626', color: '#fff',
                fontSize: '0.6rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px',
                border: '2px solid #fff',
              }}>
                {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
              </span>
            )}
          </button>

          {/* User Menu */}
          <div style={{ position: 'relative' }}>
            <button
              id="user-menu-btn"
              onClick={() => setUserMenuOpen(p => !p)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '5px 10px 5px 5px', borderRadius: 'var(--r-full)',
                background: userMenuOpen ? 'var(--bg-surface)' : 'transparent',
                border: '1px solid var(--border-strong)',
                cursor: 'pointer', transition: 'var(--t-fast)',
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={currentUser?.fullName}
                  style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: '26px', height: '26px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 800, color: '#fff',
                }}>
                  {initials}
                </div>
              )}
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {currentUser?.fullName?.split(' ')[0] || 'User'}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1 }}>
                  {currentUser?.role === 'ROLE_USER' ? 'Member' : currentUser?.role}
                </div>
              </div>
              <ChevronDown size={13} color="var(--text-faint)" />
            </button>

            {userMenuOpen && (
              <>
                <div
                  onClick={() => setUserMenuOpen(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 299 }}
                />
                <div
                  style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    width: '220px',
                    background: '#fff',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-xl)',
                    padding: '6px',
                    boxShadow: 'var(--shadow-xl)',
                    zIndex: 300,
                    animation: 'slideUp 0.12s ease',
                  }}
                >
                  {/* User Info */}
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{currentUser?.fullName}</div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '2px' }}>{currentUser?.email}</div>
                  </div>

                  <button
                    onClick={() => { setActiveTab('dashboard'); setUserMenuOpen(false); }}
                    style={dropdownItemStyle}
                  >
                    <User size={14} />
                    <span>Dashboard</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('budget-settings'); setUserMenuOpen(false); }}
                    style={dropdownItemStyle}
                  >
                    <Wallet size={14} />
                    <span>Budget Settings</span>
                  </button>

                  <div style={{ borderTop: '1px solid var(--border)', marginTop: '4px', paddingTop: '4px' }}>
                    <button
                      onClick={handleLogout}
                      style={{ ...dropdownItemStyle, color: '#dc2626' }}
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

const dropdownItemStyle = {
  display: 'flex', alignItems: 'center', gap: '9px',
  width: '100%', padding: '8px 12px', border: 'none',
  background: 'transparent', color: 'var(--text-secondary)',
  fontSize: '0.84rem', fontWeight: 500, cursor: 'pointer',
  borderRadius: 'var(--r-md)', transition: 'var(--t-fast)',
  fontFamily: 'var(--font)', textAlign: 'left',
  onMouseEnter: undefined,
};
