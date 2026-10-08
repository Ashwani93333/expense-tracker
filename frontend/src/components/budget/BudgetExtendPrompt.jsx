import React, { useEffect, useMemo, useState } from 'react';
import { X, TrendingUp, Loader2, PiggyBank } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';

const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

/**
 * Rounded-up increments that make sense as "a bit more headroom", offered as
 * one-tap buttons so raising a limit is not a typing exercise.
 */
const QUICK_INCREMENTS = [500, 1000, 2500, 5000, 10000];

/**
 * Shown when a new expense pushes a budget past its limit. Offers to raise the
 * limit with one tap, and makes "keep what I have" an equally visible choice so
 * the popup never feels like a demand.
 */
export const BudgetExtendPrompt = () => {
  const { budgetPromptQueue, dismissBudgetPrompt, raiseBudgetLimit } = useExpense();

  const [prompt, setPrompt] = useState(null);
  const [custom, setCustom] = useState('');
  const [saving, setSaving] = useState(false);

  const head = budgetPromptQueue[0] || null;

  useEffect(() => {
    setPrompt(head);
    // Pre-fill with the exact top-up (limit + overshoot) so the default action
    // raises the budget by precisely what the spend went over by.
    setCustom(head ? String(Math.round((head.limit + Math.max(0, head.overBy)) * 100) / 100) : '');
    setSaving(false);
    // Deps on the head object (not just its key) so a refreshed queue updates
    // the numbers on screen instead of keeping the ones captured earlier.
  }, [head]);

  // Suggest the increment that would have avoided this overshoot, so the
  // cheapest sufficient option is preselected rather than the smallest bump.
  const needed = useMemo(() => (prompt ? Math.max(0, prompt.overBy) : 0), [prompt]);

  if (!prompt) return null;

  const isCategory = Boolean(prompt.categoryId);
  const monthLabel = new Date(`${prompt.month}-01T12:00:00`)
    .toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const exactStep = Math.round(needed * 100) / 100;
  const exactTotal = prompt.limit + exactStep;
  // Exact top-up first, then the rounded quick increments (minus any duplicate).
  const suggestions = [
    ...(exactStep > 0 ? [{ step: exactStep, total: exactTotal, exact: true }] : []),
    ...QUICK_INCREMENTS
      .filter(step => step !== exactStep)
      .map(step => ({ step, total: prompt.limit + step })),
  ];
  const exactFit = QUICK_INCREMENTS.find(step => step >= needed);

  const chosenTotal = custom !== '' ? Number(custom) : null;
  const targetTotal = chosenTotal !== null && !Number.isNaN(chosenTotal) ? chosenTotal : null;

  const apply = async (total) => {
    if (!Number.isFinite(total) || total <= prompt.limit) return;
    setSaving(true);
    try {
      // On success raiseBudgetLimit clears the prompt queue → popup closes.
      await raiseBudgetLimit(prompt.month, prompt.categoryId, total);
    } catch {
      setSaving(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (targetTotal !== null) apply(targetTotal);
  };

  return (
    <div className="modal-backdrop" onClick={dismissBudgetPrompt}>
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Budget limit reached"
        style={{
          width: '100%', maxWidth: '460px', padding: '26px',
          borderRadius: 'var(--r-2xl)',
          background: '#fff', border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-modal)',
          animation: 'slideUp 0.18s ease',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{
              padding: '9px', borderRadius: 'var(--r-md)',
              background: 'rgba(239,68,68,0.10)', color: '#ef4444',
              display: 'flex', alignItems: 'center', flexShrink: 0,
            }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {isCategory ? `${prompt.categoryName} is over budget` : 'Monthly budget is over'}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {monthLabel} · you spent {inr(prompt.spent)} against a {inr(prompt.limit)} limit.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissBudgetPrompt}
            aria-label="Close"
            style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
              cursor: 'pointer', color: 'var(--text-muted)', width: '30px', height: '30px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Overshoot callout */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '11px 14px', marginBottom: '18px',
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 'var(--r-md)',
          }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Over by
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#ef4444' }}>
              {inr(prompt.overBy)}
            </span>
          </div>

          {/* Quick increments */}
          <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '9px' }}>
            Raise by
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
            {suggestions.map(({ step, total, exact }) => {
              const active = targetTotal === total;
              // Mark the smallest bump that would actually have covered the spend.
              const covers = step >= needed && exactFit === step;
              return (
                <button
                  key={exact ? 'exact' : step}
                  type="button"
                  onClick={() => setCustom(String(total))}
                  disabled={saving}
                  style={{
                    padding: '8px 12px', borderRadius: 'var(--r-md)',
                    border: `1px solid ${active ? 'var(--border-accent)' : exact ? 'rgba(34,197,94,0.4)' : 'var(--border)'}`,
                    background: active ? 'var(--accent-light)' : exact ? 'rgba(34,197,94,0.08)' : '#fff',
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: 700, fontSize: '0.82rem', cursor: saving ? 'default' : 'pointer',
                    transition: 'var(--t-fast)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                    gap: '1px', minWidth: '86px',
                  }}
                >
                  <span>+{inr(step)}{exact ? ' · exact' : ''}</span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    → {inr(total)}{covers ? ' · fits' : ''}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom amount */}
          <div className="input-group" style={{ margin: 0, marginBottom: '18px' }}>
            <label className="input-label" htmlFor="budget-extend-custom">
              Or set your own limit
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', fontWeight: 700 }}>₹</span>
              <input
                id="budget-extend-custom"
                type="number"
                min="0"
                step="any"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder={String(Math.round(exactTotal))}
                className="input-field"
                style={{ paddingLeft: '30px', fontWeight: 700 }}
              />
            </div>
            {targetTotal !== null && targetTotal <= prompt.limit && (
              <p style={{ margin: '6px 0 0', fontSize: '0.74rem', color: '#ef4444' }}>
                Enter more than the current limit of {inr(prompt.limit)}.
              </p>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={dismissBudgetPrompt}
              disabled={saving}
            >
              Keep {inr(prompt.limit)} limit
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || targetTotal === null || targetTotal <= prompt.limit}
            >
              {saving ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : <PiggyBank size={15} />}
              {targetTotal !== null ? `Set ${inr(targetTotal)}` : 'Update limit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
