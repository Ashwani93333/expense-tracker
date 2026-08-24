import React, { useState, useEffect } from 'react';
import {
  X, Copy, Check, Share2, Mail, Loader2, Link2, ExternalLink, Users,
  CheckCircle2, KeyRound, Send
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { groupsApi } from '../../services/api';

// ─── WhatsApp brand icon (lucide has no brand icons) ──────────────────────────
const WhatsAppIcon = ({ size = 16, color = '#ffffff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const SHARE_STYLES = {
  card: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '11px 14px', borderRadius: 'var(--r-lg)',
    border: '1px solid var(--border)', background: '#fff',
    cursor: 'pointer', width: '100%', fontFamily: 'var(--font)',
    transition: 'var(--t-base)',
  },
};

export const InviteMemberModal = ({ groupId, inviteCode, groupName }) => {
  const { isInviteModalOpen, setIsInviteModalOpen, showToast } = useExpense();

  const [copied, setCopied] = useState({ code: false, link: false });
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [invited, setInvited] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [linkLoading, setLinkLoading] = useState(false);

  useEffect(() => {
    if (!isInviteModalOpen || !groupId) return;
    let cancelled = false;
    setLinkLoading(true);
    setGenerated(null);
    groupsApi.invite(groupId, {})
      .then(res => { if (!cancelled) setGenerated(res); })
      .catch(() => { if (!cancelled) setGenerated(null); })
      .finally(() => { if (!cancelled) setLinkLoading(false); });
    return () => { cancelled = true; };
  }, [isInviteModalOpen, groupId]);

  if (!isInviteModalOpen || !groupId) return null;

  const inviteLink = generated?.inviteLink || `${window.location.origin}/join?code=${inviteCode || ''}`;
  const displayCode = generated?.inviteCode || inviteCode || 'N/A';
  const inviteText = `Join my "${groupName || 'expense'}" group on ExpenseTracker! Use invite code ${displayCode} or open this link: ${inviteLink}`;

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(prev => ({ ...prev, [key]: true }));
      setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 2200);
    } catch {
      showToast('Could not copy to clipboard', 'error');
    }
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(inviteText)}`, '_blank', 'noopener,noreferrer');
  };

  const shareEmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent('Join my expense group on ExpenseTracker')}&body=${encodeURIComponent(inviteText)}`;
  };

  const shareNative = async () => {
    if (!navigator.share) {
      copy(inviteLink, 'link');
      showToast('Sharing not supported — invite link copied!');
      return;
    }
    try {
      await navigator.share({ title: 'Join my group on ExpenseTracker', text: inviteText, url: inviteLink });
    } catch { /* user cancelled */ }
  };

  const handleEmailInvite = async (e) => {
    e.preventDefault();
    if (!email) return;
    setInviting(true);
    try {
      await groupsApi.invite(groupId, { email });
      setInvited(true);
      setEmail('');
      showToast(`Invite sent to ${email}!`);
      setTimeout(() => setInvited(false), 3000);
    } catch (err) {
      showToast(err.message || 'Failed to send invite', 'error');
    } finally {
      setInviting(false);
    }
  };

  const copyBtn = (key, text) => (
    <button
      className="btn btn-secondary btn-sm"
      onClick={() => copy(text, key)}
      style={{ flexShrink: 0 }}
    >
      {copied[key] ? <Check size={14} color="#059669" /> : <Copy size={14} />}
      <span>{copied[key] ? 'Copied!' : 'Copy'}</span>
    </button>
  );

  return (
    <div className="modal-backdrop" onClick={() => setIsInviteModalOpen(false)}>
      <div
        className="card"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '520px', padding: 0, overflow: 'hidden',
          animation: 'slideUp 0.2s ease',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div style={{
          padding: '22px 26px',
          background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 55%, #7c3aed 100%)',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Users size={19} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 800, margin: 0 }}>Invite Members</h3>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', margin: '2px 0 0 0' }}>
                Share the invite via WhatsApp, email or a direct link
              </p>
            </div>
          </div>
          <button
            className="btn btn-icon"
            onClick={() => setIsInviteModalOpen(false)}
            style={{ background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff' }}
          >
            <X size={17} />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────── */}
        <div style={{ padding: '24px 26px 26px', display: 'flex', flexDirection: 'column', gap: '22px' }}>

          {/* Quick share actions */}
          <div>
            <label className="input-label" style={{ marginBottom: '10px' }}>
              <Share2 size={12} color="var(--accent)" /> Share Invite Via
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {/* WhatsApp */}
              <button
                style={{ ...SHARE_STYLES.card, flexDirection: 'column', gap: '8px', padding: '16px 10px' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#25D366'; e.currentTarget.style.boxShadow = '0 6px 16px -6px rgba(37,211,102,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                onClick={shareWhatsApp}
              >
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37,211,102,0.35)' }}>
                  <WhatsAppIcon size={22} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>WhatsApp</span>
              </button>

              {/* Email */}
              <button
                style={{ ...SHARE_STYLES.card, flexDirection: 'column', gap: '8px', padding: '16px 10px' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#d97706'; e.currentTarget.style.boxShadow = '0 6px 16px -6px rgba(217,119,6,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                onClick={shareEmail}
              >
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(217,119,6,0.35)' }}>
                  <Mail size={20} color="#fff" />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Email</span>
              </button>

              {/* Copy Link */}
              <button
                style={{ ...SHARE_STYLES.card, flexDirection: 'column', gap: '8px', padding: '16px 10px' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 6px 16px -6px rgba(37,99,235,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                onClick={() => copy(inviteLink, 'link')}
              >
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37,99,235,0.35)' }}>
                  {copied.link ? <Check size={20} color="#fff" /> : <Link2 size={20} color="#fff" />}
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{copied.link ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>

            {/* Native share */}
            {typeof navigator !== 'undefined' && navigator.share && (
              <button
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', marginTop: '10px' }}
                onClick={shareNative}
              >
                <ExternalLink size={14} /> More share options…
              </button>
            )}
          </div>

          {/* Invite link field */}
          <div>
            <label className="input-label" style={{ marginBottom: '8px' }}>
              <Link2 size={12} color="var(--accent)" /> Invite Link
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {linkLoading ? (
                <div className="input-field" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-faint)', fontSize: '0.82rem' }}>
                  <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Generating invite link…
                </div>
              ) : (
                <input type="text" readOnly className="input-field" value={inviteLink} style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 600 }} />
              )}
              {copyBtn('link', inviteLink)}
            </div>
          </div>

          {/* Standing invite code */}
          <div>
            <label className="input-label" style={{ marginBottom: '8px' }}>
              <KeyRound size={12} color="var(--accent)" /> Standing Invite Code
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text" readOnly className="input-field"
                value={displayCode}
                style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '0.14em', color: 'var(--accent)' }}
              />
              {copyBtn('code', displayCode === 'N/A' ? '' : displayCode)}
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Anyone with this code can join the group. Share it privately.
            </p>
          </div>

          {/* Email invite (via API) */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <label className="input-label" style={{ marginBottom: '8px' }}>
              <Send size={12} color="var(--accent)" /> Send Invite by Email
            </label>
            <form onSubmit={handleEmailInvite} style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Mail size={14} color="var(--text-faint)" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email" required className="input-field"
                  style={{ paddingLeft: '34px' }}
                  placeholder="colleague@example.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={inviting || !email} style={{ flexShrink: 0, background: '#059669', borderColor: '#059669' }}>
                {inviting ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Mail size={15} />}
                {invited ? 'Sent!' : 'Invite'}
              </button>
            </form>
            {invited && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px',
                padding: '10px 12px', borderRadius: 'var(--r-md)',
                background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46',
                fontSize: '0.82rem', fontWeight: 600,
              }}>
                <CheckCircle2 size={15} color="#059669" /> Invite sent — your teammate will be able to join once they accept.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
