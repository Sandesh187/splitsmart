import { Expense, Member, Settlement, SimplifiedTransaction, MemberBalance } from '../types';
import { toPaise, toRupees } from './calculator';

/**
 * SplitSmart Debt Simplification Engine
 * 
 * ALGORITHM: Greedy Minimum Cash Flow Algorithm
 * 
 * 1. Calculate Net Balance for each member:
 *    Net(i) = TotalPaid(i) - TotalOwed(i) + ReceivedSettlements(i) - PaidSettlements(i)
 *    - If Net(i) > 0: Member is a Creditor (they are owed money)
 *    - If Net(i) < 0: Member is a Debtor (they owe money)
 *    - If Net(i) == 0: Member is balanced
 * 
 * 2. Invariant Check: Sum of all Net balances MUST equal 0.
 * 
 * 3. Settle iteratively:
 *    - Find the person who owes the most (max debtor).
 *    - Find the person who is owed the most (max creditor).
 *    - Settle the minimum of the two amounts: amount = min(|maxDebtor|, maxCreditor).
 *    - Record transaction: maxDebtor -> pays amount -> maxCreditor.
 *    - Update both balances and repeat until all balances are within 0 paise.
 * 
 * This reduces N*(N-1) potential pairwise debts down to at most (N - 1) transactions!
 */

export function calculateMemberBalances(
  members: Member[],
  expenses: Expense[],
  settlements: Settlement[] = []
): Record<string, MemberBalance> {
  const balances: Record<string, { paidPaise: number; owedPaise: number; settledDeltaPaise: number }> = {};

  members.forEach(m => {
    balances[m.id] = { paidPaise: 0, owedPaise: 0, settledDeltaPaise: 0 };
  });

  // 1. Process all expenses
  for (const exp of expenses) {
    const payerId = exp.payerId;
    const totalPaise = toPaise(exp.totalAmount);

    if (balances[payerId]) {
      balances[payerId].paidPaise += totalPaise;
    }

    // Process participant shares
    if (exp.shares) {
      Object.entries(exp.shares).forEach(([memberId, shareAmount]) => {
        if (balances[memberId]) {
          balances[memberId].owedPaise += toPaise(shareAmount);
        }
      });
    }
  }

  // 2. Process all settlement transactions
  for (const st of settlements) {
    const fromId = st.fromMemberId;
    const toId = st.toMemberId;
    const amountPaise = toPaise(st.amount);

    // From pays money, so their owed debt decreases (net balance increases)
    if (balances[fromId]) {
      balances[fromId].settledDeltaPaise += amountPaise;
    }
    // To receives money, so their positive credit decreases (net balance decreases)
    if (balances[toId]) {
      balances[toId].settledDeltaPaise -= amountPaise;
    }
  }

  // Format into MemberBalance record
  const result: Record<string, MemberBalance> = {};
  members.forEach(m => {
    const b = balances[m.id] || { paidPaise: 0, owedPaise: 0, settledDeltaPaise: 0 };
    const netPaise = b.paidPaise - b.owedPaise + b.settledDeltaPaise;

    result[m.id] = {
      memberId: m.id,
      netBalance: toRupees(netPaise),
      totalPaid: toRupees(b.paidPaise),
      totalOwed: toRupees(b.owedPaise),
    };
  });

  return result;
}

export function simplifyDebts(
  members: Member[],
  expenses: Expense[],
  settlements: Settlement[] = []
): SimplifiedTransaction[] {
  const memberBalances = calculateMemberBalances(members, expenses, settlements);

  // Separate debtors and creditors in integer paise
  const debtors: { memberId: string; amountPaise: number }[] = [];
  const creditors: { memberId: string; amountPaise: number }[] = [];

  Object.values(memberBalances).forEach(mb => {
    const paise = toPaise(mb.netBalance);
    if (paise < 0) {
      debtors.push({ memberId: mb.memberId, amountPaise: Math.abs(paise) });
    } else if (paise > 0) {
      creditors.push({ memberId: mb.memberId, amountPaise: paise });
    }
  });

  const transactions: SimplifiedTransaction[] = [];

  // Greedy settlement loop
  while (debtors.length > 0 && creditors.length > 0) {
    // Sort debtors and creditors descending by remaining amount
    debtors.sort((a, b) => b.amountPaise - a.amountPaise);
    creditors.sort((a, b) => b.amountPaise - a.amountPaise);

    const maxDebtor = debtors[0];
    const maxCreditor = creditors[0];

    const settledPaise = Math.min(maxDebtor.amountPaise, maxCreditor.amountPaise);

    if (settledPaise > 0) {
      transactions.push({
        from: maxDebtor.memberId,
        to: maxCreditor.memberId,
        amount: toRupees(settledPaise),
      });
    }

    maxDebtor.amountPaise -= settledPaise;
    maxCreditor.amountPaise -= settledPaise;

    if (maxDebtor.amountPaise === 0) {
      debtors.shift();
    }
    if (maxCreditor.amountPaise === 0) {
      creditors.shift();
    }
  }

  return transactions;
}
