import React, { useState, useEffect } from 'react';
import { X, Lock, KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useExpense } from '../../context/ExpenseContext';
import { PASSWORD_REQUIREMENTS, isPasswordValid } from '../../utils/passwordPolicy';

export const ChangePasswordModal = () => {
  const { isChangePasswordModalOpen, setIsChangePasswordModalOpen, showToast } = useExpense();
  const { changePassword } = useAuth();

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isChangePasswordModalOpen) {
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShow({ current: false, next: false, confirm: false });
      setError('');
    }
  }, [isChangePasswordModalOpen]);

  if (!isChangePasswordModalOpen) return null;

  const close = () => setIsChangePasswordModalOpen(false);

  const setField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (!isPasswordValid(form.newPassword)) {
      setError('New password must be at least 8 characters with one uppercase letter and one symbol.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      showToast('Password changed successfully!');
      close();
    } catch (err) {
      setError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleShow = (key) => setShow(prev => ({ ...prev, [key]: !prev[key] }));

  const PasswordField = ({ label, field, icon, showKey, placeholder }) => (
    <div>
      <label className="input-label" style={{ marginBottom: '8px' }}>
        {icon} {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={show[showKey] ? 'text' : 'password'}
          className="input-field"
          style={{ paddingRight: '42px' }}
          placeholder={placeholder}
          value={form[field]}
          onChange={e => setField(field, e.target.value)}
          autoComplete={field === 'currentPassword' ? 'current-password' : 'new-password'}
        />
        <button
          type="button"
          onClick={() => toggleShow(showKey)}
          style={{
            position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)',
            padding: '4px', display: 'flex',
          }}
        >
          {show[showKey] ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="modal-backdrop" onClick={close}>
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
              <KeyRound size={19} color="#B7FF00" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 800, margin: 0 }}>Change Password</h3>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', margin: '2px 0 0 0' }}>
                Verify your current password to set a new one
              </p>
            </div>
          </div>
          <button
            className="btn btn-icon"
            onClick={close}
            style={{ background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff' }}
          >
            <X size={17} />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} style={{ padding: '24px 26px 26px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '11px 13px', borderRadius: 'var(--r-md)',
              background: '#fef2f2', border: '1px solid #fecaca',
              animation: 'fade-slide-in 0.25s ease',
            }}>
              <AlertCircle size={15} color="#dc2626" />
              <span style={{ fontSize: '0.82rem', color: '#dc2626', fontWeight: 600 }}>{error}</span>
            </div>
          )}

          <PasswordField
            label="Current Password"
            field="currentPassword"
            icon={<Lock size={12} color="var(--accent)" />}
            showKey="current"
            placeholder="Enter your current password"
          />

          <div>
            <PasswordField
              label="New Password"
              field="newPassword"
              icon={<ShieldCheck size={12} color="var(--accent)" />}
              showKey="next"
              placeholder="Min 8 characters"
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
              {PASSWORD_REQUIREMENTS.map((req, i) => {
                const met = req.test(form.newPassword);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.76rem' }}>
                    {met ? (
                      <CheckCircle2 size={13} color="#059669" />
                    ) : (
                      <span style={{
                        width: '13px', height: '13px', borderRadius: '50%', flexShrink: 0,
                        border: '1.5px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }} />
                    )}
                    <span style={{ color: met ? '#059669' : 'var(--text-muted)', fontWeight: met ? 700 : 500 }}>
                      {req.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <PasswordField
            label="Confirm New Password"
            field="confirmPassword"
            icon={<KeyRound size={12} color="var(--accent)" />}
            showKey="confirm"
            placeholder="Re-enter your new password"
          />

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}
          >
            {submitting ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : <KeyRound size={15} />}
            {submitting ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};