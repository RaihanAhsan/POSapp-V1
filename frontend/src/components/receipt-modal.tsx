'use client';

import React from 'react';
import { TransactionDetail } from '@/lib/types';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { Printer, Check, X } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionDetail | null;
}

export default function ReceiptModal({ isOpen, onClose, transaction }: ReceiptModalProps) {
  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm print:p-0 print:bg-white overflow-y-auto">
      {/* Backdrop overlay for desktop */}
      <div className="fixed inset-0 hidden sm:block bg-transparent print:hidden" onClick={onClose} aria-hidden="true" />

      {/* Container: Fullscreen on mobile, centered card on desktop */}
      <div className="relative z-10 bg-slate-900 border-0 sm:border border-slate-800 rounded-none sm:rounded-2xl w-full min-h-screen sm:min-h-0 sm:max-w-md flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:w-full print:max-w-none print:bg-white print:text-black print:min-h-0 my-auto">
        {/* Modal Controls - Hidden during print */}
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between print:hidden">
          <div className="flex items-center text-emerald-400 font-bold text-sm">
            <Check className="h-5 w-5 mr-1.5 shrink-0" />
            <span>Transaction Successful</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Receipt Dialog"
            className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Printable Receipt Paper Container (Scrollable) */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6 font-mono text-xs bg-slate-950 text-slate-200 border-y sm:border-y-0 border-slate-800 print:bg-white print:text-black print:border-none print:p-2">
          {/* Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-700 print:border-black">
            <h2 className="text-base font-bold uppercase tracking-wider text-white print:text-black">
              POSv1 Retail POS
            </h2>
            <p className="text-[11px] text-slate-400 print:text-black">Retail Store & Checkout Point</p>
            <p className="text-[11px] text-slate-400 print:text-black">Customer Service: support@posv1.local</p>
          </div>

          {/* Meta Info */}
          <div className="py-3 border-b border-dashed border-slate-700 print:border-black space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400 print:text-black">Invoice No:</span>
              <span className="font-bold text-white print:text-black">{transaction.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 print:text-black">Date & Time:</span>
              <span className="tabular-nums">{formatDateTime(transaction.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 print:text-black">Cashier:</span>
              <span>{transaction.cashier.name}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-3 border-b border-dashed border-slate-700 print:border-black space-y-2">
            {transaction.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="font-semibold text-white print:text-black">{item.product_name}</div>
                <div className="flex justify-between text-slate-400 print:text-black">
                  <span className="tabular-nums">
                    {item.quantity} x {formatCurrency(item.price_at_sale)}
                  </span>
                  <span className="font-bold text-slate-200 print:text-black tabular-nums">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Payment & Totals */}
          <div className="pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-sm font-bold text-white print:text-black">
              <span>TOTAL</span>
              <span className="tabular-nums">{formatCurrency(transaction.total_amount)}</span>
            </div>
            <div className="flex justify-between text-slate-400 print:text-black">
              <span>Payment Method:</span>
              <span className="uppercase font-semibold">{transaction.payment_method}</span>
            </div>
            {transaction.cash_received != null && (
              <div className="flex justify-between text-slate-400 print:text-black">
                <span>Cash Received:</span>
                <span className="tabular-nums">{formatCurrency(transaction.cash_received)}</span>
              </div>
            )}
            {transaction.change_given != null && (
              <div className="flex justify-between text-slate-400 print:text-black">
                <span>Change Due:</span>
                <span className="font-bold text-amber-400 print:text-black tabular-nums">
                  {formatCurrency(transaction.change_given)}
                </span>
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="text-center pt-5 pb-2 text-[10px] text-slate-500 print:text-black">
            <p>Thank you for shopping at POSv1!</p>
            <p>Please retain this receipt for your records.</p>
          </div>
        </div>

        {/* Sticky Actions in Modal Footer - Hidden during print */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-md p-4 border-t border-slate-800 flex space-x-3 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[48px] py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold transition cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 min-h-[48px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white text-sm font-bold flex items-center justify-center transition shadow-lg shadow-emerald-600/20 cursor-pointer"
          >
            <Printer className="h-4 w-4 mr-2" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
}
