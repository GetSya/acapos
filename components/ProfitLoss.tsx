import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { formatCurrency, exportToCsv } from '../utils/helpers';
import { ICONS } from '../constants';

const StatCard: React.FC<{ title: string; value: string | number; className?: string }> = ({ title, value, className }) => (
    <div className={`bg-white p-4 rounded-lg shadow ${className}`}>
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
    </div>
);


const ProfitLoss: React.FC = () => {
    const { state } = useAppContext();

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(lastDayOfMonth);

    const reportData = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const salesInRange = state.sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= start && saleDate <= end;
        });
        
        const returnsInRange = state.salesReturns.filter(ret => {
            const retDate = new Date(ret.date);
            return retDate >= start && retDate <= end;
        });

        const expensesInRange = state.expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= start && expDate <= end;
        });

        const totalGrossRevenue = salesInRange.reduce((sum, sale) => sum + sale.subtotal, 0);
        const totalRefunds = returnsInRange.reduce((sum, ret) => sum + ret.totalRefund, 0);
        const netRevenue = totalGrossRevenue - totalRefunds;
        
        const cogsFromSales = salesInRange.reduce((cogsSum, sale) => {
            return cogsSum + sale.items.reduce((itemCogs, saleItem) => {
                const itemData = state.items.find(i => i.id === saleItem.itemId);
                return itemCogs + ((itemData?.purchasePrice || 0) * saleItem.quantity);
            }, 0);
        }, 0);

        const cogsFromReturns = returnsInRange.reduce((cogsSum, ret) => {
            return cogsSum + ret.returnedItems.reduce((itemCogs, retItem) => {
                const itemData = state.items.find(i => i.id === retItem.itemId);
                return itemCogs + ((itemData?.purchasePrice || 0) * retItem.quantity);
            }, 0);
        }, 0);
        
        const netCOGS = cogsFromSales - cogsFromReturns;

        const totalExpenses = expensesInRange.reduce((sum, exp) => sum + exp.amount, 0);

        const grossProfit = netRevenue - netCOGS;
        const netProfit = grossProfit - totalExpenses;
        
        return {
            totalGrossRevenue,
            totalRefunds,
            netRevenue,
            netCOGS,
            grossProfit,
            totalExpenses,
            netProfit,
            expensesInRange,
        };
    }, [startDate, endDate, state.sales, state.items, state.expenses, state.salesReturns]);
    
    const handleExport = () => {
        const dataToExport = [
            { Laporan: 'Pendapatan Kotor', Jumlah: reportData.totalGrossRevenue },
            { Laporan: 'Total Retur', Jumlah: -reportData.totalRefunds },
            { Laporan: 'Pendapatan Bersih', Jumlah: reportData.netRevenue },
            { Laporan: 'Harga Pokok Penjualan (HPP)', Jumlah: -reportData.netCOGS },
            { Laporan: 'LABA KOTOR', Jumlah: reportData.grossProfit },
            ...reportData.expensesInRange.map(exp => ({
                Laporan: `Beban: ${exp.description}`,
                Jumlah: -exp.amount
            })),
            { Laporan: 'Total Beban Operasional', Jumlah: -reportData.totalExpenses },
            { Laporan: 'LABA BERSIH', Jumlah: reportData.netProfit }
        ];
        
        const fileName = `Laporan_Laba_Rugi_${startDate}_-_${endDate}.csv`;
        exportToCsv(fileName, dataToExport);
    };

    return (
        <div>
            <div className="mb-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h1 className="text-3xl font-bold">Laporan Laba Rugi</h1>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label htmlFor="startDate" className="flex-shrink-0">Dari:</label>
                            <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-md"/>
                        </div>
                        <div className="flex items-center gap-2">
                            <label htmlFor="endDate" className="flex-shrink-0">Sampai:</label>
                            <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-md"/>
                        </div>
                         <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                            {ICONS.download}
                            <span>Export CSV</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                <StatCard title="Pendapatan Bersih" value={formatCurrency(reportData.netRevenue)} />
                <StatCard title="Laba Kotor" value={formatCurrency(reportData.grossProfit)} />
                <StatCard title="Laba Bersih" value={formatCurrency(reportData.netProfit)} className={reportData.netProfit >= 0 ? "bg-green-50" : "bg-red-50"} />
            </div>

            {/* Profit/Loss Table */}
            <div className="overflow-x-auto bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Rincian Laba Rugi</h2>
                <div className="space-y-2 text-lg">
                    <div className="flex justify-between items-center py-3 border-b">
                        <span className="font-semibold text-slate-700">Pendapatan Kotor</span>
                        <span className="font-bold">{formatCurrency(reportData.totalGrossRevenue)}</span>
                    </div>
                     <div className="flex justify-between items-center py-3 border-b">
                        <span className="font-semibold text-slate-700">Retur Penjualan</span>
                        <span className="font-bold text-red-600">({formatCurrency(reportData.totalRefunds)})</span>
                    </div>
                     <div className="flex justify-between items-center py-3 border-b">
                        <span className="font-bold text-slate-800">Pendapatan Bersih</span>
                        <span className="font-extrabold">{formatCurrency(reportData.netRevenue)}</span>
                    </div>
                     <div className="flex justify-between items-center py-3 border-b">
                        <span className="font-semibold text-slate-700">Harga Pokok Penjualan (HPP)</span>
                        <span className="font-bold text-red-600">({formatCurrency(reportData.netCOGS)})</span>
                    </div>
                     <div className="flex justify-between items-center py-3 border-b-2 border-slate-800 bg-slate-50 -mx-6 px-6">
                        <span className="font-bold text-slate-800 text-xl">Laba Kotor</span>
                        <span className="font-extrabold text-xl">{formatCurrency(reportData.grossProfit)}</span>
                    </div>
                    <div className="pt-4">
                        <h3 className="font-semibold text-slate-700 mb-2">Beban Operasional</h3>
                        {reportData.expensesInRange.length > 0 ? reportData.expensesInRange.map(exp => (
                            <div key={exp.id} className="flex justify-between items-center py-2 border-b text-base">
                                <span className="text-slate-600 pl-4">{exp.description}</span>
                                <span className="text-red-600">({formatCurrency(exp.amount)})</span>
                            </div>
                        )) : <p className="text-slate-500 pl-4 py-2 text-base">Tidak ada beban operasional pada periode ini.</p>}
                         <div className="flex justify-between items-center pt-2 mt-2">
                            <span className="font-semibold text-slate-700">Total Beban Operasional</span>
                            <span className="font-bold text-red-600">({formatCurrency(reportData.totalExpenses)})</span>
                        </div>
                    </div>
                     <div className={`flex justify-between items-center py-4 border-t-2 border-slate-800 mt-4 -mx-6 px-6 ${reportData.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                        <span className="font-bold text-slate-800 text-xl">Laba Bersih</span>
                        <span className={`font-extrabold text-2xl ${reportData.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(reportData.netProfit)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfitLoss;