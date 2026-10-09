import {
  PlusCircle, ShieldCheck, Target, Users, CalendarClock, FilePen,
  UserPlus, UserMinus, HandCoins, Wallet,
} from 'lucide-react';

// Feature-wise grants an admin can hand out per member (mirrors the backend
// GroupPermission enum). A member only sees/offers the features listed here
// that an admin has granted them; group admins implicitly hold all of them.
export const GROUP_PERMISSIONS = [
  { key: 'ADD_EXPENSE',      label: 'Add expenses',      description: 'Add new expenses to the group',                       icon: PlusCircle },
  { key: 'ADD_INCOME',       label: 'Add income',        description: 'Add income entries to the group',                     icon: Wallet },
  { key: 'REVIEW_EXPENSES',  label: 'Approve payments',  description: 'Verify or reject members\' group payments',           icon: ShieldCheck },
  { key: 'SET_BUDGET',       label: 'Set group budget',  description: 'Set or update the group\'s monthly budget',           icon: Target },
  { key: 'SET_MEMBER_CAPS',  label: 'Set member caps',   description: 'Set or update per-member budget caps',                icon: Users },
  { key: 'UPDATE_EXPIRY',    label: 'Update expiry',     description: 'Set or extend the group expiry date',                 icon: CalendarClock },
  { key: 'EDIT_GROUP_DETAILS', label: 'Edit group info', description: 'Change the group name and description',              icon: FilePen },
  { key: 'INVITE_MEMBERS',   label: 'Invite members',    description: 'Invite new members to the group',                     icon: UserPlus },
  { key: 'REMOVE_MEMBERS',   label: 'Remove members',    description: 'Remove members from the group',                       icon: UserMinus },
  { key: 'SETTLE_OTHERS',    label: 'Settle others',     description: 'Settle another member\'s share on their behalf',      icon: HandCoins },
];

export const PERMISSION_KEYS = GROUP_PERMISSIONS.map(p => p.key);

export const permissionMeta = (key) => GROUP_PERMISSIONS.find(p => p.key === key);
