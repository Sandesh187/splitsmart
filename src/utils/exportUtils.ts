import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Group, Expense, Settlement, SimplifiedTransaction } from '../types';

export function exportGroupToJson(group: Group, expenses: Expense[], settlements: Settlement[]): void {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    group,
    expenses,
    settlements,
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${group.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_SplitSmart.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportSettlementToCsv(
  group: Group,
  settlements: SimplifiedTransaction[],
  memberMap: Record<string, string>
): void {
  const headers = ['From (Debtor)', 'To (Creditor)', 'Amount (INR)', 'Payee UPI ID'];
  const rows = settlements.map(s => [
    `"${memberMap[s.from] || s.from}"`,
    `"${memberMap[s.to] || s.to}"`,
    s.amount.toFixed(2),
    `"${group.members.find(m => m.id === s.to)?.upiId || 'N/A'}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${group.name}_Settlement_Summary.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportSummaryToPdf(
  group: Group,
  expenses: Expense[],
  simplifiedDebts: SimplifiedTransaction[],
  memberMap: Record<string, string>
): void {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(22, 163, 74); // brand green
  doc.text('SplitSmart Expense & Settlement Summary', 14, 20);

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Group: ${group.name} | Generated: ${new Date().toLocaleDateString()}`, 14, 28);

  // Simplified Settlements Table
  doc.setFontSize(14);
  doc.setTextColor(30);
  doc.text('Suggested Settlements (Debt Simplification)', 14, 40);

  const settlementRows = simplifiedDebts.map(s => [
    memberMap[s.from] || s.from,
    memberMap[s.to] || s.to,
    `INR ${s.amount.toFixed(2)}`,
    group.members.find(m => m.id === s.to)?.upiId || 'Not Set',
  ]);

  autoTable(doc, {
    startY: 45,
    head: [['Who Pays (Debtor)', 'To Whom (Creditor)', 'Amount', 'Payee UPI']],
    body: settlementRows.length > 0 ? settlementRows : [['All settled up!', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [22, 163, 74] },
  });

  // Expenses Table
  const lastY = (doc as any).lastAutoTable?.finalY || 80;
  doc.setFontSize(14);
  doc.setTextColor(30);
  doc.text('Expense Breakdown', 14, lastY + 15);

  const expenseRows = expenses.map(e => [
    e.title,
    memberMap[e.payerId] || e.payerId,
    e.category,
    e.date,
    `INR ${e.totalAmount.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: lastY + 20,
    head: [['Description', 'Paid By', 'Category', 'Date', 'Total']],
    body: expenseRows.length > 0 ? expenseRows : [['No expenses yet', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105] },
  });

  doc.save(`${group.name}_SplitSmart_Summary.pdf`);
}

/**
 * Generate shareable encoded link for group without backend
 */
export function generateShareUrl(group: Group, expenses: Expense[]): string {
  const payload = {
    g: group,
    e: expenses,
  };
  const json = JSON.stringify(payload);
  const base64 = btoa(encodeURIComponent(json));
  const url = new URL(window.location.href);
  url.searchParams.set('share', base64);
  return url.toString();
}

/**
 * Decode shared group data from URL if present
 */
export function decodeSharedData(): { group: Group; expenses: Expense[] } | null {
  try {
    const url = new URL(window.location.href);
    const shareParam = url.searchParams.get('share');
    if (!shareParam) return null;

    const json = decodeURIComponent(atob(shareParam));
    const data = JSON.parse(json);
    if (data && data.g && data.e) {
      return { group: data.g, expenses: data.e };
    }
  } catch (err) {
    console.error('Failed to parse share payload:', err);
  }
  return null;
}
