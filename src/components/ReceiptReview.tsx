import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ParsedItem, Category } from '../types';
import { ParsedReceiptData } from '../utils/ocrParser';
import { calculateItemizedSplit } from '../utils/calculator';
import { CATEGORIES } from '../utils/classifier';
import {
  Check,
  Plus,
  Trash2,
  AlertTriangle,
  Receipt,
  UserCheck,
  Tag,
  ArrowRight,
  Info,
  Sparkles
} from 'lucide-react';

interface ReceiptReviewProps {
  initialData: ParsedReceiptData;
  receiptImage: string;
  onSaveExpense: () => void;
  onCancel: () => void;
}

export const ReceiptReview: React.FC<ReceiptReviewProps> = ({
  initialData,
  receiptImage,
  onSaveExpense,
  onCancel,
}) => {
  const { activeGroup, addExpense } = useApp();

  const [title, setTitle] = useState('Night Canteen Order');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [payerId, setPayerId] = useState(activeGroup?.members[0]?.id || '');
  const [items, setItems] = useState<ParsedItem[]>(initialData.items);
  const [taxAmount, setTaxAmount] = useState<number>(initialData.taxAmount || 0);
  const [serviceCharge, setServiceCharge] = useState<number>(initialData.serviceCharge || 0);
  const [discount, setDiscount] = useState<number>(initialData.discount || 0);
  const [declaredTotal, setDeclaredTotal] = useState<number>(initialData.detectedTotal || 0);
  const [validationWarningDismissed, setValidationWarningDismissed] = useState(false);

  // Compute live itemized split & totals
  const splitResult = useMemo(() => {
    return calculateItemizedSplit(items, taxAmount, serviceCharge, discount, declaredTotal);
  }, [items, taxAmount, serviceCharge, discount, declaredTotal]);

  const itemsSubtotal = items.reduce((sum, it) => sum + it.lineTotal, 0);
  const computedGrandTotal = Number((itemsSubtotal + taxAmount + serviceCharge - discount).toFixed(2));
  const totalDifference = Number((computedGrandTotal - declaredTotal).toFixed(2));
  const hasMismatch = Math.abs(totalDifference) >= 0.05;

  // Toggle item assignment for member
  const toggleMemberForItem = (itemId: string, memberId: string) => {
    setItems(prev =>
      prev.map(it => {
        if (it.id !== itemId) return it;
        const exists = it.assignedMemberIds.includes(memberId);
        const assigned = exists
          ? it.assignedMemberIds.filter(id => id !== memberId)
          : [...it.assignedMemberIds, memberId];
        return { ...it, assignedMemberIds: assigned };
      })
    );
  };

  // Assign item to all group members
  const assignToAll = (itemId: string) => {
    if (!activeGroup) return;
    setItems(prev =>
      prev.map(it => {
        if (it.id !== itemId) return it;
        return { ...it, assignedMemberIds: activeGroup.members.map(m => m.id) };
      })
    );
  };

  // Add a new empty row
  const handleAddItem = () => {
    const newItem: ParsedItem = {
      id: `item-${Date.now()}`,
      name: 'New Item',
      quantity: 1,
      unitPrice: 50,
      lineTotal: 50,
      confidence: 100,
      assignedMemberIds: activeGroup?.members.map(m => m.id) || [],
      category: 'Food',
    };
    setItems(prev => [...prev, newItem]);
  };

  // Delete an item
  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(it => it.id !== id));
  };

  // Update item field
  const updateItemField = (id: string, field: keyof ParsedItem, val: any) => {
    setItems(prev =>
      prev.map(it => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: val };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.lineTotal = Number((updated.quantity * updated.unitPrice).toFixed(2));
        } else if (field === 'lineTotal') {
          updated.unitPrice = Number((updated.lineTotal / (updated.quantity || 1)).toFixed(2));
        }
        return updated;
      })
    );
  };

  // Reconcile total button
  const handleAutoReconcileTotal = () => {
    setDeclaredTotal(computedGrandTotal);
  };

  // Submit and create expense
  const handleSave = () => {
    if (!activeGroup) return;

    if (splitResult.unassignedItems.length > 0) {
      const names = splitResult.unassignedItems.map(i => i.name).join(', ');
      alert(`Warning: The following items are not assigned to anyone: ${names}. Please assign them before saving.`);
      return;
    }

    if (items.length === 0) {
      alert('Expense must have at least one line item.');
      return;
    }

    // Proportional breakdown is stored directly in shares
    addExpense({
      groupId: activeGroup.id,
      title: title.trim() || 'Receipt Expense',
      date,
      payerId,
      subtotal: itemsSubtotal,
      taxAmount,
      serviceCharge,
      discount,
      totalAmount: splitResult.totalComputed,
      category: items[0]?.category || 'Food',
      splitMode: 'equal', // itemized shares
      items,
      shares: splitResult.memberTotalShares,
      receiptImage,
    });

    onSaveExpense();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                <Receipt className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-800">Review & Itemize Receipt</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Verify parsed lines against the original receipt. Assign items to members with 1 tap.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl flex items-center space-x-1.5 shadow-md shadow-brand-600/20 transition"
            >
              <span>Save & Settle</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expense Metadata Form */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Expense Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Paid By (Payer)</label>
            <select
              value={payerId}
              onChange={e => setPayerId(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white"
            >
              {activeGroup?.members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Validation Mismatch Banner (Requirement 5) */}
      {hasMismatch && !validationWarningDismissed && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-bold text-amber-900">Total Validation Warning: </span>
              <span className="text-amber-800">
                Sum of items + taxes is <b>₹{computedGrandTotal.toFixed(2)}</b>, but printed total says{' '}
                <b>₹{declaredTotal.toFixed(2)}</b> (Difference: ₹{Math.abs(totalDifference).toFixed(2)}).
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={handleAutoReconcileTotal}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition"
            >
              Use Computed Total (₹{computedGrandTotal.toFixed(2)})
            </button>
            <button
              onClick={() => setValidationWarningDismissed(true)}
              className="px-2 py-1 text-xs text-amber-700 hover:text-amber-900 font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Side-by-Side Split View (Requirement 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Original Receipt Image */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Original Receipt Image
            </span>
            <span className="text-[11px] text-slate-400">Pinch or scroll to inspect details</span>
          </div>
          <div className="flex-1 bg-slate-900/5 rounded-xl border border-slate-200 overflow-auto max-h-[600px] flex items-center justify-center p-2">
            <img
              src={receiptImage}
              alt="Scanned Receipt"
              className="rounded shadow-sm max-w-full object-contain"
            />
          </div>
        </div>

        {/* Right: Parsed Table & Item Assignment */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Line Items ({items.length})
            </span>
            <button
              onClick={handleAddItem}
              className="flex items-center space-x-1 text-xs font-bold text-brand-600 hover:text-brand-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Line Item</span>
            </button>
          </div>

          {/* Items Table */}
          <div className="space-y-3">
            {items.map(item => {
              const isLowConfidence = (item.confidence || 100) < 70;
              const isUnassigned = item.assignedMemberIds.length === 0;

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition ${
                    isLowConfidence
                      ? 'bg-amber-50/60 border-amber-300'
                      : isUnassigned
                      ? 'bg-rose-50/40 border-rose-300'
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top row: Item Name, Category, Price, Delete */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => updateItemField(item.id, 'name', e.target.value)}
                      className="flex-1 px-2.5 py-1 text-sm font-medium border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-brand-500"
                    />

                    {/* Category Selector */}
                    <select
                      value={item.category}
                      onChange={e => updateItemField(item.id, 'category', e.target.value as Category)}
                      className="text-xs px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-700"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>

                    {/* Quantity */}
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-slate-400">Qty</span>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => updateItemField(item.id, 'quantity', parseInt(e.target.value, 10) || 1)}
                        className="w-12 px-1.5 py-1 text-xs text-center border border-slate-300 rounded-lg bg-white"
                      />
                    </div>

                    {/* Line Total */}
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-semibold text-slate-400">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        value={item.lineTotal}
                        onChange={e => updateItemField(item.id, 'lineTotal', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 text-xs font-bold text-slate-800 text-right border border-slate-300 rounded-lg bg-white"
                      />
                    </div>

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Low Confidence warning badge (Requirement 4) */}
                  {isLowConfidence && (
                    <div className="flex items-center space-x-1.5 mt-1.5 text-[11px] text-amber-800 font-medium">
                      <Info className="w-3.5 h-3.5 text-amber-600" />
                      <span>Low OCR confidence ({Math.round(item.confidence || 0)}%) — check spelling/amount</span>
                    </div>
                  )}

                  {/* Item Assignment Avatars (Requirement 8) */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center space-x-1">
                        <UserCheck className="w-3 h-3 text-slate-400" />
                        <span>Assign:</span>
                      </span>

                      {activeGroup?.members.map(member => {
                        const isAssigned = item.assignedMemberIds.includes(member.id);
                        return (
                          <button
                            key={member.id}
                            onClick={() => toggleMemberForItem(item.id, member.id)}
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center space-x-1 transition border ${
                              isAssigned
                                ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            <span
                              className="w-2 h-2 rounded-full inline-block"
                              style={{ backgroundColor: isAssigned ? '#fff' : member.avatarColor }}
                            />
                            <span>{member.name}</span>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => assignToAll(item.id)}
                      className="text-[11px] text-brand-600 hover:text-brand-700 font-semibold"
                    >
                      All ({activeGroup?.members.length})
                    </button>
                  </div>

                  {/* Unassigned Warning */}
                  {isUnassigned && (
                    <div className="mt-1 text-[11px] font-bold text-rose-600">
                      ⚠️ Not assigned to anyone yet!
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tax, Service Charge, and Discount Inputs */}
          <div className="mt-6 pt-4 border-t border-slate-200 bg-slate-50 p-4 rounded-xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
              Taxes & Adjustments (Distributed Proportionally)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Subtotal (Items)</label>
                <div className="font-bold text-sm text-slate-800">₹{itemsSubtotal.toFixed(2)}</div>
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Taxes / GST (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={taxAmount}
                  onChange={e => setTaxAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white font-medium"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Service Charge (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={serviceCharge}
                  onChange={e => setServiceCharge(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white font-medium"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Discount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={discount}
                  onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white font-medium"
                />
              </div>
            </div>

            {/* Total Summary */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="text-xs text-slate-500">Detected Grand Total:</div>
                <div className="text-lg font-black text-slate-900">₹{splitResult.totalComputed.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">
                  Proportional Tax: Exact to the paisa (0 drift)
                </span>
                <span className="text-xs font-semibold text-brand-700">
                  {splitResult.unassignedItems.length === 0 ? '✓ All items assigned' : '⚠️ Has unassigned items'}
                </span>
              </div>
            </div>
          </div>

          {/* Member Individual Shares Breakdown (Live Preview) */}
          <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Calculated Shares Preview (Proportional Tax Added)</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {activeGroup?.members.map(m => {
                const share = splitResult.memberTotalShares[m.id] || 0;
                return (
                  <div key={m.id} className="bg-white p-2 rounded-lg border border-emerald-100 shadow-2xs">
                    <div className="text-[11px] text-slate-500 truncate font-medium">{m.name}</div>
                    <div className="text-sm font-black text-emerald-700">₹{share.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
