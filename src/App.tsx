import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { GroupManager } from './components/GroupManager';
import { ReceiptScanner } from './components/ReceiptScanner';
import { ReceiptReview } from './components/ReceiptReview';
import { ExpenseModal } from './components/ExpenseModal';
import { BalancesTab } from './components/BalancesTab';
import { ExpensesListTab } from './components/ExpensesListTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { RecurringTab } from './components/RecurringTab';
import { TestCasesModal } from './components/TestCasesModal';
import { ParsedReceiptData } from './utils/ocrParser';
import {
  Camera,
  Receipt,
  Scale,
  BarChart3,
  CalendarClock,
  Sparkles,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';

type Tab = 'scan' | 'expenses' | 'balances' | 'analytics' | 'recurring';

export const App: React.FC = () => {
  const { activeGroup } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('scan');

  // Modals
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // Scan & Review state
  const [scannedData, setScannedData] = useState<ParsedReceiptData | null>(null);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  const handleScanComplete = (data: ParsedReceiptData, imageSrc: string) => {
    setScannedData(data);
    setReceiptImage(imageSrc);
  };

  const handleSaveScannedExpense = () => {
    setScannedData(null);
    setReceiptImage(null);
    setActiveTab('balances');
  };

  const handleCancelReview = () => {
    setScannedData(null);
    setReceiptImage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <Header
        onOpenGroupModal={() => setIsGroupModalOpen(true)}
        onOpenTestModal={() => setIsTestModalOpen(true)}
      />

      {/* Main Navigation Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2.5">
            <button
              onClick={() => {
                setActiveTab('scan');
              }}
              className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center space-x-2 transition flex-shrink-0 ${
                activeTab === 'scan'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Scan Receipt</span>
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center space-x-2 transition flex-shrink-0 ${
                activeTab === 'expenses'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Expenses</span>
            </button>

            <button
              onClick={() => setActiveTab('balances')}
              className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center space-x-2 transition flex-shrink-0 ${
                activeTab === 'balances'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Balances & Settle</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center space-x-2 transition flex-shrink-0 ${
                activeTab === 'analytics'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('recurring')}
              className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center space-x-2 transition flex-shrink-0 ${
                activeTab === 'recurring'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CalendarClock className="w-4 h-4" />
              <span>Recurring</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'scan' && (
          <div>
            {scannedData && receiptImage ? (
              <ReceiptReview
                initialData={scannedData}
                receiptImage={receiptImage}
                onSaveExpense={handleSaveScannedExpense}
                onCancel={handleCancelReview}
              />
            ) : (
              <ReceiptScanner
                onScanComplete={handleScanComplete}
                onSwitchToManual={() => setIsExpenseModalOpen(true)}
              />
            )}
          </div>
        )}

        {activeTab === 'expenses' && (
          <ExpensesListTab
            onScanReceipt={() => {
              setActiveTab('scan');
              setScannedData(null);
            }}
            onAddManual={() => setIsExpenseModalOpen(true)}
          />
        )}

        {activeTab === 'balances' && <BalancesTab />}

        {activeTab === 'analytics' && <AnalyticsTab />}

        {activeTab === 'recurring' && <RecurringTab />}
      </main>

      {/* Feature Badges Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Client-Side Privacy (Tesseract.js)</span>
            </span>
            <span className="flex items-center space-x-1">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Paise-Exact Rounding (0 Paisa Drift)</span>
            </span>
          </div>
          <div>
            Built for <b>Web Brawl GC 2026</b> · SplitSmart v1.0
          </div>
        </div>
      </footer>

      {/* Modals */}
      <GroupManager
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
      />

      <TestCasesModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />
    </div>
  );
};
