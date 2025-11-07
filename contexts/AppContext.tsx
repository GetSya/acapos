import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { User, Item, Sale, Role, StockMovement, Customer, Account, Category, Brand, Unit, Supplier, Purchase, PurchaseOrder, SalesOrder, CompanySettings, StockAdjustment, ExpenseCategory, Expense, PriceTier, SalesReturn, Permission } from '../types';
import { generateId, formatDate } from '../utils/helpers';
import { ALL_PERMISSIONS } from '../constants';

// --- STATE & ACTION TYPES ---
interface AppState {
  settings: CompanySettings;
  isAuthenticated: boolean;
  currentUser: User | null;
  currentUserRole: Role | null;
  users: User[];
  roles: Role[];
  customers: Customer[];
  suppliers: Supplier[];
  items: Item[];
  sales: Sale[];
  purchases: Purchase[];
  purchaseOrders: PurchaseOrder[];
  salesOrders: SalesOrder[];
  stockMovements: StockMovement[];
  stockAdjustments: StockAdjustment[];
  accounts: Account[];
  categories: Category[];
  brands: Brand[];
  units: Unit[];
  priceTiers: PriceTier[];
  salesReturns: SalesReturn[];
  expenseCategories: ExpenseCategory[];
  expenses: Expense[];
}

type Action =
  | { type: 'LOGIN'; payload: { user: User, roles: Role[] } }
  | { type: 'LOGOUT' }
  | { type: 'INITIALIZE_COMPANY'; payload: { companyName: string } }
  | { type: 'RESTORE_STATE'; payload: Omit<AppState, 'isAuthenticated' | 'currentUser' | 'currentUserRole'> }
  | { type: 'UPDATE_SETTINGS'; payload: CompanySettings }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'ADD_ROLE', payload: Role }
  | { type: 'UPDATE_ROLE', payload: Role }
  | { type: 'DELETE_ROLE', payload: string }
  | { type: 'ADD_ITEM'; payload: Item }
  | { type: 'UPDATE_ITEM'; payload: Item }
  | { type: 'DELETE_ITEM'; payload: string }
  | { type: 'BULK_ADD_ITEMS'; payload: Item[] }
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  | { type: 'DELETE_CUSTOMER'; payload: string }
  | { type: 'ADD_SUPPLIER'; payload: Supplier }
  | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
  | { type: 'DELETE_SUPPLIER'; payload: string }
  | { type: 'ADD_ACCOUNT'; payload: Account }
  | { type: 'UPDATE_ACCOUNT'; payload: Account }
  | { type: 'DELETE_ACCOUNT'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'ADD_BRAND'; payload: Brand }
  | { type: 'UPDATE_BRAND'; payload: Brand }
  | { type: 'DELETE_BRAND'; payload: string }
  | { type: 'ADD_UNIT'; payload: Unit }
  | { type: 'UPDATE_UNIT'; payload: Unit }
  | { type: 'DELETE_UNIT'; payload: string }
  | { type: 'ADD_PURCHASE_ORDER'; payload: PurchaseOrder }
  | { type: 'UPDATE_PURCHASE_ORDER_STATUS'; payload: { id: string; status: 'Pending' | 'Completed' | 'Cancelled' } }
  | { type: 'ADD_PURCHASE'; payload: Purchase }
  | { type: 'ADD_SALES_ORDER'; payload: SalesOrder }
  | { type: 'UPDATE_SALES_ORDER_STATUS'; payload: { id: string; status: 'Quote' | 'Confirmed' | 'Completed' | 'Cancelled' } }
  | { type: 'ADD_STOCK_ADJUSTMENT', payload: StockAdjustment }
  | { type: 'CREATE_SALE'; payload: Sale }
  | { type: 'ADD_RECEIVABLE_PAYMENT'; payload: { saleId: string; amount: number; accountId: string; date: string } }
  | { type: 'ADD_PAYABLE_PAYMENT'; payload: { purchaseId: string; amount: number; accountId: string; date: string } }
  | { type: 'ADD_PRICE_TIER'; payload: PriceTier }
  | { type: 'UPDATE_PRICE_TIER'; payload: PriceTier }
  | { type: 'DELETE_PRICE_TIER'; payload: string }
  | { type: 'ADD_SALES_RETURN'; payload: SalesReturn }
  | { type: 'ADD_EXPENSE_CATEGORY', payload: ExpenseCategory }
  | { type: 'UPDATE_EXPENSE_CATEGORY', payload: ExpenseCategory }
  | { type: 'DELETE_EXPENSE_CATEGORY', payload: string }
  | { type: 'ADD_EXPENSE', payload: Expense }
  | { type: 'UPDATE_EXPENSE', payload: Expense }
  | { type: 'DELETE_EXPENSE', payload: string };

// --- INITIAL STATE & DEMO DATA ---
const initialCategories: Category[] = [
    { id: 'cat1', name: 'Minuman' },
    { id: 'cat2', name: 'Makanan Ringan' },
];
const initialBrands: Brand[] = [
    { id: 'b1', name: 'Kopi Kita' },
    { id: 'b2', name: 'Snack Enak' },
    { id: 'b3', name: 'Teh Sari' },
];
const initialUnits: Unit[] = [
    { id: 'u1', name: 'kg' },
    { id: 'u2', name: 'pcs' },
    { id: 'u3', name: 'box' },
];

const initialPriceTiers: PriceTier[] = [
    { id: 'tier1', name: 'Grosir' },
    { id: 'tier2', name: 'Reseller' },
];

const initialExpenseCategories: ExpenseCategory[] = [
    { id: 'expcat1', name: 'Gaji Karyawan' },
    { id: 'expcat2', name: 'Sewa & Properti' },
    { id: 'expcat3', name: 'Listrik, Air, & Internet' },
    { id: 'expcat4', name: 'Pemasaran & Iklan' },
    { id: 'expcat5', name: 'Lain-lain' },
];

const initialItems: Item[] = [
  { id: 'i1', sku: 'COF-001', name: 'Kopi Arabika', description: 'Biji kopi Arabika premium.', categoryId: 'cat1', brandId: 'b1', unitId: 'u1', purchasePrice: 150000, sellPrice: 200000, priceTiers: { 'tier1': 180000, 'tier2': 190000 }, stock: 50, minStock: 10, image: null },
  { id: 'i2', sku: 'SNC-002', name: 'Keripik Kentang', description: 'Rasa original.', categoryId: 'cat2', brandId: 'b2', unitId: 'u2', purchasePrice: 8000, sellPrice: 12000, priceTiers: { 'tier1': 10000 }, stock: 100, minStock: 20, image: null },
  { id: 'i3', sku: 'TEA-003', name: 'Teh Hijau', description: 'Teh hijau melati.', categoryId: 'cat1', brandId: 'b3', unitId: 'u3', purchasePrice: 15000, sellPrice: 22000, priceTiers: {}, stock: 80, minStock: 15, image: null },
];

const initialCustomers: Customer[] = [
    { id: 'c1', name: 'Pelanggan Umum', phone: '-', email: '-', address: '-', points: 0 },
    { id: 'c2', name: 'Budi Santoso', phone: '081234567890', email: 'budi.s@mail.com', address: 'Jl. Merdeka No. 10', points: 150, priceTierId: 'tier1' },
    { id: 'c3', name: 'Citra Lestari', phone: '085678901234', email: 'citra.l@mail.com', address: 'Jl. Pahlawan No. 25', points: 75, priceTierId: 'tier2' },
];

const initialSuppliers: Supplier[] = [
    { id: 'sup1', name: 'Distributor Kopi Nusantara', phone: '021-555-1111', email: 'sales@kopinusantara.com', address: 'Jl. Kopi No. 1, Jakarta' },
    { id: 'sup2', name: 'PT Snack Jaya', phone: '021-555-2222', email: 'order@snackjaya.co.id', address: 'Jl. Makanan Ringan No. 2, Bekasi' },
];

const initialAccounts: Account[] = [
    { id: 'acc1', name: 'Kas Tunai', balance: 1000000 },
    { id: 'acc2', name: 'BCA', balance: 5000000 },
];

const getInitialState = (): AppState => ({
  isAuthenticated: false,
  currentUser: null,
  currentUserRole: null,
  settings: {
    companyName: 'Nama Toko Anda',
    companyAddress: 'Alamat Toko Anda',
    companyPhone: 'No. Telepon Anda',
    autoGenerateSKU: false,
    logo: null,
  },
  users: [],
  roles: [],
  customers: [],
  suppliers: [],
  items: [],
  sales: [],
  purchases: [],
  purchaseOrders: [],
  salesOrders: [],
  stockMovements: [],
  stockAdjustments: [],
  accounts: [],
  categories: [],
  brands: [],
  units: [],
  priceTiers: [],
  salesReturns: [],
  expenseCategories: [],
  expenses: [],
});

// --- REDUCER ---
const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'LOGIN': {
      const { user, roles } = action.payload;
      const userRole = roles.find(r => r.id === user.roleId) || null;
      return { ...state, isAuthenticated: true, currentUser: user, currentUserRole: userRole, roles };
    }
    case 'LOGOUT':
      return { ...getInitialState(), settings: state.settings, roles: state.roles };
    case 'INITIALIZE_COMPANY': {
      const allPermissions = ALL_PERMISSIONS.flatMap(g => g.permissions.map(p => p.id));
      const cashierPermissions: Permission[] = ['dashboard.view', 'pos.access', 'sales_invoices.view', 'sales_orders.create'];

      const adminRole: Role = { id: 'role_admin', name: 'Admin', permissions: allPermissions };
      const cashierRole: Role = { id: 'role_cashier', name: 'Kasir', permissions: cashierPermissions };
      const initialRoles = [adminRole, cashierRole];

      const initialStockMovements = initialItems.map(item => ({
        id: generateId(),
        itemId: item.id,
        date: new Date().toISOString(),
        type: 'initial' as const,
        quantityChange: item.stock,
        balance: item.stock,
        reference: 'Initial Stock',
      }));

      return {
        ...state,
        settings: {
            ...getInitialState().settings,
            companyName: action.payload.companyName,
        },
        users: [], 
        roles: initialRoles,
        customers: initialCustomers,
        suppliers: initialSuppliers,
        items: initialItems,
        sales: [],
        purchases: [],
        purchaseOrders: [],
        salesOrders: [],
        stockMovements: initialStockMovements,
        stockAdjustments: [],
        accounts: initialAccounts,
        categories: initialCategories,
        brands: initialBrands,
        units: initialUnits,
        priceTiers: initialPriceTiers,
        salesReturns: [],
        expenseCategories: initialExpenseCategories,
        expenses: [],
      };
    }
    case 'RESTORE_STATE': {
        const restoredSettings = action.payload.settings || {};
        const restoredCustomers = action.payload.customers.map(c => ({...c, points: c.points || 0, priceTierId: c.priceTierId || undefined }));
        const restoredItems = action.payload.items.map(i => ({...i, priceTiers: i.priceTiers || {}}));
        return {
            ...state,
            ...action.payload,
            items: restoredItems,
            customers: restoredCustomers,
            settings: {
                ...getInitialState().settings,
                ...restoredSettings,
            },
            roles: action.payload.roles || [],
            stockAdjustments: action.payload.stockAdjustments || [],
            priceTiers: action.payload.priceTiers || [],
            salesReturns: action.payload.salesReturns || [],
            expenseCategories: action.payload.expenseCategories || [],
            expenses: action.payload.expenses || [],
        };
    }
    case 'UPDATE_SETTINGS':
        return {
            ...state,
            settings: action.payload,
        };
    case 'SET_USERS':
        return {
            ...state,
            users: action.payload,
        };
    case 'UPDATE_USER':
        const updatedUser = action.payload;
        const isCurrentUser = state.currentUser?.id === updatedUser.id;
        
        return {
            ...state,
            users: state.users.map(user => user.id === updatedUser.id ? updatedUser : user),
            currentUser: isCurrentUser ? { ...state.currentUser, ...updatedUser } : state.currentUser,
            currentUserRole: isCurrentUser ? state.roles.find(r => r.id === updatedUser.roleId) || null : state.currentUserRole,
        };
    case 'ADD_ROLE':
      return { ...state, roles: [...state.roles, action.payload] };
    case 'UPDATE_ROLE':
      const isCurrentRoleUpdated = state.currentUserRole?.id === action.payload.id;
      return { 
        ...state, 
        roles: state.roles.map(r => r.id === action.payload.id ? action.payload : r),
        currentUserRole: isCurrentRoleUpdated ? action.payload : state.currentUserRole,
      };
    case 'DELETE_ROLE':
      return { ...state, roles: state.roles.filter(r => r.id !== action.payload) };
    case 'ADD_ITEM':
        return {
            ...state,
            items: [...state.items, {...action.payload, priceTiers: action.payload.priceTiers || {}}],
        };
    case 'UPDATE_ITEM':
        return {
            ...state,
            items: state.items.map(item => item.id === action.payload.id ? {...action.payload, priceTiers: action.payload.priceTiers || {}} : item),
        };
    case 'DELETE_ITEM':
        return {
            ...state,
            items: state.items.filter(item => item.id !== action.payload),
            stockMovements: state.stockMovements.filter(sm => sm.itemId !== action.payload),
        };
    case 'BULK_ADD_ITEMS': {
        const updatedItems = [...state.items];
        const newStockMovements: StockMovement[] = [];
    
        action.payload.forEach(newItem => {
            const existingItemIndex = updatedItems.findIndex(i => i.sku.toLowerCase() === newItem.sku.toLowerCase());
            if (existingItemIndex > -1) {
                const oldItem = updatedItems[existingItemIndex];
                updatedItems[existingItemIndex] = { 
                    ...oldItem, 
                    name: newItem.name,
                    description: newItem.description,
                    categoryId: newItem.categoryId,
                    brandId: newItem.brandId,
                    unitId: newItem.unitId,
                    purchasePrice: newItem.purchasePrice,
                    sellPrice: newItem.sellPrice,
                    priceTiers: newItem.priceTiers || {},
                    minStock: newItem.minStock,
                    image: newItem.image
                };
            } else {
                updatedItems.push(newItem);
                newStockMovements.push({
                    id: generateId(),
                    itemId: newItem.id,
                    date: new Date().toISOString(),
                    type: 'initial',
                    quantityChange: newItem.stock,
                    balance: newItem.stock,
                    reference: 'Imported Item'
                });
            }
        });
    
        return { 
            ...state, 
            items: updatedItems,
            stockMovements: [...state.stockMovements, ...newStockMovements]
        };
    }
    case 'ADD_CUSTOMER':
        return {
            ...state,
            customers: [...state.customers, { ...action.payload, points: action.payload.points || 0, priceTierId: action.payload.priceTierId || undefined }],
        };
    case 'UPDATE_CUSTOMER':
        return {
            ...state,
            customers: state.customers.map(customer => customer.id === action.payload.id ? action.payload : customer),
        };
    case 'DELETE_CUSTOMER':
        return {
            ...state,
            customers: state.customers.filter(customer => customer.id !== action.payload),
        };
    case 'ADD_SUPPLIER':
        return { ...state, suppliers: [...state.suppliers, action.payload] };
    case 'UPDATE_SUPPLIER':
        return { ...state, suppliers: state.suppliers.map(s => s.id === action.payload.id ? action.payload : s) };
    case 'DELETE_SUPPLIER':
        return { ...state, suppliers: state.suppliers.filter(s => s.id !== action.payload) };
    case 'ADD_ACCOUNT':
        return { ...state, accounts: [...state.accounts, action.payload] };
    case 'UPDATE_ACCOUNT':
        return { ...state, accounts: state.accounts.map(acc => acc.id === action.payload.id ? action.payload : acc) };
    case 'DELETE_ACCOUNT':
        return { ...state, accounts: state.accounts.filter(acc => acc.id !== action.payload) };
    case 'ADD_CATEGORY':
        return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY':
        return { ...state, categories: state.categories.map(cat => cat.id === action.payload.id ? action.payload : cat) };
    case 'DELETE_CATEGORY':
        return { ...state, categories: state.categories.filter(cat => cat.id !== action.payload) };
    case 'ADD_BRAND':
        return { ...state, brands: [...state.brands, action.payload] };
    case 'UPDATE_BRAND':
        return { ...state, brands: state.brands.map(b => b.id === action.payload.id ? action.payload : b) };
    case 'DELETE_BRAND':
        return { ...state, brands: state.brands.filter(b => b.id !== action.payload) };
    case 'ADD_UNIT':
        return { ...state, units: [...state.units, action.payload] };
    case 'UPDATE_UNIT':
        return { ...state, units: state.units.map(u => u.id === action.payload.id ? action.payload : u) };
    case 'DELETE_UNIT':
        return { ...state, units: state.units.filter(u => u.id !== action.payload) };
    case 'ADD_PURCHASE_ORDER':
        return { ...state, purchaseOrders: [...state.purchaseOrders, action.payload] };
    case 'UPDATE_PURCHASE_ORDER_STATUS':
        return {
            ...state,
            purchaseOrders: state.purchaseOrders.map(po =>
                po.id === action.payload.id ? { ...po, status: action.payload.status } : po
            ),
        };
    case 'ADD_PURCHASE': {
        const purchase = action.payload;
        
        const updatedItems = [...state.items];
        const newStockMovements: StockMovement[] = [];
        purchase.items.forEach(purchasedItem => {
            const itemIndex = updatedItems.findIndex(i => i.id === purchasedItem.itemId);
            if (itemIndex !== -1) {
                const newStock = updatedItems[itemIndex].stock + purchasedItem.quantity;
                updatedItems[itemIndex].stock = newStock;
                updatedItems[itemIndex].purchasePrice = purchasedItem.cost;
                
                newStockMovements.push({
                    id: generateId(),
                    itemId: purchasedItem.itemId,
                    date: purchase.date,
                    type: 'purchase',
                    quantityChange: purchasedItem.quantity,
                    balance: newStock,
                    reference: purchase.purchaseNumber,
                });
            }
        });

        const updatedAccounts = state.accounts.map(acc => {
            if (acc.id === purchase.accountId) {
                return { ...acc, balance: acc.balance - purchase.amountPaid };
            }
            return acc;
        });

        const updatedPOs = purchase.purchaseOrderId 
            ? state.purchaseOrders.map(po => po.id === purchase.purchaseOrderId ? {...po, status: 'Completed' as const} : po) 
            : [...state.purchaseOrders];

        return {
            ...state,
            purchases: [...state.purchases, purchase],
            items: updatedItems,
            accounts: updatedAccounts,
            stockMovements: [...state.stockMovements, ...newStockMovements],
            purchaseOrders: updatedPOs,
        };
    }
    case 'ADD_SALES_ORDER':
        return { ...state, salesOrders: [...state.salesOrders, action.payload] };
    case 'UPDATE_SALES_ORDER_STATUS':
        return {
            ...state,
            salesOrders: state.salesOrders.map(so =>
                so.id === action.payload.id ? { ...so, status: action.payload.status } : so
            ),
        };
    case 'ADD_STOCK_ADJUSTMENT': {
        const adjustment = action.payload;
        const updatedItems = [...state.items];
        const newStockMovements: StockMovement[] = [];

        adjustment.items.forEach(adjItem => {
            const itemIndex = updatedItems.findIndex(i => i.id === adjItem.itemId);
            if (itemIndex !== -1) {
                updatedItems[itemIndex] = {
                    ...updatedItems[itemIndex],
                    stock: adjItem.physicalStock,
                };

                if (adjItem.difference !== 0) {
                    newStockMovements.push({
                        id: generateId(),
                        itemId: adjItem.itemId,
                        date: adjustment.date,
                        type: adjItem.difference > 0 ? 'adjustment-in' : 'adjustment-out',
                        quantityChange: adjItem.difference,
                        balance: adjItem.physicalStock,
                        reference: adjustment.adjustmentNumber,
                    });
                }
            }
        });

        return {
            ...state,
            stockAdjustments: [...state.stockAdjustments, adjustment],
            items: updatedItems,
            stockMovements: [...state.stockMovements, ...newStockMovements],
        };
    }
    case 'CREATE_SALE': {
        const newSale = action.payload;
        newSale.paymentStatus = newSale.amountPaid >= newSale.total ? 'Lunas' : 'Belum Lunas';

        const updatedItems = [...state.items];
        const newStockMovements: StockMovement[] = [];
        newSale.items.forEach(saleItem => {
            const itemIndex = updatedItems.findIndex(i => i.id === saleItem.itemId);
            if (itemIndex !== -1) {
                const newStock = updatedItems[itemIndex].stock - saleItem.quantity;
                updatedItems[itemIndex] = { ...updatedItems[itemIndex], stock: newStock };
                
                newStockMovements.push({
                    id: generateId(),
                    itemId: saleItem.itemId,
                    date: newSale.date,
                    type: 'sale',
                    quantityChange: -saleItem.quantity,
                    balance: newStock,
                    reference: newSale.transactionNumber,
                });
            }
        });

        const updatedAccounts = state.accounts.map(acc => {
            if (acc.id === newSale.accountId) {
                return { ...acc, balance: acc.balance + newSale.amountPaid };
            }
            return acc;
        });
        const updatedSOs = newSale.salesOrderId 
            ? state.salesOrders.map(so => so.id === newSale.salesOrderId ? {...so, status: 'Completed' as const} : so) 
            : [...state.salesOrders];

        let updatedCustomers = [...state.customers];
        if (newSale.customerId && newSale.customerId !== 'c1') {
            const customerIndex = updatedCustomers.findIndex(c => c.id === newSale.customerId);
            if (customerIndex > -1) {
                const customer = updatedCustomers[customerIndex];
                const pointsEarned = Math.floor(newSale.total / 10000);
                const updatedCustomer = { ...customer, points: (customer.points || 0) + pointsEarned };
                updatedCustomers[customerIndex] = updatedCustomer;
            }
        }

        return {
            ...state,
            sales: [...state.sales, newSale],
            items: updatedItems,
            customers: updatedCustomers,
            stockMovements: [...state.stockMovements, ...newStockMovements],
            accounts: updatedAccounts,
            salesOrders: updatedSOs,
        };
    }
    case 'ADD_RECEIVABLE_PAYMENT': {
        const { saleId, amount, accountId, date } = action.payload;
        let saleToUpdate: Sale | undefined;

        const updatedSales = state.sales.map(s => {
            if (s.id === saleId) {
                const newAmountPaid = s.amountPaid + amount;
                saleToUpdate = {
                    ...s,
                    amountPaid: newAmountPaid,
                    paymentStatus: newAmountPaid >= s.total ? 'Lunas' : 'Belum Lunas',
                };
                return saleToUpdate;
            }
            return s;
        });

        if (!saleToUpdate) return state;

        const updatedAccounts = state.accounts.map(acc => 
            acc.id === accountId ? { ...acc, balance: acc.balance + amount } : acc
        );
        
        const newStockMovement: StockMovement = {
          id: generateId(),
          itemId: '', // Not tied to a specific item
          date,
          type: 'payment',
          quantityChange: 0,
          balance: 0,
          reference: `Payment for ${saleToUpdate.transactionNumber}`
        };

        return { ...state, sales: updatedSales, accounts: updatedAccounts, stockMovements: [...state.stockMovements, newStockMovement] };
    }
    case 'ADD_PAYABLE_PAYMENT': {
        const { purchaseId, amount, accountId, date } = action.payload;
        let purchaseToUpdate: Purchase | undefined;

        const updatedPurchases = state.purchases.map(p => {
            if (p.id === purchaseId) {
                const newAmountPaid = p.amountPaid + amount;
                purchaseToUpdate = {
                    ...p,
                    amountPaid: newAmountPaid,
                    paymentStatus: newAmountPaid >= p.total ? 'Lunas' : 'Belum Lunas',
                };
                return purchaseToUpdate;
            }
            return p;
        });

        if (!purchaseToUpdate) return state;

        const updatedAccounts = state.accounts.map(acc => 
            acc.id === accountId ? { ...acc, balance: acc.balance - amount } : acc
        );

        const newStockMovement: StockMovement = {
          id: generateId(),
          itemId: '',
          date,
          type: 'payment',
          quantityChange: 0,
          balance: 0,
          reference: `Payment for ${purchaseToUpdate.purchaseNumber}`
        };

        return { ...state, purchases: updatedPurchases, accounts: updatedAccounts, stockMovements: [...state.stockMovements, newStockMovement] };
    }
    case 'ADD_PRICE_TIER':
        return { ...state, priceTiers: [...state.priceTiers, action.payload] };
    case 'UPDATE_PRICE_TIER':
        return { ...state, priceTiers: state.priceTiers.map(pt => pt.id === action.payload.id ? action.payload : pt) };
    case 'DELETE_PRICE_TIER':
        // Also remove this tier from any items that use it
        const updatedItemsOnDelete = state.items.map(item => {
            const newPriceTiers = { ...item.priceTiers };
            if (newPriceTiers[action.payload]) {
                delete newPriceTiers[action.payload];
            }
            return { ...item, priceTiers: newPriceTiers };
        });
        const updatedCustomersOnDelete = state.customers.map(customer => {
            if (customer.priceTierId === action.payload) {
                return { ...customer, priceTierId: undefined };
            }
            return customer;
        });
        return { 
            ...state, 
            priceTiers: state.priceTiers.filter(pt => pt.id !== action.payload),
            items: updatedItemsOnDelete,
            customers: updatedCustomersOnDelete
        };
    case 'ADD_SALES_RETURN': {
        const salesReturn = action.payload;
        const updatedItems = [...state.items];
        const newStockMovements: StockMovement[] = [];

        salesReturn.returnedItems.forEach(returnedItem => {
            const itemIndex = updatedItems.findIndex(i => i.id === returnedItem.itemId);
            if (itemIndex > -1) {
                const newStock = updatedItems[itemIndex].stock + returnedItem.quantity;
                updatedItems[itemIndex].stock = newStock;
                
                newStockMovements.push({
                    id: generateId(),
                    itemId: returnedItem.itemId,
                    date: salesReturn.date,
                    type: 'sales-return',
                    quantityChange: returnedItem.quantity,
                    balance: newStock,
                    reference: salesReturn.returnNumber,
                });
            }
        });

        const updatedAccounts = state.accounts.map(acc => {
            if (acc.id === salesReturn.accountId) {
                return { ...acc, balance: acc.balance - salesReturn.totalRefund };
            }
            return acc;
        });

        return {
            ...state,
            salesReturns: [...state.salesReturns, salesReturn],
            items: updatedItems,
            accounts: updatedAccounts,
            stockMovements: [...state.stockMovements, ...newStockMovements],
        };
    }
    case 'ADD_EXPENSE_CATEGORY':
        return { ...state, expenseCategories: [...state.expenseCategories, action.payload] };
    case 'UPDATE_EXPENSE_CATEGORY':
        return { ...state, expenseCategories: state.expenseCategories.map(ec => ec.id === action.payload.id ? action.payload : ec) };
    case 'DELETE_EXPENSE_CATEGORY':
        return { ...state, expenseCategories: state.expenseCategories.filter(ec => ec.id !== action.payload) };
    case 'ADD_EXPENSE': {
        const { accountId, amount } = action.payload;
        const updatedAccounts = state.accounts.map(acc => 
            acc.id === accountId ? { ...acc, balance: acc.balance - amount } : acc
        );
        return { ...state, expenses: [...state.expenses, action.payload], accounts: updatedAccounts };
    }
    case 'UPDATE_EXPENSE': {
        const oldExpense = state.expenses.find(ex => ex.id === action.payload.id);
        if (!oldExpense) return state;

        const newExpense = action.payload;
        
        const updatedAccounts = [...state.accounts].map(acc => {
            // Revert old transaction
            if (acc.id === oldExpense.accountId) {
                acc = { ...acc, balance: acc.balance + oldExpense.amount };
            }
            // Apply new transaction
            if (acc.id === newExpense.accountId) {
                acc = { ...acc, balance: acc.balance - newExpense.amount };
            }
            return acc;
        });

        return {
            ...state,
            expenses: state.expenses.map(ex => ex.id === newExpense.id ? newExpense : ex),
            accounts: updatedAccounts
        };
    }
    case 'DELETE_EXPENSE': {
        const expenseToDelete = state.expenses.find(ex => ex.id === action.payload);
        if (!expenseToDelete) return state;

        const { accountId, amount } = expenseToDelete;
        const updatedAccounts = state.accounts.map(acc =>
            acc.id === accountId ? { ...acc, balance: acc.balance + amount } : acc
        );
        return {
            ...state,
            expenses: state.expenses.filter(ex => ex.id !== action.payload),
            accounts: updatedAccounts
        };
    }
    default:
      return state;
  }
};

// --- CONTEXT & PROVIDER ---
const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action>; hasPermission: (permission: Permission) => boolean; } | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, getInitialState());
  
  // Effect to load state from localStorage on startup
  useEffect(() => {
    const lastCompany = localStorage.getItem('ACAPOS_LAST_COMPANY');
    if (lastCompany && !state.isAuthenticated) {
        const companyData = localStorage.getItem(`ACAPOS_DATA_${lastCompany}`);
        if(companyData) {
            const parsedData = JSON.parse(companyData);
            dispatch({ type: 'RESTORE_STATE', payload: parsedData });
        } else {
            dispatch({ type: 'INITIALIZE_COMPANY', payload: { companyName: lastCompany } });
        }
    }
  }, [state.isAuthenticated]);

  // Effect to save state to localStorage when it changes
  useEffect(() => {
    if (state.settings.companyName) {
      localStorage.setItem('ACAPOS_LAST_COMPANY', state.settings.companyName);
      const { isAuthenticated, currentUser, currentUserRole, ...dataToSave } = state;
      localStorage.setItem(`ACAPOS_DATA_${state.settings.companyName}`, JSON.stringify(dataToSave));
    }
  }, [state]);
  
  const hasPermission = (permission: Permission): boolean => {
    return state.currentUserRole?.permissions.includes(permission) ?? false;
  };

  return (
    <AppContext.Provider value={{ state, dispatch, hasPermission }}>
      {children}
    </AppContext.Provider>
  );
};

// --- HOOK ---
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};