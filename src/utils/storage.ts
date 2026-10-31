import { Group, Expense, Settlement, RecurringExpense } from '../types';

const STORAGE_KEYS = {
  GROUPS: 'splitsmart_groups',
  ACTIVE_GROUP_ID: 'splitsmart_active_group_id',
  EXPENSES: 'splitsmart_expenses',
  SETTLEMENTS: 'splitsmart_settlements',
  RECURRING: 'splitsmart_recurring',
};

// Initial demo group matching Section 7 scenario: "Night Canteen Gang" with Riya, Arjun, Meera, Kabir
export const DEFAULT_GROUPS: Group[] = [
  {
    id: 'group-night-canteen',
    name: 'Night Canteen Gang',
    description: 'Late night hostel food orders & snack runs',
    createdAt: Date.now() - 86400000 * 3,
    members: [
      { id: 'm-riya', name: 'Riya', avatarColor: '#ec4899', upiId: 'riya@oksbi' },
      { id: 'm-arjun', name: 'Arjun', avatarColor: '#3b82f6', upiId: 'arjun@okaxis' },
      { id: 'm-meera', name: 'Meera', avatarColor: '#8b5cf6', upiId: 'meera@icici' },
      { id: 'm-kabir', name: 'Kabir', avatarColor: '#f97316', upiId: 'kabir@paytm' },
    ],
  },
  {
    id: 'group-wing-b',
    name: 'Wing B Goa Trip',
    description: 'Shared expenses for the beach getaway',
    createdAt: Date.now() - 86400000 * 7,
    members: [
      { id: 'm-riya', name: 'Riya', avatarColor: '#ec4899', upiId: 'riya@oksbi' },
      { id: 'm-arjun', name: 'Arjun', avatarColor: '#3b82f6', upiId: 'arjun@okaxis' },
      { id: 'm-rohan', name: 'Rohan', avatarColor: '#10b981', upiId: 'rohan@ybl' },
    ],
  }
];

export const DEFAULT_EXPENSES: Expense[] = [
  {
    id: 'exp-demo-1',
    groupId: 'group-night-canteen',
    title: 'Late Night Canteen Feast',
    date: new Date().toISOString().split('T')[0],
    payerId: 'm-riya',
    subtotal: 800,
    taxAmount: 40,
    serviceCharge: 0,
    discount: 0,
    totalAmount: 840,
    category: 'Food',
    splitMode: 'equal',
    items: [
      { id: 'i-1', name: 'Large Cheese Pizza', quantity: 1, unitPrice: 480, lineTotal: 480, assignedMemberIds: ['m-riya', 'm-arjun', 'm-meera', 'm-kabir'], category: 'Food' },
      { id: 'i-2', name: 'Peri Peri Maggi', quantity: 2, unitPrice: 70, lineTotal: 140, assignedMemberIds: ['m-arjun', 'm-kabir'], category: 'Food' },
      { id: 'i-3', name: 'Cold Coffee with Ice Cream', quantity: 2, unitPrice: 90, lineTotal: 180, assignedMemberIds: ['m-riya', 'm-meera'], category: 'Food' },
    ],
    shares: {
      'm-riya': 220.50,
      'm-arjun': 199.50,
      'm-meera': 220.50,
      'm-kabir': 199.50,
    },
    createdAt: Date.now() - 3600000 * 4,
  }
];

export const DEFAULT_RECURRING: RecurringExpense[] = [
  {
    id: 'rec-1',
    groupId: 'group-night-canteen',
    title: 'Hostel Wi-Fi 300 Mbps Recharge',
    amount: 1199,
    payerId: 'm-arjun',
    participantIds: ['m-riya', 'm-arjun', 'm-meera', 'm-kabir'],
    category: 'Utilities',
    frequency: 'monthly',
    dayOfMonth: 1,
    lastAdded: '2026-10-01',
  }
];

export function loadGroups(): Group[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GROUPS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load groups from storage:', e);
  }
  saveGroups(DEFAULT_GROUPS);
  return DEFAULT_GROUPS;
}

export function saveGroups(groups: Group[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  } catch (e) {
    console.error('Failed to save groups to storage:', e);
  }
}

export function loadActiveGroupId(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_GROUP_ID);
    if (raw) return raw;
  } catch (e) {
    console.error('Failed to load active group id:', e);
  }
  return DEFAULT_GROUPS[0].id;
}

export function saveActiveGroupId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_GROUP_ID, id);
  } catch (e) {
    console.error('Failed to save active group id:', e);
  }
}

export function loadExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load expenses from storage:', e);
  }
  saveExpenses(DEFAULT_EXPENSES);
  return DEFAULT_EXPENSES;
}

export function saveExpenses(expenses: Expense[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  } catch (e) {
    console.error('Failed to save expenses to storage:', e);
  }
}

export function loadSettlements(): Settlement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTLEMENTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load settlements from storage:', e);
  }
  return [];
}

export function saveSettlements(settlements: Settlement[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTLEMENTS, JSON.stringify(settlements));
  } catch (e) {
    console.error('Failed to save settlements to storage:', e);
  }
}

export function loadRecurring(): RecurringExpense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECURRING);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load recurring expenses from storage:', e);
  }
  saveRecurring(DEFAULT_RECURRING);
  return DEFAULT_RECURRING;
}

export function saveRecurring(recurring: RecurringExpense[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(recurring));
  } catch (e) {
    console.error('Failed to save recurring to storage:', e);
  }
}
