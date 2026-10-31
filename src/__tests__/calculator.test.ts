import { describe, it, expect } from 'vitest';
import {
  calculateItemizedSplit,
  calculateFlexibleSplit,
  toPaise,
  toRupees,
} from '../utils/calculator';
import { ParsedItem } from '../types';

describe('Calculator Engine & Rounding Reconciliation', () => {
  it('converts between rupees and paise accurately', () => {
    expect(toPaise(100)).toBe(10000);
    expect(toPaise(33.33)).toBe(3333);
    expect(toRupees(3333)).toBe(33.33);
    expect(toRupees(3334)).toBe(33.34);
  });

  // Section 10 - Robustness Test Case 6: ₹100 split 3 ways
  it('reconciles ₹100 split 3 ways exactly to ₹33.34, ₹33.33, ₹33.33 with 0 paisa drift', () => {
    const participants = ['m1', 'm2', 'm3'];
    const result = calculateFlexibleSplit(100, participants, 'equal', {});

    expect(result.isValid).toBe(true);
    const shares = Object.values(result.shares);

    expect(shares).toEqual([33.34, 33.33, 33.33]);
    const totalSum = Number(shares.reduce((a, b) => a + b, 0).toFixed(2));
    expect(totalSum).toBe(100.00);
  });

  // Section 5 - Requirement 10: Proportional tax distribution
  it('distributes tax, service charge, and discounts proportionally to member item subtotals', () => {
    // Example from problem statement:
    // ₹1,000 bill with ₹100 tax: a member whose items cost ₹600 pays ₹60 of the tax.
    const items: ParsedItem[] = [
      {
        id: 'i1',
        name: 'Item A',
        quantity: 1,
        unitPrice: 600,
        lineTotal: 600,
        assignedMemberIds: ['member-A'],
        category: 'Food',
      },
      {
        id: 'i2',
        name: 'Item B',
        quantity: 1,
        unitPrice: 400,
        lineTotal: 400,
        assignedMemberIds: ['member-B'],
        category: 'Food',
      },
    ];

    const result = calculateItemizedSplit(items, 100, 0, 0, 1100);

    expect(result.memberItemSubtotals['member-A']).toBe(600);
    expect(result.memberItemSubtotals['member-B']).toBe(400);

    // Tax distribution check:
    expect(result.memberTaxShares['member-A']).toBe(60.00);
    expect(result.memberTaxShares['member-B']).toBe(40.00);

    // Final total check:
    expect(result.memberTotalShares['member-A']).toBe(660.00);
    expect(result.memberTotalShares['member-B']).toBe(440.00);
    expect(result.totalComputed).toBe(1100.00);
  });

  it('validates flexible split percentage mode: must sum to 100%', () => {
    const participants = ['m1', 'm2'];
    const invalidRes = calculateFlexibleSplit(500, participants, 'percentage', { m1: 60, m2: 30 });
    expect(invalidRes.isValid).toBe(false);

    const validRes = calculateFlexibleSplit(500, participants, 'percentage', { m1: 70, m2: 30 });
    expect(validRes.isValid).toBe(true);
    expect(validRes.shares['m1']).toBe(350);
    expect(validRes.shares['m2']).toBe(150);
  });

  it('validates flexible split exact mode: must equal bill total', () => {
    const participants = ['m1', 'm2'];
    const invalidRes = calculateFlexibleSplit(200, participants, 'exact', { m1: 100, m2: 90 });
    expect(invalidRes.isValid).toBe(false);

    const validRes = calculateFlexibleSplit(200, participants, 'exact', { m1: 120, m2: 80 });
    expect(validRes.isValid).toBe(true);
    expect(validRes.shares['m1']).toBe(120);
    expect(validRes.shares['m2']).toBe(80);
  });

  it('splits shared items equally among assignees and flags unassigned items', () => {
    const items: ParsedItem[] = [
      {
        id: 'i1',
        name: 'Shared Pizza',
        quantity: 1,
        unitPrice: 300,
        lineTotal: 300,
        assignedMemberIds: ['m1', 'm2', 'm3'],
        category: 'Food',
      },
      {
        id: 'i2',
        name: 'Unassigned Soda',
        quantity: 1,
        unitPrice: 50,
        lineTotal: 50,
        assignedMemberIds: [],
        category: 'Food',
      },
    ];

    const result = calculateItemizedSplit(items, 0, 0, 0);
    expect(result.unassignedItems.length).toBe(1);
    expect(result.unassignedItems[0].name).toBe('Unassigned Soda');
    expect(result.memberTotalShares['m1']).toBe(100);
    expect(result.memberTotalShares['m2']).toBe(100);
    expect(result.memberTotalShares['m3']).toBe(100);
  });
});
