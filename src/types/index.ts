export type Category = 'Food' | 'Groceries' | 'Travel' | 'Utilities' | 'Entertainment' | 'Other';

export interface Member {
  id: string;
  name: string;
  avatarColor: string;
  upiId?: string;
}

export interface ParsedItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number; // in Rupees
  lineTotal: number;  // in Rupees
  confidence?: number; // 0 to 100
  assignedMemberIds: string[]; // members splitting this item
  category: Category;
}

export type SplitMode = 'equal' | 'exact' | 'percentage' | 'shares';

export interface SplitDetail {
  memberId: string;
  amount: number;      // in Rupees (up to 2 decimals)
  exactValue?: number; // entered by user for exact/percentage/shares
}

export interface Expense {
  id: string;
  groupId: string;
  title: string;
  date: string;
  payerId: string;
  totalAmount: number; // in Rupees
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  discount: number;
  category: Category;
  items?: ParsedItem[];
  splitMode: SplitMode;
  shares: Record<string, number>; // memberId -> exact share in Rupees
  receiptImage?: string; // base64 or URL
  createdAt: number;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number; // in Rupees
  settledAt: number;
  note?: string;
}

export interface RecurringExpense {
  id: string;
  groupId: string;
  title: string;
  amount: number;
  payerId: string;
  participantIds: string[];
  category: Category;
  frequency: 'monthly' | 'weekly';
  dayOfMonth?: number;
  lastAdded?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: Member[];
  createdAt: number;
}

export interface SimplifiedTransaction {
  from: string; // memberId
  to: string;   // memberId
  amount: number; // in Rupees
}

export interface MemberBalance {
  memberId: string;
  netBalance: number; // + owes, - owed
  totalPaid: number;
  totalOwed: number;
}
