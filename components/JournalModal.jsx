'use client';

import { useState } from 'react';

const EMOTIONS = ['calm', 'confident', 'fomo', 'revenge', 'anxious', 'unsure'];

const EMOTION_COLORS = {
  calm: '#1976d2',
  confident: '#2e7d32',
  fomo: '#f57c00',
  revenge: '#c62828',
  anxious: '#f9a825',
  unsure: '#7b1fa2',
};

export default function JournalModal({ isOpen, orderId, planId, onClose }) {
  const [followedPlan, setFollowedPlan] = useState(null);
  const [entryReason, setEntryReason] = useState('');
  const [emotion, setEmotion] = useState('');
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          planId,
          followedPlan,
          entryReason,
          emotion,
          outcomeNotes,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save');
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 'var(--radius)',
          width: '100%',
          maxWidth: '500px',
          padding: '28px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📝</div>
          <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text)' }}>Journal This Trade</h2>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
            Takes 30 seconds. Future you will thank you.
          </p>
        </div>

        {/* Plan adherence buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <button
            onClick={() => setFollowedPlan(true)}
            style={{
              padding: '14px',
              borderRadius: '8px',
              border: '2px solid',
              borderColor: followedPlan === true ? 'var(--buy)' : '#e0e0e0',
              background: followedPlan === true ? '#e8f5e9' : '#fff',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: 600,
              color: followedPlan === true ? 'var(--buy)' : '#666',
            }}
          >
            ✅ Yes, followed my plan
          </button>
          <button
            onClick={() => setFollowedPlan(false)}
            style={{
              padding: '14px',
              borderRadius: '8px',
              border: '2px solid',
              borderColor: followedPlan === false ? 'var(--sell)' : '#e0e0e0',
              background: followedPlan === false ? '#fff5f5' : '#fff',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: 600,
              color: followedPlan === false ? 'var(--sell)' : '#666',
            }}
          >
            ❌ No, this was impulsive
          </button>
        </div>

        {followedPlan === false && (
          <div
            style={{
              background: '#fff3e0',
              border: '1px solid #ffcc02',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
              fontSize: '14px',
              color: '#e65100',
            }}
          >
            ⚠️ Impulsive trades are the #1 cause of losses. What triggered you?
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>
            Why did you take this trade?
          </label>
          <textarea
            value={entryReason}
            onChange={e => setEntryReason(e.target.value)}
            placeholder="Breakout, trend continuation, news catalyst..."
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>
            Emotional state
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {EMOTIONS.map(e => (
              <button
                key={e}
                onClick={() => setEmotion(e === emotion ? '' : e)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: '2px solid',
                  borderColor: emotion === e ? EMOTION_COLORS[e] : '#e0e0e0',
                  background: emotion === e ? EMOTION_COLORS[e] : '#fff',
                  color: emotion === e ? '#fff' : '#555',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  textTransform: 'capitalize',
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>
            Notes (optional)
          </label>
          <textarea
            value={outcomeNotes}
            onChange={e => setOutcomeNotes(e.target.value)}
            placeholder="What could you do better next time?"
            rows={2}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {error && (
          <p style={{ color: 'var(--sell)', fontSize: '14px', marginBottom: '12px' }}>{error}</p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button
            onClick={handleSave}
            disabled={saving || followedPlan === null}
            style={{
              padding: '12px',
              background: followedPlan === null ? '#ccc' : 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: followedPlan === null ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: 600,
            }}
          >
            {saving ? 'Saving...' : 'Save Journal Entry'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '12px',
              background: '#fff',
              color: '#666',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '15px',
            }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
