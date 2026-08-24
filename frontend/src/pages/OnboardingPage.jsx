import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight, Eye, EyeOff, CheckCircle2, Sparkles, Star,
  Users, PieChart, Receipt, Zap, Shield, TrendingUp, BarChart3,
  Loader2, AlertCircle, Mail, Lock, User, Wallet, ScanLine,
  Smartphone, ChevronDown, Target, CreditCard, Bell, Link2, Share2,
  Heart, HelpCircle, IndianRupee,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ─── Scroll-reveal hook ───────────────────────────────────────────────────────
// Adds `.reveal-visible` to any `[data-reveal]` element as it enters the viewport.
const useRevealOnScroll = () => {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
};

// ─── Animated counter ─────────────────────────────────────────────────────────
const AnimatedCounter = ({ target, prefix = '', suffix = '', decimals = 0 }) => {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setStarted(true);
        obs.disconnect();
      }
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const dur = 1600;
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, target]);

  return (
    <span ref={ref}>
      {prefix}{value.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </span>
  );
};

// ─── Demo: AI Receipt Scanner ─────────────────────────────────────────────────
const AiScanDemo = () => {
  const [stage, setStage] = useState(0);
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    setStage(0);
    const t1 = setTimeout(() => setStage(1), 500);
    const t2 = setTimeout(() => setStage(2), 1500);
    const t3 = setTimeout(() => setStage(3), 2600);
    const t4 = setTimeout(() => setStage(4), 3600);
    const loop = setTimeout(() => setCycle(c => c + 1), 5400);
    return () => {
      [t1, t2, t3, t4, loop].forEach(clearTimeout);
    };
  }, [cycle]);

  const fields = [
    { label: 'Merchant', value: 'Reliance Smart', show: stage >= 2 },
    { label: 'Total', value: '₹1,850.00', show: stage >= 3 },
    { label: 'Date', value: new Date().toLocaleDateString('en-IN'), show: stage >= 4 },
  ];

  return (
    <div className="demo-window">
      <div className="demo-bar">
        <span className="demo-dot" style={{ background: '#ef4444' }} />
        <span className="demo-dot" style={{ background: '#eab308' }} />
        <span className="demo-dot" style={{ background: '#22c55e' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, minHeight: '260px' }}>
        {/* Receipt being scanned */}
        <div style={{ padding: '20px', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ width: '150px', height: '190px', background: '#fff', borderRadius: '6px', padding: '14px', position: 'relative', boxShadow: '0 12px 24px rgba(0,0,0,0.4)', transform: 'rotate(-2deg)' }}>
            <div style={{ height: '5px', width: '60%', background: '#111827', borderRadius: '2px', marginBottom: '8px' }} />
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ height: '6px', width: i === 5 ? '45%' : '90%', background: '#e2e8f0', borderRadius: '2px', marginBottom: '8px' }} />
            ))}
            <div style={{ height: '5px', width: '70%', background: '#2563eb', borderRadius: '2px', marginTop: '6px' }} />
          </div>
          {stage >= 1 && (
            <div style={{ position: 'absolute', left: '10%', right: '10%', height: '3px', background: 'linear-gradient(90deg, transparent, #22d3ee, transparent)', boxShadow: '0 0 12px #22d3ee', animation: 'scan-line 1.6s linear infinite' }} />
          )}
          {stage >= 1 && (
            <span style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '0.68rem', fontWeight: 700, color: '#22d3ee', background: 'rgba(34,211,238,0.12)', padding: '3px 8px', borderRadius: '99px', border: '1px solid rgba(34,211,238,0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Zap size={11} /> AI OCR
            </span>
          )}
        </div>
        {/* Extracted fields */}
        <div style={{ padding: '20px', background: '#f8fafc' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Extracted Data</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {fields.map(f => (
              <div key={f.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 12px', borderRadius: '10px', background: '#fff', border: '1px solid #e2e8f0',
                animation: f.show ? 'fade-slide-in 0.4s ease' : 'none',
                opacity: f.show ? 1 : 0, transform: f.show ? 'translateY(0)' : 'translateY(10px)',
                transition: 'opacity 0.3s ease, transform 0.3s ease',
              }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{f.label}</span>
                {f.show ? (
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: f.label === 'Total' ? '#059669' : '#111827' }}>{f.value}</span>
                ) : (
                  <span style={{ display: 'flex', gap: '3px' }}>
                    {[0, 1, 2].map(i => <span key={i} style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1', animation: 'typing-dot 1s ease infinite', animationDelay: `${i * 0.18}s` }} />)}
                  </span>
                )}
              </div>
            ))}
          </div>
          {stage >= 4 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', fontSize: '0.74rem', fontWeight: 700, color: '#059669' }}>
              <CheckCircle2 size={14} /> Receipt analyzed in 0.8s — ready to save
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Demo: Smart Budgets ──────────────────────────────────────────────────────
const BudgetDemo = () => {
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setStarted(true), 300);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="demo-window">
      <div className="demo-bar">
        <span className="demo-dot" style={{ background: '#ef4444' }} />
        <span className="demo-dot" style={{ background: '#eab308' }} />
        <span className="demo-dot" style={{ background: '#22c55e' }} />
      </div>
      <div style={{ padding: '24px', background: '#f8fafc', minHeight: '260px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111827' }}>Monthly Budget · August 2026</span>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: '99px', background: '#fef3c7', color: '#92400e' }}>82% · Warning</span>
        </div>
        <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
          <span style={{ color: '#64748b', fontWeight: 600 }}>Spent</span>
          <span style={{ color: '#111827', fontWeight: 800 }}>₹41,000 <span style={{ color: '#94a3b8', fontWeight: 600 }}>of ₹50,000</span></span>
        </div>
        <div className="progress-track" style={{ height: '12px' }}>
          <div className="progress-fill" style={{ width: started ? '82%' : '0%', background: 'linear-gradient(90deg, #f59e0b, #f97316)', animation: 'grow-bar 1.4s ease-out' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '18px' }}>
          {[
            { label: 'Food', pct: 64, color: '#2563eb' },
            { label: 'Travel', pct: 91, color: '#d97706' },
            { label: 'Shopping', pct: 47, color: '#7c3aed' },
          ].map(c => (
            <div key={c.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>{c.label}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: c.color }}>{c.pct}%</span>
              </div>
              <div className="progress-track" style={{ height: '6px' }}>
                <div className="progress-fill" style={{ width: started ? `${c.pct}%` : '0%', background: c.color, animation: 'grow-bar 1.4s ease-out' }} />
              </div>
            </div>
          ))}
        </div>
        {started && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px',
            padding: '10px 14px', borderRadius: '10px', background: '#fffbeb', border: '1px solid #fde68a',
            fontSize: '0.78rem', fontWeight: 700, color: '#92400e',
            animation: 'fade-slide-in 0.5s ease',
          }}>
            <Bell size={14} /> 80% threshold crossed — alert sent to your device
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Demo: Expense Tracking ───────────────────────────────────────────────────
const ExpenseDemo = () => {
  const rows = [
    { name: 'Lunch at Bikanervala', cat: 'Food', amount: '₹420.00', time: '12:30 PM' },
    { name: 'Metro Card Recharge', cat: 'Transport', amount: '₹500.00', time: '9:15 AM' },
    { name: 'Netflix Subscription', cat: 'Entertainment', amount: '₹649.00', time: 'Yesterday' },
    { name: 'Groceries · BigBasket', cat: 'Groceries', amount: '₹1,850.00', time: 'Yesterday' },
  ];
  return (
    <div className="demo-window">
      <div className="demo-bar">
        <span className="demo-dot" style={{ background: '#ef4444' }} />
        <span className="demo-dot" style={{ background: '#eab308' }} />
        <span className="demo-dot" style={{ background: '#22c55e' }} />
      </div>
      <div style={{ padding: '20px', background: '#f8fafc', minHeight: '260px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111827' }}>Recent Transactions</span>
          <span className="badge badge-blue">4 today</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {rows.map((r, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '11px 13px', borderRadius: '12px', background: '#fff',
              border: '1px solid #e2e8f0',
              animation: 'fade-slide-in 0.5s ease', animationDelay: `${i * 0.12}s`,
              animationFillMode: 'backwards',
            }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Receipt size={15} color="#2563eb" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{r.cat} · {r.time}</div>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#dc2626' }}>{r.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Demo: Group Splitting ────────────────────────────────────────────────────
const SplitDemo = () => {
  const members = [
    { name: 'Alex (You, paid)', amt: '+₹1,800', ow: 'Owed' },
    { name: 'Sarah', amt: '-₹600', ow: 'Owes' },
    { name: 'Marcus', amt: '-₹600', ow: 'Owes' },
  ];
  return (
    <div className="demo-window">
      <div className="demo-bar">
        <span className="demo-dot" style={{ background: '#ef4444' }} />
        <span className="demo-dot" style={{ background: '#eab308' }} />
        <span className="demo-dot" style={{ background: '#22c55e' }} />
      </div>
      <div style={{ padding: '20px', background: '#f8fafc', minHeight: '260px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111827' }}>Team Dinner · ₹2,400</span>
          <span className="badge badge-violet">EQUAL SPLIT</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {members.map((m, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 13px', borderRadius: '12px',
              background: '#fff', border: '1px solid #e2e8f0',
              animation: 'fade-slide-in 0.45s ease', animationDelay: `${i * 0.15}s`, animationFillMode: 'backwards',
            }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: i === 0 ? '#2563eb' : '#7c3aed', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, flexShrink: 0 }}>
                {m.name.split(' ')[0].slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>{m.name}</div>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: m.amt.startsWith('+') ? '#059669' : '#dc2626' }}>
                {m.amt} <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600 }}>({m.ow})</span>
              </span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: '#ecfdf5', border: '1px solid #a7f3d0', fontSize: '0.76rem', fontWeight: 700, color: '#065f46' }}>
          <CheckCircle2 size={14} color="#059669" /> Net settlements auto-calculated — "who owes whom"
        </div>
      </div>
    </div>
  );
};

// ─── Demo: Analytics ──────────────────────────────────────────────────────────
const AnalyticsDemo = () => {
  const [started, setStarted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setStarted(true), 300); return () => clearTimeout(t); }, []);
  const bars = [
    { h: 40, c: '#2563eb' }, { h: 65, c: '#2563eb' }, { h: 48, c: '#7c3aed' },
    { h: 80, c: '#7c3aed' }, { h: 58, c: '#059669' }, { h: 92, c: '#059669' },
    { h: 70, c: '#d97706' }, { h: 100, c: '#d97706' }, { h: 84, c: '#dc2626' }, { h: 110, c: '#dc2626' },
  ];
  return (
    <div className="demo-window">
      <div className="demo-bar">
        <span className="demo-dot" style={{ background: '#ef4444' }} />
        <span className="demo-dot" style={{ background: '#eab308' }} />
        <span className="demo-dot" style={{ background: '#22c55e' }} />
      </div>
      <div style={{ padding: '20px', background: '#f8fafc', minHeight: '260px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111827' }}>Spend Trend · Last 10 weeks</span>
          <span className="badge badge-green"><TrendingUp size={11} /> +12.4%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '150px' }}>
          {bars.map((b, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: '5px' }}>
              <div style={{
                width: '100%', height: started ? `${b.h}px` : '0%', borderRadius: '5px 5px 2px 2px', background: b.c,
                animation: 'grow-bar 0.8s ease-out', animationDelay: `${i * 0.06}s`, transition: 'height 0.6s ease',
                minHeight: started ? '8px' : '0px', opacity: started ? 1 : 0,
              }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600 }}>
          <span>May</span><span>Jun</span><span>Jul</span><span>Aug</span>
        </div>
      </div>
    </div>
  );
};

// ─── Demo: Notifications ──────────────────────────────────────────────────────
const NotifDemo = () => {
  const items = [
    { type: 'red', title: 'Group budget exceeded', desc: 'Tech Roommates crossed ₹45,000 threshold.' },
    { type: 'amber', title: '80% budget reached', desc: 'Personal monthly budget is at 82%.' },
    { type: 'green', title: 'Split settled', desc: 'Marcus paid you ₹600 for Team Dinner.' },
  ];
  return (
    <div className="demo-window">
      <div className="demo-bar">
        <span className="demo-dot" style={{ background: '#ef4444' }} />
        <span className="demo-dot" style={{ background: '#eab308' }} />
        <span className="demo-dot" style={{ background: '#22c55e' }} />
      </div>
      <div style={{ padding: '20px', background: '#f8fafc', minHeight: '260px' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111827', marginBottom: '14px' }}>Notifications</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map((n, i) => {
            const color = { red: '#ef4444', amber: '#d97706', green: '#10b981' }[n.type];
            const bg = { red: '#fef2f2', amber: '#fffbeb', green: '#ecfdf5' }[n.type];
            return (
              <div key={i} style={{
                display: 'flex', gap: '11px', padding: '12px 14px', borderRadius: '12px',
                background: bg, border: `1px solid ${color}33`,
                animation: 'fade-slide-in 0.5s ease', animationDelay: `${i * 0.2}s`, animationFillMode: 'backwards',
              }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#fff', border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bell size={15} color={color} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#111827' }}>{n.title}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>{n.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── Interactive Feature Showcase ─────────────────────────────────────────────
const FeatureShowcase = () => {
  const [active, setActive] = useState('scan');
  const tabs = [
    { id: 'scan', label: 'AI Receipt Scan', icon: ScanLine },
    { id: 'budget', label: 'Smart Budgets', icon: Target },
    { id: 'expense', label: 'Expense Tracking', icon: CreditCard },
    { id: 'split', label: 'Group Splitting', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'notif', label: 'Notifications', icon: Bell },
  ];
  const demos = {
    scan: <AiScanDemo />,
    budget: <BudgetDemo />,
    expense: <ExpenseDemo />,
    split: <SplitDemo />,
    analytics: <AnalyticsDemo />,
    notif: <NotifDemo />,
  };
  const headlines = {
    scan: { title: 'AI Receipt Scanner', desc: 'Point, snap, done. Our AI engine reads your receipt, extracts the merchant, total, date and category — then saves it as a verified expense in seconds.' },
    budget: { title: 'Smart Budget Caps', desc: 'Set monthly limits for yourself or a whole group. Green when you\u2019re safe, amber at 80%, red alerts at 100% — with notifications the moment you cross a threshold.' },
    expense: { title: 'Instant Expense Tracking', desc: 'Log personal or group expenses in one tap. Every save updates your dashboard, charts, budgets and reports in real time — no manual syncing.' },
    split: { title: 'Group Expense Splitting', desc: 'Split any bill equally, by percentage, or by exact amounts. The engine computes net "who owes whom" and tracks every settlement automatically.' },
    analytics: { title: 'Real-time Analytics', desc: 'Interactive charts break down spending by category, merchant and member, with trends you can share with your group.' },
    notif: { title: 'Smart Notifications', desc: 'Budget thresholds, split assignments, settlement updates and group invites — delivered instantly, in-app and on the web.' },
  };
  const C = demos[active];
  const H = headlines[active];

  return (
    <section data-reveal style={{ padding: '90px 5%', background: '#fff' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <span className="badge badge-blue" style={{ marginBottom: '14px' }}><Sparkles size={12} /> Live Product Demo</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 800, color: '#111827', margin: '12px 0 12px' }}>
            Watch it work, <span className="text-gradient-animated">before you sign up</span>
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#6b7280', maxWidth: '620px', margin: '0 auto' }}>
            Click through the tabs — these are real interactions you\u2019ll use every day.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '26px' }}>
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '9px 16px', borderRadius: '99px', border: '1px solid',
                  borderColor: isActive ? 'var(--accent)' : '#e2e8f0',
                  background: isActive ? 'var(--accent)' : '#fff',
                  color: isActive ? '#fff' : '#64748b',
                  fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'var(--font)',
                  boxShadow: isActive ? '0 6px 14px -4px rgba(37,99,235,0.5)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Demo panel */}
        <div key={active} style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '28px', alignItems: 'center', animation: 'fade-slide-in 0.4s ease' }}>
          <div>{C}</div>
          <div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', marginBottom: '12px' }}>{H.title}</h3>
            <p style={{ fontSize: '0.98rem', color: '#64748b', lineHeight: 1.7, marginBottom: '20px' }}>{H.desc}</p>
            <button className="btn btn-primary btn-lg" onClick={() => { setIsSignUpModeGlobal(true); document.getElementById('auth-section').scrollIntoView({ behavior: 'smooth' }); }}>
              Try it free <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

// A tiny module-level toggle so FeatureShowcase can jump to signup
let setIsSignUpModeGlobal = () => {};
const setGlobalSignUp = (fn) => { setIsSignUpModeGlobal = fn; };

// ─── Section wrapper with title ───────────────────────────────────────────────
const SectionHeading = ({ badge, title, sub }) => (
  <div data-reveal style={{ textAlign: 'center', marginBottom: '48px' }}>
    {badge && <span className="badge badge-blue" style={{ marginBottom: '14px' }}>{badge}</span>}
    <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 800, color: '#111827', margin: '12px 0 12px' }}>{title}</h2>
    {sub && <p style={{ fontSize: '1.05rem', color: '#6b7280', maxWidth: '620px', margin: '0 auto' }}>{sub}</p>}
  </div>
);

// ─── How it works ─────────────────────────────────────────────────────────────
const steps = [
  { step: '01', icon: Wallet, title: 'Create your account', desc: 'Sign up in 30 seconds. No credit card required, works on every device.' },
  { step: '02', icon: ScanLine, title: 'Scan or log expenses', desc: 'Snap a receipt or enter amounts manually — AI does the heavy lifting for you.' },
  { step: '03', icon: TrendingUp, title: 'Track budgets & grow', desc: 'Watch live dashboards, set caps, split with groups, and stay on top of your money.' },
];

const HowItWorks = () => (
  <section data-reveal style={{ padding: '90px 5%', background: '#f8fafc' }}>
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <SectionHeading
        badge={<><Zap size={12} /> Simple 3-step setup</>}
        title="Up and running in minutes"
        sub="No spreadsheets. No complex accounting. Just three easy steps to total control."
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '26px' }}>
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="card" data-reveal style={{ padding: '30px', position: 'relative', overflow: 'hidden', transition: 'transform 0.25s ease, box-shadow 0.25s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 30px -12px rgba(0,0,0,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ position: 'absolute', top: -14, right: -8, fontSize: '4.2rem', fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.04em' }}>{s.step}</div>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px', border: '1px solid var(--border-accent)', position: 'relative', zIndex: 1 }}>
                <Icon size={24} color="var(--accent)" />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827', marginBottom: '8px', position: 'relative', zIndex: 1 }}>{s.title}</h3>
              <p style={{ fontSize: '0.92rem', color: '#6b7280', lineHeight: 1.65, position: 'relative', zIndex: 1 }}>{s.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

// ─── Testimonials ─────────────────────────────────────────────────────────────
const testimonials = [
  { name: 'Priya Sharma', role: 'Freelance Designer', initials: 'PS', color: '#2563eb', quote: 'The AI receipt scanner is magic. I just snap my bills and my whole month is tracked without lifting a finger.' },
  { name: 'Rohan Mehta', role: 'Startup Co-founder', initials: 'RM', color: '#7c3aed', quote: 'We split all office expenses through groups. The auto settlements saved us from an entire spreadsheet of awkwardness.' },
  { name: 'Ananya Iyer', role: 'Broke-but-now-budgeting', initials: 'AI', color: '#059669', quote: 'The 80% budget warning genuinely changed how I spend. I actually think twice before ordering extra dessert now.' },
];

const Testimonials = () => (
  <section data-reveal style={{ padding: '90px 5%', background: '#fff' }}>
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <SectionHeading
        badge={<><Heart size={12} /> Loved by real users</>}
        title="Don\u2019t take our word for it"
        sub="Thousands of individuals and teams already manage money smarter with ExpenseTracker."
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '22px' }}>
        {testimonials.map((t, i) => (
          <div key={i} className="card" data-reveal style={{ padding: '26px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '3px' }}>
              {Array.from({ length: 5 }).map((_, s) => <Star key={s} size={15} color="#f59e0b" fill="#f59e0b" />)}
            </div>
            <p style={{ fontSize: '0.95rem', color: '#374151', lineHeight: 1.7, fontStyle: 'italic' }}>“{t.quote}”</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 'auto' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: t.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800 }}>{t.initials}</div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#111827' }}>{t.name}</div>
                <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const faqs = [
  { q: 'Is my financial data secure?', a: 'Yes. Your data is encrypted in transit and at rest. We only use your credentials to authenticate, and your expenses are stored in a secure, isolated database tied to your account.' },
  { q: 'Can I split an expense unevenly?', a: 'Absolutely. Choose Equal, Percentage, or Custom splits. The system validates that percentages total 100% and custom amounts match the bill, so the math is always right.' },
  { q: 'Does the AI receipt scanner really work?', a: 'It extracts merchant, date, amount and category from common receipt photos in under a second. You always get a chance to review and edit before the expense is saved.' },
  { q: 'How do group invites work?', a: 'Share your invite code, a WhatsApp message, an email, or a direct link. Anyone with the code can join instantly — no account juggling required.' },
  { q: 'Can I use it on my phone?', a: 'Yes. It\u2019s fully responsive and works great on mobile browsers, so you can track expenses on the go from any device.' },
];

const FaqSection = () => {
  const [openIdx, setOpenIdx] = useState(0);
  return (
    <section data-reveal style={{ padding: '90px 5%', background: '#f8fafc' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        <SectionHeading
          badge={<><HelpCircle size={12} /> Frequently asked</>}
          title="Got questions? We\u2019ve got answers"
          sub="Everything you need to know before you start."
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((f, i) => {
            const open = openIdx === i;
            return (
              <div key={i} className="card" style={{ overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenIdx(open ? -1 : i)}
                  style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    gap: '14px', padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)',
                  }}
                >
                  <span style={{ fontSize: '0.98rem', fontWeight: 700, color: '#111827', textAlign: 'left' }}>{f.q}</span>
                  <ChevronDown size={18} color="#64748b" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease', flexShrink: 0 }} />
                </button>
                <div style={{
                  maxHeight: open ? '180px' : '0px', overflow: 'hidden',
                  transition: 'max-height 0.35s ease',
                }}>
                  <p style={{ padding: '0 22px 20px 22px', fontSize: '0.92rem', color: '#64748b', lineHeight: 1.7, margin: 0 }}>{f.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ─── Floating hero background icons ───────────────────────────────────────────
const HeroFloatingIcons = () => {
  const items = [
    { icon: PieChart, top: '22%', left: '6%', color: '#2563eb', delay: '0s', size: 34 },
    { icon: ScanLine, top: '16%', right: '7%', color: '#7c3aed', delay: '0.6s', size: 32 },
    { icon: Wallet, top: '62%', left: '10%', color: '#059669', delay: '1.1s', size: 30 },
    { icon: Users, bottom: '14%', right: '9%', color: '#d97706', delay: '0.3s', size: 34 },
    { icon: TrendingUp, top: '48%', left: '2%', color: '#0891b2', delay: '1.5s', size: 26 },
    { icon: Bell, top: '34%', right: '16%', color: '#dc2626', delay: '0.9s', size: 26 },
  ];
  return (
    <>
      {items.map((it, i) => {
        const Icon = it.icon;
        const pos = {
          top: it.top, left: it.left, right: it.right, bottom: it.bottom,
        };
        return (
          <div key={i} style={{
            position: 'absolute', ...pos, animation: `float-item ${5 + i}s ease-in-out infinite`, animationDelay: it.delay,
            width: '54px', height: '54px', borderRadius: '16px', background: '#fff',
            border: '1px solid var(--border)', boxShadow: '0 12px 24px -8px rgba(15,23,42,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
          }}>
            <Icon size={it.size} color={it.color} />
          </div>
        );
      })}
    </>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
export const OnboardingPage = () => {
  const { login, signup } = useAuth();
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
  const [scrolled, setScrolled] = useState(false);
  const [headlineIdx, setHeadlineIdx] = useState(0);

  useRevealOnScroll();
  setGlobalSignUp(setIsSignUpMode);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const words = ['expenses', 'budgets', 'groups', 'receipts'];
    const t = setInterval(() => setHeadlineIdx(i => (i + 1) % words.length), 2400);
    return () => clearInterval(t);
  }, []);

  const headlineWords = ['expenses', 'budgets', 'groups', 'receipts'];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.email || !formData.password) { setError('Please fill in all required fields.'); return; }
    if (isSignUpMode && !formData.fullName) { setError('Full name is required.'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setIsLoading(true);
    try {
      if (isSignUpMode) {
        await signup({ fullName: formData.fullName, email: formData.email, password: formData.password });
      } else {
        await login(formData.email, formData.password);
      }
    } catch (err) {
      setError(err.message || (isSignUpMode ? 'Signup failed. Please try again.' : 'Invalid email or password.'));
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToAuth = () => document.getElementById('auth-section').scrollIntoView({ behavior: 'smooth' });

  const stats = [
    { label: 'Active users', value: 12500, prefix: '', suffix: '+', decimals: 0 },
    { label: 'Money tracked', value: 24, prefix: '₹', suffix: ' Cr+', decimals: 0 },
    { label: 'Receipts scanned', value: 150, prefix: '', suffix: 'K+', decimals: 0 },
    { label: 'Uptime guarantee', value: 99.9, prefix: '', suffix: '%', decimals: 1 },
  ];

  const features = [
    { icon: ScanLine, color: '#2563eb', bg: '#eff6ff', title: 'AI Receipt Scanner', desc: 'Snap a photo and the AI extracts merchant, date, and total instantly — with review-before-save.' },
    { icon: PieChart, color: '#059669', bg: '#ecfdf5', title: 'Smart Budget Caps', desc: 'Set limits for yourself or your team. Warned at 80%, alerted at 100% — never caught off guard.' },
    { icon: Users, color: '#7c3aed', bg: '#f5f3ff', title: 'Group Expense Splitting', desc: 'Equal, percentage, or custom splits with automatic "who owes whom" settlements.' },
    { icon: TrendingUp, color: '#d97706', bg: '#fffbeb', title: 'Real-time Analytics', desc: 'Interactive charts reveal exactly where your money goes across all categories.' },
    { icon: Shield, color: '#dc2626', bg: '#fef2f2', title: 'Secure & Synchronized', desc: 'All data is encrypted and synced to the cloud in real time across every device.' },
    { icon: Zap, color: '#0891b2', bg: '#ecfeff', title: 'Instant Notifications', desc: 'Never miss a split, settlement, or budget alert — delivered the second it happens.' },
  ];

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: '#f8fafc',
      fontFamily: 'var(--font)',
      display: 'flex', flexDirection: 'column',
      overflowX: 'hidden'
    }}>
      {/* Sticky Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        padding: '0 5%', height: '70px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'all 0.3s ease',
        boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37,99,235,0.35)',
            animation: 'pulse-ring 2.4s ease infinite',
          }}>
            <Wallet size={19} color="#fff" />
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
            Expense<span style={{ color: '#2563eb' }}>Tracker</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => { setIsSignUpMode(false); scrollToAuth(); }}
            style={{
              padding: '8px 20px', borderRadius: '10px', border: '1px solid #e2e8f0',
              background: '#fff', color: '#374151', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
              transition: 'var(--t-fast)', fontFamily: 'var(--font)',
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsSignUpMode(true); scrollToAuth(); }}
            style={{
              padding: '8px 20px', borderRadius: '10px', border: 'none',
              background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(37,99,235,0.3)',
              transition: 'var(--t-fast)', fontFamily: 'var(--font)',
            }}
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        padding: '170px 5% 90px', textAlign: 'center', position: 'relative',
        background: 'linear-gradient(180deg, #eef2ff 0%, #f8fafc 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        overflow: 'hidden',
      }}>
        {/* Animated blobs */}
        <div style={{ position: 'absolute', width: '480px', height: '480px', top: '-160px', left: '-120px', background: 'radial-gradient(circle, rgba(37,99,235,0.18), transparent 65%)', borderRadius: '50%', animation: 'float-slow 14s ease-in-out infinite', zIndex: 0 }} />
        <div style={{ position: 'absolute', width: '420px', height: '420px', top: '10px', right: '-110px', background: 'radial-gradient(circle, rgba(124,58,237,0.15), transparent 65%)', borderRadius: '50%', animation: 'float-slow 18s ease-in-out infinite reverse', zIndex: 0 }} />
        <div style={{ position: 'absolute', width: '360px', height: '360px', bottom: '-120px', left: '40%', background: 'radial-gradient(circle, rgba(8,145,178,0.12), transparent 65%)', borderRadius: '50%', animation: 'float-slow 16s ease-in-out infinite', zIndex: 0 }} />
        <HeroFloatingIcons />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '7px 18px', borderRadius: '99px',
            background: 'rgba(255,255,255,0.85)', border: '1px solid var(--border-accent)',
            color: '#1d4ed8', fontSize: '0.85rem', fontWeight: 700, marginBottom: '30px',
            boxShadow: '0 2px 8px rgba(37,99,235,0.08)',
            animation: 'slideDown 0.6s ease-out',
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse-scale 1.6s ease infinite' }} />
            V2.0 is live — AI-powered expense tracking & group budgets
          </div>

          <h1 style={{
            fontSize: 'clamp(2.4rem, 5vw, 4.2rem)', fontWeight: 800,
            lineHeight: 1.12, letterSpacing: '-0.03em', color: '#0f172a',
            maxWidth: '900px', marginBottom: '20px',
            animation: 'slideUp 0.8s ease-out',
          }}>
            Take control of your{' '}
            <span className="text-gradient-animated" style={{ display: 'inline-block' }}>{headlineWords[headlineIdx]}</span>
            <br />and never look back
          </h1>

          <p style={{
            fontSize: '1.15rem', color: '#475569', lineHeight: 1.65,
            maxWidth: '640px', marginBottom: '38px',
            animation: 'fadeIn 1s ease-out',
          }}>
            Scan receipts, set smart budgets, and split bills with groups — all synced in real time.
            One app for personal and shared finances.
          </p>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', animation: 'fadeIn 1.2s ease-out' }}>
            <button
              onClick={() => { setIsSignUpMode(true); scrollToAuth(); }}
              style={{
                padding: '16px 30px', borderRadius: '12px', border: 'none',
                background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
                boxShadow: '0 12px 24px -6px rgba(37,99,235,0.45)',
                display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 30px -6px rgba(37,99,235,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 12px 24px -6px rgba(37,99,235,0.45)'; }}
            >
              Create Free Account <ArrowRight size={18} />
            </button>
            <button
              onClick={scrollToAuth}
              style={{
                padding: '16px 30px', borderRadius: '12px', border: '1px solid #e2e8f0',
                background: '#fff', color: '#334155', fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#2563eb'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              <Smartphone size={18} color="#2563eb" /> Explore the demo
            </button>
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '34px', flexWrap: 'wrap' }}>
            {['No credit card', 'Free forever plan', 'Works on all devices'].map(t => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                <CheckCircle2 size={14} color="#059669" /> {t}
              </span>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '70px', animation: 'fadeIn 1.5s ease-out' }}>
          <ChevronDown size={30} color="#94a3b8" style={{ animation: 'bounce 2s infinite' }} />
        </div>
      </section>

      {/* Stats bar */}
      <section data-reveal style={{ padding: '40px 5%', background: '#fff', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '8px' }}>
              <div style={{ fontSize: 'clamp(1.7rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#2563eb', letterSpacing: '-0.02em' }}>
                <AnimatedCounter target={s.value} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals} />
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive feature demo */}
      <FeatureShowcase />

      {/* Features grid */}
      <section data-reveal style={{ padding: '90px 5%', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <SectionHeading
            badge={<><Sparkles size={12} /> Everything included</>}
            title="Everything you need. Nothing you don\u2019t."
            sub="A powerful suite designed to make personal finance and group expenses absolutely effortless."
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} data-reveal style={{
                  padding: '28px', borderRadius: '20px',
                  background: '#fff', border: '1px solid #f1f5f9',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 18px 30px -12px rgba(0,0,0,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                >
                  <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: f.bg, marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={24} color={f.color} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>{f.title}</h3>
                  <p style={{ fontSize: '0.92rem', color: '#6b7280', lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <HowItWorks />

      {/* Testimonials */}
      <Testimonials />

      {/* FAQ */}
      <FaqSection />

      {/* Auth / Final CTA */}
      <section id="auth-section" style={{ padding: '100px 5%', background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: '100%', maxWidth: '1000px',
          background: '#fff', borderRadius: '26px',
          boxShadow: '0 24px 50px -12px rgba(37,99,235,0.18)',
          border: '1px solid var(--border)',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          overflow: 'hidden'
        }}>
          {/* Left panel info */}
          <div style={{ padding: '60px 40px', background: 'linear-gradient(135deg, #2563eb, #4f46e5, #7c3aed)', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', width: '280px', height: '280px', top: '-80px', right: '-80px', background: 'radial-gradient(circle, rgba(255,255,255,0.16), transparent 65%)', borderRadius: '50%', animation: 'float-slow 12s ease-in-out infinite' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h3 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '16px', lineHeight: 1.2 }}>Start your journey today.</h3>
              <p style={{ fontSize: '1.02rem', opacity: 0.92, lineHeight: 1.65, marginBottom: '30px' }}>
                Join thousands of users who are already tracking expenses, splitting group bills, and scanning receipts effortlessly.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {['No credit card required', 'Setup in 30 seconds', 'Access on all devices'].map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.3)' }}>
                      <CheckCircle2 size={14} color="#fff" />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ position: 'relative', zIndex: 1, marginTop: '36px', display: 'flex', gap: '10px' }}>
              {[IndianRupee, CreditCard, Receipt, Users].map((Icon, i) => (
                <div key={i} style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'float-item 4s ease-in-out infinite', animationDelay: `${i * 0.4}s` }}>
                  <Icon size={19} color="#fff" />
                </div>
              ))}
            </div>
          </div>

          {/* Right panel form */}
          <div style={{ padding: '48px 40px' }}>
            <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '10px', padding: '4px', marginBottom: '30px' }}>
              {[
                { label: 'Sign In', mode: false },
                { label: 'Create Account', mode: true },
              ].map(t => (
                <button
                  key={t.label}
                  onClick={() => { setIsSignUpMode(t.mode); setError(''); }}
                  style={{
                    flex: 1, padding: '11px', borderRadius: '8px', border: 'none',
                    background: isSignUpMode === t.mode ? '#fff' : 'transparent',
                    color: isSignUpMode === t.mode ? '#111827' : '#6b7280',
                    fontWeight: isSignUpMode === t.mode ? 700 : 500,
                    fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--font)',
                    boxShadow: isSignUpMode === t.mode ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', marginBottom: '6px' }}>
              {isSignUpMode ? 'Create your account' : 'Welcome back'}
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '24px' }}>
              {isSignUpMode ? 'Start tracking expenses with your team' : 'Sign in to your ExpenseTracker account'}
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
              {isSignUpMode && (
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={iconStyle} />
                    <input
                      type="text" placeholder="Ashwani Kumar"
                      value={formData.fullName}
                      onChange={e => handleChange('fullName', e.target.value)}
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#2563eb'}
                      onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>
                </div>
              )}

              <div>
                <label style={labelStyle}>Email Address *</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={iconStyle} />
                  <input
                    type="email" placeholder="you@example.com"
                    value={formData.email}
                    onChange={e => handleChange('email', e.target.value)}
                    required
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#2563eb'}
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
                    placeholder={isSignUpMode ? 'Min 6 characters' : '••••••••'}
                    value={formData.password}
                    onChange={e => handleChange('password', e.target.value)}
                    required
                    style={{ ...inputStyle, paddingRight: '40px' }}
                    onFocus={e => e.target.style.borderColor = '#2563eb'}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  />
                  <button
                    type="button" onClick={() => setShowPassword(p => !p)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit" disabled={isLoading}
                style={{
                  width: '100%', padding: '14px',
                  background: isLoading ? '#93c5fd' : '#2563eb',
                  color: '#fff', border: 'none', borderRadius: '10px',
                  fontSize: '1rem', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.30)',
                  transition: 'all 0.2s ease', fontFamily: 'var(--font)',
                  marginTop: '8px',
                }}
                onMouseEnter={e => !isLoading && (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={e => !isLoading && (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {isLoading ? (
                  <><Loader2 size={18} style={{ animation: 'spin 0.7s linear infinite' }} /><span>{isSignUpMode ? 'Creating account...' : 'Signing in...'}</span></>
                ) : (
                  <><span>{isSignUpMode ? 'Create Account' : 'Sign In'}</span><ArrowRight size={18} /></>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '44px 5%', background: '#fff', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '14px' }}>
            <Wallet size={17} color="#2563eb" />
            <span style={{ fontWeight: 800, color: '#111827', fontSize: '1.05rem' }}>ExpenseTracker</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {[{ icon: Link2, label: 'Privacy' }, { icon: Share2, label: 'Terms' }, { icon: Shield, label: 'Security' }].map((l, i) => {
              const Icon = l.icon;
              return (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: '#6b7280', cursor: 'pointer', fontWeight: 600 }}>
                  <Icon size={13} color="#94a3b8" /> {l.label}
                </span>
              );
            })}
          </div>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>
            Finance Suite API Backend: <code style={{ color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: '6px' }}>http://localhost:8080</code>
          </p>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '12px' }}>
            © {new Date().getFullYear()} ExpenseTracker. Made for smarter money.
          </p>
        </div>
      </footer>
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
