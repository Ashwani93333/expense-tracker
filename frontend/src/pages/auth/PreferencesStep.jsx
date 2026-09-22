import React, { useState, useEffect } from 'react';
import {
  Wallet, ArrowLeft, ArrowRight, Loader2, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOnboardingWizard } from '../../context/OnboardingWizardContext';
import { categoriesApi, userPreferencesApi } from '../../services/api';
import { OnboardingProgress } from './components/OnboardingProgress';
import { IncomeSlabSelector } from '../../components/preferences/IncomeSlabSelector';
import { SpendingStyleSelector } from '../../components/preferences/SpendingStyleSelector';
import { CategoryChips } from '../../components/preferences/CategoryChips';

export const PreferencesStep = () => {
  const { currentUser, updateCurrentUser } = useAuth();
  const { wizard, savePreferences, goToStep, closeWizard } = useOnboardingWizard();

  const [incomeSlab, setIncomeSlab] = useState(wizard.preferences.incomeSlab || '');
  const [spendingStyle, setSpendingStyle] = useState(wizard.preferences.spendingStyle || '');
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(wizard.preferences.categories || []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const initial = wizard.preferences;
    (async () => {
      const [catsRes, prefsRes] = await Promise.allSettled([
        categoriesApi.list(),
        userPreferencesApi.get(),
      ]);
      if (cancelled) return;
      if (catsRes.status === 'fulfilled') setCategories(catsRes.value || []);

      if (prefsRes.status === 'fulfilled' && prefsRes.value) {
        const p = prefsRes.value;
        if (!initial.incomeSlab && p.incomeSlab) setIncomeSlab(p.incomeSlab);
        if (!initial.spendingStyle && p.expensePreference) setSpendingStyle(p.expensePreference);
        if (!initial.categories?.length && p.selectedCategoryIds?.length) setSelectedCategories(p.selectedCategoryIds);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updatePrefs = (next) => {
    savePreferences({
      incomeSlab, spendingStyle, categories: selectedCategories, ...next,
    });
  };

  const toggleCategory = (id) => {
    const next = selectedCategories.includes(id)
      ? selectedCategories.filter(c => c !== id)
      : [...selectedCategories, id];
    setSelectedCategories(next);
    savePreferences({ incomeSlab, spendingStyle, categories: next });
  };

  const handleFinish = async () => {
    if (!incomeSlab || !spendingStyle) {
      setError('Please select your income range and spending style to finish setup.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await userPreferencesApi.update({
        incomeSlab,
        expensePreference: spendingStyle,
        selectedCategoryIds: selectedCategories,
      });
      savePreferences({ incomeSlab, spendingStyle, categories: selectedCategories });
      if (currentUser) updateCurrentUser({ ...currentUser, onboardingCompleted: true });
      setDone(true);
      setTimeout(() => closeWizard(), 900);
    } catch (err) {
      setError(err.message || "We couldn't save your preferences. Please try again.");
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div style={{
        minHeight: '100vh', width: '100%',
        background: 'linear-gradient(180deg, #050505 0%, #0a0a0a 60%, #f8fafc 100%)',
        fontFamily: 'var(--font)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{ textAlign: 'center', animation: 'fade-slide-in 0.4s ease' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '20px', margin: '0 auto 18px',
            background: '#B7FF00', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 14px 34px -8px rgba(183,255,0,0.5)',
          }}>
            <CheckCircle2 size={30} color="#050505" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>
            All set, {currentUser?.fullName?.split(' ')[0] || 'friend'}!
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#a1a1aa', margin: 0 }}>
            Entering your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: '#f8fafc',
      fontFamily: 'var(--font)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '34px 16px 60px',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '26px', width: '100%', maxWidth: '720px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px -6px rgba(0,0,0,0.4)' }}>
          <Wallet size={19} color="#B7FF00" />
        </div>
        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
          Expense<span style={{ color: '#050505' }}>Tracker</span>
        </div>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: '720px',
        background: '#fff', borderRadius: '24px',
        padding: '30px 32px',
        boxShadow: '0 24px 60px -16px rgba(0,0,0,0.16)',
        border: '1px solid #e2e8f0',
        display: 'flex', flexDirection: 'column', gap: '28px',
      }}>
        <OnboardingProgress step={2} />

        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: 0 }}>
            Let's personalize your experience
          </h2>
          <p style={{ fontSize: '0.92rem', color: '#6b7280', marginTop: '6px', lineHeight: 1.6 }}>
            Tell us a little about your spending habits so we can tailor your experience and recommendations.
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '9px',
            padding: '12px 14px', borderRadius: '10px',
            background: '#fef2f2', border: '1px solid #fecaca',
            animation: 'fade-slide-in 0.3s ease',
          }}>
            <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: '1px' }} />
            <span style={{ fontSize: '0.84rem', color: '#dc2626', fontWeight: 600, lineHeight: 1.45 }}>{error}</span>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="skeleton" style={{ height: '16px', width: '45%' }} />
            <div className="skeleton" style={{ height: '84px', width: '100%', borderRadius: 'var(--r-md)' }} />
            <div className="skeleton" style={{ height: '84px', width: '100%', borderRadius: 'var(--r-md)' }} />
            <div className="skeleton" style={{ height: '120px', width: '100%', borderRadius: 'var(--r-md)' }} />
          </div>
        ) : (
          <>
            {/* Income slab */}
            <section>
              <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>
                What's your monthly income range?
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#6b7280', margin: '0 0 16px' }}>
                This helps us suggest realistic budgets for you.
              </p>
              <div style={{ padding: '18px', borderRadius: 'var(--r-lg)', border: '1px solid #f1f5f9', background: '#fafafa' }}>
                <IncomeSlabSelector
                  value={incomeSlab}
                  onChange={(v) => { setIncomeSlab(v); updatePrefs({ incomeSlab: v }); }}
                />
              </div>
            </section>

            {/* Spending style */}
            <section>
              <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>
                How do you usually spend?
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#6b7280', margin: '0 0 16px' }}>
                Choose one that best describes you.
              </p>
              <div style={{ padding: '18px', borderRadius: 'var(--r-lg)', border: '1px solid #f1f5f9', background: '#fafafa' }}>
                <SpendingStyleSelector
                  value={spendingStyle}
                  onChange={(v) => { setSpendingStyle(v); updatePrefs({ spendingStyle: v }); }}
                />
              </div>
            </section>

            {/* Categories */}
            <section>
              <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>
                What do you usually spend on?
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#6b7280', margin: '0 0 16px' }}>
                Select all that apply.
              </p>
              <div style={{ padding: '18px', borderRadius: 'var(--r-lg)', border: '1px solid #f1f5f9', background: '#fafafa' }}>
                <CategoryChips categories={categories} selected={selectedCategories} onToggle={toggleCategory} />
              </div>
            </section>
          </>
        )}

        {/* Footer actions */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          borderTop: '1px solid #f1f5f9', paddingTop: '22px',
        }}>
          {wizard.registered ? (
            <button
              type="button"
              onClick={() => goToStep(1)}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '11px 18px', borderRadius: '10px',
                background: 'transparent', border: '1px solid #e2e8f0', cursor: 'pointer',
                color: '#374151', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'var(--font)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#9ca3af'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              <ArrowLeft size={15} /> Back
            </button>
          ) : <span style={{ flex: 1 }} />}

          <button
            type="button"
            onClick={handleFinish}
            disabled={saving || loading || !incomeSlab || !spendingStyle}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '12px 22px', borderRadius: '10px',
              background: saving || !incomeSlab || !spendingStyle ? '#9ca3af' : '#050505',
              color: saving || !incomeSlab || !spendingStyle ? '#e5e5e5' : '#B7FF00',
              border: 'none', fontWeight: 800, fontSize: '0.95rem',
              cursor: (saving || !incomeSlab || !spendingStyle) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease', fontFamily: 'var(--font)', marginLeft: 'auto',
            }}
          >
            {saving ? (
              <><Loader2 size={17} style={{ animation: 'spin 0.7s linear infinite' }} /><span>Finishing setup...</span></>
            ) : (
              <><span>Finish Setup</span><ArrowRight size={17} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};