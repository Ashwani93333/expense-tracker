import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Tag, Plus, Check } from 'lucide-react';
import { CategoryIcon } from './categoryIcons';

export const CategorySearchSelect = ({ categories, value, onChange, addCategory }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);

  const selected = categories.find(c => c.id === value);

  useEffect(() => {
    if (selected && !isOpen) setQuery('');
  }, [selected, isOpen]);

  useEffect(() => {
    setHighlightIdx(-1);
  }, [query]);

  const filtered = categories.filter(c =>
    c.name?.toLowerCase().includes(query.toLowerCase())
  );

  const exactMatch = categories.some(
    c => c.name?.toLowerCase().trim() === query.toLowerCase().trim()
  );
  const showCreateOption = query.trim().length > 0 && !exactMatch;

  const handleSelect = useCallback((cat) => {
    onChange(cat.id);
    setQuery('');
    setIsOpen(false);
  }, [onChange]);

  const handleCreate = useCallback(async () => {
    if (!query.trim()) return;
    setIsCreating(true);
    try {
      const newCat = await addCategory({ name: query.trim() });
      if (newCat?.id) {
        onChange(newCat.id);
        setQuery('');
        setIsOpen(false);
      }
    } catch { }
    finally { setIsCreating(false); }
  }, [query, addCategory, onChange]);

  const totalOptions = filtered.length + (showCreateOption ? 1 : 0);

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(prev => (prev + 1) % totalOptions);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(prev => (prev - 1 + totalOptions) % totalOptions);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIdx >= 0 && highlightIdx < filtered.length) {
        handleSelect(filtered[highlightIdx]);
      } else if (showCreateOption && highlightIdx === filtered.length) {
        handleCreate();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayValue = isOpen
    ? query
    : (selected ? selected.name : '');

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div
        onClick={() => { inputRef.current?.focus(); setIsOpen(true); }}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '0 12px', height: '38px',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--r-md)',
          background: '#fff',
          cursor: 'text',
        }}
      >
        <Tag size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selected ? '' : 'Search or add category...'}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: '0.875rem', fontFamily: 'var(--font)',
            color: 'var(--text-primary)', padding: 0,
          }}
        />
        {selected && !isOpen && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(''); setQuery(''); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: '2px', display: 'flex',
              fontSize: '0.8rem',
            }}
          >
            x
          </button>
        )}
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
            marginTop: '4px', maxHeight: '220px', overflowY: 'auto',
            background: '#fff', border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          }}
        >
          {filtered.length > 0 ? (
            filtered.map((cat, i) => (
              <div
                key={cat.id}
                onClick={() => handleSelect(cat)}
                onMouseEnter={() => setHighlightIdx(i)}
                style={{
                  padding: '9px 12px', cursor: 'pointer', fontSize: '0.85rem',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: highlightIdx === i ? 'var(--accent-light)' : 'transparent',
                  color: cat.id === value ? 'var(--accent)' : 'var(--text-primary)',
                  fontWeight: cat.id === value ? 600 : 400,
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <CategoryIcon icon={cat.icon} size={15} color="var(--text-secondary)" />
                {cat.name}
                {cat.id === value && <Check size={13} style={{ marginLeft: 'auto', color: 'var(--accent)' }} />}
              </div>
            ))
          ) : (
            <div style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center' }}>
              No categories found
            </div>
          )}

          {showCreateOption && (
            <div
              onClick={handleCreate}
              onMouseEnter={() => setHighlightIdx(filtered.length)}
              style={{
                padding: '10px 12px', cursor: isCreating ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                background: highlightIdx === filtered.length ? '#f0fdf4' : 'transparent',
                color: '#059669', fontWeight: 600, fontSize: '0.85rem',
                borderTop: '1px solid var(--border)',
              }}
            >
              <Plus size={14} />
              {isCreating ? 'Creating...' : `Create "${query.trim()}"`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
