import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Loader2,
  Save,
  RefreshCw,
  CheckCircle2,
  IndianRupee,
  Sparkles,
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import { userPreferencesApi } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { IncomeSlabSelector } from '../components/preferences/IncomeSlabSelector';
import { SpendingStyleSelector } from '../components/preferences/SpendingStyleSelector';
import { CategoryChips } from '../components/preferences/CategoryChips';
import { fmtINR } from '../constants/preferences';

export const PreferencesPage = () => {
  const { categories, showToast } = useExpense();
  const { currentUser, updateCurrentUser } = useAuth();

  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [incomeSlab, setIncomeSlab] = useState('');
  const [spendingStyle, setSpendingStyle] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await userPreferencesApi.get();
      setPrefs(data || {});
      setIncomeSlab(data?.incomeSlab || '');
      setSpendingStyle(data?.expensePreference || '');
      setSelectedIds(data?.selectedCategoryIds || []);
    } catch (err) {
      showToast(err.message || 'Failed to load preferences', 'error');
      setPrefs({});
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const save = async () => {
    setSaving(true);
    try {
      const updated = await userPreferencesApi.update({
        incomeSlab: incomeSlab || null,
        expensePreference: spendingStyle || null,
        selectedCategoryIds: selectedIds,
      });
      setPrefs(updated || {});
      if (updated && typeof updated.onboardingCompleted === 'boolean' && currentUser) {
        updateCurrentUser({ ...currentUser, onboardingCompleted: updated.onboardingCompleted });
      }
      showToast(updated?.onboardingCompleted ? 'Preferences saved — setup complete!' : 'Preferences saved!');
    } catch (err) {
      showToast(err.message || 'Failed to save preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  const isComplete = prefs?.onboardingCompleted
    || (Boolean(incomeSlab && spendingStyle) && !loading);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <PageHeader
        icon={SlidersHorizontal}
        badge={prefs?.onboardingCompleted ? "Preferences" : "Onboarding Setup"}
        title="My Preferences"
        subtitle="Tell us about your income and spending style so we can tailor budgets, alerts and suggestions."
        actions={
          <>
            <button className="btn btn-secondary btn-sm" onClick={load} title="Refresh">
              <RefreshCw size={14} />
            </button>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving || loading}>
              {saving ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Save size={15} />}
              Save Changes
            </button>
          </>
        }
      />

      {loading ? (
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="skeleton" style={{ height: '16px', width: '40%' }} />
          <div className="skeleton" style={{ height: '90px', width: '100%', borderRadius: 'var(--r-md)' }} />
          <div className="skeleton" style={{ height: '90px', width: '100%', borderRadius: 'var(--r-md)' }} />
          <div className="skeleton" style={{ height: '90px', width: '100%', borderRadius: 'var(--r-md)' }} />
        </div>
      ) : (
        <>
          {!isComplete && (
            <div style={{
              padding: '16px 20px', borderRadius: 'var(--r-lg)',
              background: 'rgba(183,255,0,0.06)',
              border: '1px solid rgba(183,255,0,0.22)',
              display: 'flex', alignItems: 'flex-start', gap: '12px',
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
                background: 'rgba(183,255,0,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={15} color="#B7FF00" />
              </div>
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>
                  Just a few quick questions
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '3px 0 0 0', lineHeight: 1.5 }}>
                  Pick an income slab and spending style to unlock a suggested monthly budget. You can change these anytime.
                </p>
              </div>
            </div>
          )}

          {isComplete && (
            <div style={{
              padding: '14px 20px', borderRadius: 'var(--r-lg)',
              background: 'rgba(34,197,94,0.07)',
              border: '1px solid rgba(34,197,94,0.22)',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <CheckCircle2 size={16} color="#22c55e" />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#16a34a' }}>
                Setup complete — your preferences shape budgets and alerts.
              </span>
            </div>
          )}

          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px' }}>Monthly Income Slab</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Your range helps us suggest a sensible monthly budget.
            </p>
            <IncomeSlabSelector value={incomeSlab} onChange={setIncomeSlab} />
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px' }}>Spending Style</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Controls whether we surface group recommendations.
            </p>
            <SpendingStyleSelector value={spendingStyle} onChange={setSpendingStyle} />
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px' }}>Go-To Categories</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Select the categories you use most — they'll be used for quick picks and suggestions.
            </p>
            <CategoryChips categories={categories} selected={selectedIds} onToggle={toggleCategory} />
          </div>

          {prefs?.suggestedMonthlyBudget != null && (
            <div style={{
              padding: '16px 20px', borderRadius: 'var(--r-lg)',
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0,
                background: 'rgba(183,255,0,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <IndianRupee size={16} color="#B7FF00" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current suggested budget</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {fmtINR(prefs.suggestedMonthlyBudget)} / month
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};