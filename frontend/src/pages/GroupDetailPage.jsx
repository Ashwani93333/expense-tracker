import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Share2, Users, Plus, Target, PieChart, CreditCard,
  LogOut, Key, CheckCircle2, DollarSign, AlertTriangle, TrendingUp,
  RefreshCw, Loader2, Clock, CalendarClock, Ban, XCircle, ShieldCheck
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import { groupsApi, expensesApi } from '../services/api';
import { InviteMemberModal } from '../components/groups/InviteMemberModal';
import { GroupRoleBadge } from '../components/groups/GroupRoleBadge';

const statusColor = (s) => ({ OK: '#22c55e', WARNING: '#f59e0b', EXCEEDED: '#ef4444' }[s] || '#737373');

const EXPENSE_STATUS_STYLES = {
  PENDING:  { background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: 'rgba(245,158,11,0.2)', label: 'Pending Approval' },
  APPROVED: { background: 'rgba(34,197,94,0.08)', color: '#22c55e', border: 'rgba(34,197,94,0.2)', label: 'Verified' },
  REJECTED: { background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: 'rgba(239,68,68,0.2)', label: 'Rejected' },
};

const ExpenseStatusBadge = ({ status }) => {
  const s = EXPENSE_STATUS_STYLES[status];
  if (!s) return null;
  return (
    <span className="badge" style={{
      fontSize: '0.63rem', background: s.background, color: s.color,
      border: `1px solid ${s.border}`,
    }}>{s.label}</span>
  );
};

const MiniProgress = ({ pct, status }) => (
  <div className="progress-track" style={{ height: '5px', marginTop: '6px' }}>
    <div className="progress-fill" style={{ width: `${Math.min(pct || 0, 100)}%`, background: statusColor(status) }} />
  </div>
);

const SettlementRow = ({ from, to, amount }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
    borderRadius: 'var(--r-md)', background: 'var(--bg-surface)',
    border: '1px solid var(--border)', marginBottom: '8px',
  }}>
    <div style={{ flex: 1 }}>
      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ef4444' }}>{from}</span>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 8px' }}>→ owes</span>
      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#22c55e' }}>{to}</span>
    </div>
    <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
  </div>
);

export const GroupDetailPage = () => {
  const {
    groups, activeGroupId, setActiveTab,
    setIsAddModalOpen, isInviteModalOpen, setIsInviteModalOpen,
    leaveGroup, removeMember, updateMemberRole, updateGroupInfo,
    updateGroupBudget, updateMemberBudgetCap,
    currentMonth, showToast, dataVersion,
  } = useExpense();
  const { currentUser } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [groupDetail, setGroupDetail]   = useState(null);
  const [budgetStatus, setBudgetStatus] = useState(null);
  const [settlements, setSettlements]   = useState([]);
  const [report, setReport]             = useState(null);
  const [groupExpenses, setGroupExpenses] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [budgetInput, setBudgetInput]   = useState('');
  const [memberCaps, setMemberCaps]     = useState({});
  const [savingCap, setSavingCap]       = useState('');
  const [expiryInput, setExpiryInput]   = useState('');
  const [savingExpiry, setSavingExpiry] = useState(false);
  const [reviewingId, setReviewingId]   = useState('');
  const [rejectingId, setRejectingId]   = useState(null);
  const [rejectNote, setRejectNote]     = useState('');

  const grp = groups.find(g => g.id === activeGroupId) || groups[0];

  const fetchGroupData = async () => {
    if (!grp?.id) return;
    setLoading(true);
    try {
      const [detail, budget, settles, rep, exps] = await Promise.allSettled([
        groupsApi.get(grp.id),
        groupsApi.getBudgetStatus(grp.id, currentMonth),
        groupsApi.getSettlements(grp.id, currentMonth),
        groupsApi.getMonthlyReport(grp.id, currentMonth),
        groupsApi.listExpenses(grp.id, currentMonth),
      ]);
      if (detail.status   === 'fulfilled') setGroupDetail(detail.value);
      if (budget.status   === 'fulfilled') setBudgetStatus(budget.value);
      if (settles.status  === 'fulfilled') setSettlements(settles.value || []);
      if (rep.status      === 'fulfilled') setReport(rep.value);
      if (exps.status     === 'fulfilled') setGroupExpenses(exps.value || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchGroupData(); }, [activeGroupId, currentMonth, dataVersion]);

  const reviewExpense = async (exp, action) => {
    if (action === 'REJECT' && !rejectNote.trim()) {
      showToast('Please add a reason for the rejection', 'error');
      return;
    }
    setReviewingId(exp.id);
    try {
      await expensesApi.review(exp.id, { action, note: action === 'REJECT' ? rejectNote.trim() : null });
      showToast(action === 'APPROVE'
        ? 'Payment verified — it now counts toward budgets and settlements.'
        : 'Payment rejected. The member has been notified.');
      setRejectingId(null);
      setRejectNote('');
      await fetchGroupData();
    } catch (err) {
      showToast(err.message || 'Failed to review payment', 'error');
    } finally {
      setReviewingId('');
    }
  };

  if (!grp) return (
    <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
      <p style={{ color: 'var(--text-muted)' }}>Group not found. <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('groups')}>← Back</button></p>
    </div>
  );

  const members = groupDetail?.members || [];
  const userMember = members.find(m => m.userId === currentUser?.id);
  const userRole = userMember?.role || 'MEMBER';
  const isAdmin = userRole === 'ADMIN';
  const totalSpent = report?.totalSpent ?? groupExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const pendingExpenses = groupExpenses.filter(e => e.status === 'PENDING');

  const isExpired = grp.expiresAt && new Date(grp.expiresAt) < new Date();
  const daysUntilExpiry = grp.expiresAt ? Math.ceil((new Date(grp.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const isExpiringSoon = !isExpired && daysUntilExpiry !== null && daysUntilExpiry <= 7;

  const SUB_TABS = [
    { id: 'overview',    label: 'Overview',    icon: PieChart },
    { id: 'expenses',    label: 'Expenses',    icon: CreditCard },
    { id: 'members',     label: 'Members',     icon: Users },
    { id: 'settlements', label: 'Settlements', icon: CheckCircle2 },
    { id: 'budget',      label: 'Budget',      icon: Target },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Back + Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('groups')}>
          <ArrowLeft size={15} /> Back to Groups
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setIsInviteModalOpen(true)}>
            <Share2 size={14} /> Invite
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={14} /> Add Expense
          </button>
          <button className="btn btn-ghost btn-sm" onClick={fetchGroupData} title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Group Header Card */}
      <div className="card" style={{ padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: '#050505', color: '#B7FF00',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', flexShrink: 0, fontWeight: 800, border: '1px solid #1a1a1a',
            }}>
              {grp.name?.charAt(0)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 800, margin: 0 }}>{grp.name}</h2>
                <GroupRoleBadge role={userRole} />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{grp.description}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            {[
              { label: 'Members',  value: grp.memberCount || members.length, color: '#B7FF00' },
              { label: 'Spent',    value: `₹${totalSpent.toLocaleString('en-IN')}`, color: '#ef4444' },
              { label: 'Currency', value: grp.currencyCode || 'INR', color: '#22c55e' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
          <Key size={13} color="var(--text-muted)" />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Invite Code:</span>
          <code style={{ fontSize: '0.8rem', fontWeight: 700, color: '#B7FF00', background: 'rgba(183,255,0,0.08)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(183,255,0,0.15)' }}>
            {grp.inviteCode}
          </code>
          {grp.expiresAt && (
            <>
              <span style={{ margin: '0 4px', color: 'var(--border)' }}>·</span>
              <CalendarClock size={13} color={isExpired ? '#dc2626' : isExpiringSoon ? '#d97706' : 'var(--text-muted)'} />
              <span style={{ fontSize: '0.75rem', color: isExpired ? '#dc2626' : isExpiringSoon ? '#d97706' : 'var(--text-muted)', fontWeight: 600 }}>
                {isExpired ? 'Expired' : `${daysUntilExpiry}d left`} — {new Date(grp.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Budget Alert */}
      {budgetStatus && (budgetStatus.status === 'WARNING' || budgetStatus.status === 'EXCEEDED') && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px',
          borderRadius: 'var(--r-lg)',
          background: budgetStatus.status === 'EXCEEDED' ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)',
          border: `1px solid ${budgetStatus.status === 'EXCEEDED' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
        }}>
          <AlertTriangle size={18} color={budgetStatus.status === 'EXCEEDED' ? '#ef4444' : '#f59e0b'} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Group budget {budgetStatus.status === 'EXCEEDED' ? 'exceeded!' : `at ${budgetStatus.percentUsed?.toFixed(0)}%`}
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              ₹{budgetStatus.totalSpent?.toFixed(2)} of ₹{budgetStatus.totalBudget?.toFixed(2)} used
            </p>
          </div>
        </div>
      )}

      {/* Group Expiry Alert */}
      {isExpired && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px',
          borderRadius: 'var(--r-lg)',
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
        }}>
          <Ban size={18} color="#ef4444" />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ef4444', margin: 0 }}>
              This group has expired
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              No new expenses or joins allowed. Expired on {new Date(grp.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.
              {isAdmin && ' You can extend the expiry date below.'}
            </p>
          </div>
        </div>
      )}
      {!isExpired && isExpiringSoon && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px',
          borderRadius: 'var(--r-lg)',
          background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
        }}>
          <Clock size={18} color="#f59e0b" />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              This group expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Expires on {new Date(grp.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              {isAdmin && '. You can extend the expiry date below.'}
            </p>
          </div>
        </div>
      )}

      {/* Pending Payment Approvals Alert (admin) */}
      {isAdmin && pendingExpenses.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px',
          borderRadius: 'var(--r-lg)',
          background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
        }}>
          <ShieldCheck size={18} color="#f59e0b" />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {pendingExpenses.length} payment{pendingExpenses.length !== 1 ? 's' : ''} awaiting your approval
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Member payments must be verified by you before they count toward budgets, reports or settlements.
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setActiveSubTab('expenses')}>
            Review Now
          </button>
        </div>
      )}

      {/* Sub-Nav Tabs */}
      <div style={{ display: 'flex', gap: '4px', padding: '4px', background: '#050505', borderRadius: 'var(--r-md)', width: 'fit-content' }}>
        {SUB_TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', border: 'none', borderRadius: 'var(--r-sm)',
                background: active ? 'rgba(183,255,0,0.12)' : 'transparent',
                color: active ? '#B7FF00' : '#737373',
                fontWeight: active ? 700 : 500, fontSize: '0.83rem',
                cursor: 'pointer', fontFamily: 'var(--font)',
                transition: 'var(--t-fast)',
              }}
            >
              <Icon size={14} color={active ? "#B7FF00" : "currentColor"} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Overview Tab ──────────────────────────────────────────── */}
      {activeSubTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <div className="card" style={{ padding: '24px' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ marginBottom: '12px' }}>
                  <div className="skeleton" style={{ height: '12px', width: '50%', marginBottom: '6px' }} />
                  <div className="skeleton" style={{ height: '6px', width: '100%' }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ padding: '22px' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '16px' }}>
                Category Breakdown · {currentMonth}
              </h3>
              {report?.categoryBreakdown?.length > 0 ? report.categoryBreakdown.map(cat => {
                const pct = report.totalSpent > 0 ? (cat.total / report.totalSpent * 100) : 0;
                return (
                  <div key={cat.categoryId || cat.categoryName} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.83rem', color: 'var(--text-primary)', fontWeight: 600 }}>{cat.categoryName}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        ₹{cat.total.toLocaleString('en-IN')} · {(cat.pctOfTotal ?? pct).toFixed(1)}%
                      </span>
                    </div>
                    <div className="progress-track" style={{ height: '5px' }}>
                      <div className="progress-fill" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
                    </div>
                  </div>
                );
              }) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
                  No expenses logged for this month.
                </p>
              )}
            </div>
          )}

          {report?.topDescriptions?.length > 0 && (
            <div className="card" style={{ padding: '22px' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '14px' }}>Top Expenses</h3>
              {report.topDescriptions.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-faint)', width: '18px' }}>#{i + 1}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>{item.description}</span>
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#dc2626' }}>₹{item.total.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}

          {/* Admin Expiry Settings */}
          {isAdmin && (
            <div className="card" style={{ padding: '22px' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarClock size={16} /> Group Expiry
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Set when this group stops accepting new expenses and joins.
              </p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="datetime-local"
                  value={expiryInput}
                  onChange={e => setExpiryInput(e.target.value)}
                  className="input-field"
                  style={{ flex: 1, fontSize: '0.875rem' }}
                  min={new Date().toISOString().slice(0, 16)}
                />
                <button
                  className="btn btn-primary btn-sm"
                  disabled={savingExpiry}
                  onClick={async () => {
                    if (!expiryInput) return;
                    setSavingExpiry(true);
                    try {
                      await updateGroupInfo(
                        grp.id,
                        { expiresAt: new Date(expiryInput).toISOString() },
                        `Expiry updated — group now expires ${new Date(expiryInput).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                      );
                      await fetchGroupData();
                      setExpiryInput('');
                    } catch {}
                    setSavingExpiry(false);
                  }}
                >
                  {savingExpiry ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <CalendarClock size={14} />}
                  Set Expiry
                </button>
              </div>
              {grp.expiresAt && (
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Current expiry: {new Date(grp.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {isExpired && ' (expired)'}
                    {isExpiringSoon && ` (${daysUntilExpiry}d left)`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Expenses Tab ──────────────────────────────────────────── */}
      {activeSubTab === 'expenses' && (
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700 }}>Group Expenses · {currentMonth}</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={14} /> Add Expense
            </button>
          </div>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '64px', marginBottom: '8px', borderRadius: 'var(--r-md)' }} />
            ))
          ) : groupExpenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <DollarSign size={32} color="var(--text-faint)" style={{ marginBottom: '8px' }} />
              <p style={{ color: 'var(--text-muted)' }}>No group expenses this month.</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: '12px' }} onClick={() => setIsAddModalOpen(true)}>
                Log First Expense
              </button>
            </div>
          ) : (
            groupExpenses.map(exp => (
              <div key={exp.id} style={{
                padding: '12px 14px', borderRadius: 'var(--r-md)', marginBottom: '8px',
                background: exp.status === 'PENDING' ? 'rgba(245,158,11,0.04)'
                  : exp.status === 'REJECTED' ? 'rgba(239,68,68,0.04)' : 'var(--bg-surface)',
                border: `1px solid ${exp.status === 'PENDING' ? 'rgba(245,158,11,0.15)'
                  : exp.status === 'REJECTED' ? 'rgba(239,68,68,0.15)' : 'var(--border)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{exp.description}</span>
                      <ExpenseStatusBadge status={exp.status} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {exp.expenseDate || exp.date} · {exp.categoryName} · Paid by {exp.paidByName}
                      {exp.splitType && ` · ${exp.splitType} split`}
                    </div>
                    {exp.status === 'REJECTED' && exp.reviewNote && (
                      <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '4px' }}>
                        Rejected by {exp.reviewedByName || 'admin'} · {exp.reviewNote}
                      </div>
                    )}
                    {exp.status === 'APPROVED' && exp.reviewedByName && exp.userId !== currentUser?.id && (
                      <div style={{ fontSize: '0.7rem', color: '#22c55e', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldCheck size={11} /> Verified by {exp.reviewedByName}
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: '1rem', fontWeight: 700,
                    color: exp.status === 'REJECTED' ? 'var(--text-faint)' : '#ef4444',
                    textDecoration: exp.status === 'REJECTED' ? 'line-through' : 'none',
                  }}>
                    ₹{(exp.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {isAdmin && exp.status === 'PENDING' && rejectingId !== exp.id && (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border)' }}>
                    <button
                      className="btn btn-emerald btn-xs"
                      disabled={reviewingId === exp.id}
                      onClick={() => reviewExpense(exp, 'APPROVE')}
                    >
                      {reviewingId === exp.id
                        ? <Loader2 size={12} style={{ animation: 'spin 0.7s linear infinite' }} />
                        : <CheckCircle2 size={12} />} Verify Payment
                    </button>
                    <button
                      className="btn btn-xs"
                      style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--r-sm)', gap: '4px' }}
                      onClick={() => { setRejectingId(exp.id); setRejectNote(''); }}
                    >
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                )}

                {isAdmin && exp.status === 'PENDING' && rejectingId === exp.id && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border)' }}>
                    <input
                      type="text"
                      className="input-field"
                      style={{ flex: 1, fontSize: '0.8rem' }}
                      placeholder="Reason for rejection (shared with the member)"
                      value={rejectNote}
                      onChange={e => setRejectNote(e.target.value)}
                      maxLength={500}
                    />
                    <button
                      className="btn btn-xs"
                      style={{ background: '#ef4444', color: '#fff', border: '1px solid #ef4444', borderRadius: 'var(--r-sm)', gap: '4px', flexShrink: 0 }}
                      disabled={!rejectNote.trim() || reviewingId === exp.id}
                      onClick={() => reviewExpense(exp, 'REJECT')}
                    >
                      {reviewingId === exp.id
                        ? <Loader2 size={12} style={{ animation: 'spin 0.7s linear infinite' }} />
                        : <XCircle size={12} />} Confirm Reject
                    </button>
                    <button className="btn btn-ghost btn-xs" onClick={() => setRejectingId(null)}>Cancel</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Members Tab ───────────────────────────────────────────── */}
      {activeSubTab === 'members' && (
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700 }}>Members ({members.length})</h3>
            {isAdmin && (
              <button className="btn btn-secondary btn-sm" onClick={() => setIsInviteModalOpen(true)}>
                <Share2 size={13} /> Invite
              </button>
            )}
          </div>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '56px', marginBottom: '8px', borderRadius: 'var(--r-md)' }} />
            ))
          ) : (
            members.map(m => (
              <div key={m.userId} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
                borderRadius: 'var(--r-md)', marginBottom: '8px',
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
              }}>
                {m.avatarUrl ? (
                  <img src={m.avatarUrl} alt={m.userName} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'rgba(183,255,0,0.08)', border: '1px solid rgba(183,255,0,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 800, color: '#B7FF00', flexShrink: 0,
                  }}>
                    {m.userName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{m.userName}</span>
                    <GroupRoleBadge role={m.role} />
                    {m.userId === currentUser?.id && <span className="badge" style={{ fontSize: '0.63rem', background: '#050505', color: '#B7FF00' }}>You</span>}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.userEmail}</span>
                </div>
                {isAdmin && m.userId !== currentUser?.id && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-secondary btn-xs"
                      onClick={() => updateMemberRole(grp.id, m.userId, m.role === 'ADMIN' ? 'MEMBER' : 'ADMIN')}
                    >
                      {m.role === 'ADMIN' ? 'Demote' : 'Promote'}
                    </button>
                    <button
                      className="btn btn-xs"
                      style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--r-sm)' }}
                      onClick={() => removeMember(grp.id, m.userId)}
                    >
                      Remove
                    </button>
                  </div>
                )}
                {!isAdmin && m.userId === currentUser?.id && (
                  <button
                    className="btn btn-xs"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--r-sm)', gap: '5px' }}
                    onClick={() => leaveGroup(grp.id)}
                  >
                    <LogOut size={12} /> Leave
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Settlements Tab ───────────────────────────────────────── */}
      {activeSubTab === 'settlements' && (
        <div className="card" style={{ padding: '22px' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '16px' }}>
            Who Owes Whom · {currentMonth}
          </h3>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '48px', marginBottom: '8px', borderRadius: 'var(--r-md)' }} />
            ))
          ) : settlements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <CheckCircle2 size={36} color="#22c55e" style={{ marginBottom: '10px' }} />
              <p style={{ color: '#22c55e', fontWeight: 600 }}>All settled up!</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>No outstanding balances this month.</p>
            </div>
          ) : (
            settlements.map((s, i) => (
              <SettlementRow
                key={i}
                from={s.fromUserName}
                to={s.toUserName}
                amount={s.netAmount}
              />
            ))
          )}
        </div>
      )}

      {/* ── Budget Tab ────────────────────────────────────────────── */}
      {activeSubTab === 'budget' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Group Budget */}
          <div className="card" style={{ padding: '22px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '16px' }}>
              Group Budget · {currentMonth}
            </h3>
            {budgetStatus ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    ₹{budgetStatus.totalSpent?.toFixed(2)} spent of ₹{budgetStatus.totalBudget?.toFixed(2)}
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: statusColor(budgetStatus.status) }}>
                    {budgetStatus.percentUsed?.toFixed(1)}% · {budgetStatus.status}
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${Math.min(budgetStatus.percentUsed || 0, 100)}%`, background: statusColor(budgetStatus.status) }} />
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No budget set for this month.</p>
            )}

            {isAdmin && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <input
                  type="number" placeholder="Set budget limit (₹)"
                  value={budgetInput} onChange={e => setBudgetInput(e.target.value)}
                  className="input-field" style={{ flex: 1, fontSize: '0.875rem' }}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={async () => {
                    if (!budgetInput) return;
                    await updateGroupBudget(grp.id, budgetInput);
                    setBudgetInput('');
                  }}
                >
                  Set Budget
                </button>
              </div>
            )}
          </div>

          {/* Member Budgets */}
          {budgetStatus?.memberBreakdown && (
            <div className="card" style={{ padding: '22px' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '16px' }}>Member Budget Caps</h3>
              {budgetStatus.memberBreakdown.map(m => (
                <div key={m.userId} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{m.userName}</span>
                    {m.budgetLimit ? (
                      <span style={{ fontSize: '0.8rem', color: statusColor(m.status), fontWeight: 700 }}>
                        ₹{m.spent?.toFixed(2)} / ₹{m.budgetLimit?.toFixed(2)} · {m.percentUsed?.toFixed(0)}%
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>₹{m.spent?.toFixed(2)} spent · No cap</span>
                    )}
                  </div>
                  {m.budgetLimit && <MiniProgress pct={m.percentUsed} status={m.status} />}
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <span style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', fontSize: '0.8rem', fontWeight: 700 }}>₹</span>
                        <input
                          type="number" step="100"
                          placeholder={m.budgetLimit ? `Update cap (current: ₹${m.budgetLimit})` : 'Set spend cap (₹)'}
                          value={memberCaps[m.userId] ?? ''}
                          onChange={e => setMemberCaps(p => ({ ...p, [m.userId]: e.target.value }))}
                          className="input-field" style={{ paddingLeft: '26px', fontSize: '0.83rem' }}
                        />
                      </div>
                      <button
                        className="btn btn-secondary btn-sm"
                        disabled={savingCap === m.userId || !memberCaps[m.userId]}
                        style={{ flexShrink: 0 }}
                        onClick={async () => {
                          if (!memberCaps[m.userId]) return;
                          setSavingCap(m.userId);
                          await updateMemberBudgetCap(grp.id, m.userId, memberCaps[m.userId]);
                          setMemberCaps(p => { const n = { ...p }; delete n[m.userId]; return n; });
                          setSavingCap('');
                        }}
                      >
                        {savingCap === m.userId ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Target size={14} />}
                        {m.budgetLimit ? 'Update' : 'Set Cap'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <InviteMemberModal groupId={grp.id} inviteCode={grp.inviteCode} groupName={grp.name} />
    </div>
  );
};
