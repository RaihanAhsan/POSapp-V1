'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/formatters';
import { Banknote, CreditCard, QrCode, X, CheckCircle2 } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onConfirmPayment: (paymentMethod: 'cash' | 'card' | 'qris', cashReceived?: number) => Promise<void>;
  isProcessing: boolean;
}

export default function PaymentModal({
  isOpen,
  onClose,
  totalAmount,
  onConfirmPayment,
  isProcessing,
}: PaymentModalProps) {
  const [method, setMethod] = useState<'cash' | 'card' | 'qris'>('cash');
  const [cashReceived, setCashReceived] = useState<number>(totalAmount);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCashReceived(totalAmount);
    setError(null);
  }, [totalAmount, isOpen]);

  if (!isOpen) return null;

  const changeDue = method === 'cash' ? Math.max(0, cashReceived - totalAmount) : 0;
  const isCashInsufficient = method === 'cash' && cashReceived < totalAmount;

  const quickCashOptions = [
    { label: 'Exact', value: totalAmount },
    { label: '$10', value: 10 },
    { label: '$20', value: 20 },
    { label: '$50', value: 50 },
    { label: '$100', value: 100 },
  ].filter((opt) => opt.value >= totalAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isCashInsufficient) {
      setError('Cash received is less than the total amount due.');
      return;
    }

    try {
      await onConfirmPayment(method, method === 'cash' ? cashReceived : undefined);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to process payment.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      {/* Backdrop overlay for desktop */}
      <div className="fixed inset-0 hidden sm:block bg-transparent" onClick={onClose} aria-hidden="true" />

      {/* Dialog container: Fullscreen on mobile (<sm), centered rounded card on desktop (>=sm) */}
      <div className="relative z-10 bg-slate-900 border-0 sm:border border-slate-800 rounded-none sm:rounded-2xl w-full min-h-screen sm:min-h-0 sm:max-w-lg flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-white">Process Payment</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            aria-label="Close Payment Dialog"
            className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs sm:text-sm">
              {error}
            </div>
          )}

          {/* Grand Total Callout */}
          <div className="bg-slate-800/80 rounded-2xl p-4 text-center border border-slate-700/60 shadow-inner">
            <span className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-slate-400">
              Total Amount Due
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 tabular-nums">
              {formatCurrency(totalAmount)}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMethod('cash');
                  setCashReceived(totalAmount);
                }}
                className={`flex flex-col items-center justify-center min-h-[56px] p-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition cursor-pointer active:scale-[0.98] ${
                  method === 'cash'
                    ? 'bg-emerald-600/25 border-emerald-500 text-white shadow-md shadow-emerald-950/40'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Banknote className="h-5 w-5 mb-1 text-emerald-400" />
                <span>Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('card')}
                className={`flex flex-col items-center justify-center min-h-[56px] p-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition cursor-pointer active:scale-[0.98] ${
                  method === 'card'
                    ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-md shadow-indigo-950/40'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <CreditCard className="h-5 w-5 mb-1 text-indigo-400" />
                <span>Card</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('qris')}
                className={`flex flex-col items-center justify-center min-h-[56px] p-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition cursor-pointer active:scale-[0.98] ${
                  method === 'qris'
                    ? 'bg-teal-600/25 border-teal-500 text-white shadow-md shadow-teal-950/40'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <QrCode className="h-5 w-5 mb-1 text-teal-400" />
                <span>QR / Digital</span>
              </button>
            </div>
          </div>

          {/* Cash Mode Details */}
          {method === 'cash' && (
            <div className="space-y-4 pt-3 border-t border-slate-800">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Cash Received ($ USD)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={totalAmount}
                  step={1}
                  value={cashReceived || ''}
                  onChange={(e) => setCashReceived(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-xl font-black tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[50px]"
                />
              </div>

              {/* Quick Cash Buttons >= 44px */}
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Quick Cash Suggestions
                </span>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                  {quickCashOptions.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setCashReceived(opt.value)}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 active:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition cursor-pointer tabular-nums text-center"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Change Display */}
              <div className="p-3.5 bg-slate-800/60 rounded-xl flex items-center justify-between border border-slate-700/50">
                <span className="text-xs sm:text-sm text-slate-300 font-medium">Change Due:</span>
                <span
                  className={`text-lg sm:text-xl font-black tabular-nums ${
                    changeDue > 0 ? 'text-amber-400' : 'text-slate-400'
                  }`}
                >
                  {formatCurrency(changeDue)}
                </span>
              </div>
            </div>
          )}

          {/* Sticky Actions in Modal Footer */}
          <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-md pt-4 pb-2 border-t border-slate-800 flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 min-h-[48px] py-3 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || isCashInsufficient}
              className="flex-2 min-h-[48px] py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white text-sm font-bold shadow-lg shadow-emerald-600/30 transition disabled:opacity-40 flex items-center justify-center cursor-pointer"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1.5 shrink-0" />
                  <span>Complete Payment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
