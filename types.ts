export type Permission = 
    'dashboard.view' |
    'pos.access' |
    'sales_invoices.view' |
    'sales_orders.create' | 'sales_orders.manage' |
    'sales_returns.access' |
    'purchases.create' |
    'purchase_orders.create' |
    'items.view' | 'items.create' | 'items.edit' | 'items.delete' | 'items.import_export' |
    'stock_adjustments.access' |
    'customers.manage' |
    'suppliers.manage' |
    'price_tiers.manage' |
    'categories.manage' |
    'brands.manage' |
    'units.manage' |
    'users.manage' | 'roles.manage' |
    'accounts.manage' |
    'receivables.view' | 'receivables.manage' |
    'payables.view' | 'payables.manage' |
    'expenses.manage' |
    'expense_categories.manage' |
    'reports.sales' |
    'reports.profit_loss' |
    'reports.customer_analytics' |
    'settings.manage';


export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  passwordHash: string; // DEPRECATED
  roleId: string;
  isActive: boolean;
}

export type MembershipTier = 'Standard' | 'Bronze' | 'Silver' | 'Gold';

export interface PriceTier {
    id: string;
    name: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  points: number;
  priceTierId?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
}

export interface Category {
    id: string;
    name: string;
}

export interface Brand {
    id: string;
    name: string;
}

export interface Unit {
    id: string;
    name: string;
}

export interface Item {
  id: string;
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  brandId: string;
  unitId: string;
  purchasePrice: number;
  sellPrice: number;
  priceTiers: { [tierId: string]: number };
  stock: number;
  minStock: number;
  image: string | null; // base64 string
}

export interface CartItem extends Item {
  quantity: number;
}

export interface Sale {
  id: string;
  transactionNumber: string;
  date: string;
  cashierId: string;
  customerId?: string;
  items: { itemId: string; quantity: number; price: number }[];
  subtotal: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  taxType: 'percentage' | 'fixed';
  taxValue: number;
  total: number;
  paymentMethod: 'Tunai' | 'Kartu' | 'Transfer';
  accountId: string;
  amountPaid: number;
  change: number;
  paymentStatus: 'Lunas' | 'Belum Lunas';
  salesOrderId?: string;
}

export interface Purchase {
    id: string;
    purchaseNumber: string;
    date: string;
    supplierId: string;
    items: { itemId: string; quantity: number; cost: number }[];
    total: number;
    accountId: string;
    amountPaid: number;
    paymentStatus: 'Lunas' | 'Belum Lunas';
    purchaseOrderId?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  date: string;
  supplierId: string;
  items: { itemId: string; quantity: number; cost: number }[];
  total: number;
  status: 'Pending' | 'Completed' | 'Cancelled';
}

export interface SalesOrder {
    id: string;
    soNumber: string;
    date: string;
    customerId: string;
    items: { itemId: string; quantity: number; price: number }[];
    total: number;
    status: 'Quote' | 'Confirmed' | 'Completed' | 'Cancelled';
}

export interface StockMovement {
    id: string;
    itemId: string;
    date: string;
    type: 'sale' | 'purchase' | 'adjustment-in' | 'adjustment-out' | 'initial' | 'payment' | 'sales-return';
    quantityChange: number;
    balance: number;
    reference: string;
}

export interface StockAdjustment {
    id: string;
    adjustmentNumber: string;
    date: string;
    notes: string;
    userId: string;
    items: {
      itemId: string;
      systemStock: number;
      physicalStock: number;
      difference: number;
    }[];
}

export interface SalesReturn {
    id: string;
    returnNumber: string;
    date: string;
    originalSaleId: string;
    returnedItems: { itemId: string; quantity: number; price: number }[]; // price is the price it was sold at
    totalRefund: number;
    accountId: string; // Account from which money is refunded
    notes?: string;
}

export interface ExpenseCategory {
    id: string;
    name: string;
}

export interface Expense {
    id: string;
    date: string;
    description: string;
    categoryId: string;
    amount: number;
    accountId: string;
}

export interface CompanySettings {
    companyName: string;
    companyAddress: string;
    companyPhone: string;
    autoGenerateSKU: boolean;
    logo: string | null; // base64
}