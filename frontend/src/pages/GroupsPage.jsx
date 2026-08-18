import React, { useState } from 'react';
import { Users, Plus, UserPlus, Search, ShieldCheck, DollarSign, Key, Loader2 } from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { GroupCard } from '../components/groups/GroupCard';
import { CreateGroupModal } from '../components/groups/CreateGroupModal';
import { JoinGroupModal } from '../components/groups/JoinGroupModal';

export const GroupsPage = () => {
  const {
    groups, isLoading,
    setActiveGroupId, setActiveTab,
    isCreateGroupModalOpen, setIsCreateGroupModalOpen,
    isJoinGroupModalOpen, setIsJoinGroupModalOpen,
  } = useExpense();

  const [searchQuery, setSearchQuery] = useState('');

  const filtered = groups.filter(g =>
    g.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.inviteCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (groupId) => {
    setActiveGroupId(groupId);
    setActiveTab('group-detail');
  };

  const totalMembers = groups.reduce((s, g) => s + (g.memberCount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div className="card" style={{ padding: '22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-indigo"><Users size={11} /> Group Management</span>
            </div>
            <h2 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '4px', fontWeight: 800 }}>Groups &amp; Shared Budgets</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Create shared expense pools, split bills, and track who owes whom.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsJoinGroupModalOpen(true)}>
              <Key size={14} /> Join via Code
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setIsCreateGroupModalOpen(true)}>
              <Plus size={14} /> Create Group
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        {[
          { label: 'Joined Groups', value: isLoading ? '—' : `${groups.length}`, icon: Users, iconBg: '#ede9fe', iconColor: '#7c3aed', sub: 'Active memberships' },
          { label: 'Total Members', value: isLoading ? '—' : `${totalMembers}`, icon: UserPlus, iconBg: '#d1fae5', iconColor: '#059669', sub: 'Across all groups' },
          { label: 'Admin Of',      value: isLoading ? '—' : `${groups.filter(g => g.currentUserRole === 'ADMIN').length}`, icon: ShieldCheck, iconBg: '#fef3c7', iconColor: '#d97706', sub: 'Groups you manage' },
        ].map(card => (
          <div key={card.label} className="card" style={{ padding: '18px 20px' }}>
            {isLoading ? (
              <>
                <div className="skeleton" style={{ height: '12px', width: '55%', marginBottom: '10px' }} />
                <div className="skeleton" style={{ height: '28px', width: '40%', marginBottom: '6px' }} />
                <div className="skeleton" style={{ height: '10px', width: '65%' }} />
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>{card.label}</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <card.icon size={16} color={card.iconColor} />
                  </div>
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '4px' }}>{card.value}</div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>{card.sub}</span>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Search + Groups Grid */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 800, margin: 0 }}>Your Groups</h3>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '32px', maxWidth: '240px', fontSize: '0.83rem', borderRadius: 'var(--r-full)' }}
            placeholder="Search groups..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: '20px', height: '180px' }}>
              <div className="skeleton" style={{ height: '18px', width: '60%', marginBottom: '12px' }} />
              <div className="skeleton" style={{ height: '12px', width: '85%', marginBottom: '8px' }} />
              <div className="skeleton" style={{ height: '12px', width: '70%', marginBottom: '20px' }} />
              <div className="skeleton" style={{ height: '8px', width: '100%', marginBottom: '8px' }} />
              <div className="skeleton" style={{ height: '34px', width: '100%', borderRadius: '8px' }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <Users size={40} color="var(--text-faint)" style={{ marginBottom: '12px' }} />
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '6px', fontWeight: 700 }}>
            {searchQuery ? 'No groups match your search' : 'No groups yet'}
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
            {searchQuery ? 'Try a different search term.' : 'Create a group to start splitting expenses with others.'}
          </p>
          {!searchQuery && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsJoinGroupModalOpen(true)}>
                <Key size={14} /> Join via Code
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setIsCreateGroupModalOpen(true)}>
                <Plus size={14} /> Create Group
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filtered.map(group => (
            <GroupCard key={group.id} group={group} onSelect={handleSelect} />
          ))}
        </div>
      )}

      <CreateGroupModal isOpen={isCreateGroupModalOpen} onClose={() => setIsCreateGroupModalOpen(false)} />
      <JoinGroupModal isOpen={isJoinGroupModalOpen} onClose={() => setIsJoinGroupModalOpen(false)} />
    </div>
  );
};
