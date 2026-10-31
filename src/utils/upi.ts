import QRCode from 'qrcode';

export interface UpiPaymentDetails {
  payeeUpiId: string;
  payeeName: string;
  amount: number;
  note?: string;
}

/**
 * Generate standard NPCI UPI URI
 * upi://pay?pa={vpa}&pn={name}&am={amount}&tn={note}&cu=INR
 */
export function generateUpiLink(details: UpiPaymentDetails): string {
  const { payeeUpiId, payeeName, amount, note } = details;
  const formattedAmount = amount.toFixed(2);
  const encodedName = encodeURIComponent(payeeName.trim());
  const encodedNote = encodeURIComponent(note || `SplitSmart: Settlement for ${payeeName}`);
  const vpa = encodeURIComponent(payeeUpiId.trim());

  return `upi://pay?pa=${vpa}&pn=${encodedName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}`;
}

/**
 * Generate QR code data URL (PNG) from UPI string
 */
export async function generateUpiQrCode(details: UpiPaymentDetails): Promise<string> {
  const upiUri = generateUpiLink(details);
  try {
    const dataUrl = await QRCode.toDataURL(upiUri, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate UPI QR code:', err);
    throw err;
  }
}
