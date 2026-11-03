'use client';

import React, { useState, useEffect } from 'react';
import { SalesReport } from '@/lib/types';
import { apiRequest } from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  ArrowRight,
  Store,
  Users,
  Award,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [report, setReport] = useState<SalesReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setIsLoading(true);
        const data = await apiRequest<SalesReport>('/reports/sales');
        setReport(data);
      } catch (err) {
        console.error('Failed to load sales report', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-800/40 rounded-2xl sm:rounded-3xl p-5 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
            Admin Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-2.5 sm:mt-3">
            POSv1 - Executive Management Dashboard
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1.5 sm:mt-2 leading-relaxed">
            Monitor cash flow, revenue performance, stock inventory, and cashier logs in real time.
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Gross Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-slate-400">
              Gross Revenue
            </span>
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="text-2xl sm:text-3xl font-black text-white tabular-nums truncate">
              {isLoading ? '...' : formatCurrency(report?.gross_revenue || 0)}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1">Cumulative completed sales</p>
          </div>
        </div>

        {/* Transactions Count */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-slate-400">
              Total Transactions
            </span>
            <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="text-2xl sm:text-3xl font-black text-white tabular-nums truncate">
              {isLoading ? '...' : `${report?.transaction_count || 0} orders`}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1">Successfully processed orders</p>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-slate-400">
              Average Order Value (AOV)
            </span>
            <div className="p-2 sm:p-2.5 rounded-xl bg-teal-500/10 text-teal-400 shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="text-2xl sm:text-3xl font-black text-white tabular-nums truncate">
              {isLoading ? '...' : formatCurrency(report?.average_order_value || 0)}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1">Average basket size per order</p>
          </div>
        </div>
      </div>

      {/* Top 5 Products: Table on Desktop, Ranked Cards on Mobile */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-amber-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-white">Top 5 Best-Selling Products</h2>
          </div>
          <a
            href="/admin/products"
            className="flex items-center min-h-[44px] text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
          >
            <span>View All Stock</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </a>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : !report?.top_products || report.top_products.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No sales transactions recorded yet.
          </div>
        ) : (
          <>
            {/* Mobile Card List (< md: 768px) per Constraint #14 */}
            <div className="block md:hidden space-y-3">
              {report.top_products.map((tp, idx) => (
                <div
                  key={tp.product_id}
                  className="bg-slate-850/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-500/15 text-amber-400 font-bold text-xs shrink-0 border border-amber-500/30">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-sm truncate">{tp.product_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{tp.sku}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-extrabold text-emerald-400 tabular-nums">
                      {formatCurrency(tp.total_revenue)}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-400 tabular-nums mt-0.5">
                      {tp.total_sold} units sold
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (>= md: 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3">Rank</th>
                    <th className="px-6 py-3">SKU</th>
                    <th className="px-6 py-3">Product Name</th>
                    <th className="px-6 py-3 text-right">Units Sold</th>
                    <th className="px-6 py-3 text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {report.top_products.map((tp, idx) => (
                    <tr key={tp.product_id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4 font-bold text-amber-400">#{idx + 1}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">{tp.sku}</td>
                      <td className="px-6 py-4 font-bold text-white">{tp.product_name}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-200 tabular-nums">
                        {tp.total_sold} units
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-emerald-400 tabular-nums">
                        {formatCurrency(tp.total_revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-2">
        <a
          href="/pos"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 transition block group shadow-lg min-h-[96px]"
        >
          <Store className="h-6 w-6 text-emerald-400 mb-2 group-hover:scale-110 transition shrink-0" />
          <h3 className="font-bold text-white text-base">Open POS Register</h3>
          <p className="text-xs text-slate-400 mt-1">Directly process checkout transactions for customers.</p>
        </a>

        <a
          href="/admin/reports"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 transition block group shadow-lg min-h-[96px]"
        >
          <TrendingUp className="h-6 w-6 text-indigo-400 mb-2 group-hover:scale-110 transition shrink-0" />
          <h3 className="font-bold text-white text-base">Sales Reports & Audits</h3>
          <p className="text-xs text-slate-400 mt-1">Audit all transaction receipts by custom date ranges.</p>
        </a>

        <a
          href="/admin/users"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/50 hover:bg-slate-850 transition block group shadow-lg min-h-[96px]"
        >
          <Users className="h-6 w-6 text-teal-400 mb-2 group-hover:scale-110 transition shrink-0" />
          <h3 className="font-bold text-white text-base">Manage User Accounts</h3>
          <p className="text-xs text-slate-400 mt-1">Create cashier accounts and manage RBAC permissions.</p>
        </a>
      </div>
    </div>
  );
}
