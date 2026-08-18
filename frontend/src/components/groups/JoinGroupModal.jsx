import React, { useState } from 'react';
import { X, Key, Link2, UserPlus, Loader2, Users, ShieldCheck, Clock, AlertCircle } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { groupsApi } from '../../services/api';

const extractToken = (input) => {
  try {
    const url = new URL(input.trim());
    return url.searchParams.get('token') || '';
  } catch {
    return input.trim();
  }
};

export const JoinGroupModal = ({ isOpen, onClose }) => {
  const { joinGroup } = useExpense();
  const [mode, setMode] = useState('code');
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  if (!isOpen) return null;

  const handlePreview = async () => {
    const token = extractToken(value);
    if (!token) return;
    setPreviewLoading(true);
    setPreviewError('');
    setPreview(null);
    try {
      const data = await groupsApi.getInvitePreview(token);
      setPreview(data);
    } catch (err) {
      setPreviewError(err.message || 'This invite link is invalid or expired.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    setIsLoading(true);
    const payload = mode === 'code'
      ? { code: value.trim().toUpperCase() }
      : { token: extractToken(value) };
    if (!payload.code && !payload.token) {
      setIsLoading(false);
      return;
    }
    const success = await joinGroup(payload);
    setIsLoading(false);
    if (success) {
      setValue('');
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="card"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '440px', padding: '26px',
          animation: 'slideUp 0.2s ease',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'var(--accent-light)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus size={16} color="var(--accent)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 800, margin: 0 }}>Join a Group</h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                {mode === 'code' ? 'Enter the invite code from the group admin' : 'Paste the invite link or token from the group admin'}
              </p>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Mode toggle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '4px' }}>
            <button
              type="button"
              onClick={() => { setMode('code'); setValue(''); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '8px', borderRadius: 'var(--r-md)', border: 'none', cursor: 'pointer',
                background: mode === 'code' ? '#fff' : 'transparent',
                boxShadow: mode === 'code' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                color: mode === 'code' ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: '0.82rem', fontWeight: 700,
              }}
            >
              <Key size={14} /> Invite Code
            </button>
            <button
              type="button"
              onClick={() => { setMode('link'); setValue(''); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '8px', borderRadius: 'var(--r-md)', border: 'none', cursor: 'pointer',
                background: mode === 'link' ? '#fff' : 'transparent',
                boxShadow: mode === 'link' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                color: mode === 'link' ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: '0.82rem', fontWeight: 700,
              }}
            >
              <Link2 size={14} /> Invite Link
            </button>
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">{mode === 'code' ? 'Invite Code *' : 'Invite Link / Token *'}</label>
            <div style={{ position: 'relative' }}>
              {mode === 'code' ? (
                <Key size={15} color="var(--text-faint)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              ) : (
                <Link2 size={15} color="var(--text-faint)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              )}
              <input
                type="text" required
                className="input-field"
                style={{
                  paddingLeft: '36px',
                  ...(mode === 'code' ? { letterSpacing: '0.1em', fontWeight: 800, textTransform: 'uppercase', fontSize: '1rem', color: 'var(--accent)' } : { fontSize: '0.82rem' }),
                }}
                placeholder={mode === 'code' ? 'e.g. ABC-1234' : 'Paste invite link or token'}
                value={value}
                onChange={e => { setValue(e.target.value); setPreview(null); setPreviewError(''); }}
                autoFocus
              />
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {mode === 'code'
                ? 'Ask the group admin to share their invite code with you.'
                : 'Paste the full invite link — the invite token is extracted automatically.'}
            </span>
          </div>

          {mode === 'link' && value.trim() && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handlePreview}
              disabled={previewLoading}
              style={{ alignSelf: 'flex-start' }}
            >
              {previewLoading ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <ShieldCheck size={14} />}
              Preview Invite
            </button>
          )}

          {previewError && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 14px', borderRadius: 'var(--r-md)',
              background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b',
              fontSize: '0.82rem', fontWeight: 600,
            }}>
              <AlertCircle size={15} color="#dc2626" style={{ flexShrink: 0 }} /> {previewError}
            </div>
          )}

          {preview && (
            <div style={{
              padding: '16px 18px', borderRadius: 'var(--r-lg)',
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', gap: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '11px', flexShrink: 0,
                  background: 'var(--accent-light)', border: '1px solid var(--border-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent)',
                }}>
                  {preview.groupName?.charAt(0)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{preview.groupName}</div>
                  {preview.groupDescription && (
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>{preview.groupDescription}</div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {preview.inviterName && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={12} /> Invited by {preview.inviterName}
                  </span>
                )}
                {preview.expiresAt && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={12} /> Expires {new Date(preview.expiresAt).toLocaleString('en-IN')}
                  </span>
                )}
                {preview.status && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px', width: 'fit-content',
                    fontSize: '0.72rem', fontWeight: 700, padding: '2px 9px', borderRadius: '99px',
                    color: preview.expired ? '#dc2626' : '#059669',
                    background: preview.expired ? '#fee2e2' : '#ecfdf5',
                    border: `1px solid ${preview.expired ? '#fecaca' : '#a7f3d0'}`,
                  }}>
                    {preview.expired ? 'Expired' : 'Active'}
                  </span>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isLoading || !value.trim()}>
              {isLoading ? <><Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> Joining...</> : <><UserPlus size={15} /> Join Group</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
