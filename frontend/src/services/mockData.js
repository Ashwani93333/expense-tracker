export const CURRENT_USER = {
  id: 'user-alex',
  name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
};

export const MOCK_USERS = [
  CURRENT_USER,
  {
    id: 'user-sarah',
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-jordan',
    name: 'Jordan Lee',
    email: 'jordan.lee@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-mike',
    name: 'Mike Ross',
    email: 'mike.ross@example.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_CATEGORIES = [
  { id: 'cat-1', name: 'Food & Dining', icon: 'Utensils', color: '#10b981', isSystem: true },
  { id: 'cat-2', name: 'Groceries', icon: 'ShoppingBag', color: '#6366f1', isSystem: true },
  { id: 'cat-3', name: 'Transportation', icon: 'Car', color: '#f59e0b', isSystem: true },
  { id: 'cat-4', name: 'Shopping', icon: 'Shirt', color: '#ec4899', isSystem: true },
  { id: 'cat-5', name: 'Bills & Utilities', icon: 'Zap', color: '#06b6d4', isSystem: true },
  { id: 'cat-6', name: 'Entertainment', icon: 'Film', color: '#8b5cf6', isSystem: true },
  { id: 'cat-7', name: 'Health & Wellness', icon: 'HeartPulse', color: '#ef4444', isSystem: true },
  { id: 'cat-8', name: 'Subscriptions', icon: 'CreditCard', color: '#3b82f6', isSystem: false },
];

export const INITIAL_PERSONAL_BUDGET = {
  month: '2026-08',
  overallLimit: 50000.00,
  categoryBudgets: {
    'cat-1': 12000.00, // Food & Dining
    'cat-2': 15000.00, // Groceries
    'cat-3': 6000.00,  // Transportation
    'cat-4': 10000.00, // Shopping
    'cat-5': 5000.00,  // Bills
    'cat-8': 2000.00   // Subscriptions
  }
};

export const INITIAL_GROUPS = [
  {
    id: 'group-1',
    name: 'Tech Roommates',
    description: 'Shared apartment utility bills, WiFi, groceries and living expenses',
    currency: 'INR',
    inviteCode: 'TRM-9821',
    createdBy: 'user-alex',
    createdAt: '2026-06-01',
    members: [
      { userId: 'user-alex', name: 'Alex Johnson', email: 'alex.johnson@example.com', role: 'ADMIN', budgetCap: 15000.00 },
      { userId: 'user-sarah', name: 'Sarah Chen', email: 'sarah.chen@example.com', role: 'MEMBER', budgetCap: 15000.00 },
      { userId: 'user-jordan', name: 'Jordan Lee', email: 'jordan.lee@example.com', role: 'MEMBER', budgetCap: 15000.00 }
    ],
    totalBudget: 45000.00,
    month: '2026-08'
  },
  {
    id: 'group-2',
    name: 'Goa Beach Trip',
    description: 'Summer getaway expenses, resort booking, group dinners and beach sports',
    currency: 'INR',
    inviteCode: 'GOA-7734',
    createdBy: 'user-sarah',
    createdAt: '2026-07-15',
    members: [
      { userId: 'user-sarah', name: 'Sarah Chen', email: 'sarah.chen@example.com', role: 'ADMIN', budgetCap: 25000.00 },
      { userId: 'user-alex', name: 'Alex Johnson', email: 'alex.johnson@example.com', role: 'MEMBER', budgetCap: 20000.00 },
      { userId: 'user-mike', name: 'Mike Ross', email: 'mike.ross@example.com', role: 'MEMBER', budgetCap: 20000.00 }
    ],
    totalBudget: 65000.00,
    month: '2026-08'
  },
  {
    id: 'group-3',
    name: 'Weekend Gaming Squad',
    description: 'Co-op game subscriptions, pizza orders, and tournament passes',
    currency: 'INR',
    inviteCode: 'GME-3312',
    createdBy: 'user-alex',
    createdAt: '2026-08-01',
    members: [
      { userId: 'user-alex', name: 'Alex Johnson', email: 'alex.johnson@example.com', role: 'ADMIN', budgetCap: 5000.00 },
      { userId: 'user-jordan', name: 'Jordan Lee', email: 'jordan.lee@example.com', role: 'MEMBER', budgetCap: 5000.00 }
    ],
    totalBudget: 10000.00,
    month: '2026-08'
  }
];

export const INITIAL_EXPENSES = [
  {
    id: 'exp-101',
    date: '2026-08-12',
    merchant: 'BigBasket Supermart',
    amount: 3600.00,
    currency: 'INR',
    categoryId: 'cat-2',
    categoryName: 'Groceries',
    categoryColor: '#6366f1',
    paymentMethod: 'UPI',
    source: 'SCAN',
    notes: 'Weekly fresh organic produce & shared apartment groceries',
    receiptId: 'rcpt-501',
    groupId: 'group-1',
    groupName: 'Tech Roommates',
    paidBy: 'user-sarah',
    paidByName: 'Sarah Chen',
    splitType: 'EQUAL',
    splits: [
      { userId: 'user-alex', name: 'Alex Johnson', shareAmount: 1200.00, isSettled: true },
      { userId: 'user-sarah', name: 'Sarah Chen', shareAmount: 1200.00, isSettled: true },
      { userId: 'user-jordan', name: 'Jordan Lee', shareAmount: 1200.00, isSettled: false }
    ]
  },
  {
    id: 'exp-102',
    date: '2026-08-12',
    merchant: 'Starbucks Coffee',
    amount: 450.00,
    currency: 'INR',
    categoryId: 'cat-1',
    categoryName: 'Food & Dining',
    categoryColor: '#10b981',
    paymentMethod: 'UPI',
    source: 'MANUAL',
    notes: 'Iced Oat Latte & Avocado Toast (Personal)',
    groupId: null
  },
  {
    id: 'exp-103',
    date: '2026-08-11',
    merchant: 'Uber Cabs',
    amount: 680.00,
    currency: 'INR',
    categoryId: 'cat-3',
    categoryName: 'Transportation',
    categoryColor: '#f59e0b',
    paymentMethod: 'UPI',
    source: 'MANUAL',
    notes: 'Commute to Tech Hub',
    groupId: null
  },
  {
    id: 'exp-104',
    date: '2026-08-11',
    merchant: 'Amazon India',
    amount: 4250.00,
    currency: 'INR',
    categoryId: 'cat-4',
    categoryName: 'Shopping',
    categoryColor: '#ec4899',
    paymentMethod: 'CARD',
    source: 'SCAN',
    notes: 'Ergonomic Desk Accessories & Cable Organizers',
    receiptId: 'rcpt-502',
    groupId: null
  },
  {
    id: 'exp-105',
    date: '2026-08-10',
    merchant: 'Tata Power Electricity',
    amount: 5400.00,
    currency: 'INR',
    categoryId: 'cat-5',
    categoryName: 'Bills & Utilities',
    categoryColor: '#06b6d4',
    paymentMethod: 'UPI',
    source: 'MANUAL',
    notes: 'High-power AC Electricity bill for July',
    groupId: 'group-1',
    groupName: 'Tech Roommates',
    paidBy: 'user-alex',
    paidByName: 'Alex Johnson',
    splitType: 'PERCENT',
    splits: [
      { userId: 'user-alex', name: 'Alex Johnson', shareAmount: 1800.00, sharePercent: 33.33, isSettled: true },
      { userId: 'user-sarah', name: 'Sarah Chen', shareAmount: 1800.00, sharePercent: 33.33, isSettled: false },
      { userId: 'user-jordan', name: 'Jordan Lee', shareAmount: 1800.00, sharePercent: 33.34, isSettled: false }
    ]
  },
  {
    id: 'exp-106',
    date: '2026-08-09',
    merchant: 'Netflix India',
    amount: 649.00,
    currency: 'INR',
    categoryId: 'cat-8',
    categoryName: 'Subscriptions',
    categoryColor: '#3b82f6',
    paymentMethod: 'CARD',
    source: 'MANUAL',
    notes: 'Premium 4K Monthly Plan',
    groupId: null
  },
  {
    id: 'exp-107',
    date: '2026-08-08',
    merchant: 'Barbeque Nation',
    amount: 2700.00,
    currency: 'INR',
    categoryId: 'cat-1',
    categoryName: 'Food & Dining',
    categoryColor: '#10b981',
    paymentMethod: 'UPI',
    source: 'SCAN',
    notes: 'Roommate dinner bowls',
    groupId: 'group-1',
    groupName: 'Tech Roommates',
    paidBy: 'user-jordan',
    paidByName: 'Jordan Lee',
    splitType: 'EQUAL',
    splits: [
      { userId: 'user-alex', name: 'Alex Johnson', shareAmount: 900.00, isSettled: false },
      { userId: 'user-sarah', name: 'Sarah Chen', shareAmount: 900.00, isSettled: true },
      { userId: 'user-jordan', name: 'Jordan Lee', shareAmount: 900.00, isSettled: true }
    ]
  },
  {
    id: 'exp-108',
    date: '2026-08-07',
    merchant: 'Taj Fort Aguada Goa',
    amount: 18000.00,
    currency: 'INR',
    categoryId: 'cat-6',
    categoryName: 'Entertainment',
    categoryColor: '#8b5cf6',
    paymentMethod: 'CARD',
    source: 'MANUAL',
    notes: 'Advance booking deposit for Goa Beach Villa',
    groupId: 'group-2',
    groupName: 'Goa Beach Trip',
    paidBy: 'user-sarah',
    paidByName: 'Sarah Chen',
    splitType: 'CUSTOM',
    splits: [
      { userId: 'user-sarah', name: 'Sarah Chen', shareAmount: 6000.00, isSettled: true },
      { userId: 'user-alex', name: 'Alex Johnson', shareAmount: 6000.00, isSettled: false },
      { userId: 'user-mike', name: 'Mike Ross', shareAmount: 6000.00, isSettled: false }
    ]
  }
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-101',
    type: 'GROUP_BUDGET_THRESHOLD_REACHED',
    title: 'Group Budget Alert (80%)',
    body: 'Tech Roommates has reached 82% (₹36,900 / ₹45,000) of its monthly budget.',
    time: '1 hour ago',
    isRead: false,
    groupId: 'group-1'
  },
  {
    id: 'notif-102',
    type: 'EXPENSE_SPLIT_ASSIGNED',
    title: 'New Split Expense Assigned',
    body: 'Sarah Chen added a ₹3,600.00 grocery expense in Tech Roommates. Your share is ₹1,200.00.',
    time: '3 hours ago',
    isRead: false,
    groupId: 'group-1'
  },
  {
    id: 'notif-103',
    type: 'BUDGET_THRESHOLD_REACHED',
    title: 'Personal Budget Warning (80%)',
    body: 'You have used 82% of your Groceries monthly budget (₹12,300 / ₹15,000).',
    time: 'Yesterday',
    isRead: false
  },
  {
    id: 'notif-104',
    type: 'RECEIPT_PROCESSED',
    title: 'Receipt OCR Processed',
    body: 'BigBasket Supermart receipt (₹3,600.00) successfully scanned & categorized.',
    time: '2 days ago',
    isRead: true
  }
];

export const SAMPLE_SCAN_TEMPLATES = [
  {
    merchant: 'Reliance Smart Superstore',
    amount: 1850.00,
    categoryName: 'Groceries',
    categoryId: 'cat-2',
    confidence: 0.98,
    date: new Date().toISOString().split('T')[0],
    items: ['Amul Organic Milk 2L - ₹130.00', 'Fortune Sunflower Oil 5L - ₹780.00', 'Basmati Rice 5kg - ₹640.00', 'Organic Oats 1kg - ₹300.00']
  },
  {
    merchant: 'Croma Electronics',
    amount: 3499.00,
    categoryName: 'Shopping',
    categoryId: 'cat-4',
    confidence: 0.95,
    date: new Date().toISOString().split('T')[0],
    items: ['Wireless Fast Powerbank 10000mAh - ₹2499.00', 'Type-C Braided Cable 2m - ₹1000.00']
  },
  {
    merchant: 'Indian Oil Fuel Station',
    amount: 1500.00,
    categoryName: 'Transportation',
    categoryId: 'cat-3',
    confidence: 0.92,
    date: new Date().toISOString().split('T')[0],
    items: ['XP95 Petrol 14.5 Litres - ₹1500.00']
  }
];
