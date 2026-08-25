import React from 'react';
import { Users, Key, ArrowRight, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';

export const GroupCard = ({ group, onSelect }) => {
  const { currentMonth } = useExpense();
  const { currentUser } = useAuth();

  const userRole = group.currentUserRole || 'MEMBER';
  const memberCount = group.memberCount ?? (group.members?.length ?? 0);

  const isExpired = group.expiresAt && new Date(group.expiresAt) < new Date();
  const daysUntilExpiry = group.expiresAt ? Math.ceil((new Date(group.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const isExpiringSoon = !isExpired && daysUntilExpiry !== null && daysUntilExpiry <= 7;

  return (
    <div
      className="card card-interactive"
      onClick={() => onSelect(group.id)}
      style={{
        padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px',
        opacity: isExpired ? 0.7 : 1,
      }}
    >
      {/* Group Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
            background: isExpired ? 'rgba(239,68,68,0.08)' : '#050505',
            border: `1px solid ${isExpired ? 'rgba(239,68,68,0.2)' : '#1a1a1a'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', fontWeight: 800,
            color: isExpired ? '#ef4444' : '#B7FF00',
          }}>
            {group.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {group.name}
              </h3>
              {userRole === 'ADMIN' && (
                <span className="badge" style={{ fontSize: '0.63rem', flexShrink: 0, background: '#050505', color: '#B7FF00' }}>
                  <ShieldCheck size={10} /> Admin
                </span>
              )}
              {isExpired && (
                <span className="badge" style={{ fontSize: '0.63rem', flexShrink: 0, background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <AlertTriangle size={10} /> Expired
                </span>
              )}
              {isExpiringSoon && (
                <span className="badge" style={{ fontSize: '0.63rem', flexShrink: 0, background: 'rgba(245,158,11,0.08)', color: '#f59e0b' }}>
                  <Clock size={10} /> {daysUntilExpiry}d left
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {group.description || 'Shared group expenses & budgets'}
            </p>
          </div>
        </div>
        {/* Invite Code */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '3px 8px', borderRadius: '6px',
          background: '#050505', border: '1px solid #1a1a1a',
          fontSize: '0.72rem', color: '#B7FF00', fontWeight: 700, fontFamily: 'monospace',
          flexShrink: 0,
        }}>
          <Key size={10} color="#737373" />
          <span>{group.inviteCode}</span>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        gap: '10px', padding: '10px 0',
        borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
      }}>
        {[
          { label: 'Members', value: memberCount },
          { label: 'Currency', value: group.currencyCode || 'INR' },
          { label: 'Role', value: userRole },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          <Users size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
          {memberCount} member{memberCount !== 1 ? 's' : ''}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#B7FF00', fontSize: '0.8rem', fontWeight: 700 }}>
          <span>{isExpired ? 'View' : 'Open'}</span>
          <ArrowRight size={13} />
        </div>
      </div>
    </div>
  );
};
