import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, UserPlus, Trash2, Edit2, Check, QrCode } from 'lucide-react';
import { Member } from '../types';

interface GroupManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#ec4899', '#3b82f6', '#8b5cf6', '#f97316',
  '#10b981', '#06b6d4', '#eab308', '#6366f1',
  '#ef4444', '#14b8a6', '#a855f7', '#64748b'
];

export const GroupManager: React.FC<GroupManagerProps> = ({ isOpen, onClose }) => {
  const { activeGroup, updateGroup, deleteGroup, addMember, removeMember, updateMember } = useApp();

  const [isEditingGroupName, setIsEditingGroupName] = useState(false);
  const [editedGroupName, setEditedGroupName] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberUpi, setNewMemberUpi] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editMemberName, setEditMemberName] = useState('');
  const [editMemberUpi, setEditMemberUpi] = useState('');

  if (!isOpen || !activeGroup) return null;

  const handleSaveGroupName = () => {
    if (editedGroupName.trim()) {
      updateGroup({ ...activeGroup, name: editedGroupName.trim() });
      setIsEditingGroupName(false);
    }
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    addMember(activeGroup.id, newMemberName.trim(), newMemberUpi.trim(), selectedColor);
    setNewMemberName('');
    setNewMemberUpi('');
    // Rotate to next color
    const nextColorIdx = (PRESET_COLORS.indexOf(selectedColor) + 1) % PRESET_COLORS.length;
    setSelectedColor(PRESET_COLORS[nextColorIdx]);
  };

  const startEditMember = (member: Member) => {
    setEditingMemberId(member.id);
    setEditMemberName(member.name);
    setEditMemberUpi(member.upiId || '');
  };

  const saveEditMember = (member: Member) => {
    if (editMemberName.trim()) {
      updateMember(activeGroup.id, {
        ...member,
        name: editMemberName.trim(),
        upiId: editMemberUpi.trim(),
      });
      setEditingMemberId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex-1 mr-4">
            {isEditingGroupName ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={editedGroupName}
                  onChange={e => setEditedGroupName(e.target.value)}
                  className="px-2.5 py-1 border border-slate-300 rounded text-base font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                />
                <button
                  onClick={handleSaveGroupName}
                  className="p-1.5 bg-brand-600 text-white rounded hover:bg-brand-700"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-800">{activeGroup.name}</h2>
                <button
                  onClick={() => {
                    setEditedGroupName(activeGroup.name);
                    setIsEditingGroupName(true);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <p className="text-xs text-slate-500 mt-0.5">
              {activeGroup.members.length} members · Created {new Date(activeGroup.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Members List */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Group Members & UPI IDs
            </h3>
            <div className="space-y-2">
              {activeGroup.members.map(member => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-slate-300 transition"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0"
                      style={{ backgroundColor: member.avatarColor }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>

                    {editingMemberId === member.id ? (
                      <div className="flex flex-col sm:flex-row gap-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editMemberName}
                          onChange={e => setEditMemberName(e.target.value)}
                          placeholder="Name"
                          className="px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-brand-500"
                        />
                        <input
                          type="text"
                          value={editMemberUpi}
                          onChange={e => setEditMemberUpi(e.target.value)}
                          placeholder="UPI ID (e.g. name@upi)"
                          className="px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-brand-500 flex-1"
                        />
                      </div>
                    ) : (
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-slate-800 truncate">
                          {member.name}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center space-x-1 truncate">
                          <QrCode className="w-3 h-3 text-slate-400" />
                          <span>{member.upiId || 'No UPI ID added'}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    {editingMemberId === member.id ? (
                      <button
                        onClick={() => saveEditMember(member)}
                        className="p-1.5 text-brand-600 hover:bg-brand-50 rounded"
                        title="Save"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => startEditMember(member)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => removeMember(activeGroup.id, member.id)}
                      disabled={activeGroup.members.length <= 2}
                      className={`p-1.5 rounded transition ${
                        activeGroup.members.length <= 2
                          ? 'text-slate-300 cursor-not-allowed'
                          : 'text-rose-500 hover:text-rose-700 hover:bg-rose-50'
                      }`}
                      title={activeGroup.members.length <= 2 ? 'Minimum 2 members required' : 'Remove member'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Member Form */}
          <form onSubmit={handleAddMember} className="bg-slate-50/80 p-4 rounded-xl border border-dashed border-slate-300 space-y-3">
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <UserPlus className="w-3.5 h-3.5 text-brand-600" />
              <span>Add Member</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Full Name (e.g. Kabir)"
                value={newMemberName}
                onChange={e => setNewMemberName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
              <input
                type="text"
                placeholder="UPI ID (optional, e.g. kabir@paytm)"
                value={newMemberUpi}
                onChange={e => setNewMemberUpi(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
            </div>

            {/* Color Palette Selector */}
            <div className="flex items-center space-x-2 pt-1">
              <span className="text-xs text-slate-500">Avatar Color:</span>
              <div className="flex items-center space-x-1.5 flex-wrap">
                {PRESET_COLORS.slice(0, 8).map(c => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`w-5 h-5 rounded-full border-2 transition ${
                      selectedColor === c ? 'border-slate-800 scale-110 shadow-sm' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!newMemberName.trim()}
              className="w-full py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition"
            >
              Add to Group
            </button>
          </form>

          {/* Delete Group Action */}
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
            <span className="text-xs text-slate-400">Need to remove this group?</span>
            <button
              onClick={() => {
                if (confirm(`Delete group "${activeGroup.name}" and its expenses?`)) {
                  deleteGroup(activeGroup.id);
                  onClose();
                }
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium"
            >
              Delete Group
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
