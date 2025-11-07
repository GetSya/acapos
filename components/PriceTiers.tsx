import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { PriceTier } from '../types';
import { generateId } from '../utils/helpers';
import Modal from './Modal';
import { ICONS } from '../constants';

const PriceTierForm: React.FC<{ tier?: PriceTier; onSave: (tier: PriceTier) => void; onClose: () => void }> = ({ tier, onSave, onClose }) => {
    const [name, setName] = useState(tier?.name || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: tier?.id || generateId(),
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
                placeholder="Nama Tingkatan Harga (e.g., Grosir)" 
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

const PriceTiers: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTier, setEditingTier] = useState<PriceTier | undefined>(undefined);

    const handleSave = (tier: PriceTier) => {
        if (state.priceTiers.some(t => t.id === tier.id)) {
            dispatch({ type: 'UPDATE_PRICE_TIER', payload: tier });
        } else {
            dispatch({ type: 'ADD_PRICE_TIER', payload: tier });
        }
    };

    const handleDelete = (id: string) => {
        const isTierUsedByCustomer = state.customers.some(c => c.priceTierId === id);
        const isTierUsedByItem = state.items.some(i => i.priceTiers && i.priceTiers[id]);

        if (isTierUsedByCustomer || isTierUsedByItem) {
            alert('Tingkatan harga ini tidak dapat dihapus karena sedang digunakan oleh pelanggan atau item.');
            return;
        }
        if(window.confirm('Apakah Anda yakin ingin menghapus tingkatan harga ini?')) {
            dispatch({ type: 'DELETE_PRICE_TIER', payload: id });
        }
    }
    
    const openModal = (tier?: PriceTier) => {
        setEditingTier(tier);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTier(undefined);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Manajemen Tingkatan Harga</h1>
                <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600">
                    {ICONS.plus}
                    <span>Tambah Tingkatan</span>
                </button>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b bg-slate-50">
                            <th className="p-3">Nama Tingkatan Harga</th>
                            <th className="p-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.priceTiers.map(tier => (
                            <tr key={tier.id} className="border-b hover:bg-slate-50">
                                <td className="p-3 font-semibold">{tier.name}</td>
                                <td className="p-3 flex items-center gap-2">
                                    <button onClick={() => openModal(tier)} className="text-sky-600 hover:text-sky-800 p-1">{ICONS.edit}</button>
                                    <button onClick={() => handleDelete(tier.id)} className="text-red-500 hover:text-red-700 p-1">{ICONS.trash}</button>
                                </td>
                            </tr>
                        ))}
                         {state.priceTiers.length === 0 && (
                            <tr><td colSpan={2} className="text-center p-6 text-slate-500">Belum ada tingkatan harga.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <Modal title={editingTier ? 'Edit Tingkatan Harga' : 'Tambah Tingkatan Harga Baru'} onClose={closeModal}>
                    <PriceTierForm tier={editingTier} onSave={handleSave} onClose={closeModal} />
                </Modal>
            )}
        </div>
    );
};

export default PriceTiers;