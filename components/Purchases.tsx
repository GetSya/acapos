import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Purchase, PurchaseOrder, Item } from '../types';
import { generateId, formatCurrency } from '../utils/helpers';
import Modal from './Modal';
import { ICONS } from '../constants';
// Note: Page access is controlled by router in App.tsx

const SelectPOModal: React.FC<{
    supplierId: string;
    onSelect: (po: PurchaseOrder) => void;
    onClose: () => void;
}> = ({ supplierId, onSelect, onClose }) => {
    const { state } = useAppContext();
    const pendingPOs = state.purchaseOrders.filter(po => po.supplierId === supplierId && po.status === 'Pending');

    return (
        <Modal title="Pilih dari Pesanan Pembelian (PO)" onClose={onClose}>
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {pendingPOs.length > 0 ? pendingPOs.map(po => (
                    <button 
                        key={po.id} 
                        onClick={() => onSelect(po)}
                        className="w-full text-left p-3 border rounded-lg hover:bg-slate-100 flex justify-between items-center"
                    >
                        <div>
                            <p className="font-bold">{po.poNumber}</p>
                            <p className="text-sm text-slate-500">{new Date(po.date).toLocaleDateString('id-ID')}</p>
                        </div>
                        <span className="font-semibold text-lg">{formatCurrency(po.total)}</span>
                    </button>
                )) : <p className="text-slate-500 text-center py-4">Tidak ada pesanan (PO) yang pending untuk supplier ini.</p>}
            </div>
        </Modal>
    );
};

type PurchaseItem = { itemId: string; name: string; sku: string; quantity: number; cost: number };

const Purchases: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [supplierId, setSupplierId] = useState('');
    const [accountId, setAccountId] = useState('');
    const [amountPaid, setAmountPaid] = useState(0);
    const [items, setItems] = useState<PurchaseItem[]>([]);
    const [linkedPO, setLinkedPO] = useState<PurchaseOrder | null>(null);
    const [isPOModalOpen, setPOModalOpen] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = useMemo(() => {
        if (!searchTerm || !supplierId) return [];
        return state.items.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            item.sku.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 10);
    }, [searchTerm, state.items, supplierId]);
    
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
    
    const resetForm = () => {
        setSupplierId('');
        setAccountId('');
        setItems([]);
        setAmountPaid(0);
        setLinkedPO(null);
    };

    const total = useMemo(() => items.reduce((sum, item) => sum + item.cost * item.quantity, 0), [items]);

    useEffect(() => {
        setAmountPaid(total);
    }, [total]);

    const handleSelectPO = (po: PurchaseOrder) => {
        setLinkedPO(po);
        const poItems: PurchaseItem[] = po.items.map(item => {
            const itemData = state.items.find(i => i.id === item.itemId);
            return {
                itemId: item.itemId,
                name: itemData?.name || 'N/A',
                sku: itemData?.sku || 'N/A',
                quantity: item.quantity,
                cost: item.cost,
            };
        });
        setItems(poItems);
        setPOModalOpen(false);
    };
    
    const handleSave = () => {
        if (!supplierId || !accountId || items.length === 0) {
            alert("Harap pilih Supplier, Akun Pembayaran, dan tambahkan minimal satu item.");
            return;
        }

        const newPurchase: Purchase = {
            id: generateId(),
            purchaseNumber: `PI-${Date.now()}`,
            date: new Date().toISOString(),
            supplierId,
            accountId,
            items: items.map(({itemId, quantity, cost}) => ({itemId, quantity, cost})),
            total,
            amountPaid,
            paymentStatus: amountPaid >= total ? 'Lunas' : 'Belum Lunas',
            purchaseOrderId: linkedPO?.id,
        };

        dispatch({ type: 'ADD_PURCHASE', payload: newPurchase });
        alert('Pembelian berhasil disimpan!');
        resetForm();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Faktur Pembelian</h1>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700">Supplier</label>
                        <select 
                            value={supplierId} 
                            onChange={e => setSupplierId(e.target.value)} 
                            className="w-full p-2 mt-1 border rounded bg-white"
                            disabled={!!linkedPO}
                        >
                            <option value="">Pilih Supplier</option>
                            {state.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Akun Pembayaran</label>
                        <select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full p-2 mt-1 border rounded bg-white">
                             <option value="">Pilih Akun</option>
                             {state.accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                    </div>
                    <div className="self-end">
                        <button 
                            onClick={() => setPOModalOpen(true)} 
                            disabled={!supplierId || !!linkedPO}
                            className="w-full p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-slate-300"
                        >
                            Pilih dari Pesanan (PO)
                        </button>
                    </div>
                </div>

                {linkedPO && (
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                        Transaksi ini tertaut ke Pesanan Pembelian: <span className="font-semibold">{linkedPO.poNumber}</span>
                    </div>
                )}
                
                <div className="relative pt-4">
                    <label className="block text-sm font-medium text-slate-700">Tambah Item</label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder={!supplierId ? "Pilih supplier terlebih dahulu" : "Cari item..."}
                        className="w-full p-2 mt-1 border rounded"
                        disabled={!supplierId || !!linkedPO}
                    />
                    {searchTerm && filteredItems.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border rounded-b shadow-lg max-h-60 overflow-y-auto">
                            {filteredItems.map(item => (
                                <li key={item.id} onClick={() => addItem(item)} className="p-2 hover:bg-slate-100 cursor-pointer">
                                    {item.name} ({item.sku}) - Stok: {item.stock}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                 <div className="overflow-x-auto border rounded-lg max-h-96">
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
                                    <td className="p-2"><input type="number" value={item.quantity} onChange={e => updateItem(item.itemId, 'quantity', parseInt(e.target.value) || 0)} className="w-full text-center p-1 border rounded" disabled={!!linkedPO}/></td>
                                    <td className="p-2"><input type="number" value={item.cost} onChange={e => updateItem(item.itemId, 'cost', parseFloat(e.target.value) || 0)} className="w-full text-right p-1 border rounded" disabled={!!linkedPO}/></td>
                                    <td className="p-2 text-right">{formatCurrency(item.cost * item.quantity)}</td>
                                    <td className="p-2 text-center"><button onClick={() => removeItem(item.itemId)} className="text-red-500" disabled={!!linkedPO}>{ICONS.trash}</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {items.length === 0 && (
                        <div className="text-center p-6 text-slate-500">
                            Belum ada item yang ditambahkan.
                        </div>
                    )}
                </div>

                 <div className="flex flex-col md:flex-row justify-end items-center gap-4 pt-4 border-t">
                    <div className="w-full md:w-auto">
                        <label className="block text-sm font-medium text-slate-700 text-right">Jumlah Dibayar</label>
                        <input 
                            type="number"
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                            className="w-full md:w-48 p-2 mt-1 border rounded text-right font-semibold"
                        />
                    </div>
                    <div className="text-right">
                        <p className="text-slate-600">Total Tagihan</p>
                        <p className="text-2xl font-bold"> {formatCurrency(total)}</p>
                    </div>
                </div>

                 <div className="flex justify-end gap-2 mt-4">
                    <button onClick={resetForm} className="px-6 py-3 bg-slate-500 text-white rounded-lg hover:bg-slate-600">Batal</button>
                    <button onClick={handleSave} className="px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600">Simpan Pembelian</button>
                </div>
            </div>

            {isPOModalOpen && supplierId && (
                <SelectPOModal 
                    supplierId={supplierId}
                    onSelect={handleSelectPO}
                    onClose={() => setPOModalOpen(false)}
                />
            )}
        </div>
    );
};

export default Purchases;