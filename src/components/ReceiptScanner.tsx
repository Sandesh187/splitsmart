import React, { useState, useRef, useEffect } from 'react';
import { createWorker } from 'tesseract.js';
import {
  Camera,
  Upload,
  RotateCw,
  Sliders,
  Sparkles,
  AlertCircle,
  FileCheck2,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { parseReceiptText, RawOcrLine, ParsedReceiptData } from '../utils/ocrParser';

interface ReceiptScannerProps {
  onScanComplete: (data: ParsedReceiptData, imageSrc: string) => void;
  onSwitchToManual: () => void;
}

// Built-in sample receipt images rendered via canvas for judges to test in 1-click
function generateSampleReceiptCanvas(type: 'canteen' | 'faded' | 'rotated'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 440;
  canvas.height = 620;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (type === 'rotated') {
    canvas.width = 620;
    canvas.height = 440;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 620, 440);
    ctx.translate(310, 220);
    ctx.rotate((90 * Math.PI) / 180);
    ctx.translate(-220, -310);
  } else {
    ctx.fillStyle = type === 'faded' ? '#faf7ee' : '#ffffff';
    ctx.fillRect(0, 0, 440, 620);
  }

  // Draw simulated receipt text
  ctx.fillStyle = type === 'faded' ? '#8a8579' : '#1e293b';
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('NIGHT CANTEEN HOSTEL 12', 220, 45);

  ctx.font = '12px monospace';
  ctx.fillText('GSTIN: 27AABCS1429B1Z8', 220, 70);
  ctx.fillText('Date: 31-Oct-2026 23:15', 220, 90);
  ctx.fillText('------------------------------------------', 220, 110);

  ctx.textAlign = 'left';
  ctx.font = '13px monospace';
  let y = 140;

  const items = [
    { qty: '1', name: 'Large Cheese Pizza', price: '480.00' },
    { qty: '2', name: 'Peri Peri Maggi', price: '140.00' },
    { qty: '2', name: 'Cold Coffee with Ice Cream', price: '180.00' },
  ];

  items.forEach(item => {
    ctx.fillText(`${item.qty}  ${item.name}`, 30, y);
    ctx.fillText(item.price, 360, y);
    y += 35;
  });

  y += 20;
  ctx.fillText('------------------------------------------', 30, y);
  y += 30;

  ctx.fillText('Sub Total', 30, y);
  ctx.fillText('800.00', 360, y);
  y += 25;

  ctx.fillText('CGST (2.5%)', 30, y);
  ctx.fillText('20.00', 360, y);
  y += 25;

  ctx.fillText('SGST (2.5%)', 30, y);
  ctx.fillText('20.00', 360, y);
  y += 30;

  ctx.font = 'bold 15px monospace';
  ctx.fillText('GRAND TOTAL', 30, y);
  ctx.fillText('840.00', 360, y);

  y += 40;
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('*** THANK YOU VISIT AGAIN ***', 220, y);

  return canvas.toDataURL('image/png');
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onScanComplete, onSwitchToManual }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [contrastBoost, setContrastBoost] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Handle selected image file
  const handleImageFile = (file: File) => {
    setErrorMessage(null);
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG or PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      setImageSrc(e.target?.result as string);
      setRotation(0);
    };
    reader.readAsDataURL(file);
  };

  // Render transformed image on canvas for Tesseract preprocessing
  const getProcessedCanvas = (): HTMLCanvasElement | null => {
    if (!imageSrc) return null;
    const img = new Image();
    img.src = imageSrc;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const isRotated = rotation % 180 !== 0;
    canvas.width = isRotated ? img.naturalHeight || img.height : img.naturalWidth || img.width;
    canvas.height = isRotated ? img.naturalWidth || img.width : img.naturalHeight || img.height;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();

    // Contrast boost & grayscale filter if enabled
    if (contrastBoost) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;
      const contrast = 1.35;
      const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

      for (let i = 0; i < d.length; i += 4) {
        // Luminance grayscale
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const enhanced = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
        d[i] = enhanced;
        d[i + 1] = enhanced;
        d[i + 2] = enhanced;
      }
      ctx.putImageData(imgData, 0, 0);
    }

    return canvas;
  };

  // Execute Tesseract OCR in browser
  const runOcr = async () => {
    if (!imageSrc) return;

    try {
      setIsProcessing(true);
      setProgressPercent(5);
      setProgressStatus('Initializing OCR engine...');

      const canvas = getProcessedCanvas();
      const input = canvas ? canvas.toDataURL('image/png') : imageSrc;

      const worker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            const pct = Math.round((m.progress || 0) * 100);
            setProgressPercent(pct);
            setProgressStatus(`Extracting receipt text: ${pct}%`);
          } else {
            setProgressStatus(m.status);
          }
        },
      });

      setProgressStatus('Analyzing receipt line items...');
      const ret = await worker.recognize(input);
      await worker.terminate();

      // Extract lines and confidence
      const rawLines: RawOcrLine[] = (ret.data.lines || []).map((l: any) => ({
        text: l.text,
        confidence: l.confidence ?? 80,
        words: (l.words || []).map((w: any) => ({
          text: w.text,
          confidence: w.confidence ?? 80,
        })),
      }));

      // Parse with our receipt engine
      const parsedData = parseReceiptText(rawLines);

      if (parsedData.items.length === 0) {
        setErrorMessage(
          'No receipt line items were detected. This might be a faded, unclear, or non-receipt image. You can rotate/adjust contrast and try again, or enter items manually.'
        );
        setIsProcessing(false);
        return;
      }

      setIsProcessing(false);
      onScanComplete(parsedData, input);
    } catch (err: any) {
      console.error('OCR recognition error:', err);
      setErrorMessage(`OCR failed: ${err.message || 'Unknown error'}. Please try again or enter manually.`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Banner / Call to Action */}
      <div className="bg-gradient-to-r from-emerald-600 to-brand-600 rounded-2xl p-6 text-white shadow-lg shadow-brand-500/10">
        <h2 className="text-xl sm:text-2xl font-bold">Scan & Itemize Receipt</h2>
        <p className="text-emerald-100 text-sm mt-1 max-w-xl">
          Take a photo or upload a canteen bill. Tesseract OCR will extract line items, taxes, and totals
          entirely in your browser—no receipt images are ever sent to a server.
        </p>

        {/* Quick Sample Receipts for Judges */}
        <div className="mt-4 pt-4 border-t border-white/20 flex items-center space-x-2 flex-wrap gap-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Sample Receipts:</span>
          </span>
          <button
            onClick={() => {
              const src = generateSampleReceiptCanvas('canteen');
              setImageSrc(src);
              setRotation(0);
            }}
            className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-medium backdrop-blur-sm transition"
          >
            Night Canteen Bill (₹840)
          </button>
          <button
            onClick={() => {
              const src = generateSampleReceiptCanvas('faded');
              setImageSrc(src);
              setRotation(0);
            }}
            className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-medium backdrop-blur-sm transition"
          >
            Faded Receipt
          </button>
          <button
            onClick={() => {
              const src = generateSampleReceiptCanvas('rotated');
              setImageSrc(src);
              setRotation(90);
            }}
            className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-medium backdrop-blur-sm transition"
          >
            Rotated 90° Bill
          </button>
        </div>
      </div>

      {/* Main Upload / Camera Box */}
      {!imageSrc ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8 sm:p-12 text-center hover:border-brand-500 transition shadow-sm">
          <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Upload or Snap Your Receipt</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Supports JPG & PNG. Clear, well-lit photos give the fastest and most accurate parsing.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-brand-600/20 transition"
            >
              <Camera className="w-5 h-5" />
              <span>Use Camera</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl flex items-center justify-center space-x-2 transition"
            >
              <Upload className="w-5 h-5 text-slate-600" />
              <span>Upload Photo</span>
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center">
            <button
              onClick={onSwitchToManual}
              className="text-sm text-brand-600 hover:text-brand-700 font-semibold flex items-center space-x-1"
            >
              <FileText className="w-4 h-4" />
              <span>Or add expense manually without receipt</span>
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={e => e.target.files?.[0] && handleImageFile(e.target.files[0])}
            className="hidden"
          />
          <input
            type="file"
            ref={cameraInputRef}
            accept="image/*"
            capture="environment"
            onChange={e => e.target.files?.[0] && handleImageFile(e.target.files[0])}
            className="hidden"
          />
        </div>
      ) : (
        /* Image Preview & Pre-processing Controls */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center space-x-2">
              <FileCheck2 className="w-5 h-5 text-brand-600" />
              <span>Image Preview & Enhancement</span>
            </h3>
            <button
              onClick={() => setImageSrc(null)}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium"
            >
              Choose different image
            </button>
          </div>

          {/* Transformation Controls */}
          <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-200 flex-wrap gap-y-2">
            <button
              onClick={() => setRotation(r => (r + 90) % 360)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-sm"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Rotate 90° ({rotation}°)</span>
            </button>

            <button
              onClick={() => setContrastBoost(c => !c)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm border ${
                contrastBoost
                  ? 'bg-brand-50 border-brand-300 text-brand-700'
                  : 'bg-white border-slate-300 text-slate-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Enhance Contrast {contrastBoost ? '✓' : ''}</span>
            </button>
            <span className="text-[11px] text-slate-500">
              Preprocessing with grayscale & contrast improves faded receipts
            </span>
          </div>

          {/* Image Display */}
          <div className="max-h-[400px] overflow-auto rounded-xl border border-slate-200 bg-slate-900/5 flex items-center justify-center p-4">
            <img
              src={imageSrc}
              alt="Receipt Preview"
              style={{
                transform: `rotate(${rotation}deg)`,
                filter: contrastBoost ? 'contrast(135%) grayscale(100%)' : 'none',
                maxHeight: '360px',
                transition: 'transform 0.2s ease',
              }}
              className="rounded-lg shadow-md max-w-full object-contain"
            />
          </div>

          {/* Progress Indicator */}
          {isProcessing && (
            <div className="space-y-2 bg-brand-50 p-4 rounded-xl border border-brand-200">
              <div className="flex justify-between text-xs font-semibold text-brand-900">
                <span>{progressStatus}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 bg-brand-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-600 transition-all duration-200 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message & Graceful Fallback */}
          {errorMessage && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-start space-x-2 text-amber-900 text-sm font-medium">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
              <div className="flex space-x-2 pt-1">
                <button
                  onClick={onSwitchToManual}
                  className="text-xs font-semibold text-brand-700 hover:text-brand-800 underline"
                >
                  Enter items manually instead →
                </button>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={runOcr}
              disabled={isProcessing}
              className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-brand-600/20 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isProcessing ? 'Processing Receipt...' : 'Run OCR & Parse Receipt'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
