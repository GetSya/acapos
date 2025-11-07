import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Customer, Sale, MembershipTier } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import { ICONS } from '../constants';

// --- Helper functions for tier calculation ---
const MEMBERSHIP_THRESHOLDS: { [key in MembershipTier]: number } = {
    Gold: 5000000,
    Silver: 2000000,
    Bronze: 500000,
    Standard: 0,
};

const getMembershipTier = (totalSpent: number): MembershipTier => {
    if (totalSpent >= MEMBERSHIP_THRESHOLDS.Gold) return 'Gold';
    if (totalSpent >= MEMBERSHIP_THRESHOLDS.Silver) return 'Silver';
    if (totalSpent >= MEMBERSHIP_THRESHOLDS.Bronze) return 'Bronze';
    return 'Standard';
};

const getTierBadgeClass = (tier: MembershipTier) => {
    switch (tier) {
        case 'Gold': return 'bg-yellow-400 text-yellow-900';
        case 'Silver': return 'bg-slate-300 text-slate-800';
        case 'Bronze': return 'bg-orange-400 text-orange-900';
        default: return 'bg-slate-200 text-slate-700';
    }
};

// --- Main Component ---
interface CustomerPurchaseHistoryProps {
    customerId: string | null;
    onBack: () => void;
}

const CustomerPurchaseHistory: React.FC<CustomerPurchaseHistoryProps> = ({ customerId, onBack }) => {
    const { state } = useAppContext();
    const [expandedSaleId, setExpandedSaleId] = React.useState<string | null>(null);

    const customerData = React.useMemo(() => {
        if (!customerId) return null;

        const customer = state.customers.find(c => c.id === customerId);
        if (!customer) return null;

        const purchaseHistory = state.sales
            .filter(sale => sale.customerId === customerId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const totalSpent = purchaseHistory.reduce((sum, sale) => sum + sale.total, 0);
        const tier = getMembershipTier(totalSpent);

        return { customer, purchaseHistory, totalSpent, tier };

    }, [customerId, state.customers, state.sales]);


    if (!customerData) {
        return (
            <div className="text-center p-8">
                <h2 className="text-xl font-semibold text-slate-700">Pelanggan Tidak Ditemukan</h2>
                <p className="text-slate-500 mt-2">Silakan pilih pelanggan yang valid.</p>
                <button onClick={onBack} className="mt-4 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600">
                    Kembali ke Daftar Pelanggan
                </button>
            </div>
        );
    }
    
    const { customer, purchaseHistory, totalSpent, tier } = customerData;

    const toggleExpand = (saleId: string) => {
        setExpandedSaleId(prev => (prev === saleId ? null : saleId));
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full" title="Kembali">
                    {ICONS.backArrow}
                </button>
                <div>
                    <h1 className="text-3xl font-bold">Riwayat Pembelian Pelanggan</h1>
                    <p className="text-slate-600">{customer.name}</p>
                </div>
            </div>

            {/* Customer Profile Card */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                 <h2 className="text-xl font-semibold border-b pb-2 mb-4">Profil Pelanggan</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                     <div><strong>Telepon:</strong> {customer.phone || '-'}</div>
                     <div><strong>Email:</strong> {customer.email || '-'}</div>
                     <div><strong>Alamat:</strong> {customer.address || '-'}</div>
                     <div className="font-semibold"><strong>Poin Saat Ini:</strong> <span className="text-amber-600 text-lg">{customer.points}</span></div>
                     <div className="font-semibold"><strong>Total Belanja:</strong> <span className="text-sky-600 text-lg">{formatCurrency(totalSpent)}</span></div>
                     <div className="font-semibold flex items-center gap-2">
                         <strong>Tier:</strong>
                         <span className={`px-3 py-1 text-sm font-bold rounded-full ${getTierBadgeClass(tier)}`}>{tier}</span>
                     </div>
                 </div>
            </div>

            {/* Purchase History Table */}
            <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                 <h2 className="text-xl font-semibold mb-4 px-2">Riwayat Transaksi</h2>
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b bg-slate-50">
                            <th className="p-3 w-12"></th>
                            <th className="p-3">No. Transaksi</th>
                            <th className="p-3">Tanggal</th>
                            <th className="p-3 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchaseHistory.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center p-6 text-slate-500">
                                    Pelanggan ini belum memiliki riwayat transaksi.
                                </td>
                            </tr>
                        ) : (
                            purchaseHistory.map(sale => (
                                <React.Fragment key={sale.id}>
                                    <tr className="border-b hover:bg-slate-50 cursor-pointer" onClick={() => toggleExpand(sale.id)}>
                                        <td className="p-3 text-center">
                                            <span className={`transform transition-transform duration-200 inline-block ${expandedSaleId === sale.id ? 'rotate-90' : ''}`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                            </span>
                                        </td>
                                        <td className="p-3 font-mono text-sm">{sale.transactionNumber}</td>
                                        <td className="p-3">{formatDate(sale.date)}</td>
                                        <td className="p-3 text-right font-semibold">{formatCurrency(sale.total)}</td>
                                    </tr>
                                    {expandedSaleId === sale.id && (
                                        <tr className="bg-slate-50">
                                            <td colSpan={4} className="p-0">
                                                <div className="p-4">
                                                    <h4 className="font-semibold text-md mb-2">Detail Item:</h4>
                                                    <table className="w-full bg-white text-sm rounded-md">
                                                        <thead className="bg-slate-200">
                                                            <tr>
                                                                <th className="p-2 text-left">Nama Item</th>
                                                                <th className="p-2 text-center">Jumlah</th>
                                                                <th className="p-2 text-right">Harga</th>
                                                                <th className="p-2 text-right">Subtotal</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                        {sale.items.map((saleItem, index) => {
                                                            const itemData = state.items.find(i => i.id === saleItem.itemId);
                                                            return (
                                                                <tr key={index} className="border-b">
                                                                    <td className="p-2">{itemData?.name || 'Item Dihapus'}</td>
                                                                    <td className="p-2 text-center">{saleItem.quantity}</td>
                                                                    <td className="p-2 text-right">{formatCurrency(saleItem.price)}</td>
                                                                    <td className="p-2 text-right">{formatCurrency(saleItem.price * saleItem.quantity)}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CustomerPurchaseHistory;
