export const INCOME_SLABS = [
  { key: 'UNDER_25K',       label: 'Under ₹25K',     budget: 12500 },
  { key: 'FROM_25K_TO_50K', label: '₹25K – ₹50K',    budget: 20000 },
  { key: 'FROM_50K_TO_1L',  label: '₹50K – ₹1L',     budget: 35000 },
  { key: 'FROM_1L_TO_2P5L', label: '₹1L – ₹2.5L',    budget: 60000 },
  { key: 'ABOVE_2P5L',      label: 'Above ₹2.5L',    budget: 120000 },
];

export const SPENDING_STYLES = [
  { key: 'INDIVIDUAL', label: 'Individual', desc: 'Just me' },
  { key: 'GROUP',      label: 'Group',      desc: 'With others' },
  { key: 'BOTH',       label: 'Both',       desc: 'A mix of both' },
];

export const fmtINR = (n) => `₹${Number(n).toLocaleString('en-IN')}`;