import { ParsedItem, Category } from '../types';

export interface RawOcrWord {
  text: string;
  confidence: number;
}

export interface RawOcrLine {
  text: string;
  confidence: number;
  words: RawOcrWord[];
}

export interface ParsedReceiptData {
  items: ParsedItem[];
  subtotal: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  serviceCharge: number;
  discount: number;
  detectedTotal: number;
  rawText: string;
  validationDiff: number; // detectedTotal - computedTotal
  isValidTotal: boolean;
  warnings: string[];
}

// Quick keyword categorizer
export function categorizeItem(name: string): Category {
  const lower = name.toLowerCase();
  
  if (/(pizza|burger|maggi|chai|coffee|biryani|roti|paneer|chicken|dosa|sandwich|roll|thali|coke|pepsi|beverage|drink|snack|curry|dal|rice|bread|dessert|cake|ice cream|momos)/i.test(lower)) {
    return 'Food';
  }
  if (/(milk|curd|egg|fruit|apple|banana|vegetable|onion|potato|atta|oil|butter|cheese|grocery|biscuit|soap|shampoo|toothpaste)/i.test(lower)) {
    return 'Groceries';
  }
  if (/(uber|ola|rapido|auto|cab|train|metro|bus|petrol|fuel|diesel|flight|toll|parking)/i.test(lower)) {
    return 'Travel';
  }
  if (/(wifi|wi-fi|recharge|electricity|water|gas|bill|cylinder|maid|broadband|rent)/i.test(lower)) {
    return 'Utilities';
  }
  if (/(movie|cinema|netflix|spotify|game|bowling|arcade|concert|show|ticket)/i.test(lower)) {
    return 'Entertainment';
  }
  return 'Food'; // default for hostel receipts
}

// Noise filters
const NOISE_PATTERNS = [
  /gstin[:\s]*[0-9A-Z]{15}/i,
  /tax\s*invoice/i,
  /cash\s*memo/i,
  /fssai/i,
  /phone[:\s]*\+?[0-9\- ]{8,}/i,
  /tel[:\s]*\+?[0-9\- ]{8,}/i,
  /mob[:\s]*\+?[0-9\- ]{8,}/i,
  /address|road|street|nagar|floor|marg|lane|pin\s*code|pincode/i,
  /thank\s*you/i,
  /visit\s*again/i,
  /date\s*[:\s]*[0-9\/\-\.]+/i,
  /time\s*[:\s]*[0-9\:]+/i,
  /table\s*no/i,
  /bill\s*no|invoice\s*no|token\s*no/i,
  /duplicate\s*copy|customer\s*copy/i,
  /order\s*id|pos\s*terminal/i,
];

// Price regex: matches currency amounts like 120, 120.00, 1,200.50, ₹ 250
const PRICE_REGEX = /(?:₹|rs\.?|inr)?\s*([0-9]{1,4}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?)\s*$/i;

export function parseReceiptText(lines: RawOcrLine[]): ParsedReceiptData {
  const items: ParsedItem[] = [];
  let subtotal = 0;
  let taxAmount = 0;
  let cgst = 0;
  let sgst = 0;
  let serviceCharge = 0;
  let discount = 0;
  let detectedTotal = 0;
  const warnings: string[] = [];

  const fullRawText = lines.map(l => l.text).join('\n');

  lines.forEach((lineObj, lineIndex) => {
    let text = lineObj.text.trim();
    if (!text || text.length < 2) return;

    // Filter noise
    if (NOISE_PATTERNS.some(p => p.test(text))) {
      return;
    }

    // Check for Grand Total line
    if (/(?:grand\s*total|net\s*amount|total\s*amount|total\s*payable|final\s*total|^total)\b/i.test(text)) {
      const match = text.match(/([0-9]+(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?)\s*$/);
      if (match) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(val)) detectedTotal = Math.max(detectedTotal, val);
      }
      return;
    }

    // Check for Subtotal line
    if (/sub\s*total|sub-total|items\s*total/i.test(text)) {
      const match = text.match(/([0-9]+(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?)\s*$/);
      if (match) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(val)) subtotal = val;
      }
      return;
    }

    // Check for CGST line
    if (/\bcgst\b/i.test(text)) {
      const match = text.match(/([0-9]+(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?)\s*$/);
      if (match) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(val)) cgst += val;
      }
      return;
    }

    // Check for SGST line
    if (/\bsgst\b/i.test(text)) {
      const match = text.match(/([0-9]+(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?)\s*$/);
      if (match) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(val)) sgst += val;
      }
      return;
    }

    // Check generic Tax/GST line
    if (/\b(?:gst|vat|tax)\b/i.test(text)) {
      const match = text.match(/([0-9]+(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?)\s*$/);
      if (match) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(val)) taxAmount += val;
      }
      return;
    }

    // Check Service Charge / Packing line
    if (/service\s*charge|service\s*fee|packing\s*charge|delivery\s*fee/i.test(text)) {
      const match = text.match(/([0-9]+(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?)\s*$/);
      if (match) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(val)) serviceCharge += val;
      }
      return;
    }

    // Check Discount line
    if (/discount|offer|coupon|less/i.test(text)) {
      const match = text.match(/([0-9]+(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?)\s*$/);
      if (match) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(val)) discount += val;
      }
      return;
    }

    // Line item extraction: Looking for Item Description [Qty] [Price] LineTotal
    const priceMatch = text.match(PRICE_REGEX);
    if (priceMatch) {
      const lineTotal = parseFloat(priceMatch[1].replace(/,/g, ''));
      if (isNaN(lineTotal) || lineTotal <= 0) return;

      let remaining = text.substring(0, priceMatch.index).trim();
      let quantity = 1;
      let unitPrice = lineTotal;

      // Check for quantity patterns: e.g. "2 x 150", "2x", "Qty: 3", or leading "2 "
      const qtyMatch1 = remaining.match(/(\d+)\s*(?:x|\*|@)\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
      const qtyMatch2 = remaining.match(/(?:qty|qnty|count)[:\s]*(\d+)/i);
      const leadingQtyMatch = remaining.match(/^(\d+)\s+([A-Za-z].*)/);

      if (qtyMatch1) {
        quantity = parseInt(qtyMatch1[1], 10);
        const parsedUnit = parseFloat(qtyMatch1[2]);
        if (!isNaN(parsedUnit)) unitPrice = parsedUnit;
        remaining = remaining.replace(qtyMatch1[0], '').trim();
      } else if (qtyMatch2) {
        quantity = parseInt(qtyMatch2[1], 10);
        remaining = remaining.replace(qtyMatch2[0], '').trim();
        unitPrice = Number((lineTotal / (quantity || 1)).toFixed(2));
      } else if (leadingQtyMatch && parseInt(leadingQtyMatch[1], 10) <= 20) {
        // e.g. "2 Veg Burger"
        quantity = parseInt(leadingQtyMatch[1], 10);
        remaining = leadingQtyMatch[2].trim();
        unitPrice = Number((lineTotal / (quantity || 1)).toFixed(2));
      }

      // Clean item name
      const itemName = remaining.replace(/[-*._|]/g, ' ').replace(/\s+/g, ' ').trim();

      // If valid name and price
      if (itemName.length >= 2 && !/^(total|subtotal|balance|change|cash)$/i.test(itemName)) {
        items.push({
          id: `item-${Date.now()}-${lineIndex}`,
          name: itemName,
          quantity,
          unitPrice,
          lineTotal,
          confidence: lineObj.confidence ?? 80,
          assignedMemberIds: [],
          category: categorizeItem(itemName),
        });
      }
    }
  });

  // Consolidate taxes: if CGST & SGST were detected, add them to taxAmount
  if (cgst > 0 || sgst > 0) {
    taxAmount = Number((taxAmount + cgst + sgst).toFixed(2));
  }

  // Calculate computed subtotal if not detected
  const computedSubtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  if (subtotal === 0) {
    subtotal = Number(computedSubtotal.toFixed(2));
  }

  // Calculated Grand Total
  const calculatedGrandTotal = Number((subtotal + taxAmount + serviceCharge - discount).toFixed(2));

  // If detectedTotal was 0, fall back to calculatedGrandTotal
  if (detectedTotal === 0) {
    detectedTotal = calculatedGrandTotal;
  }

  // Validation
  const validationDiff = Number((calculatedGrandTotal - detectedTotal).toFixed(2));
  const isValidTotal = Math.abs(validationDiff) < 0.05;

  if (!isValidTotal) {
    warnings.push(
      `Total mismatch: Parsed items + taxes sum to ₹${calculatedGrandTotal.toFixed(2)}, but detected total is ₹${detectedTotal.toFixed(2)} (diff: ₹${Math.abs(validationDiff).toFixed(2)}). Please verify items.`
    );
  }

  if (items.length === 0) {
    warnings.push('No receipt items could be automatically recognized. You can add items manually.');
  }

  return {
    items,
    subtotal,
    taxAmount,
    cgst,
    sgst,
    serviceCharge,
    discount,
    detectedTotal,
    rawText: fullRawText,
    validationDiff,
    isValidTotal,
    warnings,
  };
}
