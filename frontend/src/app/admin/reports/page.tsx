'use client';

import React, { useState, useEffect } from 'react';
import { TransactionDetail, SalesReport } from '@/lib/types';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import ReceiptModal from '@/components/receipt-modal';
import { BarChart3, Filter, Eye, AlertCircle, ShoppingBag, Receipt } from 'lucide-react';

export default function AdminReportsPage() {
  const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
  const [reportSummary, setReportSummary] = useState<SalesReport | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<TransactionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async (start = startDate, end = endDate) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (start) params.append('start_date', start);
      if (end) params.append('end_date', end);
      const query = params.toString() ? `?${params.toString()}` : '';

      const [txData, summaryData] = await Promise.all([
        apiRequest<TransactionDetail[]>(`/transactions${query}`),
        apiRequest<SalesReport>(`/reports/sales${query}`),
      ]);

      setTransactions(txData || []);
      setReportSummary(summaryData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load sales reports.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports(startDate, endDate);
  };

  const handleResetFilter = () => {
    setStartDate('');
    setEndDate('');
    fetchReports('', '');
  };

  const handleViewReceipt = async (txId: string) => {
    try {
      const detail = await apiRequest<TransactionDetail>(`/transactions/${txId}`);
      setSelectedTx(detail);
    } catch (err) {
      console.error('Failed to load transaction detail', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center">
          <BarChart3 className="h-6 w-6 mr-2 text-emerald-400 shrink-0" />
          <span>Sales Reports & Audit Logs</span>
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Comprehensive transaction history and customer receipt audit trail.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Date Range Filter Bar (Responsive Stack) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <form onSubmit={handleFilterSubmit} className="flex flex-col sm:flex-row sm:items-end gap-3.5 sm:gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            />
          </div>

          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            />
          </div>

          <div className="flex items-center space-x-2 pt-1 sm:pt-0">
            <button
              type="submit"
              className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white rounded-xl text-sm font-bold flex items-center justify-center min-h-[44px] shadow-md transition cursor-pointer"
            >
              <Filter className="h-4 w-4 mr-1.5" />
              <span>Apply Filter</span>
            </button>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="px-4 py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold min-h-[44px] transition cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Summary KPI Cards */}
      {reportSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <span className="text-[11px] sm:text-xs uppercase font-bold text-slate-400">Gross Revenue</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 tabular-nums truncate">
              {formatCurrency(reportSummary.gross_revenue)}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <span className="text-[11px] sm:text-xs uppercase font-bold text-slate-400">Total Orders</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-1 tabular-nums truncate">
              {reportSummary.transaction_count} orders
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <span className="text-[11px] sm:text-xs uppercase font-bold text-slate-400">Average Order Value (AOV)</span>
            <div className="text-xl sm:text-2xl font-black text-teal-400 mt-1 tabular-nums truncate">
              {formatCurrency(reportSummary.average_order_value)}
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table on Desktop, Card List on Mobile */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="h-12 w-12 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No transactions found for the selected period.</p>
          </div>
        ) : (
          <>
            {/* Mobile Card List (< md: 768px) per Constraint #14 */}
            <div className="block md:hidden divide-y divide-slate-800/80 p-3 space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-slate-850/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5"
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

                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span className="tabular-nums">{formatDateTime(tx.created_at)}</span>
                    <span className="font-semibold text-slate-300">Cashier: {tx.cashier.name}</span>
                  </div>

                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-xs text-slate-400 font-semibold uppercase">Total Due:</span>
                    <span className="text-base font-black text-emerald-400 tabular-nums">
                      {formatCurrency(tx.total_amount)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleViewReceipt(tx.id)}
                    className="w-full flex items-center justify-center min-h-[44px] py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700/80 active:bg-slate-600 transition cursor-pointer"
                  >
                    <Eye className="h-4 w-4 mr-1.5" />
                    <span>View Receipt Details</span>
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
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Cashier</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4 text-right">Total Amount</th>
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
                      <td className="px-6 py-4 font-semibold text-slate-200">{tx.cashier.name}</td>
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
                          title="View Receipt Details"
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
