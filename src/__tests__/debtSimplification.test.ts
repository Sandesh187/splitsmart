import { describe, it, expect } from 'vitest';
import { simplifyDebts, calculateMemberBalances } from '../utils/debtSimplification';
import { Member, Expense, Settlement } from '../types';

describe('Debt Simplification & Greedy Cash Flow Algorithm', () => {
  const members: Member[] = [
    { id: 'm-A', name: 'Alice', avatarColor: '#ec4899' },
    { id: 'm-B', name: 'Bob', avatarColor: '#3b82f6' },
    { id: 'm-C', name: 'Charlie', avatarColor: '#10b981' },
  ];

  it('simplifies transitive debt: A owes B ₹200 and B owes C ₹200 -> A pays C ₹200 directly', () => {
    // Problem Statement Section 5 - Requirement 12 Example:
    // If A owes B ₹200 and B owes C ₹200, app suggests A pays C ₹200 directly.
    const expenses: Expense[] = [
      {
        id: 'e1',
        groupId: 'g1',
        title: 'B paid for A',
        date: '2026-10-31',
        payerId: 'm-B',
        subtotal: 200,
        taxAmount: 0,
        serviceCharge: 0,
        discount: 0,
        totalAmount: 200,
        category: 'Food',
        splitMode: 'exact',
        shares: { 'm-A': 200 },
        createdAt: 1,
      },
      {
        id: 'e2',
        groupId: 'g1',
        title: 'C paid for B',
        date: '2026-10-31',
        payerId: 'm-C',
        subtotal: 200,
        taxAmount: 0,
        serviceCharge: 0,
        discount: 0,
        totalAmount: 200,
        category: 'Food',
        splitMode: 'exact',
        shares: { 'm-B': 200 },
        createdAt: 2,
      },
    ];

    const balances = calculateMemberBalances(members, expenses);
    expect(balances['m-A'].netBalance).toBe(-200); // A owes 200
    expect(balances['m-B'].netBalance).toBe(0);    // B is balanced
    expect(balances['m-C'].netBalance).toBe(200);  // C is owed 200

    const simplified = simplifyDebts(members, expenses);
    expect(simplified.length).toBe(1);
    expect(simplified[0]).toEqual({
      from: 'm-A',
      to: 'm-C',
      amount: 200,
    });
  });

  // Section 10 - Robustness Test Case 9: Five members, ten expenses with mixed payers
  it('simplifies 5 members with 10 mixed expenses into the minimum number of transactions', () => {
    const testMembers: Member[] = [
      { id: '1', name: 'Aarav', avatarColor: '#3b82f6' },
      { id: '2', name: 'Bhavya', avatarColor: '#ec4899' },
      { id: '3', name: 'Chirag', avatarColor: '#10b981' },
      { id: '4', name: 'Divya', avatarColor: '#8b5cf6' },
      { id: '5', name: 'Eshaan', avatarColor: '#f97316' },
    ];

    const testExpenses: Expense[] = [
      { id: 'e1', groupId: 'g', title: 'Exp 1', date: '2026-10-01', payerId: '1', subtotal: 1000, taxAmount: 0, serviceCharge: 0, discount: 0, totalAmount: 1000, category: 'Food', splitMode: 'equal', shares: { '1': 200, '2': 200, '3': 200, '4': 200, '5': 200 }, createdAt: 1 },
      { id: 'e2', groupId: 'g', title: 'Exp 2', date: '2026-10-02', payerId: '2', subtotal: 500, taxAmount: 0, serviceCharge: 0, discount: 0, totalAmount: 500, category: 'Travel', splitMode: 'equal', shares: { '1': 100, '2': 100, '3': 100, '4': 100, '5': 100 }, createdAt: 2 },
      { id: 'e3', groupId: 'g', title: 'Exp 3', date: '2026-10-03', payerId: '3', subtotal: 750, taxAmount: 0, serviceCharge: 0, discount: 0, totalAmount: 750, category: 'Groceries', splitMode: 'equal', shares: { '1': 150, '2': 150, '3': 150, '4': 150, '5': 150 }, createdAt: 3 },
      { id: 'e4', groupId: 'g', title: 'Exp 4', date: '2026-10-04', payerId: '4', subtotal: 1200, taxAmount: 0, serviceCharge: 0, discount: 0, totalAmount: 1200, category: 'Utilities', splitMode: 'equal', shares: { '1': 240, '2': 240, '3': 240, '4': 240, '5': 240 }, createdAt: 4 },
      { id: 'e5', groupId: 'g', title: 'Exp 5', date: '2026-10-05', payerId: '5', subtotal: 600, taxAmount: 0, serviceCharge: 0, discount: 0, totalAmount: 600, category: 'Entertainment', splitMode: 'equal', shares: { '1': 120, '2': 120, '3': 120, '4': 120, '5': 120 }, createdAt: 5 },
      { id: 'e6', groupId: 'g', title: 'Exp 6', date: '2026-10-06', payerId: '1', subtotal: 300, taxAmount: 0, serviceCharge: 0, discount: 0, totalAmount: 300, category: 'Food', splitMode: 'equal', shares: { '1': 60, '2': 60, '3': 60, '4': 60, '5': 60 }, createdAt: 6 },
      { id: 'e7', groupId: 'g', title: 'Exp 7', date: '2026-10-07', payerId: '2', subtotal: 900, taxAmount: 0, serviceCharge: 0, discount: 0, totalAmount: 900, category: 'Entertainment', splitMode: 'equal', shares: { '1': 180, '2': 180, '3': 180, '4': 180, '5': 180 }, createdAt: 7 },
      { id: 'e8', groupId: 'g', title: 'Exp 8', date: '2026-10-08', payerId: '3', subtotal: 450, taxAmount: 0, serviceCharge: 0, discount: 0, totalAmount: 450, category: 'Utilities', splitMode: 'equal', shares: { '1': 90, '2': 90, '3': 90, '4': 90, '5': 90 }, createdAt: 8 },
      { id: 'e9', groupId: 'g', title: 'Exp 9', date: '2026-10-09', payerId: '4', subtotal: 200, taxAmount: 0, serviceCharge: 0, discount: 0, totalAmount: 200, category: 'Food', splitMode: 'equal', shares: { '1': 40, '2': 40, '3': 40, '4': 40, '5': 40 }, createdAt: 9 },
      { id: 'e10', groupId: 'g', title: 'Exp 10', date: '2026-10-10', payerId: '5', subtotal: 800, taxAmount: 0, serviceCharge: 0, discount: 0, totalAmount: 800, category: 'Food', splitMode: 'equal', shares: { '1': 160, '2': 160, '3': 160, '4': 160, '5': 160 }, createdAt: 10 },
    ];

    const balances = calculateMemberBalances(testMembers, testExpenses);
    
    // Invariant: sum of all net balances must equal 0
    const sumNetBalances = Object.values(balances).reduce((s, b) => s + b.netBalance, 0);
    expect(Math.abs(sumNetBalances)).toBeLessThan(0.01);

    const simplified = simplifyDebts(testMembers, testExpenses);

    // With 5 members, maximum possible transactions in any simplified settlement is N - 1 = 4
    expect(simplified.length).toBeLessThanOrEqual(4);

    // Sum of amounts paid in transactions must equal sum of debtor balances
    const totalDebtorAmount = Object.values(balances)
      .filter(b => b.netBalance < 0)
      .reduce((s, b) => s + Math.abs(b.netBalance), 0);
    
    const totalSettledInTransactions = simplified.reduce((s, t) => s + t.amount, 0);
    expect(Number(totalSettledInTransactions.toFixed(2))).toBe(Number(totalDebtorAmount.toFixed(2)));
  });
});
