import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SplitMode, Category } from '../types';
import { calculateFlexibleSplit } from '../utils/calculator';
import { CATEGORIES } from '../utils/classifier';
import { X, Check, DollarSign, PieChart, Users, Hash, AlertCircle } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose }) => {
  const { activeGroup, addExpense } = useApp();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payerId, setPayerId] = useState<string>('');
  const [category, setCategory] = useState<Category>('Food');
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [participants, setParticipants] = useState<string[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, number>>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize defaults on open
  useEffect(() => {
    if (activeGroup && isOpen) {
      setPayerId(activeGroup.members[0]?.id || '');
      const allIds = activeGroup.members.map(m => m.id);
      setParticipants(allIds);
      setTitle('');
      setAmount('');
      setValidationError(null);

      // Default custom values
      const initialCustom: Record<string, number> = {};
      allIds.forEach(id => {
        initialCustom[id] = 1; // 1 share or 0
      });
      setCustomValues(initialCustom);
    }
  }, [activeGroup, isOpen]);

  if (!isOpen || !activeGroup) return null;

  const toggleParticipant = (memberId: string) => {
    setParticipants(prev => {
      if (prev.includes(memberId)) {
        if (prev.length <= 1) return prev; // Keep at least one
        return prev.filter(id => id !== memberId);
      }
      return [...prev, memberId];
    });
  };

  const handleCustomValueChange = (memberId: string, val: number) => {
    setCustomValues(prev => ({
      ...prev,
      [memberId]: val,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setValidationError('Please enter a valid expense amount.');
      return;
    }

    if (!title.trim()) {
      setValidationError('Please enter a description for the expense.');
      return;
    }

    if (participants.length === 0) {
      setValidationError('Please select at least one participant.');
      return;
    }

    // Run flexible split calculation engine
    const splitResult = calculateFlexibleSplit(numAmount, participants, splitMode, customValues);

    if (!splitResult.isValid) {
      setValidationError(splitResult.errorMessage || 'Invalid split breakdown.');
      return;
    }

    // Add expense
    addExpense({
      groupId: activeGroup.id,
      title: title.trim(),
      date,
      payerId,
      subtotal: numAmount,
      taxAmount: 0,
      serviceCharge: 0,
      discount: 0,
      totalAmount: numAmount,
      category,
      splitMode,
      shares: splitResult.shares,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Add Manual Expense</h2>
            <p className="text-xs text-slate-500">Record a shared expense without receipt</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {validationError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-800 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Title & Amount */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Description / Title</label>
              <input
                type="text"
                placeholder="e.g. Chai & Samosa Treat, Auto to Station..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Total Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as Category)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Paid By (Payer)</label>
                <select
                  value={payerId}
                  onChange={e => setPayerId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 bg-white font-medium"
                >
                  {activeGroup.members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Split Mode Selector (Requirement 9) */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Split Mode
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl">
              {(['equal', 'exact', 'percentage', 'shares'] as SplitMode[]).map(mode => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => setSplitMode(mode)}
                  className={`py-1.5 text-xs font-bold rounded-lg capitalize transition ${
                    splitMode === mode
                      ? 'bg-white text-brand-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Participants & Custom Split Inputs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Split Between ({participants.length})
              </span>
              <button
                type="button"
                onClick={() => setParticipants(activeGroup.members.map(m => m.id))}
                className="text-xs text-brand-600 hover:text-brand-700 font-semibold"
              >
                Select All
              </button>
            </div>

            <div className="space-y-2">
              {activeGroup.members.map(member => {
                const isSelected = participants.includes(member.id);
                return (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                      isSelected ? 'bg-slate-50 border-slate-300' : 'bg-white border-slate-200 opacity-60'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleParticipant(member.id)}
                      className="flex items-center space-x-2.5 flex-1 text-left"
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs"
                        style={{ backgroundColor: member.avatarColor }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{member.name}</span>
                    </button>

                    {/* Mode Specific Value Inputs */}
                    {isSelected && (
                      <div className="flex items-center space-x-1.5">
                        {splitMode === 'exact' && (
                          <div className="flex items-center">
                            <span className="text-xs text-slate-400 mr-1 font-semibold">₹</span>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={customValues[member.id] ?? ''}
                              onChange={e =>
                                handleCustomValueChange(member.id, parseFloat(e.target.value) || 0)
                              }
                              className="w-20 px-2 py-1 text-xs border border-slate-300 rounded font-bold text-right"
                            />
                          </div>
                        )}

                        {splitMode === 'percentage' && (
                          <div className="flex items-center">
                            <input
                              type="number"
                              step="0.1"
                              placeholder="%"
                              value={customValues[member.id] ?? ''}
                              onChange={e =>
                                handleCustomValueChange(member.id, parseFloat(e.target.value) || 0)
                              }
                              className="w-16 px-2 py-1 text-xs border border-slate-300 rounded font-bold text-right"
                            />
                            <span className="text-xs text-slate-400 ml-1 font-semibold">%</span>
                          </div>
                        )}

                        {splitMode === 'shares' && (
                          <div className="flex items-center">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={customValues[member.id] ?? 1}
                              onChange={e =>
                                handleCustomValueChange(member.id, parseInt(e.target.value, 10) || 0)
                              }
                              className="w-14 px-2 py-1 text-xs border border-slate-300 rounded font-bold text-center"
                            />
                            <span className="text-xs text-slate-400 ml-1">share</span>
                          </div>
                        )}

                        {splitMode === 'equal' && (
                          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                            Equal
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm shadow-md shadow-brand-600/20 transition"
            >
              Add Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
