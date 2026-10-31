import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { calculateMemberBalances, simplifyDebts } from '../utils/debtSimplification';
import { SimplifiedTransaction } from '../types';
import { UpiModal } from './UpiModal';
import {
  ArrowRight,
  CheckCircle2,
  QrCode,
  DollarSign,
  Scale,
  Sparkles,
  History,
  RotateCcw
} from 'lucide-react';

export const BalancesTab: React.FC = () => {
  const { activeGroup, expenses, settlements, addSettlement } = useApp();

  const [activeUpiPayment, setActiveUpiPayment] = useState<{
    fromName: string;
    toName: string;
    fromId: string;
    toId: string;
    amount: number;
    payeeUpiId?: string;
  } | null>(null);

  if (!activeGroup) {
    return (
      <div className="text-center py-12 text-slate-500">
        Please select or create a group to view balances.
      </div>
    );
  }

  const memberBalances = calculateMemberBalances(activeGroup.members, expenses, settlements);
  const simplifiedDebts = simplifyDebts(activeGroup.members, expenses, settlements);
  const memberMap = Object.fromEntries(activeGroup.members.map(m => [m.id, m]));

  const handleSettleTransaction = (st: SimplifiedTransaction) => {
    const fromMember = memberMap[st.from];
    const toMember = memberMap[st.to];

    addSettlement(
      st.from,
      st.to,
      st.amount,
      `Settled: ${fromMember?.name} paid ${toMember?.name}`
    );
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* 1. Member Net Balances Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-brand-50 text-brand-600 rounded-lg">
              <Scale className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-800">Group Net Balances</h3>
              <p className="text-xs text-slate-500">Updated automatically after every expense and payment</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
            {activeGroup.members.length} members
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {activeGroup.members.map(member => {
            const b = memberBalances[member.id] || { netBalance: 0, totalPaid: 0, totalOwed: 0 };
            const isOwed = b.netBalance > 0.01;
            const owes = b.netBalance < -0.01;
            const isSettled = !isOwed && !owes;

            return (
              <div
                key={member.id}
                className={`p-4 rounded-xl border transition ${
                  isOwed
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : owes
                    ? 'bg-rose-50/50 border-rose-200'
                    : 'bg-slate-50/50 border-slate-200'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs"
                    style={{ backgroundColor: member.avatarColor }}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-sm text-slate-800 truncate">{member.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{member.upiId || 'No UPI ID'}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60">
                  <div className="text-[11px] font-semibold text-slate-500">
                    {isOwed ? 'Gets back' : owes ? 'Owes group' : 'Settled up'}
                  </div>
                  <div
                    className={`text-xl font-black ${
                      isOwed ? 'text-emerald-600' : owes ? 'text-rose-600' : 'text-slate-500'
                    }`}
                  >
                    {isOwed ? `+₹${b.netBalance.toFixed(2)}` : owes ? `-₹${Math.abs(b.netBalance).toFixed(2)}` : '₹0.00'}
                  </div>
                </div>

                <div className="mt-2 text-[10px] text-slate-400 flex justify-between">
                  <span>Paid: ₹{b.totalPaid.toFixed(0)}</span>
                  <span>Share: ₹{b.totalOwed.toFixed(0)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Debt Simplification & Settle-Up Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Suggested Settle-Up (Debt Simplification)
              </h3>
              <p className="text-xs text-slate-500">
                Minimum cash flow algorithm matches debtors directly to creditors in fewest payments
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {simplifiedDebts.length} {simplifiedDebts.length === 1 ? 'transaction' : 'transactions'} needed
          </span>
        </div>

        {simplifiedDebts.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <div className="font-bold text-slate-700">All Balances Settled!</div>
            <p className="text-xs text-slate-400 mt-1">No outstanding debts remain in this group.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {simplifiedDebts.map((item, index) => {
              const fromMember = memberMap[item.from];
              const toMember = memberMap[item.to];

              return (
                <div
                  key={`${item.from}-${item.to}-${index}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-brand-300 transition gap-4"
                >
                  {/* From -> To Representation */}
                  <div className="flex items-center space-x-3">
                    {/* Debtor */}
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-sm"
                        style={{ backgroundColor: fromMember?.avatarColor || '#64748b' }}
                      >
                        {fromMember?.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-sm text-slate-800">{fromMember?.name}</span>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />

                    {/* Creditor */}
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-sm"
                        style={{ backgroundColor: toMember?.avatarColor || '#64748b' }}
                      >
                        {toMember?.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-sm text-slate-800">{toMember?.name}</span>
                    </div>
                  </div>

                  {/* Amount & Actions */}
                  <div className="flex items-center justify-between sm:justify-end space-x-3">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Amount</span>
                      <span className="text-lg font-black text-slate-900">₹{item.amount.toFixed(2)}</span>
                    </div>

                    {/* Pay with UPI Modal Button */}
                    <button
                      onClick={() =>
                        setActiveUpiPayment({
                          fromName: fromMember?.name || 'Member',
                          toName: toMember?.name || 'Member',
                          fromId: item.from,
                          toId: item.to,
                          amount: item.amount,
                          payeeUpiId: toMember?.upiId,
                        })
                      }
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Pay UPI / QR</span>
                    </button>

                    {/* Settle Directly */}
                    <button
                      onClick={() => handleSettleTransaction(item)}
                      className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Settle</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Settlement History Log */}
      {settlements.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <span className="p-2 bg-slate-100 text-slate-600 rounded-lg">
              <History className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-800">Settlement History</h3>
              <p className="text-xs text-slate-500">Record of confirmed payments in this group</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {settlements.map(st => {
              const fromName = memberMap[st.fromMemberId]?.name || 'Member';
              const toName = memberMap[st.toMemberId]?.name || 'Member';

              return (
                <div key={st.id} className="py-3 flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold text-slate-800">{fromName}</span>
                    <span className="text-slate-400">paid</span>
                    <span className="font-semibold text-slate-800">{toName}</span>
                    <span className="text-xs text-slate-400 ml-2">
                      ({new Date(st.settledAt).toLocaleDateString()})
                    </span>
                  </div>
                  <span className="font-bold text-emerald-600">₹{st.amount.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* UPI QR & Payment Modal */}
      {activeUpiPayment && (
        <UpiModal
          isOpen={true}
          onClose={() => setActiveUpiPayment(null)}
          details={activeUpiPayment}
          onMarkSettled={() => {
            handleSettleTransaction({
              from: activeUpiPayment.fromId,
              to: activeUpiPayment.toId,
              amount: activeUpiPayment.amount,
            });
          }}
        />
      )}
    </div>
  );
};
