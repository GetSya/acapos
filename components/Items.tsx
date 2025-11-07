import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Item } from '../types';
import { formatCurrency, generateId } from '../utils/helpers';
import Modal from './Modal';
import { ICONS } from '../constants';
import { usePermissions } from '../hooks/usePermissions';

const generateSKU = () => `ITEM-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

type SortKey = 'name' | 'categoryId' | 'sellPrice' | 'stock';

interface ItemFormProps {
    item?: Item;
    onSave: (item: Item) => void;
    onClose: () => void;
}

const ItemForm: React.FC<ItemFormProps> = ({ item, onSave, onClose }) => {
    const { state } = useAppContext();
    const [formData, setFormData] = useState<Omit<Item, 'id' | 'stock'>>(item ? { ...item } : {
        sku: '', name: '', description: '', categoryId: '', brandId: '', unitId: '',
        purchasePrice: 0, sellPrice: 0, minStock: 0, image: null, priceTiers: {}
    });
    const [initialStock, setInitialStock] = useState(item ? item.stock : 0);
    const [imagePreview, setImagePreview] = useState<string | null>(item?.image || null);

    useEffect(() => {
        if (!item && state.settings.autoGenerateSKU) {
            setFormData(prev => ({ ...prev, sku: generateSKU() }));
        }
    }, [item, state.settings.autoGenerateSKU]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name.includes('Price') || name.includes('Stock') ? parseFloat(value) || 0 : value }));
    };

     const handlePriceTierChange = (tierId: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            priceTiers: {
                ...prev.priceTiers,
                [tierId]: parseFloat(value) || 0
            }
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setImagePreview(base64String);
                setFormData(prev => ({...prev, image: base64String}));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.categoryId || !formData.brandId || !formData.unitId) {
            alert("Harap pilih Kategori, Merek, dan Satuan.");
            return;
        }
        onSave({
            ...formData,
            id: item?.id || generateId(),
            stock: item ? item.stock : initialStock,
        });
        onClose();
    };
    
    const handleRegenerateSKU = () => {
        setFormData(prev => ({ ...prev, sku: generateSKU() }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nama Item</label>
                    <input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Nama Item" className="mt-1 p-2 border rounded w-full" required />
                </div>
                <div>
                    <label htmlFor="sku" className="block text-sm font-medium text-slate-700">SKU</label>
                    <div className="flex mt-1">
                        <input id="sku" name="sku" value={formData.sku} onChange={handleChange} placeholder="SKU" className="p-2 border rounded-l w-full" required disabled={!item && state.settings.autoGenerateSKU} />
                        {!item && state.settings.autoGenerateSKU && (
                            <button type="button" onClick={handleRegenerateSKU} title="Buat SKU baru" className="p-2 border-t border-b border-r rounded-r bg-slate-100 hover:bg-slate-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M20 4h-5v5M4 20h5v-5" /></svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>
             <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700">Deskripsi</label>
                <textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Deskripsi item (opsional)" className="mt-1 w-full p-2 border rounded" />
             </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="categoryId" className="block text-sm font-medium text-slate-700">Kategori</label>
                    <select id="categoryId" name="categoryId" value={formData.categoryId} onChange={handleChange} className="mt-1 p-2 border rounded bg-white w-full" required>
                        <option value="">Pilih Kategori</option>
                        {state.categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="brandId" className="block text-sm font-medium text-slate-700">Merek</label>
                    <select id="brandId" name="brandId" value={formData.brandId} onChange={handleChange} className="mt-1 p-2 border rounded bg-white w-full" required>
                        <option value="">Pilih Merek</option>
                        {state.brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="unitId" className="block text-sm font-medium text-slate-700">Satuan</label>
                    <select id="unitId" name="unitId" value={formData.unitId} onChange={handleChange} className="mt-1 p-2 border rounded bg-white w-full" required>
                        <option value="">Pilih Satuan</option>
                        {state.units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
                    </select>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                <div>
                    <label htmlFor="purchasePrice" className="block text-sm font-medium text-slate-700">Harga Beli</label>
                    <input id="purchasePrice" type="number" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} placeholder="0" className="mt-1 p-2 border rounded w-full" />
                </div>
                <div>
                    <label htmlFor="sellPrice" className="block text-sm font-medium text-slate-700">Harga Jual (Ecer)</label>
                    <input id="sellPrice" type="number" name="sellPrice" value={formData.sellPrice} onChange={handleChange} placeholder="0" className="mt-1 p-2 border rounded w-full" required />
                </div>
                {state.priceTiers.map(tier => (
                    <div key={tier.id}>
                        <label htmlFor={`priceTier_${tier.id}`} className="block text-sm font-medium text-slate-700">Harga {tier.name}</label>
                        <input 
                            id={`priceTier_${tier.id}`} 
                            type="number" 
                            value={formData.priceTiers[tier.id] || ''} 
                            onChange={(e) => handlePriceTierChange(tier.id, e.target.value)} 
                            placeholder="0" 
                            className="mt-1 p-2 border rounded w-full" 
                        />
                    </div>
                ))}
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                 <div>
                    <label htmlFor="minStock" className="block text-sm font-medium text-slate-700">Stok Minimum</label>
                    <input id="minStock" type="number" name="minStock" value={formData.minStock} onChange={handleChange} placeholder="0" className="mt-1 p-2 border rounded w-full" />
                </div>
                {!item && (
                    <div>
                        <label htmlFor="initialStock" className="block text-sm font-medium text-slate-700">Stok Awal</label>
                        <input id="initialStock" type="number" value={initialStock} onChange={(e) => setInitialStock(parseInt(e.target.value) || 0)} placeholder="0" className="mt-1 p-2 border rounded w-full" />
                    </div>
                )}
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700">Gambar Item</label>
                <div className="mt-1 flex items-center space-x-4">
                    {imagePreview && <img src={imagePreview} alt="preview" className="h-16 w-16 object-cover rounded" />}
                    <input type="file" onChange={handleImageChange} accept="image/*" className="text-sm" />
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300">Batal</button>
                <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600">Simpan</button>
            </div>
        </form>
    );
};

interface ItemsProps {
    onViewStockCard: (itemId: string) => void;
}

const Items: React.FC<ItemsProps> = ({ onViewStockCard }) => {
    const { state, dispatch } = useAppContext();
    const { hasPermission } = usePermissions();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | undefined>(undefined);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const getCategoryName = (id: string) => state.categories.find(c => c.id === id)?.name || '-';

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    const sortedItems = useMemo(() => {
        const itemsCopy = [...state.items];
        itemsCopy.sort((a, b) => {
            let valA: string | number, valB: string | number;

            if (sortKey === 'categoryId') {
                valA = getCategoryName(a.categoryId);
                valB = getCategoryName(b.categoryId);
            } else {
                valA = a[sortKey];
                valB = b[sortKey];
            }

            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            if (typeof valA === 'number' && typeof valB === 'number') {
                return sortOrder === 'asc' ? valA - valB : valB - valA;
            }
            return 0;
        });
        return itemsCopy;
    }, [state.items, sortKey, sortOrder, state.categories]);

    const handleSaveItem = (item: Item) => {
        if (state.items.some(i => i.id === item.id)) {
            dispatch({ type: 'UPDATE_ITEM', payload: item });
        } else {
            dispatch({ type: 'ADD_ITEM', payload: item });
        }
    };
    
    const handleDeleteItem = (itemId: string) => {
        if (!hasPermission('items.delete')) {
            alert("Anda tidak memiliki hak akses untuk menghapus item.");
            return;
        }

        const hasTransactions = state.sales.some(sale => sale.items.some(item => item.itemId === itemId)) || 
                                state.purchaseOrders.some(po => po.items.some(item => item.itemId === itemId)) ||
                                state.salesOrders.some(so => so.items.some(item => item.itemId === itemId));

        if (hasTransactions) {
            alert("Item ini tidak dapat dihapus karena sudah memiliki riwayat transaksi. Anda bisa menonaktifkan item jika sudah tidak dijual.");
            return;
        }

        if (window.confirm("Apakah Anda yakin ingin menghapus item ini? Tindakan ini tidak dapat diurungkan. Seluruh riwayat stok untuk item ini juga akan dihapus.")) {
            dispatch({ type: 'DELETE_ITEM', payload: itemId });
        }
    };

    const handleExport = () => {
        const exportData = state.items.map(({ id, image, ...rest }) => rest);
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `acapos_items_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const importedData = JSON.parse(text);
                
                if (!Array.isArray(importedData)) throw new Error("Format JSON tidak valid, harus berupa array.");

                const newItems: Item[] = importedData.map((d: any) => {
                    if (!d.sku || !d.name || typeof d.sellPrice === 'undefined') {
                        throw new Error(`Data tidak lengkap untuk SKU: ${d.sku || 'N/A'}`);
                    }
                    return {
                        id: generateId(),
                        sku: d.sku,
                        name: d.name,
                        description: d.description || '',
                        categoryId: d.categoryId || '',
                        brandId: d.brandId || '',
                        unitId: d.unitId || '',
                        purchasePrice: Number(d.purchasePrice) || 0,
                        sellPrice: Number(d.sellPrice),
                        stock: Number(d.stock) || 0,
                        minStock: Number(d.minStock) || 0,
                        image: null,
                        priceTiers: d.priceTiers || {},
                    };
                });

                if (window.confirm(`${newItems.length} item akan diimpor. Item dengan SKU yang sama akan diperbarui. Lanjutkan?`)) {
                    dispatch({ type: 'BULK_ADD_ITEMS', payload: newItems });
                    alert("Impor berhasil!");
                }
            } catch (err) {
                alert(`Gagal mengimpor file: ${err instanceof Error ? err.message : "Error tidak diketahui"}`);
            }
        };
        reader.readAsText(file);
        if(event.target) event.target.value = '';
    };

    const openModal = (item?: Item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(undefined);
    };

    const SortableHeader: React.FC<{ children: React.ReactNode; columnKey: SortKey; }> = ({ children, columnKey }) => {
        const isActive = sortKey === columnKey;
        const icon = !isActive ? ICONS.sortable : sortOrder === 'asc' ? ICONS.sortUp : ICONS.sortDown;
        return (
            <th className="p-3">
                <button onClick={() => handleSort(columnKey)} className="flex items-center gap-1 font-semibold hover:text-sky-600 transition-colors">
                    {children}
                    {icon}
                </button>
            </th>
        );
    };
    
    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold">Manajemen Item</h1>
                <div className="flex flex-wrap gap-2">
                     {hasPermission('items.import_export') && (
                        <>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                            <button onClick={handleImportClick} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                                {ICONS.upload} <span>Import</span>
                            </button>
                            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                                {ICONS.download} <span>Export</span>
                            </button>
                        </>
                     )}
                     {hasPermission('items.create') && (
                        <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600">
                            {ICONS.plus}
                            <span>Tambah Item</span>
                        </button>
                     )}
                </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b bg-slate-50 text-left">
                            <th className="p-3 font-semibold">SKU</th>
                            <SortableHeader columnKey="name">Nama Item</SortableHeader>
                            <SortableHeader columnKey="categoryId">Kategori</SortableHeader>
                            <th className="p-3 text-right">
                                <button onClick={() => handleSort('sellPrice')} className="flex items-center gap-1 font-semibold hover:text-sky-600 transition-colors ml-auto">
                                    Harga Jual
                                    {sortKey === 'sellPrice' ? (sortOrder === 'asc' ? ICONS.sortUp : ICONS.sortDown) : ICONS.sortable}
                                </button>
                            </th>
                            <th className="p-3 text-center">
                                 <button onClick={() => handleSort('stock')} className="flex items-center gap-1 font-semibold hover:text-sky-600 transition-colors mx-auto">
                                    Stok
                                    {sortKey === 'stock' ? (sortOrder === 'asc' ? ICONS.sortUp : ICONS.sortDown) : ICONS.sortable}
                                </button>
                            </th>
                            <th className="p-3 font-semibold">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedItems.map(item => (
                            <tr key={item.id} className="border-b hover:bg-slate-50">
                                <td className="p-3 font-mono text-sm">{item.sku}</td>
                                <td className="p-3 font-semibold">{item.name}</td>
                                <td className="p-3">{getCategoryName(item.categoryId)}</td>
                                <td className="p-3 text-right">{formatCurrency(item.sellPrice)}</td>
                                <td className={`p-3 text-center font-bold ${item.stock <= item.minStock ? 'text-red-500' : ''}`}>{item.stock}</td>
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => onViewStockCard(item.id)} title="Lihat Kartu Stok" className="text-gray-500 hover:text-gray-800 p-1">{ICONS.stockCard}</button>
                                        {hasPermission('items.edit') && (
                                            <button onClick={() => openModal(item)} title="Edit Item" className="text-sky-600 hover:text-sky-800 p-1">{ICONS.edit}</button>
                                        )}
                                        {hasPermission('items.delete') && (
                                            <button onClick={() => handleDeleteItem(item.id)} title="Hapus Item" className="text-red-500 hover:text-red-700 p-1">{ICONS.trash}</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <Modal title={editingItem ? 'Edit Item' : 'Tambah Item Baru'} onClose={closeModal}>
                    <ItemForm item={editingItem} onSave={handleSaveItem} onClose={closeModal} />
                </Modal>
            )}
        </div>
    );
};

export default Items;