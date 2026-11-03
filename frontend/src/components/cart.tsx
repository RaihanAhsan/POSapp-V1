'use client';

import React from 'react';
import { CartItem } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, X } from 'lucide-react';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onOpenPayment: () => void;
  onCloseMobileDrawer?: () => void;
}

export default function Cart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenPayment,
  onCloseMobileDrawer,
}: CartProps) {
  const totalAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] text-center">
        <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
          <ShoppingCart className="h-7 w-7 sm:h-8 sm:w-8" />
        </div>
        <h4 className="text-base font-semibold text-white">Your Cart is Empty</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
          Select products from the catalog or scan a barcode to add items to your cart.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-full overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="font-bold text-white text-base">Register Cart</h3>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold tabular-nums">
            {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={onClearCart}
            className="flex items-center justify-center min-h-[44px] px-3 text-xs text-rose-400 hover:text-rose-300 font-semibold transition cursor-pointer"
          >
            Clear
          </button>
          {onCloseMobileDrawer && (
            <button
              onClick={onCloseMobileDrawer}
              className="lg:hidden flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-4 space-y-2.5 sm:space-y-3">
        {items.map(({ product, quantity }) => {
          const subtotal = product.price * quantity;
          const isAtMaxStock = quantity >= product.stock;

          return (
            <div
              key={product.id}
              className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3 sm:p-3.5 space-y-2.5 transition hover:border-slate-600 shadow-sm"
            >
              {/* Top Row: Name, SKU, Unit Price, and Delete Button */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-white text-sm leading-snug break-words">
                    {product.name}
                  </h4>
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-1">
                    <span className="text-[11px] text-slate-400 font-mono">{product.sku}</span>
                    <span className="text-[11px] text-slate-600">•</span>
                    <span className="text-xs text-emerald-400 font-semibold tabular-nums">
                      {formatCurrency(product.price)} each
                    </span>
                  </div>
                </div>

                {/* Remove Item Button */}
                <button
                  type="button"
                  onClick={() => onRemoveItem(product.id)}
                  aria-label={`Remove ${product.name} from cart`}
                  className="flex items-center justify-center min-w-[40px] min-h-[40px] rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 active:bg-rose-500/20 transition cursor-pointer shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Bottom Row: Quantity Stepper & Line Subtotal */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 gap-2">
                {/* Stepper with >= 44px Touch Target */}
                <div className="flex items-center bg-slate-900 rounded-xl border border-slate-700 shadow-inner shrink-0">
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                    aria-label="Decrease quantity"
                    className="flex items-center justify-center min-w-[42px] min-h-[42px] rounded-l-xl text-slate-300 hover:text-white hover:bg-slate-800 active:bg-slate-700 transition cursor-pointer"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 sm:w-9 text-center text-sm font-bold text-white font-mono tabular-nums select-none">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                    disabled={isAtMaxStock}
                    aria-label="Increase quantity"
                    className="flex items-center justify-center min-w-[42px] min-h-[42px] rounded-r-xl text-slate-300 hover:text-white hover:bg-slate-800 active:bg-slate-700 transition cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Line Subtotal */}
                <div className="text-right">
                  <span className="block text-[10px] uppercase font-semibold tracking-wider text-slate-500">
                    Subtotal
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-white tabular-nums">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart Footer */}
      <div className="p-4 bg-slate-900/95 border-t border-slate-800 space-y-3">
        <div className="flex justify-between items-baseline">
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-400">
            Total Due:
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-400 tabular-nums">
            {formatCurrency(totalAmount)}
          </span>
        </div>

        <button
          onClick={onOpenPayment}
          className="w-full flex items-center justify-center space-x-2 min-h-[52px] py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-base shadow-lg shadow-emerald-600/30 transition cursor-pointer"
        >
          <span>Checkout & Pay</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
