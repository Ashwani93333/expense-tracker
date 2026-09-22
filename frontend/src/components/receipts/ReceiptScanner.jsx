import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud, ScanLine, Loader2, CheckCircle2, ShieldCheck, Tag,
  X, Edit3, DollarSign, Calendar, FileText, Zap, AlertCircle, AlertTriangle,
  ShoppingCart, Smartphone, UtensilsCrossed, Sparkles, Users, Scale, Percent, PenLine
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { expensesApi, groupsApi } from '../../services/api';
import { CategorySearchSelect } from '../categories/CategorySearchSelect';
import { PageHeader } from '../ui/PageHeader';

const DEMO_TEMPLATES = [
  {
    description: 'Reliance Smart Superstore',
    amount: 1850.00,
    categoryName: 'Food & Dining',
    confidenceScore: 0.98,
    expenseDate: new Date().toISOString().split('T')[0],
    demoIcon: ShoppingCart,
  },
  {
    description: 'Croma Electronics Store',
    amount: 3499.00,
    categoryName: 'Shopping',
    confidenceScore: 0.95,
    expenseDate: new Date().toISOString().split('T')[0],
    demoIcon: Smartphone,
  },
  {
    description: 'Swiggy Order',
    amount: 420.00,
    categoryName: 'Food & Dining',
    confidenceScore: 0.97,
    expenseDate: new Date().toISOString().split('T')[0],
    demoIcon: UtensilsCrossed,
  },
];

const SCAN_STEPS = [
  'Uploading receipt image...',
  'Extracting text via OCR engine...',
  'Parsing merchant, total & date...',
  'Matching expense category...',
  'Done! Review results below.',
];

const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getMonthLabel = (dateStr) => {
  if (!/^\d{4}-\d{2}/.test(dateStr)) return dateStr;
  const [y, m] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

const round2 = (n) => Math.round(n * 100) / 100;

const SplitTypeBtn = ({ value, current, label, icon: Icon, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(value)}
    style={{
      flex: 1, padding: '9px 4px', border: '1px solid',
      borderColor: current === value ? '#050505' : 'var(--border)',
      borderRadius: 'var(--r-md)',
      background: current === value ? '#050505' : '#fff',
      color: current === value ? '#B7FF00' : 'var(--text-muted)',
      fontWeight: current === value ? 700 : 500,
      fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--font)',
      transition: 'var(--t-fast)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
    }}
  >
    <Icon size={13} /> {label}
  </button>
);

export const ReceiptScanner = () => {
  const { addExpense, addCategory, categories, groups } = useExpense();
  const { currentUser } = useAuth();

  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [scannedData, setScannedData] = useState(null);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);

  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [isGroupExpense, setIsGroupExpense] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState('EQUAL');
  const [groupMembers, setGroupMembers] = useState([]);
  const [splits, setSplits] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileUpload = async (file) => {
    if (!file) return;
    setError('');
    setScannedData(null);

    const reader = new FileReader();
    reader.onload = e => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);

    setIsProcessing(true);
    setScanStep(0);
    setScanProgress(0);

    try {
      let step = 0;
      const stepInterval = setInterval(() => {
        step++;
        setScanStep(step);
        setScanProgress(Math.round((step / SCAN_STEPS.length) * 100));
        if (step >= SCAN_STEPS.length - 1) clearInterval(stepInterval);
      }, 500);

      const data = await expensesApi.scan(file);
      clearInterval(stepInterval);
      setScanStep(SCAN_STEPS.length - 1);
      setScanProgress(100);

      const mappedData = {
        amount: data.totalAmount || data.amount,
        description: data.merchantName || data.description,
        expenseDate: data.date || data.expenseDate,
        confidenceScore: data.confidenceScore || 0.95,
        receiptHash: data.receiptHash || null,
        receiptUrl: data.receiptUrl || null,
      };

      const catMatch = categories.find(c =>
        (data.category && c.name?.toLowerCase().includes(data.category.toLowerCase())) ||
        c.id === data.categoryId
      ) || categories[0];

      mappedData.categoryId = catMatch?.id;
      mappedData.categoryName = catMatch?.name;

      applyScannedData(mappedData);
    } catch (err) {
      setError('OCR scan failed. Please try a clearer image or use the demo mode below.');
      setIsProcessing(false);
      setPreviewUrl(null);
    }
  };

  const applyScannedData = (data) => {
    const cat = categories.find(c => c.id === data.categoryId) || categories[0];
    setScannedData(data);
    setEditAmount(String(data.amount || ''));
    setEditDescription(data.description || '');
    setEditDate(data.expenseDate || new Date().toISOString().split('T')[0]);
    setEditCategoryId(cat?.id || '');
    setIsProcessing(false);
  };

  const handleDemoScan = (idx) => {
    const template = DEMO_TEMPLATES[idx];
    setError('');
    setScannedData(null);
    setPreviewUrl(null);
    setIsProcessing(true);
    setScanStep(0);
    setScanProgress(0);

    let step = 0;
    const total = SCAN_STEPS.length;
    const interval = setInterval(() => {
      step++;
      setScanStep(step);
      setScanProgress(Math.round((step / total) * 100));
      if (step >= total - 1) {
        clearInterval(interval);
        setTimeout(() => {
          const cat = categories.find(c => c.name?.includes(template.categoryName.split(' ')[0])) || categories[0];
          applyScannedData({ ...template, categoryId: cat?.id });
        }, 400);
      }
    }, 600);
  };

  const handleConfirm = async () => {
    if (!editAmount || !editDescription || isSaving) return;
    if (isGroupExpense && (membersLoading || groupMembers.length === 0 || splitError)) return;
    setIsSaving(true);
    try {
      await addExpense({
        amount: parseFloat(editAmount),
        description: editDescription,
        expenseDate: editDate,
        categoryId: editCategoryId,
        receiptHash: scannedData?.receiptHash || null,
        receiptUrl: scannedData?.receiptUrl || null,
        groupId: isGroupExpense ? selectedGroupId : null,
        paidBy: isGroupExpense ? paidBy : null,
        splitType: isGroupExpense ? splitType : null,
        splits: isGroupExpense ? splits : null,
      });
      resetAll();
    } catch (err) {
      // Show the backend's specific error message (e.g. duplicate receipt)
      const msg = err?.message || 'Failed to save expense';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Group split helpers ─────────────────────────────────────────────────────
  const buildSplits = (members, totalAmount, type) => {
    const n = members.length || 1;
    if (type === 'EQUAL') {
      const base = round2(totalAmount / n);
      setSplits(members.map((m, i) => i === n - 1
        ? { userId: m.userId, userName: m.userName, shareAmount: round2(totalAmount - base * (n - 1)), sharePercent: round2(100 / n) }
        : { userId: m.userId, userName: m.userName, shareAmount: base, sharePercent: round2(100 / n) }
      ));
    } else if (type === 'PERCENT') {
      const pct = round2(100 / n);
      const list = members.map((m, i) => ({
        userId: m.userId, userName: m.userName,
        sharePercent: pct,
        shareAmount: round2((totalAmount * pct) / 100),
      }));
      const usedPct = round2(pct * (n - 1));
      const usedAmt = list.slice(0, -1).reduce((a, s) => a + s.shareAmount, 0);
      list[n - 1] = { ...list[n - 1], sharePercent: round2(100 - usedPct), shareAmount: round2(totalAmount - usedAmt) };
      setSplits(list);
    } else {
      const base = round2(totalAmount / n);
      setSplits(members.map((m, i) => i === n - 1
        ? { userId: m.userId, userName: m.userName, shareAmount: round2(totalAmount - base * (n - 1)) }
        : { userId: m.userId, userName: m.userName, shareAmount: base }
      ));
    }
  };

  // When a scan is active and the user opts to split with a group, load members.
  useEffect(() => {
    if (!isGroupExpense || !selectedGroupId) { setGroupMembers([]); setSplits([]); return; }
    let cancelled = false;
    const fetchMembers = async () => {
      setMembersLoading(true);
      try {
        const data = await groupsApi.get(selectedGroupId);
        const mems = (data.members || []).filter(m => m.userId);
        if (cancelled) return;
        setGroupMembers(mems);
        if (!mems.some(m => m.userId === paidBy)) {
          setPaidBy(currentUser?.id || mems[0]?.userId || '');
        }
      } catch {
        if (!cancelled) setGroupMembers([]);
      } finally {
        if (!cancelled) setMembersLoading(false);
      }
    };
    fetchMembers();
    return () => { cancelled = true; };
  }, [isGroupExpense, selectedGroupId]);

  // Rebuild shares whenever the scanned amount / split method / member list changes.
  useEffect(() => {
    if (!isGroupExpense || groupMembers.length === 0) return;
    buildSplits(groupMembers, parseFloat(editAmount) || 0, splitType);
  }, [editAmount, splitType, groupMembers, isGroupExpense]);

  const updateSplitAmount = (userId, value) =>
    setSplits(prev => prev.map(s => s.userId === userId ? { ...s, shareAmount: parseFloat(value) || 0 } : s));

  const updateSplitPercent = (userId, value) => {
    const pct = parseFloat(value) || 0;
    const total = parseFloat(editAmount) || 0;
    setSplits(prev => prev.map(s =>
      s.userId === userId ? { ...s, sharePercent: pct, shareAmount: round2((total * pct) / 100) } : s
    ));
  };

  const resetAll = () => {
    setScannedData(null);
    setPreviewUrl(null);
    setIsProcessing(false);
    setScanStep(0);
    setScanProgress(0);
    setError('');
    setEditAmount('');
    setEditDescription('');
    setEditDate('');
    setEditCategoryId('');
    setIsGroupExpense(false);
    setSelectedGroupId('');
    setPaidBy('');
    setSplitType('EQUAL');
    setGroupMembers([]);
    setSplits([]);
    setMembersLoading(false);
  };

  const splitTotal = splits.reduce((s, sp) => s + (sp.shareAmount || 0), 0);
  const splitError = isGroupExpense && groupMembers.length > 0 && Math.abs(splitTotal - (parseFloat(editAmount) || 0)) > 0.5;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>

      {/* Header */}
      <PageHeader
        icon={ScanLine}
        badge="AI Receipt Scanner"
        title="AI Receipt Scanner"
        subtitle="Turn a receipt into an expense in seconds."
        actions={
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '4px 10px', borderRadius: '99px',
            background: 'rgba(183,255,0,0.12)', color: 'var(--accent)',
            fontSize: '0.72rem', fontWeight: 700,
          }}>
            <Zap size={11} /> OCR Powered
          </span>
        }
      />

      {/* Error */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 16px', borderRadius: 'var(--r-lg)',
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
        }}>
          <AlertCircle size={16} color="#ef4444" />
          <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 500 }}>{error}</span>
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {!scannedData ? (
        <>
          {/* Upload Zone */}
          <div
            className="card"
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={e => {
              e.preventDefault(); setIsDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFileUpload(file);
            }}
            style={{
              padding: '52px 24px', textAlign: 'center',
              border: `2px dashed ${isDragOver ? '#B7FF00' : 'var(--border)'}`,
              background: isDragOver ? 'rgba(183,255,0,0.03)' : 'var(--bg-card)',
              borderRadius: 'var(--r-xl)',
              transition: 'var(--t-base)',
              cursor: isProcessing ? 'default' : 'pointer',
              boxShadow: 'none',
              position: 'relative',
              overflow: 'hidden',
            }}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
          >
            {/* Subtle glow overlay */}
            <div style={{
              position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)',
              width: '300px', height: '300px',
              background: 'radial-gradient(circle, rgba(183,255,0,0.04), transparent 65%)',
              borderRadius: '50%', pointerEvents: 'none',
            }} />
            {isProcessing ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                  <Loader2 size={60} color="#B7FF00" style={{ animation: 'spin 1s linear infinite', position: 'absolute', inset: 0, opacity: 0.15 }} />
                  <div style={{
                    position: 'absolute', inset: '8px',
                    borderRadius: '50%',
                    background: '#050505',
                    border: '1.5px solid rgba(183,255,0,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ScanLine size={20} color="#B7FF00" />
                  </div>
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px' }}>
                    Processing Receipt...
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    {SCAN_STEPS[Math.min(scanStep, SCAN_STEPS.length - 1)]}
                  </p>
                </div>
                <div style={{ width: '100%', maxWidth: '280px' }}>
                  <div className="progress-track" style={{ height: '5px' }}>
                    <div className="progress-fill" style={{ width: `${scanProgress}%`, background: '#B7FF00', transition: 'width 0.4s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                    {SCAN_STEPS.slice(0, -1).map((_, i) => (
                      <div key={i} style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: i < scanStep ? '#B7FF00' : '#1a1a1a',
                        border: `1px solid ${i < scanStep ? '#B7FF00' : '#333'}`,
                        transition: 'all 0.3s ease',
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: '72px', height: '72px', borderRadius: '50%',
                  background: isDragOver ? 'rgba(183,255,0,0.08)' : '#050505',
                  border: `2px dashed ${isDragOver ? '#B7FF00' : '#333'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'var(--t-base)',
                }}>
                  <UploadCloud size={28} color={isDragOver ? '#B7FF00' : 'var(--text-faint)'} />
                </div>

                <div>
                  <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px', fontWeight: 600 }}>
                    {isDragOver ? 'Drop your receipt here' : 'Drag & drop receipt image'}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    or <span style={{ color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>browse files</span> · JPEG, PNG, WEBP, PDF (Max 10MB)
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                    e.target.value = '';
                  }}
                />

                {/* Demo buttons */}
                <div style={{
                  marginTop: '20px', paddingTop: '18px',
                  borderTop: '1px solid var(--border)',
                  width: '100%', maxWidth: '420px',
                }}>
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                    Or try a demo receipt (simulation)
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {DEMO_TEMPLATES.map((t, i) => {
                      const DemoIcon = t.demoIcon;
                      return (
                        <button
                          key={i}
                          className="btn btn-secondary btn-sm"
                          onClick={e => { e.stopPropagation(); handleDemoScan(i); }}
                          style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <DemoIcon size={13} /> {t.description.split(' ')[0]} ·{' '}
                          ₹{t.amount.toLocaleString('en-IN')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Image preview */}
          {previewUrl && (
            <div className="card" style={{ padding: '16px' }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px' }}>Uploaded Receipt Preview</p>
              <img
                src={previewUrl}
                alt="Receipt preview"
                style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}
              />
            </div>
          )}
        </>
      ) : (
        /* OCR Result + Edit Form */
        <div className="card" style={{ padding: '28px' }}>
          {/* Result header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px', paddingBottom: '18px', borderBottom: '1px solid var(--border)' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'rgba(183,255,0,0.1)', border: '1px solid rgba(183,255,0,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <ShieldCheck size={20} color="#B7FF00" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>Receipt Scanned Successfully</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Confidence: <strong style={{ color: '#B7FF00' }}>{((scannedData.confidenceScore || 0.95) * 100).toFixed(0)}%</strong> · Review & confirm below
              </p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={resetAll}>
              <X size={14} /> Discard
            </button>
          </div>

          {/* Confidence bar */}
          <div style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>OCR Confidence</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B7FF00' }}>{((scannedData.confidenceScore || 0.95) * 100).toFixed(0)}%</span>
            </div>
            <div className="progress-track" style={{ height: '5px' }}>
              <div className="progress-fill" style={{ width: `${(scannedData.confidenceScore || 0.95) * 100}%`, background: '#B7FF00' }} />
            </div>
          </div>

          {/* Editable form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Off-month date warning */}
            {editDate && !editDate.startsWith(getCurrentMonthKey()) && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', borderRadius: 'var(--r-md)',
                background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
              }}>
                <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: 500 }}>
                  Receipt date is <strong>{editDate}</strong> — it will be saved under{' '}
                  <strong>{getMonthLabel(editDate)}</strong>{' '}
                  and won't appear in the current month's dashboard.
                </span>
              </div>
            )}

            {/* Amount */}
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label"><DollarSign size={12} /> Amount (₹) *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', fontWeight: 700 }}>₹</span>
                <input
                  type="number" step="0.01"
                  value={editAmount}
                  onChange={e => setEditAmount(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '28px', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* Description */}
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label"><FileText size={12} /> Description *</label>
              <input
                type="text"
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                className="input-field"
                placeholder="Merchant / description"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Category */}
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label"><Tag size={12} /> Category</label>
                <CategorySearchSelect
                  categories={categories}
                  value={editCategoryId}
                  onChange={setEditCategoryId}
                  addCategory={addCategory}
                />
              </div>

              {/* Date */}
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label"><Calendar size={12} /> Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            {/* Group Toggle */}
            {groups.length > 0 && (
              <div style={{
                padding: '14px 16px', borderRadius: 'var(--r-xl)',
                background: isGroupExpense ? 'rgba(183,255,0,0.06)' : 'var(--bg-surface)',
                border: `1px solid ${isGroupExpense ? 'rgba(183,255,0,0.2)' : 'var(--border)'}`,
                transition: 'var(--t-fast)',
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isGroupExpense}
                    onChange={e => {
                      setIsGroupExpense(e.target.checked);
                      if (e.target.checked && !selectedGroupId && groups.length > 0) setSelectedGroupId(groups[0].id);
                    }}
                    style={{ width: '16px', height: '16px', accentColor: '#050505', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Users size={13} /> Split with a group
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                      Assign shares to group members when saving this receipt
                    </div>
                  </div>
                </label>
              </div>
            )}

            {/* Group options */}
            {isGroupExpense && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="input-label">Select Group</label>
                    <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} className="input-field">
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="input-label">Paid By</label>
                    <select value={paidBy} onChange={e => setPaidBy(e.target.value)} className="input-field">
                      {groupMembers.map(m => <option key={m.userId} value={m.userId}>{m.userName}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Split Method</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <SplitTypeBtn value="EQUAL"   current={splitType} label="Equal"    icon={Scale}   onClick={setSplitType} />
                    <SplitTypeBtn value="PERCENT" current={splitType} label="% Percent" icon={Percent} onClick={setSplitType} />
                    <SplitTypeBtn value="CUSTOM"  current={splitType} label="Custom"   icon={PenLine} onClick={setSplitType} />
                  </div>
                </div>

                {/* Split table */}
                {membersLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    <div className="spinner spinner-sm" /> Loading members...
                  </div>
                ) : splits.length > 0 && (
                  <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '8px 14px', borderBottom: '1px solid var(--border)', background: '#050505' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Member</span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Share</span>
                    </div>
                    {splits.map(sp => (
                      <div key={sp.userId} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                          {sp.userName}
                          {sp.userId === currentUser?.id && <span className="badge" style={{ marginLeft: '6px', fontSize: '0.62rem', background: '#050505', color: '#B7FF00' }}>You</span>}
                        </span>
                        <div style={{ textAlign: 'right' }}>
                          {splitType === 'EQUAL' ? (
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>₹{sp.shareAmount.toFixed(2)}</span>
                          ) : splitType === 'PERCENT' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end' }}>
                              <input
                                type="number" step="0.1" min="0" max="100"
                                value={sp.sharePercent || ''}
                                onChange={e => updateSplitPercent(sp.userId, e.target.value)}
                                style={{ width: '55px', padding: '4px 7px', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none', textAlign: 'right', fontFamily: 'var(--font)', background: '#fff' }}
                              />
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.73rem' }}>% = ₹{sp.shareAmount.toFixed(2)}</span>
                            </div>
                          ) : (
                            <input
                              type="number" step="0.01" min="0"
                              value={sp.shareAmount || ''}
                              onChange={e => updateSplitAmount(sp.userId, e.target.value)}
                              style={{ width: '90px', padding: '4px 7px', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--text-primary)', fontSize: '0.87rem', fontWeight: 700, outline: 'none', textAlign: 'right', fontFamily: 'var(--font)', background: '#fff' }}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '9px 14px', background: '#050505' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#737373' }}>Total</span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 800, color: splitError ? '#ef4444' : '#B7FF00', textAlign: 'right', display: 'inline-flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end' }}>
                        ₹{splitTotal.toFixed(2)} {splitError && <AlertTriangle size={13} />}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-secondary" onClick={resetAll} style={{ flex: 1 }}>
                <X size={14} /> Discard
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirm}
                disabled={!editAmount || !editDescription || isSaving || (isGroupExpense && (membersLoading || groupMembers.length === 0 || splitError))}
                style={{ flex: 2 }}
              >
                {isSaving ? (
                  <><Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving...</>
                ) : (
                  <><CheckCircle2 size={15} /> Save Expense</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How it works */}
      {!scannedData && !isProcessing && (
        <div className="card" style={{ padding: '22px 24px' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '16px' }}>How it works</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
            {[
              { step: '1', icon: UploadCloud, label: 'Upload Receipt', sub: 'JPEG, PNG, PDF or drag & drop' },
              { step: '2', icon: ScanLine, label: 'AI Extracts Data', sub: 'OCR reads amount, date & merchant' },
              { step: '3', icon: Edit3, label: 'Review & Edit', sub: 'Verify the scanned details' },
              { step: '4', icon: CheckCircle2, label: 'Save Expense', sub: 'One click to save to your account' },
            ].map(({ step, icon: Icon, label, sub }) => (
              <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: '#050505', border: '1px solid #1a1a1a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={17} color="#B7FF00" />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
