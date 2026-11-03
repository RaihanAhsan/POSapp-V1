export type Role = 'admin' | 'staff';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number; // In smallest monetary unit (IDR / cents)
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CheckoutItemRequest {
  product_id: string;
  quantity: number;
}

export interface CheckoutRequest {
  payment_method: 'cash' | 'card' | 'qris';
  cash_received?: number;
  items: CheckoutItemRequest[];
}

export interface TransactionItemResponse {
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  price_at_sale: number;
  subtotal: number;
}

export interface CashierSummary {
  id: string;
  name: string;
}

export interface TransactionDetail {
  id: string;
  invoice_number: string;
  cashier: CashierSummary;
  total_amount: number;
  payment_method: string;
  cash_received?: number;
  change_given?: number;
  created_at: string;
  items: TransactionItemResponse[];
}

export interface TopProductSale {
  product_id: string;
  product_name: string;
  sku: string;
  total_sold: number;
  total_revenue: number;
}

export interface SalesReport {
  gross_revenue: number;
  transaction_count: number;
  average_order_value: number;
  top_products: TopProductSale[];
}
