import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Brand } from '../types';
import { generateId } from '../utils/helpers';
import Modal from './Modal';
import { ICONS } from '../constants';
import { usePermissions } from '../hooks/usePermissions';

const BrandForm: React.FC<{ brand?: Brand; onSave: (brand: Brand) => void; onClose: () => void }> = ({ brand, onSave, onClose }) => {
    const [name, setName] = useState(brand?.name || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: brand?.id || generateId(),
            name,
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input 
                name="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Nama Merek" 
                className="p-2 border rounded w-full" 
                required 
            />
            <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300">Batal</button>
                <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600">Simpan</button>
            </div>
        </form>
    );
};

const Brands: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { hasPermission } = usePermissions();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | undefined>(undefined);

    const handleSave = (brand: Brand) => {
        if (state.brands.some(b => b.id === brand.id)) {
            dispatch({ type: 'UPDATE_BRAND', payload: brand });
        } else {
            dispatch({ type: 'ADD_BRAND', payload: brand });
        }
    };

    const handleDelete = (id: string) => {
        const isBrandUsed = state.items.some(item => item.brandId === id);
        if (isBrandUsed) {
            alert('Merek ini tidak dapat dihapus karena sedang digunakan oleh satu atau lebih item.');
            return;
        }
        if(window.confirm('Apakah Anda yakin ingin menghapus merek ini?')) {
            dispatch({ type: 'DELETE_BRAND', payload: id });
        }
    }
    
    const openModal = (brand?: Brand) => {
        setEditingBrand(brand);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingBrand(undefined);
    };
    
    const canManage = hasPermission('brands.manage');

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Manajemen Merek</h1>
                {canManage && (
                    <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600">
                        {ICONS.plus}
                        <span>Tambah Merek</span>
                    </button>
                )}
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b bg-slate-50">
                            <th className="p-3">Nama Merek</th>
                            {canManage && <th className="p-3">Aksi</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {state.brands.map(brand => (
                            <tr key={brand.id} className="border-b hover:bg-slate-50">
                                <td className="p-3 font-semibold">{brand.name}</td>
                                {canManage && (
                                    <td className="p-3 flex items-center gap-2">
                                        <button onClick={() => openModal(brand)} className="text-sky-600 hover:text-sky-800 p-1">{ICONS.edit}</button>
                                        <button onClick={() => handleDelete(brand.id)} className="text-red-500 hover:text-red-700 p-1">{ICONS.trash}</button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <Modal title={editingBrand ? 'Edit Merek' : 'Tambah Merek Baru'} onClose={closeModal}>
                    <BrandForm brand={editingBrand} onSave={handleSave} onClose={closeModal} />
                </Modal>
            )}
        </div>
    );
};

export default Brands;