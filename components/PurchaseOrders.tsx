import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { PurchaseOrder, Item } from '../types';
import { generateId, formatCurrency, formatDate } from '../utils/helpers';
import Modal from './Modal';
import { ICONS } from '../constants';
// Note: Page access is controlled by router in App.tsx

type POItem = { itemId: string; name: string; sku: string; quantity: number; cost: number };

// Form for creating/editing a Purchase Order
const POForm: React.FC<{ onSave: (po: PurchaseOrder) => void; onClose: () => void }> = ({ onSave, onClose }) => {
    const { state } = useAppContext();
    const [supplierId, setSupplierId] = useState('');
    const [items, setItems] = useState<POItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = useMemo(() => {
        if (!searchTerm) return [];
        return state.items.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            item.sku.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 10); // Limit results for performance
    }, [searchTerm, state.items]);
    
    const addItem = (item: Item) => {
        if (!items.some(i => i.itemId === item.id)) {
            setItems([...items, { itemId: item.id, name: item.name, sku: item.sku, quantity: 1, cost: item.purchasePrice }]);
        }
        setSearchTerm('');
    };
    
    const updateItem = (itemId: string, field: 'quantity' | 'cost', value: number) => {
        setItems(items.map(i => i.itemId === itemId ? { ...i, [field]: value } : i));
    };

    const removeItem = (itemId: string) => {
        setItems(items.filter(i => i.itemId !== itemId));
    };

    const total = useMemo(() => items.reduce((sum, item) => sum + item.cost * item.quantity, 0), [items]);

    const handleSubmit = () => {
        if (!supplierId || items.length === 0) {
            alert('Silakan pilih supplier dan tambahkan minimal satu item.');
            return;
        }
        onSave({
            id: generateId(),
            poNumber: `PO-${Date.now()}`,
            date: new Date().toISOString(),
            supplierId,
            items: items.map(({ itemId, quantity, cost }) => ({ itemId, quantity, cost })),
            total,
            status: 'Pending',
        });
        onClose();
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700">Supplier</label>
                <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full p-2 mt-1 border rounded bg-white" required>
                    <option value="">Pilih Supplier</option>
                    {state.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>

            {/* Item Search */}
            <div className="relative">
                <label className="block text-sm font-medium text-slate-700">Tambah Item</label>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Cari berdasarkan nama atau SKU..."
                    className="w-full p-2 mt-1 border rounded"
                />
                {searchTerm && filteredItems.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border rounded-b shadow-lg max-h-60 overflow-y-auto">
                        {filteredItems.map(item => (
                            <li key={item.id} onClick={() => addItem(item)} className="p-2 hover:bg-slate-100 cursor-pointer">
                                {item.name} ({item.sku})
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            
            {/* Added Items Table */}
            <div className="overflow-x-auto border rounded-lg max-h-64">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                        <tr>
                            <th className="p-2 text-left">Item</th>
                            <th className="p-2 text-center w-24">Jumlah</th>
                            <th className="p-2 text-right w-32">Harga Beli</th>
                            <th className="p-2 text-right w-32">Subtotal</th>
                            <th className="p-2 w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.itemId} className="border-b">
                                <td className="p-2 font-semibold">{item.name}</td>
                                <td className="p-2"><input type="number" value={item.quantity} onChange={e => updateItem(item.itemId, 'quantity', parseInt(e.target.value) || 0)} className="w-full text-center p-1 border rounded" /></td>
                                <td className="p-2"><input type="number" value={item.cost} onChange={e => updateItem(item.itemId, 'cost', parseFloat(e.target.value) || 0)} className="w-full text-right p-1 border rounded" /></td>
                                <td className="p-2 text-right">{formatCurrency(item.cost * item.quantity)}</td>
                                <td className="p-2 text-center"><button onClick={() => removeItem(item.itemId)} className="text-red-500">{ICONS.trash}</button></td>
                            </tr>
                        ))}
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


const PurchaseOrders: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSavePO = (po: PurchaseOrder) => {
        dispatch({ type: 'ADD_PURCHASE_ORDER', payload: po });
    };

    const getStatusClass = (status: 'Pending' | 'Completed' | 'Cancelled') => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Completed': return 'bg-green-100 text-green-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Pesanan Pembelian (PO)</h1>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600">
                    {ICONS.plus}
                    <span>Buat Pesanan Baru</span>
                </button>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b bg-slate-50">
                            <th className="p-3">No. PO</th>
                            <th className="p-3">Tanggal</th>
                            <th className="p-3">Supplier</th>
                            <th className="p-3 text-right">Total</th>
                            <th className="p-3 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.purchaseOrders.map(po => (
                            <tr key={po.id} className="border-b hover:bg-slate-50">
                                <td className="p-3 font-mono text-sm">{po.poNumber}</td>
                                <td className="p-3">{formatDate(po.date)}</td>
                                <td className="p-3">{state.suppliers.find(s => s.id === po.supplierId)?.name || 'N/A'}</td>
                                <td className="p-3 text-right font-semibold">{formatCurrency(po.total)}</td>
                                <td className="p-3 text-center">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(po.status)}`}>
                                        {po.status}
                                    </span>
                                </td>
                            </tr>
                        )).reverse()}
                    </tbody>
                </table>
                 {state.purchaseOrders.length === 0 && (
                    <div className="text-center p-6 text-slate-500">
                        Belum ada pesanan pembelian.
                    </div>
                )}
            </div>

            {isModalOpen && (
                <Modal title="Buat Pesanan Pembelian Baru" onClose={() => setIsModalOpen(false)}>
                    <POForm onSave={handleSavePO} onClose={() => setIsModalOpen(false)} />
                </Modal>
            )}
        </div>
    );
};

export default PurchaseOrders;