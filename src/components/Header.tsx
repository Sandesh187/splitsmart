import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  PlusCircle,
  Share2,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  RotateCcw,
  ChevronDown,
  Check
} from 'lucide-react';
import {
  exportGroupToJson,
  exportSettlementToCsv,
  exportSummaryToPdf,
  generateShareUrl,
} from '../utils/exportUtils';
import { simplifyDebts } from '../utils/debtSimplification';

interface HeaderProps {
  onOpenGroupModal: () => void;
  onOpenTestModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenGroupModal, onOpenTestModal }) => {
  const {
    groups,
    activeGroup,
    setActiveGroupId,
    createGroup,
    expenses,
    settlements,
    importGroupData,
    resetToSampleData,
  } = useApp();

  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNewGroupPrompt, setShowNewGroupPrompt] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGroupName.trim()) {
      createGroup(newGroupName.trim());
      setNewGroupName('');
      setShowNewGroupPrompt(false);
      setShowGroupMenu(false);
    }
  };

  const handleShareLink = () => {
    if (!activeGroup) return;
    const url = generateShareUrl(activeGroup, expenses);
    navigator.clipboard.writeText(url).then(() => {
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2500);
    });
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (data.group && Array.isArray(data.group.members)) {
          importGroupData(data.group, data.expenses || []);
          alert(`Successfully imported group: ${data.group.name}!`);
        } else {
          alert('Invalid SplitSmart JSON format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    setShowExportMenu(false);
  };

  const handleExportCsv = () => {
    if (!activeGroup) return;
    const debts = simplifyDebts(activeGroup.members, expenses, settlements);
    const memberMap = Object.fromEntries(activeGroup.members.map(m => [m.id, m.name]));
    exportSettlementToCsv(activeGroup, debts, memberMap);
    setShowExportMenu(false);
  };

  const handleExportPdf = () => {
    if (!activeGroup) return;
    const debts = simplifyDebts(activeGroup.members, expenses, settlements);
    const memberMap = Object.fromEntries(activeGroup.members.map(m => [m.id, m.name]));
    exportSummaryToPdf(activeGroup, expenses, debts, memberMap);
    setShowExportMenu(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-md shadow-brand-500/20 text-white font-black text-xl tracking-tight">
              S⚡
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Split<span className="text-brand-600">Smart</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-emerald-100 text-emerald-800 rounded-full">
                  GC 2026
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                AI Receipt Scanner & Fair Debt Simplification
              </p>
            </div>
          </div>

          {/* Group Selector & Top Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Active Group Selector */}
            <div className="relative">
              <button
                onClick={() => setShowGroupMenu(!showGroupMenu)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 active:bg-slate-200 border border-slate-300/80 rounded-lg text-sm font-medium text-slate-800 transition"
              >
                <Users className="w-4 h-4 text-brand-600" />
                <span className="max-w-[120px] sm:max-w-[160px] truncate">
                  {activeGroup?.name || 'Select Group'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {showGroupMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Your Groups
                  </div>
                  {groups.map(g => (
                    <button
                      key={g.id}
                      onClick={() => {
                        setActiveGroupId(g.id);
                        setShowGroupMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between text-sm hover:bg-slate-50 transition ${
                        g.id === activeGroup?.id ? 'text-brand-600 font-semibold bg-brand-50/60' : 'text-slate-700'
                      }`}
                    >
                      <span className="truncate">{g.name}</span>
                      <span className="text-xs text-slate-400">{g.members.length} members</span>
                    </button>
                  ))}
                  <div className="border-t border-slate-100 my-1"></div>
                  {showNewGroupPrompt ? (
                    <form onSubmit={handleCreateGroup} className="p-2 space-y-2">
                      <input
                        type="text"
                        placeholder="Group name..."
                        value={newGroupName}
                        onChange={e => setNewGroupName(e.target.value)}
                        autoFocus
                        className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <div className="flex space-x-1.5">
                        <button
                          type="submit"
                          className="flex-1 py-1 text-xs bg-brand-600 hover:bg-brand-700 text-white font-medium rounded"
                        >
                          Create
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowNewGroupPrompt(false)}
                          className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowNewGroupPrompt(true)}
                      className="w-full text-left px-3 py-2 text-sm text-brand-600 hover:bg-brand-50 flex items-center space-x-2 font-medium"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Create New Group</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowGroupMenu(false);
                      onOpenGroupModal();
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>Manage Group & Members</span>
                  </button>
                </div>
              )}
            </div>

            {/* Robustness Test Suite Button */}
            <button
              onClick={onOpenTestModal}
              title="Test Robustness Test Cases (Section 10)"
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition"
            >
              <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Test Suite</span>
            </button>

            {/* Export / Share Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                title="Export & Share"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    onClick={handleShareLink}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                  >
                    {copiedShareLink ? (
                      <Check className="w-4 h-4 text-brand-600" />
                    ) : (
                      <Share2 className="w-4 h-4 text-slate-400" />
                    )}
                    <span>{copiedShareLink ? 'Link Copied!' : 'Copy Shareable Link'}</span>
                  </button>
                  <button
                    onClick={() => {
                      if (activeGroup) exportGroupToJson(activeGroup, expenses, settlements);
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4 text-slate-400" />
                    <span>Export Group (JSON)</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <Upload className="w-4 h-4 text-slate-400" />
                    <span>Import Group (JSON)</span>
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={handleExportPdf}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <FileText className="w-4 h-4 text-rose-500" />
                    <span>Download PDF Report</span>
                  </button>
                  <button
                    onClick={handleExportCsv}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Download CSV Summary</span>
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={() => {
                      if (confirm('Reset all demo data back to default sample state?')) {
                        resetToSampleData();
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                    <span>Reset to Sample Data</span>
                  </button>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleJsonUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
