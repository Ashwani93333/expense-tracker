import React, { useState } from 'react';
import {
  Wallet, ArrowRight, ArrowLeft, Eye, EyeOff, Loader2, AlertCircle,
  Mail, Lock, User, CheckCircle2, X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOnboardingWizard } from '../../context/OnboardingWizardContext';
import { PASSWORD_REQUIREMENTS } from '../../utils/passwordPolicy';

export const RegisterStep = () => {
  const { signup, isAuthenticated } = useAuth();
  const { wizard, saveRegistration, goToStep, closeWizard } = useOnboardingWizard();

  const [form, setForm] = useState({
    fullName: wizard.registration.fullName || '',
    email: wizard.registration.email || '',
    password: wizard.registration.password || '',
    confirmPassword: wizard.registration.confirmPassword || '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password) { setError('Please fill in all required fields.'); return; }
    if (!form.fullName) { setError('Full name is required.'); return; }
    const missing = PASSWORD_REQUIREMENTS.filter(r => !r.test(form.password));
    if (missing.length > 0) {
      setError(`Password must include: ${missing.map(r => r.label).join(', ')}.`);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (wizard.registered) {
      goToStep(2);
      return;
    }

    setIsLoading(true);
    try {
      await signup({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      saveRegistration(form);
    } catch (err) {
      const detail = err.data?.validationErrors ? Object.values(err.data.validationErrors)[0] : null;
      setError(detail || err.message || 'Signup failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: 'linear-gradient(180deg, #050505 0%, #0a0a0a 55%, #f8fafc 100%)',
      fontFamily: 'var(--font)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '40px 16px 60px',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '34px', width: '100%', maxWidth: '460px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px -6px rgba(0,0,0,0.5)' }}>
          <Wallet size={19} color="#050505" />
        </div>
        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
          Expense<span style={{ color: '#B7FF00' }}>Tracker</span>
        </div>
        <div style={{ flex: 1 }} />
        {wizard.registered ? (
          <button
            type="button"
            onClick={() => goToStep(2)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#a1a1aa', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'var(--font)',
            }}
          >
            <ArrowLeft size={14} /> Preferences
          </button>
        ) : (
          !isAuthenticated && (
            <button
              type="button"
              onClick={closeWizard}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#a1a1aa', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'var(--font)',
              }}
            >
              <X size={14} /> Cancel
            </button>
          )
        )}
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: '460px',
        background: '#fff', borderRadius: '22px',
        padding: '34px 32px',
        boxShadow: '0 24px 60px -16px rgba(0,0,0,0.5)',
        border: '1px solid #e2e8f0',
      }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', marginBottom: '6px' }}>
          {wizard.registered ? 'Your details' : 'Create your account'}
        </h2>
        <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '24px' }}>
          {wizard.registered ? 'Looks good so far — continue to preferences.' : 'Start tracking expenses in 30 seconds.'}
        </p>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 14px', borderRadius: '10px', marginBottom: '20px',
            background: '#fef2f2', border: '1px solid #fecaca',
            animation: 'fade-slide-in 0.3s ease',
          }}>
            <AlertCircle size={16} color="#dc2626" />
            <span style={{ fontSize: '0.85rem', color: '#dc2626', fontWeight: 600 }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Full Name *</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={iconStyle} />
              <input
                type="text" placeholder="Ashwani Kumar"
                value={form.fullName}
                onChange={e => handleChange('fullName', e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#050505'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Email Address *</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={iconStyle} />
              <input
                type="email" placeholder="you@example.com"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#050505'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Password *</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={iconStyle} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 8 chars, 1 uppercase, 1 symbol"
                value={form.password}
                onChange={e => handleChange('password', e.target.value)}
                required
                style={{ ...inputStyle, paddingRight: '40px' }}
                onFocus={e => e.target.style.borderColor = '#050505'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
              <button type="button" onClick={() => setShowPassword(p => !p)} style={eyeBtnStyle}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {!wizard.registered && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px' }}>
                {PASSWORD_REQUIREMENTS.map((req, i) => {
                  const met = req.test(form.password);
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.76rem' }}>
                      {met ? <CheckCircle2 size={13} color="#059669" /> : <span style={{ width: '13px', height: '13px', borderRadius: '50%', flexShrink: 0, border: '1.5px solid #d1d5db', display: 'inline-block' }} />}
                      <span style={{ color: met ? '#059669' : '#6b7280', fontWeight: met ? 700 : 500 }}>{req.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>Confirm Password *</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={iconStyle} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={e => handleChange('confirmPassword', e.target.value)}
                required
                style={{ ...inputStyle, paddingRight: '40px' }}
                onFocus={e => e.target.style.borderColor = '#050505'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
              <button type="button" onClick={() => setShowConfirmPassword(p => !p)} style={eyeBtnStyle}>
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit" disabled={isLoading}
            style={{
              width: '100%', padding: '14px',
              background: isLoading ? '#737373' : '#050505',
              color: isLoading ? '#a1a1aa' : '#B7FF00', border: 'none', borderRadius: '10px',
              fontSize: '1rem', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s ease', fontFamily: 'var(--font)', marginTop: '8px',
            }}
            onMouseEnter={e => !isLoading && (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={e => !isLoading && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {wizard.registered ? (
              <><span>Continue to Preferences</span><ArrowRight size={18} /></>
            ) : isLoading ? (
              <><Loader2 size={18} style={{ animation: 'spin 0.7s linear infinite' }} /><span>Creating account...</span></>
            ) : (
              <><span>Create Account</span><ArrowRight size={18} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const labelStyle = {
  display: 'block', fontSize: '0.85rem', fontWeight: 600,
  color: '#374151', marginBottom: '8px',
};
const iconStyle = {
  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
  color: '#9ca3af',
};
const inputStyle = {
  width: '100%', padding: '12px 14px 12px 42px',
  border: '1.5px solid #e5e7eb', borderRadius: '10px',
  fontSize: '0.95rem', color: '#111827', background: '#fff',
  outline: 'none', fontFamily: 'var(--font)',
  transition: 'all 0.2s ease',
  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
};
const eyeBtnStyle = {
  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px',
};