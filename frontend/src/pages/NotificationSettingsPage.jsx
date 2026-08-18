import React, { useState, useEffect } from 'react';
import { Bell, Loader2, RefreshCw, Save, AlertTriangle, Wallet, Target, BarChart3, Mail, Inbox } from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { usersApi } from '../services/api';

const DEFAULT_SETTINGS = {
  inAppNotifications: true,
  emailNotifications: false,
  overallBudgetEnabled: true,
  overallBudgetThresholds: [80, 100],
  categoryBudgetEnabled: true,
  categoryBudgetThresholds: [80, 100],
  totalExpenditureEnabled: true,
  totalExpenditureThresholds: [],
  monthlySummaryEnabled: true,
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

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await usersApi.getNotificationSettings();
      setSettings({ ...DEFAULT_SETTINGS, ...data });
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

  const ThresholdEditor = ({ title, desc, prefix, enabledKey, listKey, draftKey, unit }) => (
    <div style={{
      padding: '18px 20px', borderRadius: 'var(--r-lg)',
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', gap: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {unit === '%' ? <Target size={16} color="#2563eb" /> : <BarChart3 size={16} color="#2563eb" />}
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

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Current:
        </span>
        {listVal(listKey).length > 0 ? (
          listVal(listKey).map((t, i) => (
            <span key={i} style={{
              fontSize: '0.74rem', fontWeight: 700, padding: '2px 9px', borderRadius: '99px',
              background: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe',
            }}>
              {t}{unit}
            </span>
          ))
        ) : (
          <span style={{ fontSize: '0.74rem', color: 'var(--text-faint)' }}>None</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          {prefix && (
            <span style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', fontSize: '0.8rem', fontWeight: 700 }}>{prefix}</span>
          )}
          <input
            type="text"
            className="input-field"
            style={{ ...(prefix ? { paddingLeft: '26px' } : {}), fontSize: '0.82rem' }}
            placeholder={unit === '%' ? 'e.g. 80, 100' : 'e.g. 1000, 5000'}
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div className="card" style={{ padding: '22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-amber"><Bell size={11} /> Notification Alerts</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '4px', fontWeight: 800 }}>Notification Settings</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Configure budget thresholds, total-spend alerts and monthly summaries.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={fetchSettings} title="Refresh">
              <RefreshCw size={14} />
            </button>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving || loading}>
              {saving ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Save size={15} />}
              Save Changes
            </button>
          </div>
        </div>
      </div>

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
                  padding: '14px 16px', borderRadius: 'var(--r-md)', marginBottom: '10px',
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} color="#2563eb" />
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
              You'll be notified when spending crosses each threshold. Budget thresholds are percentages; total-spend thresholds are amounts.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <ThresholdEditor
                title="Overall Budget"
                desc="Overall monthly budget progress alerts"
                enabledKey="overallBudgetEnabled"
                listKey="overallBudgetThresholds"
                draftKey="overallBudgetThresholds"
                unit="%"
              />
              <ThresholdEditor
                title="Category Budget"
                desc="Per-category budget progress alerts"
                enabledKey="categoryBudgetEnabled"
                listKey="categoryBudgetThresholds"
                draftKey="categoryBudgetThresholds"
                unit="%"
              />
              <ThresholdEditor
                title="Total Expenditure"
                desc="Absolute total-spend alerts (per month)"
                enabledKey="totalExpenditureEnabled"
                listKey="totalExpenditureThresholds"
                draftKey="totalExpenditureThresholds"
                prefix="₹"
                unit=""
              />
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                padding: '18px 20px', borderRadius: 'var(--r-lg)',
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Wallet size={16} color="#4f46e5" />
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <AlertTriangle size={14} color="#d97706" />
            Threshold values are applied on save. Budget thresholds must be percentages between 1 and 100.
          </div>
        </>
      )}
    </div>
  );
};
