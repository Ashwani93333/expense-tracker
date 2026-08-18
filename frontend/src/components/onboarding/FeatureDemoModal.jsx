import React, { useState } from 'react';
import { 
  X, 
  Users, 
  PieChart, 
  Receipt, 
  Bell, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  ShieldCheck,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';

export const FeatureDemoModal = ({ isOpen, onClose }) => {
  const { setActiveTab } = useExpense();
  const [activeTab, setActiveDemoTab] = useState('splits');

  if (!isOpen) return null;

  const features = [
    {
      id: 'splits',
      label: 'Group Split Engine',
      icon: Users,
      badge: 'Core Feature',
      title: 'Distributed Expense Tracking & Net Settlements',
      description: 'Log shared expenses inside groups and automatically split them across members using 3 flexible split strategies.',
      highlights: [
        'EQUAL Split: Divides total expense evenly across selected group members.',
        'PERCENT Split: Assign custom percentage shares per member (validates to 100%).',
        'CUSTOM Split: Assign exact dollar amounts per member (validates total).',
        'Lightweight Settlements: Automatic net "who owes whom" balance calculation with manual settlement toggle.'
      ],
      mockPreview: (
        <div style={{ background: '#090d16', borderRadius: '12px', padding: '16px', border: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Team Dinner (₹2,400.00)</span>
            <span style={{ fontSize: '0.75rem', background: 'rgba(99,102,241,0.2)', color: '#818cf8', padding: '2px 8px', borderRadius: '99px', fontWeight: 700 }}>EQUAL SPLIT</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#0d131f', padding: '8px 12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: '#ffffff' }}>Alex Vance (Paid)</span>
              <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700 }}>+₹1,800.00 (Owed)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#0d131f', padding: '8px 12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: '#ffffff' }}>Sarah Connor</span>
              <span style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: 700 }}>-₹600.00 (Owes Alex)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#0d131f', padding: '8px 12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: '#ffffff' }}>Marcus Wright</span>
              <span style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: 700 }}>-₹600.00 (Owes Alex)</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'budgets',
      label: 'Personal & Group Budgets',
      icon: PieChart,
      badge: 'Cost Control',
      title: 'Smart Personal & Group Budget Enforcements',
      description: 'Set monthly budget limits for personal accounts, overall groups, and per-member spend caps inside shared pools.',
      highlights: [
        'Personal Monthly Budget: Track category-level and overall spend limits.',
        'Group Total Budget: Real-time progress bar visible to all group members.',
        'Per-Member Caps: Admin allocates individual spend limits inside a group to prevent overspending.',
        'Dynamic Progress Bars: Visual status indicators (Green <70%, Amber 70-99%, Red ≥100%).'
      ],
      mockPreview: (
        <div style={{ background: '#090d16', borderRadius: '12px', padding: '16px', border: '1px solid #1e293b' }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
              <span style={{ color: '#ffffff', fontWeight: 700 }}>Trip to Goa Budget</span>
              <span style={{ color: '#fbbf24', fontWeight: 700 }}>₹38,500 / ₹40,000 (96%)</span>
            </div>
            <div style={{ height: '8px', background: '#1e293b', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '96%', background: 'linear-gradient(90deg, #f59e0b, #ef4444)', borderRadius: '99px' }} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Bell size={14} color="#f59e0b" /> 80% and 100% automated alerts sent to group members
          </div>
        </div>
      )
    },
    {
      id: 'ocr',
      label: 'AI Receipt Scanner',
      icon: Receipt,
      badge: 'Automated OCR',
      title: 'Instant Scan & Auto-Expense Creation',
      description: 'Upload receipt photos or invoices to automatically extract total amount, merchant name, category, and date.',
      highlights: [
        'Multi-format OCR scanning (JPG, PNG, PDF receipt images).',
        'Automatic merchant name and date recognition.',
        'Smart category auto-suggestion based on merchant keywords.',
        'One-click conversion to personal or group expenses.'
      ],
      mockPreview: (
        <div style={{ background: '#090d16', borderRadius: '12px', padding: '16px', border: '1px solid #1e293b', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(99,102,241,0.15)', borderRadius: '12px', color: '#818cf8', marginBottom: '8px' }}>
            <Receipt size={28} />
          </div>
          <div style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 700 }}>Receipt #8492 Processed</div>
          <div style={{ fontSize: '0.75rem', color: '#34d399', margin: '4px 0' }}>Merchant: Reliance Smart • Total: ₹1,850.00</div>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Scanned in 0.8 seconds via AI Engine</span>
        </div>
      )
    },
    {
      id: 'alerts',
      label: 'Smart Notifications',
      icon: Bell,
      badge: 'Real-time',
      title: 'Budget-Aware Alerts & Activity Feed',
      description: 'Receive proactive alerts when spending reaches 80% or 100% of any budget limit, plus group invite notifications.',
      highlights: [
        '80% Threshold Warnings: Early notification before overspending occurs.',
        '100% Budget Exceeded: Critical alerts for personal and group caps.',
        'Group Activity Triggers: Member invites, role updates, and split assignments.',
        'In-app Notification Drawer + Web Push integration.'
      ],
      mockPreview: (
        <div style={{ background: '#090d16', borderRadius: '12px', padding: '12px', border: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '10px', borderRadius: '8px' }}>
            <Bell size={18} color="#ef4444" />
            <div>
              <div style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 700 }}>Group Budget Exceeded</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Tech Roommates budget crossed ₹45,000 threshold.</div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentFeature = features.find(f => f.id === activeTab) || features[0];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(12px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#0d131f',
        border: '1px solid #1e293b',
        borderRadius: '24px',
        maxWidth: '850px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(90deg, #131a29 0%, #0d131f 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>Platform Capabilities & Features</h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>Explore what ExpenseTracker provides for personal & team finance</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{
              background: '#131a29',
              border: '1px solid #1e293b',
              color: '#94a3b8',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Feature Tab Selector */}
        <div style={{ display: 'flex', padding: '12px 24px', gap: '10px', borderBottom: '1px solid #1e293b', background: '#090d16', overflowX: 'auto' }}>
          {features.map(f => {
            const Icon = f.icon;
            const isActive = f.id === activeTab;
            return (
              <button
                key={f.id}
                onClick={() => setActiveDemoTab(f.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: isActive ? '1px solid #6366f1' : '1px solid #1e293b',
                  background: isActive ? 'rgba(99, 102, 241, 0.15)' : '#0d131f',
                  color: isActive ? '#818cf8' : '#94a3b8',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} />
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div style={{ padding: '28px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '4px 10px', borderRadius: '99px', fontWeight: 700 }}>
              {currentFeature.badge}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={14} color="#10b981" /> Enterprise Security Ready
            </span>
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
            {currentFeature.title}
          </h2>

          <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '20px' }}>
            {currentFeature.description}
          </p>

          {/* Interactive Live Mock Preview */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Interactive Component Preview
            </div>
            {currentFeature.mockPreview}
          </div>

          {/* Feature Points */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            {currentFeature.highlights.map((point, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <CheckCircle2 size={16} color="#34d399" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                  {point}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          background: '#090d16'
        }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Ready to streamline your personal & group finances?
          </span>

          <button
            onClick={() => {
              onClose();
              setActiveTab('dashboard');
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ff4d4d 0%, #ef4444 100%)',
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
            }}
          >
            Launch Free Trial App <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
