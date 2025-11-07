import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { SalesOrder, Item } from '../types';
import { generateId, formatCurrency, formatDate } from '../utils/helpers';
import Modal from './Modal';
import { ICONS } from '../constants';
import { usePermissions } from '../hooks/usePermissions';

type SOItem = { itemId: string; name: string; sku: string; quantity: number; price: number };

// Form for creating/editing a Sales Order
const SOForm: React.FC<{ onSave: (so: SalesOrder) => void; onClose: () => void }> = ({ onSave, onClose }) => {
    const { state } = useAppContext();
    const [customerId, setCustomerId] = useState('');
    const [items, setItems] = useState<SOItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = useMemo(() => {
        if (!searchTerm) return [];
        return state.items.filter(item => 
            (item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            item.sku.toLowerCase().includes(searchTerm.toLowerCase())) &&
            !items.some(i => i.itemId === item.id) // Exclude already added items
        ).slice(0, 10);
    }, [searchTerm, state.items, items]);
    
    const addItem = (item: Item) => {
        if (!items.some(i => i.itemId === item.id)) {
            setItems([...items, { itemId: item.id, name: item.name, sku: item.sku, quantity: 1, price: item.sellPrice }]);
        }
        setSearchTerm('');
    };
    
    const updateItem = (itemId: string, field: 'quantity' | 'price', value: number) => {
        setItems(items.map(i => i.itemId === itemId ? { ...i, [field]: value } : i));
    };

    const removeItem = (itemId: string) => {
        setItems(items.filter(i => i.itemId !== itemId));
    };

    const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

    const handleSubmit = () => {
        if (!customerId || items.length === 0) {
            alert('Silakan pilih pelanggan dan tambahkan minimal satu item.');
            return;
        }
        onSave({
            id: generateId(),
            soNumber: `SO-${Date.now()}`,
            date: new Date().toISOString(),
            customerId,
            items: items.map(({ itemId, quantity, price }) => ({ itemId, quantity, price })),
            total,
            status: 'Quote',
        });
        onClose();
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700">Pelanggan</label>
                <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="w-full p-2 mt-1 border rounded bg-white" required>
                    <option value="">Pilih Pelanggan</option>
                    {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            <div className="relative">
                <label className="block text-sm font-medium text-slate-700">Tambah Item</label>
                 <div className="relative">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Cari berdasarkan nama atau SKU..."
                        className="w-full p-2 mt-1 border rounded"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        {ICONS.search}
                    </div>
                </div>
                {searchTerm && (
                    <ul className="absolute z-10 w-full bg-white border rounded-b shadow-lg max-h-60 overflow-y-auto mt-1">
                        {filteredItems.length > 0 ? filteredItems.map(item => (
                            <li key={item.id} onClick={() => addItem(item)} className="p-2 hover:bg-slate-100 cursor-pointer">
                                {item.name} ({item.sku}) - Stok: {item.stock}
                            </li>
                        )) : <li className="p-2 text-slate-500">Item tidak ditemukan.</li>}
                    </ul>
                )}
            </div>
            
            <div className="overflow-x-auto border rounded-lg max-h-64">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                        <tr>
                            <th className="p-2 text-left">Item</th>
                            <th className="p-2 text-center w-24">Jumlah</th>
                            <th className="p-2 text-right w-32">Harga Jual</th>
                            <th className="p-2 text-right w-32">Subtotal</th>
                            <th className="p-2 w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.itemId} className="border-b">
                                <td className="p-2 font-semibold">{item.name}</td>
                                <td className="p-2"><input type="number" value={item.quantity} onChange={e => updateItem(item.itemId, 'quantity', parseInt(e.target.value) || 0)} className="w-full text-center p-1 border rounded" /></td>
                                <td className="p-2"><input type="number" value={item.price} onChange={e => updateItem(item.itemId, 'price', parseFloat(e.target.value) || 0)} className="w-full text-right p-1 border rounded" /></td>
                                <td className="p-2 text-right">{formatCurrency(item.price * item.quantity)}</td>
                                <td className="p-2 text-center"><button onClick={() => removeItem(item.itemId)} className="text-red-500">{ICONS.trash}</button></td>
                            </tr>
                        ))}
                         {items.length === 0 && (
                            <tr><td colSpan={5} className="text-center p-4 text-slate-500">Belum ada item ditambahkan.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="text-right font-bold text-xl">Total: {formatCurrency(total)}</div>

            <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300">Batal</button>
                <button onClick={handleSubmit} className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600">Simpan Pesanan</button>
            </div>
        </div>
    );
};

interface SalesOrdersProps {
    onInvoice: (salesOrderId: string) => void;
}

const SalesOrders: React.FC<SalesOrdersProps> = ({ onInvoice }) => {
    const { state, dispatch } = useAppContext();
    const { hasPermission } = usePermissions();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSaveSO = (so: SalesOrder) => {
        dispatch({ type: 'ADD_SALES_ORDER', payload: so });
    };

    const handleUpdateStatus = (id: string, status: 'Confirmed' | 'Cancelled') => {
        const message = status === 'Confirmed'
            ? 'Konfirmasi pesanan ini? Stok belum akan dipotong sampai faktur dibuat.'
            : 'Batalkan pesanan ini? Tindakan ini tidak dapat diurungkan.';
        if (window.confirm(message)) {
            dispatch({ type: 'UPDATE_SALES_ORDER_STATUS', payload: { id, status } });
        }
    }

    const getStatusClass = (status: 'Quote' | 'Confirmed' | 'Completed' | 'Cancelled') => {
        switch (status) {
            case 'Quote': return 'bg-blue-100 text-blue-800';
            case 'Confirmed': return 'bg-yellow-100 text-yellow-800';
            case 'Completed': return 'bg-green-100 text-green-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
        }
    }
    
    const canManageStatus = hasPermission('sales_orders.manage');

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Pesanan Penjualan (SO)</h1>
                 {hasPermission('sales_orders.create') && (
                    <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600">
                        {ICONS.plus}
                        <span>Buat Pesanan Baru</span>
                    </button>
                 )}
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b bg-slate-50">
                            <th className="p-3">No. SO</th>
                            <th className="p-3">Tanggal</th>
                            <th className="p-3">Pelanggan</th>
                            <th className="p-3 text-right">Total</th>
                            <th className="p-3 text-center">Status</th>
                            <th className="p-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.salesOrders.map(so => (
                            <tr key={so.id} className="border-b hover:bg-slate-50">
                                <td className="p-3 font-mono text-sm">{so.soNumber}</td>
                                <td className="p-3">{formatDate(so.date)}</td>
                                <td className="p-3">{state.customers.find(c => c.id === so.customerId)?.name || 'N/A'}</td>
                                <td className="p-3 text-right font-semibold">{formatCurrency(so.total)}</td>
                                <td className="p-3 text-center">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(so.status)}`}>
                                        {so.status}
                                    </span>
                                </td>
                                <td className="p-3">
                                    {canManageStatus && (
                                        <div className="flex justify-center items-center gap-1">
                                            {so.status === 'Quote' && (
                                                <button onClick={() => handleUpdateStatus(so.id, 'Confirmed')} className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600">Konfirmasi</button>
                                            )}
                                            {so.status === 'Confirmed' && hasPermission('sales_invoices.view') && (
                                                <button onClick={() => onInvoice(so.id)} className="flex items-center gap-1 text-xs px-2 py-1 bg-sky-500 text-white rounded hover:bg-sky-600">
                                                    {React.cloneElement(ICONS.salesInvoice, {className: "h-3 w-3"})}
                                                    <span>Faktur</span>
                                                </button>
                                            )}
                                            {(so.status === 'Quote' || so.status === 'Confirmed') && (
                                                <button onClick={() => handleUpdateStatus(so.id, 'Cancelled')} className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Batal</button>
                                            )}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        )).reverse()}
                    </tbody>
                </table>
                 {state.salesOrders.length === 0 && (
                    <div className="text-center p-6 text-slate-500">
                        Belum ada pesanan penjualan.
                    </div>
                )}
            </div>

            {isModalOpen && (
                <Modal title="Buat Pesanan Penjualan Baru" onClose={() => setIsModalOpen(false)}>
                    <SOForm onSave={handleSaveSO} onClose={() => setIsModalOpen(false)} />
                </Modal>
            )}
        </div>
    );
};

export default SalesOrders;