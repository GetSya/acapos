import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Sale, SalesReturn } from '../types';
import { generateId, formatCurrency, formatDate } from '../utils/helpers';
import Modal from './Modal';
import { ICONS } from '../constants';

type ReturnedItem = { itemId: string; name: string; quantity: number; maxQuantity: number; price: number };

const ReturnForm: React.FC<{ sale: Sale; onSave: (sr: SalesReturn) => void; onClose: () => void }> = ({ sale, onSave, onClose }) => {
    const { state } = useAppContext();
    const [returnedItems, setReturnedItems] = useState<ReturnedItem[]>([]);
    const [accountId, setAccountId] = useState(state.accounts[0]?.id || '');
    const [notes, setNotes] = useState('');

    const saleItemsWithData = useMemo(() => {
        return sale.items.map(saleItem => {
            const itemData = state.items.find(i => i.id === saleItem.itemId);
            return {
                ...saleItem,
                name: itemData?.name || 'Item Dihapus',
                sku: itemData?.sku || 'N/A'
            };
        });
    }, [sale, state.items]);
    
    const addItemToReturn = (item: typeof saleItemsWithData[0]) => {
        if (!returnedItems.some(ri => ri.itemId === item.itemId)) {
            setReturnedItems([...returnedItems, { itemId: item.itemId, name: item.name, quantity: 1, maxQuantity: item.quantity, price: item.price }]);
        }
    };
    
    const updateReturnQuantity = (itemId: string, quantity: number) => {
        setReturnedItems(currentItems => currentItems.map(item => {
            if (item.itemId === itemId) {
                const newQuantity = Math.max(0, Math.min(item.maxQuantity, quantity));
                return { ...item, quantity: newQuantity };
            }
            return item;
        }).filter(item => item.quantity > 0)); // Remove item if quantity is 0
    };

    const totalRefund = useMemo(() => {
        return returnedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }, [returnedItems]);

    const handleSubmit = () => {
        if (returnedItems.length === 0 || !accountId) {
            alert('Pilih minimal satu item untuk diretur dan pilih akun pengembalian dana.');
            return;
        }

        const newReturn: SalesReturn = {
            id: generateId(),
            returnNumber: `SR-${Date.now()}`,
            date: new Date().toISOString(),
            originalSaleId: sale.id,
            returnedItems: returnedItems.map(({ itemId, quantity, price }) => ({ itemId, quantity, price })),
            totalRefund,
            accountId,
            notes,
        };
        onSave(newReturn);
        onClose();
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg text-sm">
                <div><strong>No. Faktur:</strong> {sale.transactionNumber}</div>
                <div><strong>Tanggal:</strong> {formatDate(sale.date)}</div>
                <div><strong>Pelanggan:</strong> {state.customers.find(c => c.id === sale.customerId)?.name || 'Umum'}</div>
                <div><strong>Total Awal:</strong> {formatCurrency(sale.total)}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Items from original sale */}
                <div className="space-y-2">
                    <h3 className="font-semibold">Pilih Item untuk Diretur:</h3>
                    <div className="border rounded-lg max-h-48 overflow-y-auto p-2 space-y-2">
                        {saleItemsWithData.map(item => (
                            <div key={item.itemId} className="flex justify-between items-center">
                                <div>
                                    <p>{item.name}</p>
                                    <p className="text-xs text-slate-500">{item.quantity} x {formatCurrency(item.price)}</p>
                                </div>
                                <button
                                    onClick={() => addItemToReturn(item)}
                                    disabled={returnedItems.some(ri => ri.itemId === item.itemId)}
                                    className="px-2 py-1 text-xs bg-sky-500 text-white rounded disabled:bg-slate-300"
                                >
                                    + Retur
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                 {/* Items being returned */}
                <div className="space-y-2">
                    <h3 className="font-semibold">Item yang Diretur:</h3>
                    <div className="border rounded-lg max-h-48 overflow-y-auto p-2 space-y-2">
                        {returnedItems.length > 0 ? returnedItems.map(item => (
                            <div key={item.itemId} className="flex justify-between items-center gap-2">
                                <span className="flex-grow truncate">{item.name}</span>
                                <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={e => updateReturnQuantity(item.itemId, parseInt(e.target.value) || 0)}
                                    className="w-16 p-1 border rounded text-center"
                                    max={item.maxQuantity}
                                    min="0"
                                />
                                <span>x {formatCurrency(item.price)}</span>
                            </div>
                        )) : <p className="text-slate-500 text-center text-sm py-4">Belum ada item dipilih.</p>}
                    </div>
                </div>
            </div>

            <div className="border-t pt-4 space-y-4">
                 <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-slate-700">Catatan Retur (Opsional)</label>
                    <input id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g., Barang rusak, salah ukuran" className="mt-1 p-2 border rounded w-full" />
                </div>
                <div>
                    <label htmlFor="accountId" className="block text-sm font-medium text-slate-700">Kembalikan Dana Dari Akun</label>
                    <select id="accountId" value={accountId} onChange={e => setAccountId(e.target.value)} className="mt-1 p-2 border rounded bg-white w-full" required>
                        <option value="">Pilih Akun</option>
                        {state.accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </select>
                </div>
                 <div className="text-right font-bold text-xl">Total Pengembalian Dana: {formatCurrency(totalRefund)}</div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300">Batal</button>
                <button onClick={handleSubmit} className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600">Proses Retur</button>
            </div>
        </div>
    );
};

const SalesReturns: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [foundSale, setFoundSale] = useState<Sale | null>(null);

    const handleSearch = () => {
        const sale = state.sales.find(s => s.transactionNumber.toLowerCase() === searchTerm.toLowerCase());
        if (sale) {
            setFoundSale(sale);
            setIsModalOpen(true);
        } else {
            alert('Faktur penjualan tidak ditemukan.');
        }
        setSearchTerm('');
    };

    const handleSaveReturn = (salesReturn: SalesReturn) => {
        dispatch({ type: 'ADD_SALES_RETURN', payload: salesReturn });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Retur Penjualan</h1>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Masukkan No. Faktur Penjualan..."
                        className="p-2 border rounded-lg"
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    />
                    <button onClick={handleSearch} className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600">
                        {ICONS.search}
                        <span>Cari</span>
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                 <h2 className="text-xl font-semibold mb-4">Riwayat Retur</h2>
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b bg-slate-50">
                            <th className="p-3">No. Retur</th>
                            <th className="p-3">Tanggal</th>
                            <th className="p-3">No. Faktur Asli</th>
                            <th className="p-3 text-right">Total Refund</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...state.salesReturns].reverse().map(sr => (
                            <tr key={sr.id} className="border-b hover:bg-slate-50">
                                <td className="p-3 font-mono text-sm">{sr.returnNumber}</td>
                                <td className="p-3">{formatDate(sr.date)}</td>
                                <td className="p-3 font-mono text-sm">{state.sales.find(s => s.id === sr.originalSaleId)?.transactionNumber}</td>
                                <td className="p-3 text-right font-semibold">{formatCurrency(sr.totalRefund)}</td>
                            </tr>
                        ))}
                         {state.salesReturns.length === 0 && (
                            <tr><td colSpan={4} className="text-center p-6 text-slate-500">Belum ada riwayat retur.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && foundSale && (
                <Modal title="Buat Retur Penjualan Baru" onClose={() => setIsModalOpen(false)}>
                    <ReturnForm sale={foundSale} onSave={handleSaveReturn} onClose={() => setIsModalOpen(false)} />
                </Modal>
            )}
        </div>
    );
};

export default SalesReturns;