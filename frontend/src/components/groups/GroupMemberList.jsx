import React, { useState } from 'react';
import { UserCheck, Shield, Trash2, UserPlus, ShieldAlert } from 'lucide-react';
import { GroupRoleBadge } from './GroupRoleBadge';
import { useExpense } from '../../context/ExpenseContext';
import { RemoveMemberConfirmModal } from './RemoveMemberConfirmModal';

export const GroupMemberList = ({ groupId, onOpenInvite }) => {
  const { groups, currentUser, updateMemberRole, removeMember } = useExpense();
  const grp = groups.find(g => g.id === groupId);

  const [selectedMemberToRemove, setSelectedMemberToRemove] = useState(null);

  if (!grp) return null;

  const currentMember = grp.members.find(m => m.userId === currentUser.id);
  const isAdmin = currentMember?.role === 'ADMIN';

  return (
    <div className="glass-card" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', color: '#ffffff', margin: 0 }}>Group Members</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {grp.members.length} member{grp.members.length !== 1 ? 's' : ''} in {grp.name}
          </p>
        </div>

        <button className="btn btn-primary btn-sm" onClick={onOpenInvite}>
          <UserPlus size={14} />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Member List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {grp.members.map(member => {
          const isSelf = member.userId === currentUser.id;

          return (
            <div 
              key={member.userId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: '#131926',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: '#ffffff'
                }}>
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 700 }}>
                      {member.name}
                    </span>
                    {isSelf && (
                      <span style={{ fontSize: '0.725rem', color: '#6366f1', fontWeight: 600 }}>(You)</span>
                    )}
                    <GroupRoleBadge role={member.role} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {member.email}
                  </span>
                </div>
              </div>

              {/* Admin Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isAdmin && !isSelf && (
                  <>
                    <button 
                      className="btn btn-ghost btn-sm"
                      onClick={() => updateMemberRole(groupId, member.userId, member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN')}
                      title={member.role === 'ADMIN' ? 'Demote to Member' : 'Promote to Admin'}
                      style={{ fontSize: '0.75rem' }}
                    >
                      <Shield size={13} />
                      <span>{member.role === 'ADMIN' ? 'Demote' : 'Promote'}</span>
                    </button>

                    <button 
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => setSelectedMemberToRemove(member)}
                      title="Remove Member"
                      style={{ color: '#ef4444' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {selectedMemberToRemove && (
        <RemoveMemberConfirmModal 
          isOpen={!!selectedMemberToRemove}
          onClose={() => setSelectedMemberToRemove(null)}
          onConfirm={() => {
            removeMember(groupId, selectedMemberToRemove.userId);
            setSelectedMemberToRemove(null);
          }}
          memberName={selectedMemberToRemove.name}
        />
      )}
    </div>
  );
};
