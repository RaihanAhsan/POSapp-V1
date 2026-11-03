'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import { X, Save, Sparkles } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null; // null if creating, populated if editing
  onSave: (productData: {
    sku: string;
    name: string;
    price: number;
    stock: number;
    is_active?: boolean;
  }) => Promise<void>;
}

export default function ProductModal({
  isOpen,
  onClose,
  product,
  onSave,
}: ProductModalProps) {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setSku(product.sku);
      setName(product.name);
      setPrice(product.price);
      setStock(product.stock);
      setIsActive(product.is_active);
    } else {
      setSku('');
      setName('');
      setPrice(5);
      setStock(20);
      setIsActive(true);
    }
    setError(null);
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleGenerateSKU = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    const prefix = name ? name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'PRD') : 'SKU';
    setSku(`${prefix}-${random}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      await onSave({
        sku,
        name,
        price,
        stock,
        is_active: isActive,
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save product details.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      {/* Desktop Backdrop */}
      <div className="fixed inset-0 hidden sm:block bg-transparent" onClick={onClose} aria-hidden="true" />

      {/* Dialog container: Fullscreen on mobile (<sm), centered rounded card on desktop (>=sm) */}
      <div className="relative z-10 bg-slate-900 border-0 sm:border border-slate-800 rounded-none sm:rounded-2xl w-full min-h-screen sm:min-h-0 sm:max-w-lg flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-white">
            {product ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Dialog"
            className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6 space-y-4 sm:space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs sm:text-sm">
              {error}
            </div>
          )}

          {/* SKU Field with 44px Generator */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                SKU / Barcode Code
              </label>
              <button
                type="button"
                onClick={handleGenerateSKU}
                className="flex items-center min-h-[44px] text-xs font-bold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                <span>Auto Generate</span>
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="e.g. SKU-COF-001"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full px-3.5 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-base font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[48px]"
            />
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Product Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Iced Latte Special"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[48px]"
            />
          </div>

          {/* Price & Stock: Stack on mobile, 2 cols on >= sm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Unit Price ($ USD)
              </label>
              <input
                type="number"
                required
                min={0}
                step={1}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3.5 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-base font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[48px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Stock Quantity
              </label>
              <input
                type="number"
                required
                min={0}
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full px-3.5 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-base font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[48px]"
              />
            </div>
          </div>

          {/* Active Status Checkbox */}
          {product && (
            <div className="flex items-center space-x-3 pt-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-5 w-5 rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="isActive" className="text-sm text-slate-300 font-semibold cursor-pointer">
                Active Product (Visible on POS Register)
              </label>
            </div>
          )}

          {/* Sticky Actions in Modal Footer */}
          <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-md pt-4 pb-2 border-t border-slate-800 flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 min-h-[48px] py-3 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 min-h-[48px] py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white text-sm font-bold flex items-center justify-center space-x-2 transition cursor-pointer shadow-lg shadow-emerald-600/30"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Product</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
