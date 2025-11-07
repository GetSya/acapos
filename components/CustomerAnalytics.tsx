import React, { useMemo, useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { formatCurrency, formatDate, exportToCsv } from '../utils/helpers';
import { ICONS } from '../constants';

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

type CustomerStats = {
    id: string;
    name: string;
    totalSpent: number;
    transactionCount: number;
    lastPurchaseDate: string;
};

type SortKey = 'name' | 'totalSpent' | 'transactionCount' | 'lastPurchaseDate';

const CustomerAnalytics: React.FC = () => {
    const { state } = useAppContext();
    const [sortKey, setSortKey] = useState<SortKey>('totalSpent');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const analyticsData = useMemo(() => {
        const stats: { [customerId: string]: Omit<CustomerStats, 'id' | 'name'> } = {};

        for (const sale of state.sales) {
            const customerId = sale.customerId || 'c1'; // Default to Pelanggan Umum
            if (!stats[customerId]) {
                stats[customerId] = { totalSpent: 0, transactionCount: 0, lastPurchaseDate: '' };
            }
            stats[customerId].totalSpent += sale.total;
            stats[customerId].transactionCount += 1;
            if (!stats[customerId].lastPurchaseDate || new Date(sale.date) > new Date(stats[customerId].lastPurchaseDate)) {
                stats[customerId].lastPurchaseDate = sale.date;
            }
        }

        const customerDetails: CustomerStats[] = state.customers
            .map(customer => ({
                id: customer.id,
                name: customer.name,
                ... (stats[customer.id] || { totalSpent: 0, transactionCount: 0, lastPurchaseDate: '' })
            }));
            
        // Exclude 'Pelanggan Umum' for top customer calculations
        const payingCustomers = customerDetails.filter(c => c.id !== 'c1' && c.transactionCount > 0);

        const totalSpentAll = Object.values(stats).reduce((sum, s) => sum + s.totalSpent, 0);
        const averageSpend = payingCustomers.length > 0 ? totalSpentAll / payingCustomers.length : 0;
        
        const topCustomers = [...payingCustomers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

        return {
            customerDetails,
            totalUniqueCustomers: payingCustomers.length,
            averageSpend,
            topCustomers
        };
    }, [state.sales, state.customers]);
    
    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('desc'); // Default to desc for value-based columns
        }
    };
    
    const sortedCustomers = useMemo(() => {
        return [...analyticsData.customerDetails].sort((a, b) => {
            const valA = a[sortKey];
            const valB = b[sortKey];

            if(sortKey === 'lastPurchaseDate') {
                const dateA = valA ? new Date(valA).getTime() : 0;
                const dateB = valB ? new Date(valB).getTime() : 0;
                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            }

            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            if (typeof valA === 'number' && typeof valB === 'number') {
                return sortOrder === 'asc' ? valA - valB : valB - valA;
            }
            return 0;
        });
    }, [analyticsData.customerDetails, sortKey, sortOrder]);

    const handleExport = () => {
        const dataToExport = sortedCustomers.map(c => ({
            'Nama Pelanggan': c.name,
            'Total Belanja': c.totalSpent,
            'Jumlah Transaksi': c.transactionCount,
            'Pembelian Terakhir': c.lastPurchaseDate ? formatDate(c.lastPurchaseDate) : '-',
        }));
        const fileName = `Analisis_Pelanggan_${new Date().toISOString().split('T')[0]}.csv`;
        exportToCsv(fileName, dataToExport);
    };

    const SortableHeader: React.FC<{ children: React.ReactNode; columnKey: SortKey; className?: string; }> = ({ children, columnKey, className = '' }) => {
        const isActive = sortKey === columnKey;
        const icon = !isActive ? ICONS.sortable : sortOrder === 'asc' ? ICONS.sortUp : ICONS.sortDown;
        return (
            <th className={`p-3 ${className}`}>
                <button onClick={() => handleSort(columnKey)} className="flex items-center gap-1 font-semibold hover:text-sky-600 transition-colors">
                    {children}
                    {icon}
                </button>
            </th>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold">Analisis Pelanggan</h1>
                 <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    {ICONS.download}
                    <span>Export CSV</span>
                </button>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <StatCard title="Total Pelanggan Unik" value={analyticsData.totalUniqueCustomers} subtext="Tidak termasuk 'Pelanggan Umum'" icon={ICONS.customers} />
                <StatCard title="Rata-rata Belanja" value={formatCurrency(analyticsData.averageSpend)} subtext="per Pelanggan" icon={ICONS.report} />
                <StatCard title="Pelanggan Teratas" value={analyticsData.topCustomers[0]?.name || '-'} subtext={analyticsData.topCustomers[0] ? formatCurrency(analyticsData.topCustomers[0].totalSpent) : ''} icon={ICONS.user} />
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold mb-4 text-slate-700">Papan Peringkat Pelanggan (Top 5)</h2>
                     <ul className="space-y-3">
                        {analyticsData.topCustomers.map((customer, index) => (
                            <li key={customer.id} className="flex items-center gap-4 p-2 rounded-md transition-colors even:bg-slate-50 hover:bg-sky-50">
                                <span className="font-bold text-lg text-slate-400 w-6 text-center">{index + 1}</span>
                                <div className="flex-grow">
                                    <p className="font-semibold text-slate-800">{customer.name}</p>
                                    <p className="text-xs text-slate-500">{customer.transactionCount} transaksi</p>
                                </div>
                                <span className="font-bold text-sky-600 text-lg">{formatCurrency(customer.totalSpent)}</span>
                            </li>
                        ))}
                         {analyticsData.topCustomers.length === 0 && (
                            <li className="text-center p-4 text-slate-500">Belum ada data transaksi pelanggan.</li>
                         )}
                    </ul>
                </div>
                
                 <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-1">
                    <h2 className="text-lg font-semibold mb-4 text-slate-700">Rincian Semua Pelanggan</h2>
                    <div className="overflow-x-auto max-h-96">
                        <table className="w-full text-left text-sm">
                            <thead className="sticky top-0 bg-slate-100">
                                <tr className="border-b">
                                    <SortableHeader columnKey="name">Nama Pelanggan</SortableHeader>
                                    <SortableHeader columnKey="totalSpent">Total Belanja</SortableHeader>
                                    <SortableHeader columnKey="transactionCount">Jml. Transaksi</SortableHeader>
                                    <SortableHeader columnKey="lastPurchaseDate">Pembelian Terakhir</SortableHeader>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedCustomers.map(customer => (
                                    <tr key={customer.id} className="border-b hover:bg-slate-50">
                                        <td className="p-3 font-semibold">{customer.name}</td>
                                        <td className="p-3">{formatCurrency(customer.totalSpent)}</td>
                                        <td className="p-3 text-center">{customer.transactionCount}</td>
                                        <td className="p-3">{customer.lastPurchaseDate ? formatDate(customer.lastPurchaseDate) : '-'}</td>
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

export default CustomerAnalytics;