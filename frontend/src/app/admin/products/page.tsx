'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import ProductModal from '@/components/product-modal';
import { Package, Plus, Search, Edit2, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      let query = `?only_active=${showOnlyActive}`;
      if (searchTerm) {
        query += `&search=${encodeURIComponent(searchTerm)}`;
      }
      const data = await apiRequest<Product[]>(`/products${query}`);
      setProducts(data || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load product catalog.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [showOnlyActive]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (productData: {
    sku: string;
    name: string;
    price: number;
    stock: number;
    is_active?: boolean;
  }) => {
    if (editingProduct) {
      // Update
      await apiRequest<Product>(`/products/${editingProduct.id}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
      });
    } else {
      // Create
      await apiRequest<Product>('/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      });
    }
    fetchProducts();
  };

  const handleDeactivateProduct = async (product: Product) => {
    if (!confirm(`Are you sure you want to deactivate "${product.name}"?`)) return;

    try {
      await apiRequest(`/products/${product.id}`, {
        method: 'DELETE',
      });
      fetchProducts();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center">
            <Package className="h-6 w-6 mr-2 text-emerald-400 shrink-0" />
            <span>Products & Inventory</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Manage product pricing, SKU barcodes, and retail inventory levels.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="w-full sm:w-auto flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Add Product</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar: Full width stack on mobile */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition min-h-[44px]"
          />
        </div>

        <div className="flex items-center space-x-2 px-1">
          <input
            type="checkbox"
            id="activeOnly"
            checked={showOnlyActive}
            onChange={(e) => setShowOnlyActive(e.target.checked)}
            className="h-5 w-5 rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          />
          <label htmlFor="activeOnly" className="text-xs sm:text-sm text-slate-300 font-semibold cursor-pointer select-none">
            Active Products Only
          </label>
        </div>
      </div>

      {/* Main Content: Table on Desktop (>= md), Card List on Mobile (< md) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No products found in the catalog.</p>
          </div>
        ) : (
          <>
            {/* Mobile Card List (< md: 768px) per Constraint #14 */}
            <div className="block md:hidden divide-y divide-slate-800/80 p-3 space-y-3">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-850/60 border border-slate-800 rounded-xl p-3.5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-400">{p.sku}</span>
                    {p.is_active ? (
                      <span className="inline-flex items-center text-xs font-bold text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-500">Inactive</span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white">{p.name}</h4>
                    <div className="flex items-baseline justify-between mt-1.5">
                      <span className="text-base font-black text-emerald-400 tabular-nums">
                        {formatCurrency(p.price)}
                      </span>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold tabular-nums ${
                          p.stock === 0
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : p.stock <= 5
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        Stock: {p.stock}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-1 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(p)}
                      className="flex-1 flex items-center justify-center min-h-[44px] px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700/80 transition cursor-pointer"
                    >
                      <Edit2 className="h-4 w-4 mr-1.5" />
                      <span>Edit</span>
                    </button>
                    {p.is_active && (
                      <button
                        type="button"
                        onClick={() => handleDeactivateProduct(p)}
                        className="flex items-center justify-center min-w-[44px] min-h-[44px] p-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700/80 transition cursor-pointer"
                        title="Deactivate Product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (>= md: 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4">Product Name</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Last Updated</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4 font-mono font-bold text-slate-300">{p.sku}</td>
                      <td className="px-6 py-4 font-bold text-white">{p.name}</td>
                      <td className="px-6 py-4 font-bold text-emerald-400 tabular-nums">
                        {formatCurrency(p.price)}
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold tabular-nums ${
                            p.stock === 0
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : p.stock <= 5
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {p.stock} units
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {p.is_active ? (
                          <span className="inline-flex items-center text-xs font-semibold text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-semibold text-slate-500">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 tabular-nums">
                        {formatDateTime(p.updated_at)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(p)}
                            className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {p.is_active && (
                            <button
                              type="button"
                              onClick={() => handleDeactivateProduct(p)}
                              className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                              title="Deactivate Product"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={editingProduct}
        onSave={handleSaveProduct}
      />
    </div>
  );
}
