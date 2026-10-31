import React from 'react';
import { useApp } from '../context/AppContext';
import { Category } from '../types';
import { PieChart, BarChart2, TrendingUp, DollarSign } from 'lucide-react';

const CATEGORY_COLORS: Record<Category, string> = {
  Food: '#f97316',
  Groceries: '#10b981',
  Travel: '#3b82f6',
  Utilities: '#8b5cf6',
  Entertainment: '#ec4899',
  Other: '#64748b',
};

export const AnalyticsTab: React.FC = () => {
  const { activeGroup, expenses } = useApp();

  if (!activeGroup || expenses.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 max-w-2xl mx-auto">
        <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-700 text-base">No Spending Data Yet</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Scan receipts or add manual expenses to see interactive breakdowns by category and group member.
        </p>
      </div>
    );
  }

  const totalSpent = expenses.reduce((sum, e) => sum + e.totalAmount, 0);

  // 1. Spending by Category
  const categoryTotals: Record<Category, number> = {
    Food: 0,
    Groceries: 0,
    Travel: 0,
    Utilities: 0,
    Entertainment: 0,
    Other: 0,
  };

  expenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.totalAmount;
  });

  // 2. Spending by Member (who paid)
  const memberPaidTotals: Record<string, number> = {};
  activeGroup.members.forEach(m => (memberPaidTotals[m.id] = 0));
  expenses.forEach(e => {
    memberPaidTotals[e.payerId] = (memberPaidTotals[e.payerId] || 0) + e.totalAmount;
  });

  // 3. Member consumption shares
  const memberOwedTotals: Record<string, number> = {};
  activeGroup.members.forEach(m => (memberOwedTotals[m.id] = 0));
  expenses.forEach(e => {
    if (e.shares) {
      Object.entries(e.shares).forEach(([mId, amt]) => {
        memberOwedTotals[mId] = (memberOwedTotals[mId] || 0) + amt;
      });
    }
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Group Spending</span>
          <div className="text-2xl font-black text-slate-900 mt-1">₹{totalSpent.toFixed(2)}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Across {expenses.length} recorded expenses</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Per Member</span>
          <div className="text-2xl font-black text-brand-600 mt-1">
            ₹{(totalSpent / (activeGroup.members.length || 1)).toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">{activeGroup.members.length} members sharing costs</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top Spending Category</span>
          <div className="text-xl font-black text-slate-800 mt-1 flex items-center space-x-2">
            {Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Food'}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            ₹{Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[1]?.toFixed(2) || '0.00'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-slate-800 text-base">Spending by Category</h3>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(categoryTotals)
              .filter(([_, amt]) => amt > 0)
              .map(([cat, amt]) => {
                const pct = totalSpent > 0 ? (amt / totalSpent) * 100 : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700 flex items-center space-x-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: CATEGORY_COLORS[cat as Category] }}
                        />
                        <span>{cat}</span>
                      </span>
                      <span className="text-slate-900">
                        ₹{amt.toFixed(2)} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: CATEGORY_COLORS[cat as Category],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Member Breakdown Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-slate-800 text-base">Consumption vs Paid</h3>
          </div>

          <div className="space-y-4 pt-2">
            {activeGroup.members.map(member => {
              const paid = memberPaidTotals[member.id] || 0;
              const consumed = memberOwedTotals[member.id] || 0;
              const maxVal = Math.max(totalSpent, 1);
              const paidPct = (paid / maxVal) * 100;
              const consumedPct = (consumed / maxVal) * 100;

              return (
                <div key={member.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800 flex items-center space-x-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: member.avatarColor }}
                      />
                      <span>{member.name}</span>
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Paid: <b>₹{paid.toFixed(0)}</b> · Share: <b>₹{consumed.toFixed(0)}</b>
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-emerald-500"
                        title="Paid"
                        style={{ width: `${paidPct}%` }}
                      />
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-indigo-500"
                        title="Consumed"
                        style={{ width: `${consumedPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="pt-2 flex justify-end items-center space-x-4 text-[10px] text-slate-500">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded bg-emerald-500 inline-block"></span>
                <span>Paid</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded bg-indigo-500 inline-block"></span>
                <span>Consumed</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
