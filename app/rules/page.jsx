'use client';

import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/lib/authFetch.js';

const CATEGORIES = [
  { key: 'entry',      label: 'Entry Rules',       icon: '🎯', color: '#1565c0', bg: '#e3f2fd' },
  { key: 'risk',       label: 'Risk Management',   icon: '🛡️', color: '#6a1b9a', bg: '#f3e5f5' },
  { key: 'psychology', label: 'Psychology Rules',  icon: '🧠', color: '#e65100', bg: '#fff3e0' },
  { key: 'exit',       label: 'Exit Rules',        icon: '🚪', color: '#2e7d32', bg: '#e8f5e9' },
];

function RuleEditor({ rules, onChange }) {
  function updateRule(idx, val) {
    const next = [...rules];
    next[idx] = val;
    onChange(next);
  }
  function addRule() {
    if (rules.length < 10) onChange([...rules, '']);
  }
  function removeRule(idx) {
    onChange(rules.filter((_, i) => i !== idx));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {rules.map((rule, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', width: '20px', flexShrink: 0, textAlign: 'right' }}>{idx + 1}.</span>
          <input
            value={rule}
            onChange={e => updateRule(idx, e.target.value)}
            placeholder={`Rule ${idx + 1}…`}
            style={{
              flex: 1, padding: '8px 12px', border: '1px solid var(--border)',
              borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', outline: 'none',
              background: rule ? '#fff' : '#fafafa',
            }}
          />
          <button onClick={() => removeRule(idx)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#ccc', fontSize: '16px', padding: '4px', lineHeight: 1,
            flexShrink: 0,
          }} title="Remove">✕</button>
        </div>
      ))}
      {rules.length < 10 && (
        <button onClick={addRule} style={{
          marginLeft: '28px', padding: '7px 14px', border: '1.5px dashed var(--border)',
          borderRadius: '8px', background: 'none', color: 'var(--text-muted)',
          fontSize: '13px', cursor: 'pointer', fontWeight: 500, textAlign: 'left',
        }}>
          + Add rule
        </button>
      )}
    </div>
  );
}

function CategoryCard({ cat, data, onSave }) {
  const [rules, setRules]       = useState(data.rules || []);
  const [notes, setNotes]       = useState(data.notes || '');
  const [expanded, setExpanded] = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [dirty, setDirty]       = useState(false);

  useEffect(() => {
    setRules(data.rules || []);
    setNotes(data.notes || '');
    setDirty(false);
  }, [data]);

  function handleRulesChange(r) { setRules(r); setDirty(true); }
  function handleNotesChange(v) { setNotes(v); setDirty(true); }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(cat.key, rules, notes);
      setSaved(true);
      setDirty(false);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    finally { setSaving(false); }
  }

  const filledRules = rules.filter(r => r.trim()).length;

  return (
    <div style={{ border: `1px solid ${cat.bg}`, borderRadius: '14px', overflow: 'hidden', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(p => !p)}
        style={{
          background: cat.bg, padding: '14px 18px', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>{cat.icon}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '14px', color: cat.color }}>{cat.label}</div>
            <div style={{ fontSize: '11px', color: cat.color, opacity: 0.7 }}>{filledRules} rule{filledRules !== 1 ? 's' : ''} defined</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {dirty && <span style={{ fontSize: '11px', color: cat.color, fontWeight: 600 }}>● unsaved</span>}
          <span style={{ color: cat.color, fontSize: '18px' }}>{expanded ? '▾' : '▸'}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '18px' }}>
          <RuleEditor rules={rules} onChange={handleRulesChange} />

          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
              My Notes
            </label>
            <textarea
              value={notes}
              onChange={e => handleNotesChange(e.target.value)}
              placeholder="Personal notes, reminders, lessons learnt…"
              rows={2}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleSave} disabled={saving || !dirty} style={{
              padding: '9px 20px', borderRadius: '8px', border: 'none', cursor: (saving || !dirty) ? 'not-allowed' : 'pointer',
              background: saved ? '#2e7d32' : dirty ? cat.color : '#e0e0e0',
              color: '#fff', fontSize: '13px', fontWeight: 700,
              opacity: !dirty && !saved ? 0.6 : 1, transition: 'all 0.2s',
            }}>
              {saving ? 'Saving…' : saved ? '✅ Saved' : '💾 Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RulesPage() {
  const [categories, setCategories] = useState({});
  const [loading, setLoading]       = useState(true);

  const load = useCallback(async () => {
    try {
      const res  = await authFetch('/api/rules');
      const data = await res.json();
      setCategories(data.categories || {});
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(category, rules, notes) {
    await authFetch('/api/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, rules, notes }),
    });
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading…</div>;

  return (
    <div style={{ maxWidth: '680px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px' }}>📌 Rules & System</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
          Your personal trading constitution. Review before every session.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {CATEGORIES.map(cat => (
          <CategoryCard
            key={cat.key}
            cat={cat}
            data={categories[cat.key] || { rules: [], notes: '' }}
            onSave={handleSave}
          />
        ))}
      </div>

      <div style={{ marginTop: '24px', background: '#f8f9ff', borderRadius: '12px', padding: '16px 18px', border: '1px solid #e8eaf6' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', marginBottom: '6px' }}>💡 Crorepati Reminder</div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          The market doesn't care about your feelings. Your rules do. Every time you break a rule, document it in your journal. Patterns of rule-breaking are the #1 cause of account blowup.
        </div>
      </div>
    </div>
  );
}
