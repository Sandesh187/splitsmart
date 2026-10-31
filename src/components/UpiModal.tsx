import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { generateUpiLink, generateUpiQrCode, UpiPaymentDetails } from '../utils/upi';
import { X, QrCode, ExternalLink, CheckCircle2, Copy, Check } from 'lucide-react';

interface UpiModalProps {
  isOpen: boolean;
  onClose: () => void;
  details: {
    fromName: string;
    toName: string;
    fromId: string;
    toId: string;
    amount: number;
    payeeUpiId?: string;
  };
  onMarkSettled: () => void;
}

export const UpiModal: React.FC<UpiModalProps> = ({
  isOpen,
  onClose,
  details,
  onMarkSettled,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [upiLink, setUpiLink] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [customUpi, setCustomUpi] = useState<string>(details.payeeUpiId || '');

  const effectiveUpi = customUpi.trim() || 'splitsmart@upi';

  useEffect(() => {
    if (isOpen) {
      setCustomUpi(details.payeeUpiId || '');
      const paymentInfo: UpiPaymentDetails = {
        payeeUpiId: effectiveUpi,
        payeeName: details.toName,
        amount: details.amount,
        note: `SplitSmart: ${details.fromName} to ${details.toName}`,
      };

      const link = generateUpiLink(paymentInfo);
      setUpiLink(link);

      generateUpiQrCode(paymentInfo)
        .then(data => setQrDataUrl(data))
        .catch(e => console.error(e));
    }
  }, [isOpen, details, effectiveUpi]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(upiLink).then(() => {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    });
  };

  const handleSettle = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
    });
    onMarkSettled();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center">
          <div className="text-left">
            <h3 className="font-bold text-slate-800 text-base">UPI Settle-Up</h3>
            <p className="text-xs text-slate-500">Scan & pay with any UPI App</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transfer Header */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{details.fromName}</span> pays{' '}
            <span className="font-semibold text-slate-700">{details.toName}</span>
          </div>
          <div className="text-2xl font-black text-brand-600 mt-0.5">
            ₹{details.amount.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            Payee UPI ID: <span className="font-mono text-slate-600">{effectiveUpi}</span>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="bg-white p-3 border border-slate-200 rounded-2xl inline-block shadow-sm">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="UPI QR Code" className="w-52 h-52 mx-auto rounded-lg" />
          ) : (
            <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs">
              Generating QR Code...
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Deep link for mobile devices */}
          <a
            href={upiLink}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/20 transition"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open in UPI App (GPay / PhonePe)</span>
          </a>

          <div className="flex space-x-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 transition"
            >
              {copiedUpi ? <Check className="w-3.5 h-3.5 text-brand-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUpi ? 'Link Copied!' : 'Copy UPI Link'}</span>
            </button>

            <button
              onClick={handleSettle}
              className="flex-1 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
              <span>Mark as Settled</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
