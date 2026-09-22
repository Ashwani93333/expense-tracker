import React from 'react';
import { Check } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Create Account' },
  { id: 2, label: 'Preferences' },
  { id: 3, label: 'Done' },
];

export const OnboardingProgress = ({ step }) => {
  return (
    <>
      {/* Desktop stepper */}
      <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%' }}>
        {STEPS.map((s, i) => {
          const completed = step > s.id;
          const active = step === s.id;
          return (
            <React.Fragment key={s.id}>
              {i > 0 && (
                <div style={{
                  width: '38px', height: '2px', borderRadius: 99,
                  background: completed ? 'var(--accent)' : '#e2e8f0',
                  transition: 'var(--t-fast)',
                }} />
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.72rem', fontWeight: 800,
                  background: completed ? '#B7FF00' : active ? 'rgba(183,255,0,0.12)' : '#f3f4f6',
                  border: `1.5px solid ${active ? 'var(--accent)' : completed ? '#B7FF00' : '#e5e7eb'}`,
                  color: active ? '#050505' : completed ? '#050505' : '#9ca3af',
                }}>
                  {completed ? <Check size={14} /> : s.id}
                </div>
                <span style={{
                  fontSize: '0.82rem', fontWeight: active ? 800 : 600,
                  color: active || completed ? '#050505' : '#9ca3af',
                }}>
                  {s.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile indicator */}
      <div className="mobile-only" style={{ textAlign: 'center' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#B7FF00', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Step {step} of 2
        </span>
      </div>
    </>
  );
};