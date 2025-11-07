import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { formatCurrency, formatDate, exportToCsv } from '../utils/helpers';
import { Sale } from '../types';
import Modal from './Modal';
import { ICONS } from '../constants';
import { usePermissions } from '../hooks/usePermissions';

const StatCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
    </div>
);

// Component for the detailed invoice view, used inside the modal
const InvoiceView: React.FC<{ sale: Sale; state: ReturnType<typeof useAppContext>['state'] }> = ({ sale, state }) => {
    const customer = state.customers.find(c => c.id === sale.customerId);
    const cashier = state.users.find(u => u.id === sale.cashierId);

    const discountAmount = sale.discountType === 'percentage' ? sale.subtotal * (sale.discountValue / 100) : sale.discountValue;
    const subtotalAfterDiscount = sale.subtotal - discountAmount;
    const taxAmount = sale.taxType === 'percentage' ? subtotalAfterDiscount * (sale.taxValue / 100) : sale.taxValue;

    return (
        <div className="bg-white p-6 sm:p-8 font-sans text-gray-800 print-friendly-invoice">
            {/* Header */}
            <header className="flex justify-between items-start pb-4 border-b-2 border-gray-800">
                <div className="flex items-center space-x-4">
                    {state.settings.logo && <img src={state.settings.logo} alt="Company Logo" className="h-16 w-auto object-contain" />}
                    <div>
                        <h2 className="font-bold text-xl text-gray-800">{state.settings.companyName}</h2>
                        <p className="text-xs text-gray-500">{state.settings.companyAddress}</p>
                        <p className="text-xs text-gray-500">{state.settings.companyPhone}</p>
                    </div>
                </div>
                <div className="text-right flex-shrink-0">
                    <h1 className="text-3xl font-bold text-gray-900 uppercase">INVOICE</h1>
                    <p className="text-sm text-gray-500 mt-1">{sale.transactionNumber}</p>
                </div>
            </header>
            
            {/* Info Section */}
            <section className="grid grid-cols-2 gap-4 mt-6 text-sm">
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kepada Yth.</h3>
                    <p className="font-bold text-base mt-1">{customer?.name || 'Pelanggan Ecer'}</p>
                    <p className="text-xs text-gray-600">{customer?.address || ''}</p>
                    <p className="text-xs text-gray-600">{customer?.phone || ''}</p>
                </div>
                <div className="text-right">
                    <div className="grid grid-cols-2 gap-x-2">
                        <span className="font-semibold text-gray-600">Tanggal Invoice:</span>
                        <span className="text-gray-800">{formatDate(sale.date)}</span>
                        <span className="font-semibold text-gray-600">Kasir:</span>
                        <span className="text-gray-800">{cashier?.fullName || '-'}</span>
                    </div>
                </div>
            </section>

            {/* Item Table */}
            <section className="mt-8">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b-2 border-gray-300">
                        <tr>
                            <th className="p-2 text-left font-bold text-gray-600 uppercase w-10">#</th>
                            <th className="p-2 text-left font-bold text-gray-600 uppercase">Item</th>
                            <th className="p-2 text-center font-bold text-gray-600 uppercase w-20">Jumlah</th>
                            <th className="p-2 text-right font-bold text-gray-600 uppercase w-32">Harga Satuan</th>
                            <th className="p-2 text-right font-bold text-gray-600 uppercase w-32">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sale.items.map((saleItem, index) => {
                            const itemData = state.items.find(i => i.id === saleItem.itemId);
                            return (
                                <tr key={index} className="border-b hover:bg-gray-50 even:bg-gray-50">
                                    <td className="p-2 text-center">{index + 1}</td>
                                    <td className="p-2">
                                        <p className="font-semibold">{itemData?.name || 'N/A'}</p>
                                        <p className="text-xs text-gray-500">{itemData?.sku || 'N/A'}</p>
                                    </td>
                                    <td className="p-2 text-center">{saleItem.quantity}</td>
                                    <td className="p-2 text-right">{formatCurrency(saleItem.price)}</td>
                                    <td className="p-2 text-right font-semibold">{formatCurrency(saleItem.price * saleItem.quantity)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </section>

            {/* Footer & Totals */}
            <footer className="flex justify-between items-start mt-8 pt-4 border-t">
                <div className="text-xs text-gray-600">
                    <h4 className="font-semibold">Catatan:</h4>
                    <p>Terima kasih telah berbelanja.</p>
                </div>
                <div className="w-full max-w-xs text-sm">
                    <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                        <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(sale.subtotal)}</span></div>
                        <div className="flex justify-between"><span>Diskon</span><span>- {formatCurrency(discountAmount)}</span></div>
                        <div className="flex justify-between"><span>Pajak</span><span>+ {formatCurrency(taxAmount)}</span></div>
                    </div>
                    <div className="flex justify-between font-bold text-lg mt-2 bg-gray-800 text-white p-3 rounded-lg">
                        <span>TOTAL</span>
                        <span>{formatCurrency(sale.total)}</span>
                    </div>
                    <div className="text-xs text-right mt-2 text-gray-500 space-y-1">
                        <p>Pembayaran: {sale.paymentMethod} ({formatCurrency(sale.amountPaid)})</p>
                        <p>Kembali: {formatCurrency(sale.change)}</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const Reports: React.FC = () => {
    const { state } = useAppContext();
    const { hasPermission } = usePermissions();

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(lastDayOfMonth);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

    const { filteredSales, totalRevenue, totalTransactions, totalItemsSold, estimatedProfit } = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const filtered = state.sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= start && saleDate <= end;
        });

        const revenue = filtered.reduce((sum, sale) => sum + sale.total, 0);
        const itemsSold = filtered.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

        const profit = filtered.reduce((sum, sale) => {
            const saleProfit = sale.items.reduce((itemProfit, saleItem) => {
                const itemData = state.items.find(i => i.id === saleItem.itemId);
                if (itemData && itemData.purchasePrice > 0) {
                    return itemProfit + ((saleItem.price - itemData.purchasePrice) * saleItem.quantity);
                }
                return itemProfit;
            }, 0);
            return sum + saleProfit;
        }, 0);
        
        return {
            filteredSales: filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            totalRevenue: revenue,
            totalTransactions: filtered.length,
            totalItemsSold: itemsSold,
            estimatedProfit: profit,
        };
    }, [startDate, endDate, state.sales, state.items]);

    const handleExport = () => {
        const dataToExport = filteredSales.map(sale => {
            const customer = state.customers.find(c => c.id === sale.customerId)?.name || 'Umum';
            const cashier = state.users.find(u => u.id === sale.cashierId)?.fullName || '-';
            return {
                'No. Transaksi': sale.transactionNumber,
                'Tanggal': formatDate(sale.date),
                'Pelanggan': customer,
                'Kasir': cashier,
                'Subtotal': sale.subtotal,
                'Diskon': sale.discountValue,
                'Pajak': sale.taxValue,
                'Total': sale.total,
                'Metode Bayar': sale.paymentMethod,
                'Status Bayar': sale.paymentStatus,
            };
        });
        const fileName = `Laporan_Penjualan_${startDate}_-_${endDate}.csv`;
        exportToCsv(fileName, dataToExport);
    };

    return (
        <div>
            <div className="mb-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h1 className="text-3xl font-bold">Laporan Penjualan</h1>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label htmlFor="startDate" className="flex-shrink-0">Dari:</label>
                            <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-md"/>
                        </div>
                        <div className="flex items-center gap-2">
                            <label htmlFor="endDate" className="flex-shrink-0">Sampai:</label>
                            <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-md"/>
                        </div>
                        {hasPermission('reports.sales') && (
                            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                                {ICONS.download}
                                <span>Export CSV</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard title="Total Penjualan" value={formatCurrency(totalRevenue)} />
                <StatCard title="Total Transaksi" value={totalTransactions} />
                <StatCard title="Item Terjual" value={totalItemsSold} />
                <StatCard title="Estimasi Laba" value={formatCurrency(estimatedProfit)} />
            </div>

            {/* Sales Table */}
            <div className="overflow-x-auto bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Rincian Transaksi</h2>
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b bg-slate-50">
                            <th className="p-3">No. Transaksi</th>
                            <th className="p-3">Tanggal</th>
                            <th className="p-3">Pelanggan</th>
                            <th className="p-3">Kasir</th>
                            <th className="p-3 text-right">Total</th>
                            <th className="p-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSales.length > 0 ? filteredSales.map(sale => {
                            const customer = state.customers.find(c => c.id === sale.customerId)?.name || 'Umum';
                            const cashier = state.users.find(u => u.id === sale.cashierId)?.fullName || '-';
                            return (
                            <tr key={sale.id} className="border-b hover:bg-slate-50">
                                <td className="p-3 font-mono text-sm">{sale.transactionNumber}</td>
                                <td className="p-3 text-sm">{formatDate(sale.date)}</td>
                                <td className="p-3">{customer}</td>
                                <td className="p-3">{cashier}</td>
                                <td className="p-3 text-right font-semibold">{formatCurrency(sale.total)}</td>
                                <td className="p-3 text-center">
                                    <button 
                                        onClick={() => setSelectedSale(sale)}
                                        className="px-3 py-1 bg-sky-100 text-sky-700 text-xs font-semibold rounded-md hover:bg-sky-200"
                                    >
                                        Detail
                                    </button>
                                </td>
                            </tr>
                        )}) : (
                            <tr>
                                <td colSpan={6} className="text-center p-6 text-slate-500">Tidak ada data penjualan pada periode ini.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Detail Modal */}
            {selectedSale && (
                <Modal title={`Detail Faktur: ${selectedSale.transactionNumber}`} onClose={() => setSelectedSale(null)}>
                    <div id="printable-invoice-area">
                        <InvoiceView sale={selectedSale} state={state} />
                    </div>
                    <div className="flex justify-end gap-2 mt-6 pt-4 border-t no-print">
                        <button onClick={() => setSelectedSale(null)} className="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300">Tutup</button>
                        <button onClick={() => window.print()} className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600">Cetak Faktur</button>
                    </div>
                </Modal>
            )}

            {/* Print Styles */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-invoice-area, #printable-invoice-area * {
                        visibility: visible;
                    }
                    #printable-invoice-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: auto;
                    }
                    .no-print {
                        display: none !important;
                    }
                     .fixed.inset-0 { /* Modal container */
                        position: static !important;
                        overflow: visible !important;
                    }
                     .bg-white.rounded-lg.shadow-xl { /* Modal body */
                        box-shadow: none !important;
                        border: none !important;
                        width: 100% !important;
                        max-width: none !important;
                        height: auto !important;
                        max-height: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .p-6.overflow-y-auto {
                        overflow: visible !important;
                        padding: 0 !important;
                    }
                    .print-friendly-invoice {
                        font-size: 12px;
                    }
                    @page {
                        size: A4;
                        margin: 20mm;
                    }
                }
            `}</style>
        </div>
    );
};

export default Reports;