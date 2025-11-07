
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Item, StockAdjustment } from '../types';
import { generateId } from '../utils/helpers';
import { ICONS } from '../constants';

type AdjustmentItem = {
    itemId: string;
    name: string;
    sku: string;
    systemStock: number;
    physicalStock: number;
    difference: number;
};

const StockAdjustments: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [adjustedItems, setAdjustedItems] = useState<AdjustmentItem[]>([]);
    const [notes, setNotes] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = useMemo(() => {
        if (!searchTerm) return [];
        return state.items.filter(item =>
            (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchTerm.toLowerCase())) &&
            !adjustedItems.some(adj => adj.itemId === item.id)
        ).slice(0, 10);
    }, [searchTerm, state.items, adjustedItems]);

    const addItemForAdjustment = (item: Item) => {
        setAdjustedItems(prev => [
            ...prev,
            {
                itemId: item.id,
                name: item.name,
                sku: item.sku,
                systemStock: item.stock,
                physicalStock: item.stock,
                difference: 0,
            }
        ]);
        setSearchTerm('');
    };

    const updatePhysicalStock = (itemId: string, physicalStock: number) => {
        setAdjustedItems(prev => prev.map(item => {
            if (item.itemId === itemId) {
                return {
                    ...item,
                    physicalStock,
                    difference: physicalStock - item.systemStock
                };
            }
            return item;
        }));
    };

    const removeItem = (itemId: string) => {
        setAdjustedItems(prev => prev.filter(item => item.itemId !== itemId));
    };
    
    const resetForm = () => {
        setAdjustedItems([]);
        setNotes('');
        setSearchTerm('');
    }

    const handleSubmit = () => {
        if (adjustedItems.length === 0) {
            alert('Tambahkan minimal satu item untuk disesuaikan.');
            return;
        }

        const newAdjustment: StockAdjustment = {
            id: generateId(),
            adjustmentNumber: `SA-${Date.now()}`,
            date: new Date().toISOString(),
            notes,
            userId: state.currentUser!.id,
            items: adjustedItems.map(({ itemId, systemStock, physicalStock, difference }) => ({
                itemId,
                systemStock,
                physicalStock,
                difference
            }))
        };
        
        dispatch({ type: 'ADD_STOCK_ADJUSTMENT', payload: newAdjustment });
        alert('Penyesuaian stok berhasil disimpan.');
        resetForm();
    };


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Penyesuaian Stok</h1>
            
            <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                 <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-slate-700">Catatan (Alasan Penyesuaian)</label>
                    <input 
                        id="notes"
                        value={notes} 
                        onChange={e => setNotes(e.target.value)} 
                        className="w-full p-2 mt-1 border rounded"
                        placeholder="e.g., Stok opname bulanan, barang rusak"
                        required
                    />
                </div>
                
                <div className="relative pt-2">
                    <label className="block text-sm font-medium text-slate-700">Tambah Item</label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Cari item berdasarkan nama atau SKU..."
                        className="w-full p-2 mt-1 border rounded"
                    />
                    {searchTerm && filteredItems.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border rounded-b shadow-lg max-h-60 overflow-y-auto">
                            {filteredItems.map(item => (
                                <li key={item.id} onClick={() => addItemForAdjustment(item)} className="p-2 hover:bg-slate-100 cursor-pointer">
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
                                <th className="p-2 text-center w-28">Stok Sistem</th>
                                <th className="p-2 text-center w-32">Stok Fisik</th>
                                <th className="p-2 text-center w-28">Selisih</th>
                                <th className="p-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {adjustedItems.map(item => (
                                <tr key={item.itemId} className="border-b">
                                    <td className="p-2 font-semibold">{item.name} <span className="font-normal text-slate-500">({item.sku})</span></td>
                                    <td className="p-2 text-center font-mono">{item.systemStock}</td>
                                    <td className="p-2"><input type="number" value={item.physicalStock} onChange={e => updatePhysicalStock(item.itemId, parseInt(e.target.value) || 0)} className="w-full text-center p-1 border rounded" /></td>
                                    <td className={`p-2 text-center font-bold ${item.difference > 0 ? 'text-green-600' : item.difference < 0 ? 'text-red-600' : ''}`}>
                                        {item.difference > 0 ? `+${item.difference}` : item.difference}
                                    </td>
                                    <td className="p-2 text-center"><button onClick={() => removeItem(item.itemId)} className="text-red-500">{ICONS.trash}</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {adjustedItems.length === 0 && (
                        <div className="text-center p-6 text-slate-500">
                            Belum ada item yang ditambahkan untuk penyesuaian.
                        </div>
                    )}
                </div>

                 <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                    <button onClick={resetForm} className="px-6 py-3 bg-slate-500 text-white rounded-lg hover:bg-slate-600">Batal</button>
                    <button onClick={handleSubmit} className="px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600">Simpan Penyesuaian</button>
                </div>
            </div>
        </div>
    );
};

export default StockAdjustments;
