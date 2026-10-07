import React, { useEffect, useState } from 'react';
import { X, Check, Loader2, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { GROUP_PERMISSIONS } from '../../constants/groupPermissions';
import { useExpense } from '../../context/ExpenseContext';

/**
 * Admin-only picker: grants feature-wise permissions to a single member.
 * Members are never promoted to ADMIN — they only receive individual features.
 * Styled to match InviteMemberModal (dark gradient header + light card body).
 */
export const MemberPermissionsModal = ({ isOpen, onClose, groupId, member }) => {
  const { updateMemberPermissions } = useExpense();
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && member) {
      setSelected(member.role === 'ADMIN'
        ? GROUP_PERMISSIONS.map(p => p.key)
        : (member.permissions || []));
    }
  }, [isOpen, member]);

  if (!isOpen || !member) return null;

  const isAdminMember = member.role === 'ADMIN';
  const toggle = (key) => {
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleSave = async () => {
    setSaving(true);
    const ok = await updateMemberPermissions(groupId, member.userId, selected);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={saving ? undefined : onClose}>
      <div
        className="card"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '480px', padding: 0, overflow: 'hidden',
          animation: 'slideUp 0.2s ease',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div style={{
          padding: '22px 26px',
          background: 'linear-gradient(135deg, #050505 0%, #1a1a1a 55%, #141414 100%)',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <SlidersHorizontal size={19} color="#B7FF00" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 800, margin: 0 }}>Member Permissions</h3>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', margin: '2px 0 0 0' }}>
                {member.userName} · {member.userEmail}
              </p>
            </div>
          </div>
          <button
            className="btn btn-icon"
            onClick={saving ? undefined : onClose}
            style={{ background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff' }}
          >
            <X size={17} />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────── */}
        <div style={{ padding: '24px 26px 26px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 16px' }}>
            Choose exactly what this member can do in the group. They only see the features you allow
            here — no admin access is ever handed over.
          </p>

          {isAdminMember ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px',
              borderRadius: 'var(--r-md)', background: 'var(--violet-light)',
              border: '1px solid rgba(139,92,246,0.25)',
            }}>
              <ShieldCheck size={18} color="var(--violet-text)" />
              <span style={{ fontSize: '0.82rem', color: 'var(--violet-text)', fontWeight: 600 }}>
                This member is a group admin and already has every permission.
              </span>
            </div>
          ) : (
            <>
              <label className="input-label" style={{ marginBottom: '10px' }}>
                <SlidersHorizontal size={12} color="var(--accent)" /> Features this member can use
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '44vh', overflowY: 'auto', paddingRight: '4px' }}>
                {GROUP_PERMISSIONS.map(p => {
                  const active = selected.includes(p.key);
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => toggle(p.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '11px 13px', textAlign: 'left', cursor: 'pointer',
                        fontFamily: 'var(--font)',
                        borderRadius: 'var(--r-md)',
                        background: active ? 'var(--accent-light)' : 'var(--bg-surface)',
                        border: `1px solid ${active ? 'rgba(183,255,0,0.55)' : 'var(--border)'}`,
                        boxShadow: active ? 'var(--shadow-xs)' : 'none',
                        transition: 'var(--t-fast)',
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = 'var(--border-accent)'; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >
                      <div style={{
                        width: '30px', height: '30px', borderRadius: 'var(--r-sm)', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: active ? 'var(--accent)' : '#fff',
                        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                        color: active ? 'var(--accent-text)' : 'var(--text-muted)',
                        transition: 'var(--t-fast)',
                      }}>
                        <Icon size={15} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {p.label}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.description}</div>
                      </div>
                      <div style={{
                        width: '20px', height: '20px', borderRadius: 'var(--r-xs)', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: active ? 'var(--accent)' : '#fff',
                        border: `1px solid ${active ? 'var(--accent)' : 'var(--border-strong)'}`,
                        color: 'var(--accent-text)',
                        transition: 'var(--t-fast)',
                      }}>
                        {active && <Check size={13} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer CTAs */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--border)', gap: '10px',
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {selected.length} of {GROUP_PERMISSIONS.length} features allowed
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                    {saving
                      ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />
                      : <Check size={14} />}
                    Save Permissions
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
