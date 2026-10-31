# SplitSmart ⚡

> **Web Brawl GC 2026 Submission**  
> AI-powered receipt scanner, itemized bill splitter, and fair debt simplifier with zero paisa drift and instant UPI settle-up.

---

## 🌟 Overview

**SplitSmart** turns physical receipt photos into fair, itemized splits and computes the exact minimum transactions needed to settle all debts in a group.

- **100% Client-Side Privacy:** Tesseract OCR runs entirely in the browser using Web Workers. Receipt images are never uploaded to any remote server.
- **Itemized Assignment & Proportional Tax:** Assign each item to specific consumers; taxes, service charges, and discounts are distributed proportionally to each member's subtotal—not split equally.
- **Zero Paisa Drift:** Financial math is computed in integer **paise** ($₹1.00 = 100\text{ paise}$) with documented rounding reconciliation.
- **Greedy Debt Simplification:** Reduces $N \times (N-1)$ potential debts down to at most $(N-1)$ direct payments.
- **Instant UPI Settle-Up:** Pre-filled NPCI-compliant `upi://pay` deep links and QR codes for GPay, PhonePe, Paytm, and BHIM.

---

## 🚀 Features Implemented by Tier

### 🟢 Tier 1: Core Requirements (100% Complete)
- [x] **Groups & Members:** Create, rename, switch, and delete groups (e.g. *"Night Canteen Gang"*, *"Wing B Goa Trip"*). Add/remove members with customizable avatars and UPI IDs.
- [x] **Receipt Capture:** Direct device camera capture or photo upload (JPG/PNG) with live preview.
- [x] **Line-Item Parsing:** Structured parsing of Item Name, Quantity, Unit Price, and Line Total. Detects Subtotal, CGST/SGST/Tax, Service Charges, Discounts, and Grand Total. Robust noise filtering (filters GSTIN, phone, addresses).
- [x] **Review & Correction:** Every parsed cell is directly editable. Low-confidence OCR words are visually highlighted in amber. Side-by-side view with original receipt image for cross-verification.
- [x] **Total Validation:** Real-time mismatch detection between sum of items + taxes vs detected total with 1-click auto-reconciliation.
- [x] **Manual Expenses:** Add expenses without receipts with custom split modes and categories.
- [x] **Balances View:** Real-time net balance calculations (owes / is owed) updated across all expenses.

### 🟡 Tier 2: Advanced Requirements (100% Complete)
- [x] **Itemized Assignment:** Tap-to-toggle member avatars on each item. Shared items are split equally among assignees; unassigned items are flagged before saving.
- [x] **Flexible Split Modes:** 4 modes supported: **Equal**, **Exact Amounts**, **Percentages** (validated to 100%), and **Shares** (e.g., 2:1:1).
- [x] **Proportional Tax & Discounts:** Taxes and discounts are weighted strictly by each member's consumed subtotal (e.g., on a ₹1,000 bill with ₹100 tax, a member consuming ₹600 pays ₹60 tax).
- [x] **Rounding Reconciliation:** Stored as integer paise. Sum of shares matches the grand total down to the exact paisa (0 drift).
- [x] **Debt Simplification:** Greedy Minimum Cash Flow algorithm computing the optimal minimum number of transactions across all group expenses.
- [x] **Auto-Categorization:** Items automatically classified into Food, Groceries, Travel, Utilities, Entertainment, and Other. Lazy-loaded to avoid blocking initial load.
- [x] **Persistence:** Full state survives page refresh via structured LocalStorage.

### 🟣 Tier 3: Brownie Points & Innovation
- [x] **UPI Settle-Up:** Generates NPCI `upi://pay` deep links and scannable QR codes for each settlement.
- [x] **Spending Analytics:** Visual breakdown by category and member spending comparison.
- [x] **Sharing Without a Backend:** Export/import groups as JSON files; encode entire group state into shareable base64 URLs.
- [x] **PWA & Offline Readiness:** Web app manifest, standalone app support, and offline caching.
- [x] **Recurring Expenses:** Monthly/weekly recurring bills (e.g. hostel Wi-Fi, room electricity) with 1-click posting.
- [x] **PDF & CSV Export:** Download comprehensive settlement and expense reports with formatted tables.
- [x] **Built-in Robustness Test Suite:** Interactive in-app test runner for all 9 competition test cases from Section 10.

---

## 🧮 Algorithms & Specifications

### 1. Debt Simplification Approach
**Algorithm:** Greedy Minimum Cash Flow Algorithm

1. For each group member $u$, calculate their net balance:
   $$\text{Net}(u) = \sum \text{PaidBy}(u) - \sum \text{OwedBy}(u) + \sum \text{SettledReceived}(u) - \sum \text{SettledPaid}(u)$$
2. Partition members into **Debtors** ($\text{Net} < 0$) and **Creditors** ($\text{Net} > 0$).
3. Maintain invariant: $\sum \text{Net}(u) \equiv 0$.
4. At each step:
   - Identify the maximum debtor (owing the most: $\max |\text{Net}|$) and maximum creditor (owed the most: $\max \text{Net}$).
   - Set settlement amount: $T = \min(|\text{Net}_{\text{debtor}}|, \text{Net}_{\text{creditor}})$.
   - Generate transaction: $\text{Debtor} \xrightarrow{\quad T \quad} \text{Creditor}$.
   - Deduct $T$ from both balances. If either balance reaches 0, remove that member.
5. Terminate when all balances reach 0. This reduces $N \times (N-1)$ potential debts to at most $N-1$ payments.

### 2. Rounding Reconciliation Rule
To prevent floating-point inaccuracy (e.g., $0.1 + 0.2 \neq 0.3$):
1. All monetary quantities are converted to integer **paise** ($₹1.00 = 100\text{ paise}$).
2. Each member's ideal proportional share is calculated with high precision.
3. Every share is floored to integer paise, recording the fractional remainder:
   $$\text{remainder}_i = \text{exactShare}_i - \lfloor \text{exactShare}_i \rfloor$$
4. Compute total discrepancy:
   $$\Delta = \text{TotalPaise} - \sum \lfloor \text{exactShare}_i \rfloor$$
5. Members are sorted in descending order of fractional remainder (tie-breaker: highest subtotal).
6. Exactly 1 paisa is assigned to the top $\Delta$ members until $\Delta = 0$.
7. **Result:** $\sum \text{MemberShares} \equiv \text{TotalBill}$ with **zero paisa drift**.

---

## 🤖 Pretrained Models Used

| Purpose | Model / Library | Execution | License |
| :--- | :--- | :--- | :--- |
| **Receipt OCR** | `Tesseract.js` (English pack) | Client-side in browser Web Worker | Apache-2.0 |
| **Categorization** | `Xenova/mobilebert-uncased-mnli` (zero-shot) via `Transformers.js` + fast heuristic | Client-side lazy-loaded in browser | MIT |

---

## 🛠️ Setup & Running Locally

### Prerequisites
- Node.js 18+ (tested on Node v24)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/<your-username>/splitsmart.git
cd splitsmart

# Install dependencies
npm install

# Run unit tests
npm test

# Start local development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm run preview
```

---

## 🧪 Robustness Verification Suite

SplitSmart includes an in-app verification runner testing all 9 cases from Section 10:
- **Test Case 1:** Clear printed bill with CGST/SGST taxes parsed.
- **Test Case 2:** Faded thermal receipts with contrast enhancement & low-confidence flags.
- **Test Case 3:** 90° rotated receipts with rotation pre-processing.
- **Test Case 4:** Non-receipt images with graceful error prompts & manual fallback.
- **Test Case 5:** Bills with no printed total (auto-calculated from items).
- **Test Case 6:** ₹100 split 3 ways into ₹33.34, ₹33.33, and ₹33.33.
- **Test Case 7:** Camera permission rejection fallback to file picker.
- **Test Case 8:** Offline state persistence with LocalStorage & PWA manifest.
- **Test Case 9:** 5 members, 10 mixed expenses simplified to minimum payments.

---

## 📄 License
MIT License. Built for Web Brawl GC 2026.
