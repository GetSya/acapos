import React from 'react';
import { AppProvider, useAppContext } from './contexts/AppContext';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Items from './components/Items';
import Customers from './components/Customers';
import Accounts from './components/Accounts';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Categories from './components/Categories';
import Brands from './components/Brands';
import Units from './components/Units';
import Suppliers from './components/Suppliers';
import Purchases from './components/Purchases';
import PurchaseOrders from './components/PurchaseOrders';
import SalesOrders from './components/SalesOrders';
import SalesInvoices from './components/SalesInvoices';
import StockAdjustments from './components/StockAdjustments';
import Users from './components/Users';
import { supabase } from './supabase/client';
import { Permission, User } from './types';
import ProfitLoss from './components/ProfitLoss';
import StockCard from './components/StockCard';
import CustomerAnalytics from './components/CustomerAnalytics';
import CustomerPurchaseHistory from './components/CustomerPurchaseHistory';
import Receivables from './components/Receivables';
import Payables from './components/Payables';
import Expenses from './components/Expenses';
import ExpenseCategories from './components/ExpenseCategories';
import PriceTiers from './components/PriceTiers';
import SalesReturns from './components/SalesReturns';
import Roles from './components/Roles';
import AccessDenied from './components/AccessDenied';
import { usePermissions } from './hooks/usePermissions';

const App: React.FC = () => {
  return (
    <AppProvider>
      <Main />
    </AppProvider>
  );
};

const PAGE_PERMISSIONS: { [key: string]: Permission } = {
  dashboard: 'dashboard.view',
  pos: 'pos.access',
  items: 'items.view',
  stock_card: 'items.view',
  stock_adjustments: 'stock_adjustments.access',
  customers: 'customers.manage',
  customer_purchase_history: 'customers.manage',
  suppliers: 'suppliers.manage',
  purchasing: 'purchase_orders.create',
  purchases: 'purchases.create',
  sales: 'sales_orders.create',
  sales_invoices: 'sales_invoices.view',
  sales_returns: 'sales_returns.access',
  accounts: 'accounts.manage',
  receivables: 'receivables.view',
  payables: 'payables.view',
  expenses: 'expenses.manage',
  expense_categories: 'expense_categories.manage',
  reports: 'reports.sales',
  profit_loss: 'reports.profit_loss',
  customer_analytics: 'reports.customer_analytics',
  settings: 'settings.manage',
  categories: 'categories.manage',
  brands: 'brands.manage',
  units: 'units.manage',
  price_tiers: 'price_tiers.manage',
  users: 'users.manage',
  roles: 'roles.manage',
};

const Main: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { hasPermission } = usePermissions();
  const [currentPage, setCurrentPage] = React.useState<string>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);
  const [salesOrderToInvoice, setSalesOrderToInvoice] = React.useState<string | null>(null);
  const [viewingItemId, setViewingItemId] = React.useState<string | null>(null);
  const [viewingCustomerId, setViewingCustomerId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchUsersAndRoles = async () => {
        // Fetch all roles first
        const { data: roles, error: rolesError } = await supabase.from('roles').select('*');
        if (rolesError) {
          console.error("Gagal memuat roles:", rolesError.message);
          return;
        }

        const { data: users, error: usersError } = await supabase.from('users').select('*');
        if (usersError) {
            console.error("Gagal memuat daftar pengguna:", usersError.message);
        } else {
            const mappedUsers: User[] = (users || []).map(u => ({
                id: u.id,
                username: u.username,
                fullName: u.fullName,
                roleId: u.roleId,
                isActive: u.isActive,
                passwordHash: '',
            }));

            // Dispatch both roles and users
            dispatch({ type: 'SET_USERS', payload: mappedUsers || [] });
            // This is slightly inefficient as roles might be dispatched on login too, but ensures consistency
            if (state.currentUser) {
              dispatch({ type: 'LOGIN', payload: { user: state.currentUser, roles: roles || [] } });
            }
        }
    };

    if (state.isAuthenticated && state.currentUser && hasPermission('users.manage')) {
        fetchUsersAndRoles();
    }
  }, [state.isAuthenticated, state.currentUser, dispatch, hasPermission]);


  if (!state.isAuthenticated || !state.currentUser) {
    return <Login />;
  }
  
  const handleCreateInvoiceFromSO = (soId: string) => {
    setSalesOrderToInvoice(soId);
    setCurrentPage('sales_invoices');
  };

  const handleViewStockCard = (itemId: string) => {
    setViewingItemId(itemId);
    setCurrentPage('stock_card');
  };

  const handleViewCustomerHistory = (customerId: string) => {
    setViewingCustomerId(customerId);
    setCurrentPage('customer_purchase_history');
  };

  const renderPage = () => {
    const requiredPermission = PAGE_PERMISSIONS[currentPage];
    if (requiredPermission && !hasPermission(requiredPermission)) {
        return <AccessDenied />;
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'pos':
        return <POS />;
      case 'items':
        return <Items onViewStockCard={handleViewStockCard} />;
      case 'stock_card':
        return <StockCard itemId={viewingItemId} onBack={() => setCurrentPage('items')} />;
      case 'stock_adjustments':
        return <StockAdjustments />;
      case 'customers':
        return <Customers onViewHistory={handleViewCustomerHistory} />;
      case 'customer_purchase_history':
        return <CustomerPurchaseHistory customerId={viewingCustomerId} onBack={() => setCurrentPage('customers')} />;
      case 'suppliers':
        return <Suppliers />;
      case 'purchasing':
        return <PurchaseOrders />;
      case 'purchases':
        return <Purchases />;
      case 'sales':
        return <SalesOrders onInvoice={handleCreateInvoiceFromSO} />;
      case 'sales_invoices':
        return <SalesInvoices salesOrderIdToLoad={salesOrderToInvoice} clearSalesOrderToLoad={() => setSalesOrderToInvoice(null)} />;
      case 'sales_returns':
        return <SalesReturns />;
      case 'accounts':
        return <Accounts />;
      case 'receivables':
        return <Receivables />;
      case 'payables':
        return <Payables />;
      case 'expenses':
        return <Expenses />;
      case 'expense_categories':
        return <ExpenseCategories />;
      case 'reports':
        return <Reports />;
      case 'profit_loss':
        return <ProfitLoss />;
      case 'customer_analytics':
        return <CustomerAnalytics />;
      case 'settings':
        return <Settings />;
      case 'categories':
        return <Categories />;
      case 'brands':
        return <Brands />;
      case 'units':
        return <Units />;
      case 'price_tiers':
        return <PriceTiers />;
      case 'users':
        return <Users />;
      case 'roles':
        return <Roles />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800">
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        isOpen={isSidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-4 sm:p-6 lg:p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;