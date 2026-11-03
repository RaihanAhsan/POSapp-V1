'use client';

import React, { useState, useEffect } from 'react';
import { TransactionDetail } from '@/lib/types';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import ReceiptModal from '@/components/receipt-modal';
import { Clock, Eye, AlertCircle, ShoppingBag, Receipt } from 'lucide-react';

export default function ShiftHistoryPage() {
  const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<TransactionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchShiftTransactions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiRequest<TransactionDetail[]>('/transactions');
      setTransactions(data || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load shift transaction history.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShiftTransactions();
  }, []);

  const totalShiftSales = transactions.reduce((sum, tx) => sum + tx.total_amount, 0);

  const handleViewReceipt = async (txId: string) => {
    try {
      const detail = await apiRequest<TransactionDetail>(`/transactions/${txId}`);
      setSelectedTx(detail);
    } catch (err) {
      console.error('Failed to fetch transaction detail', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6">
      {/* Shift Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center">
            <Clock className="h-6 w-6 mr-2 text-emerald-400 shrink-0" />
            <span>My Shift Transaction History</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            All transactions processed under your cashier account during today's shift.
          </p>
        </div>

        {/* Shift Total Badge (Responsive Stack) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between sm:justify-start space-x-4 shadow-lg">
          <div>
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Shift Revenue</div>
            <div className="text-lg sm:text-xl font-extrabold text-emerald-400 mt-0.5 tabular-nums">
              {formatCurrency(totalShiftSales)}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-800"></div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Receipts</div>
            <div className="text-lg sm:text-xl font-extrabold text-white mt-0.5 tabular-nums">
              {transactions.length} orders
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content: Table on Desktop (>= md), Card List on Mobile (< md) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="h-12 w-12 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No transactions recorded for this shift yet.</p>
          </div>
        ) : (
          <>
            {/* Mobile Card List (< md: 768px) per Constraint #14 */}
            <div className="block md:hidden divide-y divide-slate-800/80 p-3 space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-slate-850/60 border border-slate-800 rounded-xl p-3.5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <Receipt className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="font-mono text-sm font-bold text-white">{tx.invoice_number}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                      {tx.payment_method}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-xs text-slate-400">
                    <span className="tabular-nums">{formatDateTime(tx.created_at)}</span>
                    <span className="text-base font-black text-emerald-400 tabular-nums">
                      {formatCurrency(tx.total_amount)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleViewReceipt(tx.id)}
                    className="w-full flex items-center justify-center min-h-[44px] py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 active:bg-slate-600 transition cursor-pointer"
                  >
                    <Eye className="h-4 w-4 mr-1.5" />
                    <span>View Receipt</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop Table (>= md: 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Invoice No</th>
                    <th className="px-6 py-4">Date & Time</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4 text-right">Total</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4 font-mono font-bold text-white">
                        {tx.invoice_number}
                      </td>
                      <td className="px-6 py-4 text-slate-400 tabular-nums">{formatDateTime(tx.created_at)}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                          {tx.payment_method}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-emerald-400 tabular-nums">
                        {formatCurrency(tx.total_amount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleViewReceipt(tx.id)}
                          className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition mx-auto cursor-pointer"
                          title="View Receipt"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
        transaction={selectedTx}
      />
    </div>
  );
}
