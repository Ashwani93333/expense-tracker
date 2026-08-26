import React, { useState, useEffect } from 'react';
import { Bell, Loader2, RefreshCw, Save, AlertTriangle, Wallet, Target, BarChart3, Mail, Inbox, Tag, X, Plus, DollarSign, Calendar, CheckCircle } from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { usersApi, categoryLimitsApi, categoriesApi } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';

const DEFAULT_SETTINGS = {
  inAppNotifications: true,
  emailNotifications: false,
  overallBudgetEnabled: true,
  overallBudgetThresholds: [80, 100],
  overallBudgetThresholdType: 'PERCENTAGE',
  categoryBudgetEnabled: true,
  categoryBudgetThresholds: [80, 100],
  categoryBudgetThresholdType: 'PERCENTAGE',
  totalExpenditureEnabled: true,
  totalExpenditureThresholds: [],
  totalExpenditureThresholdType: 'AMOUNT',
  monthlySummaryEnabled: true,
  budgetUpdateEnabled: true,
  expiryDateUpdateEnabled: true,
  paymentApprovalEnabled: true,
};

const parseList = (raw) => raw
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .map(Number)
  .filter(n => !isNaN(n) && n > 0)
  .filter((n, i, arr) => arr.indexOf(n) === i)
  .sort((a, b) => a - b);

export const NotificationSettingsPage = () => {
  const { showToast } = useExpense();

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edits, setEdits] = useState({});
  const [drafts, setDrafts] = useState({
    overallBudgetThresholds: '',
    categoryBudgetThresholds: '',
    totalExpenditureThresholds: '',
  });
  const [categoryLimits, setCategoryLimits] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [newLimitCategory, setNewLimitCategory] = useState('');
  const [newLimitAmount, setNewLimitAmount] = useState('');
  const [savingLimit, setSavingLimit] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [data, limits, cats] = await Promise.allSettled([
        usersApi.getNotificationSettings(),
        categoryLimitsApi.list(),
        categoriesApi.list(),
      ]);
      if (data.status === 'fulfilled') setSettings({ ...DEFAULT_SETTINGS, ...data.value });
      if (limits.status === 'fulfilled') setCategoryLimits(limits.value || []);
      if (cats.status === 'fulfilled') setAllCategories(cats.value || []);
    } catch { setSettings(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSettings(); }, []);

  const toggle = (key) => {
    setEdits(prev => ({ ...prev, [key]: !(prev[key] ?? settings?.[key] ?? DEFAULT_SETTINGS[key]) }));
  };

  const save = async () => {
    setSaving(true);
    const payload = { ...edits };

    if (drafts.overallBudgetThresholds !== '') {
      payload.overallBudgetThresholds = parseList(drafts.overallBudgetThresholds);
    }
    if (drafts.categoryBudgetThresholds !== '') {
      payload.categoryBudgetThresholds = parseList(drafts.categoryBudgetThresholds);
    }
    if (drafts.totalExpenditureThresholds !== '') {
      payload.totalExpenditureThresholds = parseList(drafts.totalExpenditureThresholds);
    }

    if (edits.overallBudgetThresholdType) payload.overallBudgetThresholdType = edits.overallBudgetThresholdType;
    if (edits.categoryBudgetThresholdType) payload.categoryBudgetThresholdType = edits.categoryBudgetThresholdType;
    if (edits.totalExpenditureThresholdType) payload.totalExpenditureThresholdType = edits.totalExpenditureThresholdType;

    try {
      const updated = await usersApi.updateNotificationSettings(payload);
      setSettings({ ...DEFAULT_SETTINGS, ...updated });
      setEdits({});
      setDrafts({
        overallBudgetThresholds: '',
        categoryBudgetThresholds: '',
        totalExpenditureThresholds: '',
      });
      showToast('Notification preferences saved!');
    } catch (err) {
      showToast(err.message || 'Failed to save notification settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const boolVal = (key) => edits[key] ?? settings?.[key] ?? DEFAULT_SETTINGS[key];
  const listVal = (key) => settings?.[key] ?? DEFAULT_SETTINGS[key];

  const addCategoryLimit = async () => {
    if (!newLimitCategory || !newLimitAmount) return;
    setSavingLimit(true);
    try {
      await categoryLimitsApi.set(newLimitCategory, parseFloat(newLimitAmount));
      const limits = await categoryLimitsApi.list();
      setCategoryLimits(limits || []);
      setNewLimitCategory('');
      setNewLimitAmount('');
      showToast('Category limit saved');
    } catch (err) {
      showToast(err.message || 'Failed to save limit', 'error');
    }
    setSavingLimit(false);
  };

  const removeCategoryLimit = async (categoryId) => {
    try {
      await categoryLimitsApi.remove(categoryId);
      setCategoryLimits(prev => prev.filter(l => l.categoryId !== categoryId));
      showToast('Category limit removed');
    } catch (err) {
      showToast(err.message || 'Failed to remove limit', 'error');
    }
  };

  const ThresholdEditor = ({ title, desc, enabledKey, listKey, draftKey, typeKey, unit }) => {
    const currentType = edits[typeKey] ?? settings?.[typeKey] ?? DEFAULT_SETTINGS[typeKey];
    const isAmount = currentType === 'AMOUNT';

    return (
    <div style={{
      padding: '18px 20px', borderRadius: 'var(--r-lg)',
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', gap: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: '#050505', border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {isAmount ? <BarChart3 size={16} color="#B7FF00" /> : <Target size={16} color="#B7FF00" />}
          </div>
          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>{title}</h4>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{desc}</p>
          </div>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={boolVal(enabledKey)}
            onChange={() => toggle(enabledKey)}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      {/* Percentage / Amount toggle */}
      <div style={{ display: 'flex', gap: '4px', padding: '3px', background: '#050505', borderRadius: 'var(--r-sm)', width: 'fit-content' }}>
        {['PERCENTAGE', 'AMOUNT'].map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setEdits(prev => ({ ...prev, [typeKey]: t }))}
            style={{
              padding: '5px 14px', border: 'none', borderRadius: 'var(--r-sm)',
              background: currentType === t ? 'rgba(183,255,0,0.12)' : 'transparent',
              color: currentType === t ? '#B7FF00' : '#737373',
              fontWeight: currentType === t ? 700 : 500, fontSize: '0.75rem',
              cursor: 'pointer', fontFamily: 'var(--font)',
              transition: 'var(--t-fast)',
            }}
          >
            {t === 'PERCENTAGE' ? '% Percentage' : '₹ Amount'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Current:
        </span>
        {listVal(listKey).length > 0 ? (
          listVal(listKey).map((t, i) => (
            <span key={i} style={{
              fontSize: '0.74rem', fontWeight: 700, padding: '2px 9px', borderRadius: '99px',
              background: 'rgba(183,255,0,0.08)', color: '#B7FF00', border: '1px solid rgba(183,255,0,0.15)',
            }}>
              {isAmount ? `₹${t.toLocaleString('en-IN')}` : `${t}%`}
            </span>
          ))
        ) : (
          <span style={{ fontSize: '0.74rem', color: 'var(--text-faint)' }}>None</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', fontSize: '0.8rem', fontWeight: 700 }}>
            {isAmount ? '₹' : '%'}
          </span>
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '26px', fontSize: '0.82rem' }}
            placeholder={isAmount ? 'e.g. 1000, 5000' : 'e.g. 80, 100'}
            value={drafts[draftKey]}
            onChange={e => setDrafts(p => ({ ...p, [draftKey]: e.target.value }))}
          />
        </div>
        {drafts[draftKey] !== '' && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setDrafts(p => ({ ...p, [draftKey]: '' }))}
            style={{ flexShrink: 0 }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <PageHeader
        icon={Bell}
        badge="Notification Alerts"
        title="Notification Settings"
        subtitle="Configure budget thresholds, total-spend alerts and monthly summaries."
        actions={
          <>
            <button className="btn btn-secondary btn-sm" onClick={fetchSettings} title="Refresh">
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
          <div className="skeleton" style={{ height: '120px', width: '100%', borderRadius: 'var(--r-md)' }} />
          <div className="skeleton" style={{ height: '120px', width: '100%', borderRadius: 'var(--r-md)' }} />
          <div className="skeleton" style={{ height: '120px', width: '100%', borderRadius: 'var(--r-md)' }} />
        </div>
      ) : (
        <>
          {/* Delivery channels */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px' }}>Delivery Channels</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '18px' }}>Choose where you receive alerts.</p>

            {[
              { key: 'inAppNotifications', label: 'In-App Notifications', desc: 'Show alerts in the notification drawer.', icon: Inbox },
              { key: 'emailNotifications', label: 'Email Notifications', desc: 'Send alerts to your registered email address.', icon: Mail },
            ].map(ch => {
              const Icon = ch.icon;
              return (
                <div key={ch.key} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                  padding: '14px 16px', borderRadius: 'var(--r-lg)', marginBottom: '10px',
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: '#050505', border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} color="#B7FF00" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>{ch.label}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{ch.desc}</p>
                    </div>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={boolVal(ch.key)}
                      onChange={() => toggle(ch.key)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              );
            })}
          </div>

          {/* Thresholds */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px' }}>Alert Thresholds</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              You'll be notified when spending crosses each threshold. Choose percentage or absolute amount for each type.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <ThresholdEditor
                title="Overall Budget"
                desc="Overall monthly budget progress alerts"
                enabledKey="overallBudgetEnabled"
                listKey="overallBudgetThresholds"
                draftKey="overallBudgetThresholds"
                typeKey="overallBudgetThresholdType"
              />
              <ThresholdEditor
                title="Category Budget"
                desc="Per-category budget progress alerts"
                enabledKey="categoryBudgetEnabled"
                listKey="categoryBudgetThresholds"
                draftKey="categoryBudgetThresholds"
                typeKey="categoryBudgetThresholdType"
              />
              <ThresholdEditor
                title="Total Expenditure"
                desc="Total monthly spend alerts"
                enabledKey="totalExpenditureEnabled"
                listKey="totalExpenditureThresholds"
                draftKey="totalExpenditureThresholds"
                typeKey="totalExpenditureThresholdType"
              />
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                padding: '18px 20px', borderRadius: 'var(--r-lg)',
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: '#050505', border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Wallet size={16} color="#B7FF00" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>Monthly Summary</h4>
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Receive a month-end spending summary.</p>
                  </div>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={boolVal('monthlySummaryEnabled')}
                    onChange={() => toggle('monthlySummaryEnabled')}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          </div>

          {/* Group Notifications */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px' }}>Group Notifications</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Choose which group-related events you want to be notified about.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { key: 'budgetUpdateEnabled', label: 'Budget Updates', desc: 'When a group budget is set or updated.', icon: Target },
                { key: 'expiryDateUpdateEnabled', label: 'Expiry Date Updates', desc: 'When a group expiry date is changed.', icon: Calendar },
                { key: 'paymentApprovalEnabled', label: 'Payment Approve/Reject', desc: 'When your group payment is approved or rejected.', icon: CheckCircle },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.key} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                    padding: '14px 16px', borderRadius: 'var(--r-lg)',
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: '#050505', border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={16} color="#B7FF00" />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>{item.label}</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{item.desc}</p>
                      </div>
                    </div>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={boolVal(item.key)}
                        onChange={() => toggle(item.key)}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Expense Limits */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px' }}>Category Expense Limits</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Set a monthly spending limit per category. You'll be notified when it's exceeded.
            </p>

            {categoryLimits.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {categoryLimits.map(limit => (
                  <div key={limit.categoryId} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 'var(--r-lg)',
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Tag size={14} color="#B7FF00" />
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{limit.categoryName}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ef4444' }}>
                        ₹{limit.limitAmount.toLocaleString('en-IN')}
                      </span>
                      <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => removeCategoryLimit(limit.categoryId)}
                        title="Remove limit"
                        style={{ padding: '4px' }}
                      >
                        <X size={14} color="#ef4444" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div className="input-group" style={{ margin: 0, flex: 1 }}>
                <label className="input-label">Category</label>
                <select
                  value={newLimitCategory}
                  onChange={e => setNewLimitCategory(e.target.value)}
                  className="input-field"
                  style={{ fontSize: '0.83rem' }}
                >
                  <option value="">Select category...</option>
                  {allCategories
                    .filter(c => !categoryLimits.some(l => l.categoryId === c.id))
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>
              <div className="input-group" style={{ margin: 0, flex: 1 }}>
                <label className="input-label">Monthly Limit (₹)</label>
                <input
                  type="number" min="1" step="100"
                  placeholder="e.g. 5000"
                  value={newLimitAmount}
                  onChange={e => setNewLimitAmount(e.target.value)}
                  className="input-field"
                  style={{ fontSize: '0.83rem' }}
                />
              </div>
              <button
                className="btn btn-primary btn-sm"
                disabled={savingLimit || !newLimitCategory || !newLimitAmount}
                onClick={addCategoryLimit}
                style={{ flexShrink: 0, height: '36px' }}
              >
                {savingLimit ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Plus size={14} />}
                Add
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <AlertTriangle size={14} color="#f59e0b" />
            Threshold values are applied on save. Choose between percentage (%) or absolute amount (₹) for each alert type.
          </div>
        </>
      )}
    </div>
  );
};
