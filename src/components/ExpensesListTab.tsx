import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Expense, Category } from '../types';
import {
  Receipt,
  Plus,
  Trash2,
  Calendar,
  Users,
  Tag,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon
} from 'lucide-react';

interface ExpensesListTabProps {
  onScanReceipt: () => void;
  onAddManual: () => void;
}

const CATEGORY_COLORS: Record<Category, string> = {
  Food: 'bg-orange-50 text-orange-700 border-orange-200',
  Groceries: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Travel: 'bg-blue-50 text-blue-700 border-blue-200',
  Utilities: 'bg-purple-50 text-purple-700 border-purple-200',
  Entertainment: 'bg-pink-50 text-pink-700 border-pink-200',
  Other: 'bg-slate-50 text-slate-700 border-slate-200',
};

export const ExpensesListTab: React.FC<ExpensesListTabProps> = ({ onScanReceipt, onAddManual }) => {
  const { activeGroup, expenses, deleteExpense } = useApp();
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);

  if (!activeGroup) return null;

  const toggleExpand = (id: string) => {
    setExpandedExpenseId(prev => (prev === id ? null : id));
  };

  const memberMap = Object.fromEntries(activeGroup.members.map(m => [m.id, m]));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="font-bold text-slate-800 text-base">Group Expenses</h3>
          <p className="text-xs text-slate-500">
            {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'} recorded in{' '}
            <span className="font-semibold text-slate-700">{activeGroup.name}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onAddManual}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            <span>Add Manual</span>
          </button>
          <button
            onClick={onScanReceipt}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm shadow-brand-600/20 transition"
          >
            <Receipt className="w-4 h-4" />
            <span>Scan Receipt</span>
          </button>
        </div>
      </div>

      {/* Expenses Cards */}
      <div className="space-y-3">
        {expenses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-700 text-base">No Expenses Added Yet</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Scan a receipt photo or add a manual expense to start splitting fairly with your group.
            </p>
          </div>
        ) : (
          expenses.map(exp => {
            const isExpanded = expandedExpenseId === exp.id;
            const payer = memberMap[exp.payerId];
            const hasItems = exp.items && exp.items.length > 0;

            return (
              <div
                key={exp.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-slate-300 transition"
              >
                {/* Main Card Summary */}
                <div
                  onClick={() => toggleExpand(exp.id)}
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition gap-4"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0"
                      style={{ backgroundColor: payer?.avatarColor || '#64748b' }}
                      title={`Paid by ${payer?.name || 'Member'}`}
                    >
                      {payer?.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800 text-sm sm:text-base truncate">
                          {exp.title}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                            CATEGORY_COLORS[exp.category] || CATEGORY_COLORS.Other
                          }`}
                        >
                          {exp.category}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                        <span>{exp.date}</span>
                        <span>·</span>
                        <span>
                          Paid by <b className="text-slate-600">{payer?.name || 'Member'}</b>
                        </span>
                        {hasItems && (
                          <>
                            <span>·</span>
                            <span>{exp.items?.length} items</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-base sm:text-lg font-black text-slate-900">
                        ₹{exp.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-400 capitalize">
                        {exp.splitMode} split
                      </div>
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (confirm(`Delete "${exp.title}"?`)) deleteExpense(exp.id);
                      }}
                      className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg transition"
                      title="Delete expense"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details: Items & Individual Shares */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-4">
                    {/* Items table if receipt was scanned */}
                    {hasItems && (
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                          Itemized Breakdown
                        </div>
                        <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
                          {exp.items?.map(it => (
                            <div
                              key={it.id}
                              className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-slate-800">
                                  {it.quantity > 1 ? `${it.quantity}x ` : ''}
                                  {it.name}
                                </span>
                                <div className="flex -space-x-1">
                                  {it.assignedMemberIds.map(mId => (
                                    <div
                                      key={mId}
                                      className="w-4 h-4 rounded-full border border-white text-[9px] text-white font-bold flex items-center justify-center"
                                      style={{ backgroundColor: memberMap[mId]?.avatarColor || '#94a3b8' }}
                                      title={memberMap[mId]?.name}
                                    >
                                      {memberMap[mId]?.name.charAt(0).toUpperCase()}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <span className="font-mono text-slate-700">₹{it.lineTotal.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Member Shares */}
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Member Shares (Split Breakdown)
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {Object.entries(exp.shares).map(([mId, share]) => (
                          <div
                            key={mId}
                            className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs"
                          >
                            <span className="text-xs text-slate-600 truncate">{memberMap[mId]?.name || 'Member'}</span>
                            <span className="text-xs font-black text-slate-900">₹{share.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
