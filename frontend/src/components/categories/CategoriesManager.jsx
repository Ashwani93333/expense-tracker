import React, { useState } from 'react';
import { Plus, ShieldCheck, Trash2, Check, Loader2, Tag } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { CATEGORY_ICONS, CategoryIcon } from './categoryIcons';

const PRESET_COLORS = ['#B7FF00', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#84cc16', '#f97316'];

export const CategoriesManager = () => {
  const { categories, addCategory, deleteCategory, isLoading } = useExpense();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('folder');
  const [color, setColor] = useState('#B7FF00');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await addCategory({ name: name.trim(), icon, color });
      setName(''); setIcon('folder'); setColor('#B7FF00');
      setIsFormOpen(false);
    } catch {}
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try { await deleteCategory(id); }
    finally { setDeletingId(null); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div className="card" style={{ padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge" style={{ background: '#050505', color: '#B7FF00' }}><Tag size={11} /> Categories</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 800, margin: 0 }}>Category Manager</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {categories.length} categories · Used to tag and filter your expenses
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setIsFormOpen(p => !p)}>
            <Plus size={16} /> {isFormOpen ? 'Cancel' : 'New Category'}
          </button>
        </div>

        {/* Create Form */}
        {isFormOpen && (
          <form onSubmit={handleSubmit} style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">Category Name *</label>
                <input
                  type="text" placeholder="e.g. Pet Care, Fitness" required
                  value={name} onChange={e => setName(e.target.value)}
                  className="input-field" autoFocus
                />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">Icon</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {CATEGORY_ICONS.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key} type="button" title={label}
                      onClick={() => setIcon(key)}
                      style={{
                        padding: '6px 8px', borderRadius: '8px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: icon === key ? '#B7FF00' : 'var(--text-muted)',
                        background: icon === key ? 'rgba(183,255,0,0.08)' : 'var(--bg-surface)',
                        border: `1px solid ${icon === key ? 'rgba(183,255,0,0.2)' : 'var(--border)'}`,
                        transition: 'var(--t-fast)',
                      }}
                    >
                      <Icon size={16} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', flexWrap: 'wrap' }}>
              <div className="input-group" style={{ margin: 0, flex: 1 }}>
                <label className="input-label">Color</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c} type="button" onClick={() => setColor(c)}
                      style={{
                        width: '26px', height: '26px', borderRadius: '50%', background: c, cursor: 'pointer',
                        border: color === c ? '2px solid #fff' : '1px solid transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'var(--t-fast)', outline: color === c ? `2px solid ${c}` : 'none',
                      }}
                    >
                      {color === c && <Check size={12} color="#fff" />}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving || !name.trim()}>
                {saving ? <><Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving...</> : <><Check size={15} /> Create Category</>}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '80px', borderRadius: 'var(--r-lg)' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
          {categories.map(cat => (
            <div key={cat.id} className="card" style={{
              padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                  background: `${cat.color || '#737373'}15`,
                  border: `1px solid ${cat.color || '#737373'}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CategoryIcon icon={cat.icon} size={18} color={cat.color || '#737373'} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h4 style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cat.name}
                  </h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {cat.isSystem ? (
                      <><ShieldCheck size={10} color="#22c55e" /> System</>
                    ) : (
                      'Custom'
                    )}
                  </span>
                </div>
              </div>

              {!cat.isSystem && (
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={() => handleDelete(cat.id)}
                  disabled={deletingId === cat.id}
                  style={{ color: '#ef4444', width: '32px', height: '32px', flexShrink: 0 }}
                >
                  {deletingId === cat.id
                    ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />
                    : <Trash2 size={14} />
                  }
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
