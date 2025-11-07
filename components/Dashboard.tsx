import React, { useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import { ICONS } from '../constants';

// Reusable component for statistics cards
const StatCard: React.FC<{ title: string; value: string | number; subtext?: string; icon: React.ReactNode }> = ({ title, value, subtext, icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center gap-4">
        <div className="p-3 bg-sky-100 text-sky-500 rounded-full">
            {icon}
        </div>
        <div>
            <h3 className="text-sm font-medium text-slate-500">{title}</h3>
            <p className="text-2xl lg:text-3xl font-bold text-slate-800 mt-1">{value}</p>
            {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
    </div>
);

// --- Chart Components (self-contained for simplicity) ---

// Bar Chart for weekly sales trend
const WeeklySalesChart: React.FC<{ data: { label: string; value: number }[] }> = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1); // Use 1 to avoid division by zero if all values are 0

    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
            <h2 className="text-lg font-semibold mb-4 text-slate-700">Penjualan 7 Hari Terakhir</h2>
            <div className="flex-grow flex items-end justify-between gap-2 pt-4 border-t">
                {data.map((day, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2 group text-center">
                        <div className="relative w-full h-48 bg-slate-100 rounded-md flex items-end" title={formatCurrency(day.value)}>
                            <div
                                className="w-full bg-sky-500 rounded-md group-hover:bg-sky-600 transition-all duration-300 ease-in-out"
                                style={{ height: `${(day.value / maxValue) * 100}%` }}
                            >
                               <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                   {formatCurrency(day.value)}
                                   <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800"></div>
                               </div>
                            </div>
                        </div>
                        <span className="text-xs font-medium text-slate-500">{day.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Donut Chart for top selling products
const TopProductsChart: React.FC<{ data: { name: string; value: number }[] }> = ({ data }) => {
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    const colors = ['#0ea5e9', '#34d399', '#f59e0b', '#ef4444', '#8b5cf6'];
    
    if (data.length === 0) {
        return (
             <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
                <h2 className="text-lg font-semibold mb-4 text-slate-700">Produk Terlaris</h2>
                <div className="flex-grow flex items-center justify-center pt-4 border-t text-slate-500">
                    Belum ada data penjualan.
                </div>
            </div>
        )
    }

    let cumulativePercentage = 0;
    const gradientParts = data.map((item, index) => {
        const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
        const start = cumulativePercentage;
        cumulativePercentage += percentage;
        const end = cumulativePercentage;
        return `${colors[index % colors.length]} ${start}% ${end}%`;
    }).join(', ');
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
            <h2 className="text-lg font-semibold mb-4 text-slate-700">Produk Terlaris (Berdasarkan Pendapatan)</h2>
            <div className="flex-grow flex flex-col xl:flex-row items-center justify-center gap-4 xl:gap-8 pt-4 border-t">
                <div 
                    className="relative w-40 h-40 rounded-full flex items-center justify-center" 
                    style={{ background: `conic-gradient(${gradientParts})` }}
                    role="img"
                    aria-label="Grafik produk terlaris"
                >
                    <div className="absolute w-24 h-24 bg-white rounded-full"></div>
                </div>
                <ul className="space-y-2 w-full max-w-xs">
                    {data.map((item, index) => (
                        <li key={item.name} className="flex items-center gap-3 text-sm">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }}></span>
                            <span className="font-medium text-slate-700 truncate flex-1" title={item.name}>{item.name}</span>
                            <span className="text-slate-500 font-semibold ml-auto">{formatCurrency(item.value)}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};


const Dashboard: React.FC = () => {
    const { state } = useAppContext();

    const dashboardData = useMemo(() => {
        // Today's stats
        const today = new Date().toISOString().split('T')[0];
        const todaysSales = state.sales.filter(sale => sale.date.startsWith(today));
        const totalTodaysRevenue = todaysSales.reduce((sum, sale) => sum + sale.total, 0);
        
        const todaysProfit = todaysSales.reduce((profitSum, sale) => {
            const saleProfit = sale.items.reduce((itemProfit, saleItem) => {
                const itemData = state.items.find(i => i.id === saleItem.itemId);
                if (itemData && itemData.purchasePrice > 0) { // Ensure purchase price is set
                    return itemProfit + ((saleItem.price - itemData.purchasePrice) * saleItem.quantity);
                }
                return itemProfit;
            }, 0);
            return profitSum + saleProfit;
        }, 0);

        // Weekly sales
        const weeklySales: { label: string; value: number }[] = [];
        const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            weeklySales.push({
                label: dayLabels[d.getDay()],
                value: 0
            });
        }
        
        state.sales.forEach(sale => {
            const saleDate = new Date(sale.date);
            const diff = new Date().setHours(0,0,0,0) - saleDate.setHours(0,0,0,0);
            const daysAgo = Math.floor(diff / (1000 * 60 * 60 * 24));
            if (daysAgo >= 0 && daysAgo < 7) {
                weeklySales[6 - daysAgo].value += sale.total;
            }
        });
        
        // Top selling products by revenue
        const productRevenue: { [key: string]: { name: string, value: number } } = {};
        state.sales.forEach(sale => {
            sale.items.forEach(saleItem => {
                const itemData = state.items.find(i => i.id === saleItem.itemId);
                if (itemData) {
                    if (!productRevenue[saleItem.itemId]) {
                        productRevenue[saleItem.itemId] = { name: itemData.name, value: 0 };
                    }
                    productRevenue[saleItem.itemId].value += saleItem.price * saleItem.quantity;
                }
            });
        });

        const topProducts = Object.values(productRevenue)
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // Low stock items
        const lowStockItems = state.items.filter(item => item.stock <= item.minStock);
        
        // Recent sales
        const recentSales = state.sales.slice(-5).reverse();

        return {
            totalTodaysRevenue,
            todaysTransactions: todaysSales.length,
            todaysProfit,
            weeklySales,
            topProducts,
            lowStockItems,
            recentSales
        };
    }, [state.sales, state.items]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>

            {dashboardData.lowStockItems.length > 0 && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-r-lg flex items-start gap-4 shadow-sm" role="alert">
                    <div className="flex-shrink-0 pt-0.5">{ICONS.warning}</div>
                    <div>
                        <p className="font-bold">Peringatan Stok Rendah!</p>
                        <p className="text-sm">Terdapat {dashboardData.lowStockItems.length} item yang stoknya di bawah minimum. Segera lakukan restock.</p>
                    </div>
                </div>
            )}
            
            {/* --- Statistic Cards --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard title="Penjualan Hari Ini" value={formatCurrency(dashboardData.totalTodaysRevenue)} subtext={`${dashboardData.todaysTransactions} transaksi`} icon={ICONS.pos} />
                <StatCard title="Estimasi Profit Hari Ini" value={formatCurrency(dashboardData.todaysProfit)} subtext="Berdasarkan harga jual & beli" icon={ICONS.report}/>
                <StatCard title="Total Item" value={state.items.length} subtext="Jenis produk terdaftar" icon={ICONS.items} />
                <StatCard title="Stok Rendah" value={dashboardData.lowStockItems.length} subtext="Item perlu di-restock" icon={ICONS.warning}/>
            </div>

            {/* --- Charts --- */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <WeeklySalesChart data={dashboardData.weeklySales} />
                </div>
                <div className="lg:col-span-2">
                    <TopProductsChart data={dashboardData.topProducts} />
                </div>
            </div>

            {/* --- Tables: Recent Transactions & Low Stock --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold mb-4 text-slate-700">Transaksi Terakhir</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-2 text-sm font-medium">No. Transaksi</th>
                                    <th className="p-2 text-sm font-medium">Tanggal</th>
                                    <th className="p-2 text-sm font-medium text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dashboardData.recentSales.map(sale => (
                                    <tr key={sale.id} className="border-b border-slate-100">
                                        <td className="p-2 font-mono text-sm">{sale.transactionNumber}</td>
                                        <td className="p-2 text-sm">{formatDate(sale.date)}</td>
                                        <td className="p-2 text-right font-semibold">{formatCurrency(sale.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold mb-4 text-slate-700">Peringatan Stok Rendah</h2>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-2 text-sm font-medium">Nama Item</th>
                                    <th className="p-2 text-sm font-medium text-center">Sisa Stok</th>
                                    <th className="p-2 text-sm font-medium text-center">Stok Min.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dashboardData.lowStockItems.slice(0, 5).map(item => (
                                    <tr key={item.id} className="border-b border-slate-100">
                                        <td className="p-2 font-medium">{item.name}</td>
                                        <td className="p-2 text-center text-red-500 font-bold">{item.stock}</td>
                                        <td className="p-2 text-center text-slate-600">{item.minStock}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;