import React, { useState, useRef } from 'react';
import {
  UploadCloud, ScanLine, Loader2, CheckCircle2, ShieldCheck, Tag,
  X, Edit3, DollarSign, Calendar, FileText, Zap, AlertCircle, AlertTriangle,
  ShoppingCart, Smartphone, UtensilsCrossed
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { expensesApi } from '../../services/api';
import { CategorySearchSelect } from '../categories/CategorySearchSelect';

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

export const ReceiptScanner = () => {
  const { addExpense, addCategory, categories } = useExpense();

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

  const fileInputRef = useRef(null);

  const simulateScanSteps = (callback) => {
    let step = 0;
    const total = SCAN_STEPS.length;
    const interval = setInterval(() => {
      step++;
      setScanStep(step);
      setScanProgress(Math.round((step / total) * 100));
      if (step >= total - 1) {
        clearInterval(interval);
        setTimeout(callback, 400);
      }
    }, 600);
  };

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

    simulateScanSteps(() => {
      const cat = categories.find(c => c.name?.includes(template.categoryName.split(' ')[0])) || categories[0];
      applyScannedData({ ...template, categoryId: cat?.id });
    });
  };

  const handleConfirm = async () => {
    if (!editAmount || !editDescription) return;
    try {
      await addExpense({
        amount: parseFloat(editAmount),
        description: editDescription,
        expenseDate: editDate,
        categoryId: editCategoryId,
      });
      resetAll();
    } catch {}
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
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>

      {/* Header */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: '#050505',
            border: '1px solid #1a1a1a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <ScanLine size={22} color="#B7FF00" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 800, marginBottom: '3px' }}>
              AI Receipt Scanner
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Upload any paper or digital receipt — the AI extracts merchant, date & total automatically.
            </p>
          </div>
          <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '4px 10px', borderRadius: '99px',
              background: 'rgba(183,255,0,0.12)', color: 'var(--accent)',
              fontSize: '0.72rem', fontWeight: 700,
            }}>
              <Zap size={11} /> OCR Powered
            </span>
          </div>
        </div>
      </div>

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
            }}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
          >
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
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: isDragOver ? 'rgba(183,255,0,0.08)' : 'var(--bg-surface)',
                  border: `2px dashed ${isDragOver ? '#B7FF00' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'var(--t-base)',
                }}>
                  <UploadCloud size={26} color={isDragOver ? '#B7FF00' : 'var(--text-faint)'} />
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

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-secondary" onClick={resetAll} style={{ flex: 1 }}>
                <X size={14} /> Discard
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirm}
                disabled={!editAmount || !editDescription}
                style={{ flex: 2 }}
              >
                <CheckCircle2 size={15} /> Save Expense
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
