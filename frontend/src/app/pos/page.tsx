'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product, CartItem, TransactionDetail } from '@/lib/types';
import { apiRequest } from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import Cart from '@/components/cart';
import PaymentModal from '@/components/payment-modal';
import ReceiptModal from '@/components/receipt-modal';
import { Search, Barcode, Package, AlertCircle, ShoppingCart, ArrowRight } from 'lucide-react';

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Mobile Bottom Sheet state
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Modals state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [latestTransaction, setLatestTransaction] = useState<TransactionDetail | null>(null);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch catalog products
  const fetchProducts = async (search = '') => {
    try {
      setIsLoading(true);
      const query = search ? `?search=${encodeURIComponent(search)}&only_active=true` : '?only_active=true';
      const data = await apiRequest<Product[]>(`/products${query}`);
      setProducts(data || []);
    } catch (err: unknown) {
      console.error('Failed to load products', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchProducts(searchTerm);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Handle barcode scanning via Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const match = products.find(
        (p) => p.sku.toLowerCase() === searchTerm.trim().toLowerCase()
      );
      if (match) {
        addToCart(match);
        setSearchTerm('');
      }
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prevCart; // cannot exceed stock
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.product.id === productId) {
          const clampedQty = Math.min(quantity, item.product.stock);
          return { ...item, quantity: clampedQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setIsMobileCartOpen(false);
  };

  // Execute checkout transaction
  const handleConfirmPayment = async (
    paymentMethod: 'cash' | 'card' | 'qris',
    cashReceived?: number
  ) => {
    setIsProcessingCheckout(true);
    setCheckoutError(null);

    try {
      const payload = {
        payment_method: paymentMethod,
        cash_received: cashReceived,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      };

      const result = await apiRequest<TransactionDetail>('/transactions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Successful checkout: clear cart, refresh catalog stock, open receipt
      setCart([]);
      setIsMobileCartOpen(false);
      setIsPaymentOpen(false);
      setLatestTransaction(result);
      setIsReceiptOpen(true);
      fetchProducts(searchTerm);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCheckoutError(err.message);
        throw err;
      }
      throw new Error('An error occurred while processing checkout.');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 min-h-[calc(100vh-80px)] lg:h-[calc(100vh-80px)] flex flex-col pb-24 lg:pb-0">
      {checkoutError && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 shrink-0" />
          <span>{checkoutError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 flex-1 min-h-0">
        {/* Left Side: Product Catalog (7 columns on desktop, full on mobile) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full min-h-0">
          {/* Search Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 mb-4 flex items-center space-x-3 shadow-md shrink-0">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Search className="h-4 w-4" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products or scan barcode / SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition min-h-[44px]"
              />
            </div>
            <div className="hidden sm:flex items-center text-xs text-slate-400 font-mono px-3 py-2 bg-slate-800/80 rounded-xl border border-slate-700 shrink-0">
              <Barcode className="h-4 w-4 mr-1.5 text-emerald-400" />
              <span>Barcode Ready</span>
            </div>
          </div>

          {/* Product Grid (Constraint #11: 1 col @ 360, 2 cols @ 640, 3 cols @ 1024, 4 cols @ 1280) */}
          <div className="flex-1 overflow-y-auto pr-1 min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-48 sm:h-64">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 sm:h-64 text-center">
                <Package className="h-10 w-10 text-slate-600 mb-2" />
                <p className="text-slate-400 text-sm">No products found matching your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3.5">
                {products.map((product) => {
                  const cartItem = cart.find((i) => i.product.id === product.id);
                  const inCartQty = cartItem?.quantity || 0;
                  const isOutOfStock = product.stock <= 0;
                  const isMaxInCart = inCartQty >= product.stock;

                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addToCart(product)}
                      disabled={isOutOfStock || isMaxInCart}
                      className={`text-left p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col justify-between relative cursor-pointer min-h-[80px] sm:min-h-[135px] active:scale-[0.98] ${
                        isOutOfStock
                          ? 'bg-slate-900/40 border-slate-800/40 opacity-50 cursor-not-allowed'
                          : inCartQty > 0
                          ? 'bg-emerald-950/25 border-emerald-500/70 hover:border-emerald-400 shadow-md shadow-emerald-950/40'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                      }`}
                    >
                      {/* In Cart Badge */}
                      {inCartQty > 0 && (
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-xs font-black shadow-sm">
                          {inCartQty}
                        </span>
                      )}

                      <div className="pr-7 sm:pr-0">
                        <div className="text-[11px] font-mono text-slate-400 mb-0.5">{product.sku}</div>
                        <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                          {product.name}
                        </h4>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                        <span className="text-sm sm:text-base font-extrabold text-emerald-400 tabular-nums">
                          {formatCurrency(product.price)}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            product.stock === 0
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : product.stock <= 5
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          Stock: {product.stock}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Desktop Active Cart (>= lg: 1024px) */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-4 h-full min-h-0">
          <Cart
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
            onOpenPayment={() => setIsPaymentOpen(true)}
          />
        </div>
      </div>

      {/* Mobile Floating Sticky Bottom Cart Bar (< lg: 1024px) */}
      {cart.length > 0 && (
        <aside aria-label="Shopping Cart Summary" className="lg:hidden fixed inset-x-0 bottom-0 z-30 bg-slate-900/95 border-t border-slate-800 px-4 py-3 backdrop-blur-md shadow-2xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsMobileCartOpen(true)}
              className="flex items-center space-x-2 text-left"
            >
              <div className="relative p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black">
                  {totalItemsCount}
                </span>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Total ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'})</div>
                <div className="text-base font-black text-emerald-400 tabular-nums">{formatCurrency(totalAmount)}</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsMobileCartOpen(true)}
              className="flex items-center justify-center min-h-[48px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition cursor-pointer"
            >
              <span>View Cart</span>
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </button>
          </div>
        </aside>
      )}

      {/* Mobile Cart Bottom Sheet Drawer (< lg) */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileCartOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-Up Bottom Sheet */}
          <div className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-slate-900 rounded-t-3xl border-t border-slate-700 shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto my-2.5 shrink-0" />

            <div className="flex-1 overflow-hidden flex flex-col">
              <Cart
                items={cart}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeFromCart}
                onClearCart={clearCart}
                onOpenPayment={() => {
                  setIsMobileCartOpen(false);
                  setIsPaymentOpen(true);
                }}
                onCloseMobileDrawer={() => setIsMobileCartOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        totalAmount={totalAmount}
        onConfirmPayment={handleConfirmPayment}
        isProcessing={isProcessingCheckout}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        transaction={latestTransaction}
      />
    </div>
  );
}
