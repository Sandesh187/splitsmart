import React, { createContext, useContext, useState, useEffect } from 'react';
import { Group, Member, Expense, Settlement, RecurringExpense } from '../types';
import {
  loadGroups,
  saveGroups,
  loadActiveGroupId,
  saveActiveGroupId,
  loadExpenses,
  saveExpenses,
  loadSettlements,
  saveSettlements,
  loadRecurring,
  saveRecurring,
} from '../utils/storage';
import { decodeSharedData } from '../utils/exportUtils';

interface AppContextType {
  groups: Group[];
  activeGroup: Group | null;
  activeGroupId: string;
  setActiveGroupId: (id: string) => void;
  createGroup: (name: string, description?: string, initialMembers?: Member[]) => Group;
  updateGroup: (group: Group) => void;
  deleteGroup: (id: string) => void;
  addMember: (groupId: string, name: string, upiId?: string, avatarColor?: string) => void;
  updateMember: (groupId: string, member: Member) => void;
  removeMember: (groupId: string, memberId: string) => void;
  expenses: Expense[];
  allExpenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;
  settlements: Settlement[];
  addSettlement: (fromId: string, toId: string, amount: number, note?: string) => void;
  recurring: RecurringExpense[];
  addRecurring: (rec: Omit<RecurringExpense, 'id'>) => void;
  deleteRecurring: (recId: string) => void;
  processRecurring: (recId: string) => void;
  importGroupData: (group: Group, newExpenses: Expense[]) => void;
  resetToSampleData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const PRESET_COLORS = ['#ec4899', '#3b82f6', '#8b5cf6', '#f97316', '#10b981', '#06b6d4', '#eab308', '#6366f1'];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [groups, setGroups] = useState<Group[]>(() => loadGroups());
  const [activeGroupId, setActiveGroupIdState] = useState<string>(() => loadActiveGroupId());
  const [allExpenses, setAllExpenses] = useState<Expense[]>(() => loadExpenses());
  const [settlements, setSettlements] = useState<Settlement[]>(() => loadSettlements());
  const [recurring, setRecurring] = useState<RecurringExpense[]>(() => loadRecurring());

  // Check URL for shared data on mount
  useEffect(() => {
    const shared = decodeSharedData();
    if (shared) {
      importGroupData(shared.group, shared.expenses);
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    saveGroups(groups);
  }, [groups]);

  useEffect(() => {
    saveActiveGroupId(activeGroupId);
  }, [activeGroupId]);

  useEffect(() => {
    saveExpenses(allExpenses);
  }, [allExpenses]);

  useEffect(() => {
    saveSettlements(settlements);
  }, [settlements]);

  useEffect(() => {
    saveRecurring(recurring);
  }, [recurring]);

  const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0] || null;

  const setActiveGroupId = (id: string) => {
    setActiveGroupIdState(id);
  };

  const createGroup = (name: string, description?: string, initialMembers?: Member[]) => {
    const newGroup: Group = {
      id: `group-${Date.now()}`,
      name: name.trim(),
      description: description?.trim() || '',
      createdAt: Date.now(),
      members: initialMembers || [
        { id: `m-${Date.now()}-1`, name: 'You', avatarColor: PRESET_COLORS[0], upiId: '' },
      ],
    };

    const updated = [newGroup, ...groups];
    setGroups(updated);
    setActiveGroupIdState(newGroup.id);
    return newGroup;
  };

  const updateGroup = (updatedGroup: Group) => {
    setGroups(groups.map(g => (g.id === updatedGroup.id ? updatedGroup : g)));
  };

  const deleteGroup = (id: string) => {
    if (groups.length <= 1) {
      alert('You must have at least one group.');
      return;
    }
    const filtered = groups.filter(g => g.id !== id);
    setGroups(filtered);
    if (activeGroupId === id) {
      setActiveGroupIdState(filtered[0].id);
    }
  };

  const addMember = (groupId: string, name: string, upiId?: string, avatarColor?: string) => {
    const target = groups.find(g => g.id === groupId);
    if (!target) return;

    const color = avatarColor || PRESET_COLORS[target.members.length % PRESET_COLORS.length];
    const newMember: Member = {
      id: `m-${Date.now()}`,
      name: name.trim(),
      avatarColor: color,
      upiId: upiId?.trim() || '',
    };

    const updatedGroup = {
      ...target,
      members: [...target.members, newMember],
    };
    updateGroup(updatedGroup);
  };

  const updateMember = (groupId: string, member: Member) => {
    const target = groups.find(g => g.id === groupId);
    if (!target) return;

    const updatedMembers = target.members.map(m => (m.id === member.id ? member : m));
    updateGroup({ ...target, members: updatedMembers });
  };

  const removeMember = (groupId: string, memberId: string) => {
    const target = groups.find(g => g.id === groupId);
    if (!target) return;

    if (target.members.length <= 2) {
      alert('A group must have at least 2 members to split expenses.');
      return;
    }

    const updatedMembers = target.members.filter(m => m.id !== memberId);
    updateGroup({ ...target, members: updatedMembers });
  };

  const addExpense = (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      createdAt: Date.now(),
    };
    setAllExpenses(prev => [newExpense, ...prev]);
  };

  const deleteExpense = (id: string) => {
    setAllExpenses(prev => prev.filter(e => e.id !== id));
  };

  const addSettlement = (fromId: string, toId: string, amount: number, note?: string) => {
    if (!activeGroup) return;
    const newSettlement: Settlement = {
      id: `set-${Date.now()}`,
      groupId: activeGroup.id,
      fromMemberId: fromId,
      toMemberId: toId,
      amount,
      settledAt: Date.now(),
      note,
    };
    setSettlements(prev => [newSettlement, ...prev]);
  };

  const addRecurring = (recData: Omit<RecurringExpense, 'id'>) => {
    const newRec: RecurringExpense = {
      ...recData,
      id: `rec-${Date.now()}`,
    };
    setRecurring(prev => [...prev, newRec]);
  };

  const deleteRecurring = (recId: string) => {
    setRecurring(prev => prev.filter(r => r.id !== recId));
  };

  const processRecurring = (recId: string) => {
    const rec = recurring.find(r => r.id === recId);
    if (!rec) return;

    // Calculate equal share
    const n = rec.participantIds.length;
    if (n === 0) return;
    const shareAmount = Number((rec.amount / n).toFixed(2));
    const shares: Record<string, number> = {};
    rec.participantIds.forEach(id => {
      shares[id] = shareAmount;
    });

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      groupId: rec.groupId,
      title: `[Recurring] ${rec.title}`,
      date: new Date().toISOString().split('T')[0],
      payerId: rec.payerId,
      totalAmount: rec.amount,
      subtotal: rec.amount,
      taxAmount: 0,
      serviceCharge: 0,
      discount: 0,
      category: rec.category,
      splitMode: 'equal',
      shares,
      createdAt: Date.now(),
    };

    setAllExpenses(prev => [newExpense, ...prev]);
    setRecurring(prev =>
      prev.map(r => (r.id === recId ? { ...r, lastAdded: new Date().toISOString().split('T')[0] } : r))
    );
  };

  const importGroupData = (importedGroup: Group, newExpenses: Expense[]) => {
    // Add or replace group
    const exists = groups.some(g => g.id === importedGroup.id);
    const updatedGroups = exists
      ? groups.map(g => (g.id === importedGroup.id ? importedGroup : g))
      : [importedGroup, ...groups];

    setGroups(updatedGroups);
    setActiveGroupIdState(importedGroup.id);

    // Merge expenses
    const existingIds = new Set(allExpenses.map(e => e.id));
    const uniqueIncoming = newExpenses.filter(e => !existingIds.has(e.id));
    setAllExpenses(prev => [...uniqueIncoming, ...prev]);
  };

  const resetToSampleData = () => {
    localStorage.clear();
    window.location.reload();
  };

  const activeExpenses = allExpenses.filter(e => e.groupId === activeGroupId);
  const activeSettlements = settlements.filter(s => s.groupId === activeGroupId);
  const activeRecurring = recurring.filter(r => r.groupId === activeGroupId);

  return (
    <AppContext.Provider
      value={{
        groups,
        activeGroup,
        activeGroupId,
        setActiveGroupId,
        createGroup,
        updateGroup,
        deleteGroup,
        addMember,
        updateMember,
        removeMember,
        expenses: activeExpenses,
        allExpenses,
        addExpense,
        deleteExpense,
        settlements: activeSettlements,
        addSettlement,
        recurring: activeRecurring,
        addRecurring,
        deleteRecurring,
        processRecurring,
        importGroupData,
        resetToSampleData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
