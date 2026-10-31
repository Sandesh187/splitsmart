import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RecurringExpense, Category } from '../types';
import { CATEGORIES } from '../utils/classifier';
import { CalendarClock, Plus, Trash2, Play, CheckCircle2 } from 'lucide-react';

export const RecurringTab: React.FC = () => {
  const { activeGroup, recurring, addRecurring, deleteRecurring, processRecurring } = useApp();

  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState(activeGroup?.members[0]?.id || '');
  const [category, setCategory] = useState<Category>('Utilities');
  const [frequency, setFrequency] = useState<'monthly' | 'weekly'>('monthly');

  if (!activeGroup) return null;

  const handleCreateRecurring = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (!title.trim() || isNaN(numAmt) || numAmt <= 0) return;

    addRecurring({
      groupId: activeGroup.id,
      title: title.trim(),
      amount: numAmt,
      payerId: payerId || activeGroup.members[0].id,
      participantIds: activeGroup.members.map(m => m.id),
      category,
      frequency,
      dayOfMonth: 1,
    });

    setTitle('');
    setAmount('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <CalendarClock className="w-5 h-5" />
            </span>
            <h3 className="text-base font-bold text-slate-800">Recurring Shared Expenses</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automate recurring costs like hostel Wi-Fi, room electricity, water cans, and OTT subscriptions.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Recurring Bill</span>
        </button>
      </div>

      {/* Add Recurring Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateRecurring}
          className="bg-white rounded-2xl border border-brand-200 p-5 shadow-sm space-y-4 animate-in fade-in"
        >
          <h4 className="text-sm font-bold text-slate-800">New Recurring Bill</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Expense Title</label>
              <input
                type="text"
                placeholder="e.g. Hostel Wi-Fi 300 Mbps"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 1199"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Payer</label>
              <select
                value={payerId}
                onChange={e => setPayerId(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white"
              >
                {activeGroup.members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as Category)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold"
            >
              Save Schedule
            </button>
          </div>
        </form>
      )}

      {/* Recurring Items List */}
      <div className="space-y-3">
        {recurring.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-slate-400 text-xs">
            No recurring bills set up for this group yet.
          </div>
        ) : (
          recurring.map(rec => {
            const payer = activeGroup.members.find(m => m.id === rec.payerId);

            return (
              <div
                key={rec.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800 text-base">{rec.title}</span>
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 rounded-full capitalize">
                      {rec.frequency}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Paid by <span className="font-semibold text-slate-700">{payer?.name || 'Member'}</span> · Split
                    equally among all {rec.participantIds.length} members
                  </div>
                  {rec.lastAdded && (
                    <div className="text-[11px] text-slate-400">
                      Last added to group expenses on {rec.lastAdded}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3 justify-between sm:justify-end">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Amount</span>
                    <span className="text-lg font-black text-slate-900">₹{rec.amount.toFixed(2)}</span>
                  </div>

                  <button
                    onClick={() => {
                      processRecurring(rec.id);
                      alert(`Added "${rec.title}" (₹${rec.amount}) to group expenses!`);
                    }}
                    className="px-3.5 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Post Now</span>
                  </button>

                  <button
                    onClick={() => deleteRecurring(rec.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
