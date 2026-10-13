import React from 'react';
import { ShieldCheck, User } from 'lucide-react';

export const GroupRoleBadge = ({ role = 'MEMBER' }) => {
  const isAdmin = role === 'ADMIN';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 8px',
      borderRadius: '99px',
      fontSize: '0.7rem',
      fontWeight: 700,
      letterSpacing: '0.04em',
      background: isAdmin ? 'rgba(99, 102, 241, 0.15)' : 'rgba(113, 113, 122, 0.15)',
      border: `1px solid ${isAdmin ? 'rgba(99, 102, 241, 0.3)' : 'rgba(113, 113, 122, 0.3)'}`,
      color: isAdmin ? '#4338ca' : '#52525b'
    }}>
      {isAdmin ? <ShieldCheck size={12} color="#4338ca" /> : <User size={12} color="#52525b" />}
      <span>{role}</span>
    </span>
  );
};
