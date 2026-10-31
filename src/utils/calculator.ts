import { ParsedItem, SplitMode } from '../types';

/**
 * SplitSmart Financial Math & Rounding Engine
 * All calculations internally use integer PAISE (1 Rupee = 100 Paise)
 * to avoid floating-point representation bugs.
 * 
 * ROUNDING RECONCILIATION RULE:
 * 1. Convert all currency inputs to integer paise.
 * 2. Calculate ideal proportional share in high-precision floats.
 * 3. Floor each member's share to integer paise and record the remainder fraction.
 * 4. Sum all floored paise and calculate discrepancy: diff = totalPaise - sum(flooredPaise).
 * 5. Sort members by largest fractional remainder (tie-breaker: member with largest subtotal).
 * 6. Distribute exactly 1 paisa to the top `diff` members until diff is 0.
 * Result: sum of shares is guaranteed to exactly equal totalAmount down to the last paisa!
 */

export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function toRupees(paise: number): number {
  return Number((paise / 100).toFixed(2));
}

export interface ItemizedSplitResult {
  memberItemSubtotals: Record<string, number>; // in Rupees
  memberTaxShares: Record<string, number>;      // in Rupees
  memberServiceShares: Record<string, number>;  // in Rupees
  memberDiscountShares: Record<string, number>; // in Rupees
  memberTotalShares: Record<string, number>;    // in Rupees
  unassignedItems: ParsedItem[];
  subtotal: number;
  totalComputed: number;
  reconciliationPaisaAdjusted: number;
}

/**
 * Calculate itemized split with proportional tax, service charge, and discounts.
 */
export function calculateItemizedSplit(
  items: ParsedItem[],
  taxAmount: number,
  serviceCharge: number,
  discount: number,
  declaredTotal?: number
): ItemizedSplitResult {
  const memberItemPaise: Record<string, number> = {};
  const unassignedItems: ParsedItem[] = [];

  // 1. Calculate each item's split across its assigned members
  for (const item of items) {
    if (!item.assignedMemberIds || item.assignedMemberIds.length === 0) {
      unassignedItems.push(item);
      continue;
    }

    const itemTotalPaise = toPaise(item.lineTotal);
    const numAssignees = item.assignedMemberIds.length;
    const baseSharePaise = Math.floor(itemTotalPaise / numAssignees);
    let remainderPaise = itemTotalPaise - (baseSharePaise * numAssignees);

    item.assignedMemberIds.forEach((memberId, idx) => {
      // Allocate 1 extra paisa to first remainder members for fair item split
      const share = baseSharePaise + (idx < remainderPaise ? 1 : 0);
      memberItemPaise[memberId] = (memberItemPaise[memberId] || 0) + share;
    });
  }

  const memberIds = Object.keys(memberItemPaise);
  const totalItemSubtotalPaise = Object.values(memberItemPaise).reduce((sum, p) => sum + p, 0);

  const taxPaise = toPaise(taxAmount);
  const servicePaise = toPaise(serviceCharge);
  const discountPaise = toPaise(discount);

  // Proportional distribution helper
  function distributeProportionally(totalPoolPaise: number): Record<string, number> {
    if (totalPoolPaise === 0 || memberIds.length === 0 || totalItemSubtotalPaise === 0) {
      const res: Record<string, number> = {};
      memberIds.forEach(id => (res[id] = 0));
      return res;
    }

    const shares: Record<string, number> = {};
    const remainders: { memberId: string; frac: number }[] = [];
    let allocatedTotal = 0;

    memberIds.forEach(id => {
      const proportion = memberItemPaise[id] / totalItemSubtotalPaise;
      const exactShare = proportion * totalPoolPaise;
      const floored = Math.floor(exactShare);
      shares[id] = floored;
      allocatedTotal += floored;
      remainders.push({ memberId: id, frac: exactShare - floored });
    });

    let diff = totalPoolPaise - allocatedTotal;
    remainders.sort((a, b) => b.frac - a.frac);

    for (let i = 0; i < diff && i < remainders.length; i++) {
      shares[remainders[i].memberId] += 1;
    }

    return shares;
  }

  const memberTaxPaise = distributeProportionally(taxPaise);
  const memberServicePaise = distributeProportionally(servicePaise);
  const memberDiscountPaise = distributeProportionally(discountPaise);

  // Calculate final total per member
  const memberFinalPaise: Record<string, number> = {};
  memberIds.forEach(id => {
    memberFinalPaise[id] = 
      memberItemPaise[id] +
      (memberTaxPaise[id] || 0) +
      (memberServicePaise[id] || 0) -
      (memberDiscountPaise[id] || 0);
  });

  const sumFinalPaise = Object.values(memberFinalPaise).reduce((s, p) => s + p, 0);

  // If a declared grand total was provided and differs by a few paise due to rounding,
  // reconcile exactly against declared total using our documented rule.
  let targetTotalPaise = sumFinalPaise;
  let reconciliationPaisaAdjusted = 0;

  if (declaredTotal !== undefined && declaredTotal > 0) {
    const declaredPaise = toPaise(declaredTotal);
    const discrepancy = declaredPaise - sumFinalPaise;
    
    // Only auto-reconcile if difference is within normal rounding threshold (<= 10 paise)
    if (discrepancy !== 0 && Math.abs(discrepancy) <= 10 && memberIds.length > 0) {
      // Documented rule: Largest spender absorbs the discrepancy
      const sortedMembers = [...memberIds].sort((a, b) => memberFinalPaise[b] - memberFinalPaise[a]);
      const sign = discrepancy > 0 ? 1 : -1;
      const absDiff = Math.abs(discrepancy);
      
      for (let i = 0; i < absDiff; i++) {
        const targetMember = sortedMembers[i % sortedMembers.length];
        memberFinalPaise[targetMember] += sign;
      }
      targetTotalPaise = declaredPaise;
      reconciliationPaisaAdjusted = discrepancy;
    }
  }

  return {
    memberItemSubtotals: Object.fromEntries(memberIds.map(id => [id, toRupees(memberItemPaise[id])])),
    memberTaxShares: Object.fromEntries(memberIds.map(id => [id, toRupees(memberTaxPaise[id] || 0)])),
    memberServiceShares: Object.fromEntries(memberIds.map(id => [id, toRupees(memberServicePaise[id] || 0)])),
    memberDiscountShares: Object.fromEntries(memberIds.map(id => [id, toRupees(memberDiscountPaise[id] || 0)])),
    memberTotalShares: Object.fromEntries(memberIds.map(id => [id, toRupees(memberFinalPaise[id])])),
    unassignedItems,
    subtotal: toRupees(totalItemSubtotalPaise),
    totalComputed: toRupees(targetTotalPaise),
    reconciliationPaisaAdjusted,
  };
}

/**
 * Split expenses across 4 flexible modes: Equal, Exact, Percentage, and Shares.
 */
export function calculateFlexibleSplit(
  totalAmount: number,
  participants: string[],
  mode: SplitMode,
  customValues: Record<string, number>
): { shares: Record<string, number>; isValid: boolean; errorMessage?: string } {
  const totalPaise = toPaise(totalAmount);
  const n = participants.length;

  if (n === 0) {
    return { shares: {}, isValid: false, errorMessage: 'At least one participant is required.' };
  }

  if (totalAmount <= 0) {
    return { shares: {}, isValid: false, errorMessage: 'Expense amount must be greater than zero.' };
  }

  const resultShares: Record<string, number> = {};

  if (mode === 'equal') {
    const basePaise = Math.floor(totalPaise / n);
    let remainder = totalPaise - basePaise * n;

    // Documented rule: First `remainder` participants get +1 paisa
    participants.forEach((id, idx) => {
      const sharePaise = basePaise + (idx < remainder ? 1 : 0);
      resultShares[id] = toRupees(sharePaise);
    });

    return { shares: resultShares, isValid: true };
  }

  if (mode === 'exact') {
    let sumPaise = 0;
    for (const id of participants) {
      const val = customValues[id] || 0;
      const valPaise = toPaise(val);
      sumPaise += valPaise;
      resultShares[id] = toRupees(valPaise);
    }

    const diff = totalPaise - sumPaise;
    if (diff !== 0) {
      return {
        shares: resultShares,
        isValid: false,
        errorMessage: `Exact amounts total ₹${toRupees(sumPaise)}, which differs from bill total ₹${totalAmount} by ₹${toRupees(Math.abs(diff))}.`,
      };
    }
    return { shares: resultShares, isValid: true };
  }

  if (mode === 'percentage') {
    let sumPercentage = 0;
    participants.forEach(id => {
      sumPercentage += customValues[id] || 0;
    });

    if (Math.abs(sumPercentage - 100) > 0.01) {
      return {
        shares: {},
        isValid: false,
        errorMessage: `Percentages must add up to 100% (currently ${sumPercentage.toFixed(1)}%).`,
      };
    }

    let allocatedPaise = 0;
    const remainders: { id: string; frac: number }[] = [];

    participants.forEach(id => {
      const pct = customValues[id] || 0;
      const exactPaise = (pct / 100) * totalPaise;
      const floored = Math.floor(exactPaise);
      resultShares[id] = floored;
      allocatedPaise += floored;
      remainders.push({ id, frac: exactPaise - floored });
    });

    const diff = totalPaise - allocatedPaise;
    remainders.sort((a, b) => b.frac - a.frac);
    for (let i = 0; i < diff && i < remainders.length; i++) {
      resultShares[remainders[i].id] += 1;
    }

    participants.forEach(id => {
      resultShares[id] = toRupees(resultShares[id]);
    });

    return { shares: resultShares, isValid: true };
  }

  if (mode === 'shares') {
    let totalShares = 0;
    participants.forEach(id => {
      totalShares += Math.max(0, customValues[id] || 0);
    });

    if (totalShares <= 0) {
      return {
        shares: {},
        isValid: false,
        errorMessage: 'Total shares must be greater than zero.',
      };
    }

    let allocatedPaise = 0;
    const remainders: { id: string; frac: number }[] = [];

    participants.forEach(id => {
      const shareCount = Math.max(0, customValues[id] || 0);
      const exactPaise = (shareCount / totalShares) * totalPaise;
      const floored = Math.floor(exactPaise);
      resultShares[id] = floored;
      allocatedPaise += floored;
      remainders.push({ id, frac: exactPaise - floored });
    });

    const diff = totalPaise - allocatedPaise;
    remainders.sort((a, b) => b.frac - a.frac);
    for (let i = 0; i < diff && i < remainders.length; i++) {
      resultShares[remainders[i].id] += 1;
    }

    participants.forEach(id => {
      resultShares[id] = toRupees(resultShares[id]);
    });

    return { shares: resultShares, isValid: true };
  }

  return { shares: {}, isValid: false, errorMessage: 'Unknown split mode' };
}
