import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Supplier } from '../types';
import { generateId } from '../utils/helpers';
import Modal from './Modal';
import { ICONS } from '../constants';
import { usePermissions } from '../hooks/usePermissions';

const SupplierForm: React.FC<{ supplier?: Supplier; onSave: (supplier: Supplier) => void; onClose: () => void }> = ({ supplier, onSave, onClose }) => {
    const [formData, setFormData] = useState<Omit<Supplier, 'id'>>(supplier ? { ...supplier } : {
        name: '', phone: '', email: '', address: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            id: supplier?.id || generateId(),
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Nama Supplier" className="p-2 border rounded w-full" required />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="phone" value={formData.phone} onChange={handleChange} placeholder="No. Telepon" className="p-2 border rounded" />
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="p-2 border rounded" />
            </div>
            <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Alamat" className="w-full p-2 border rounded" />
            
            <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300">Batal</button>
                <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600">Simpan</button>
            </div>
        </form>
    );
};

const Suppliers: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { hasPermission } = usePermissions();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined);

    const handleSaveSupplier = (supplier: Supplier) => {
        if (state.suppliers.some(s => s.id === supplier.id)) {
            dispatch({ type: 'UPDATE_SUPPLIER', payload: supplier });
        } else {
            dispatch({ type: 'ADD_SUPPLIER', payload: supplier });
        }
    };

    const handleDeleteSupplier = (supplierId: string) => {
        if(window.confirm('Apakah Anda yakin ingin menghapus supplier ini?')) {
            dispatch({ type: 'DELETE_SUPPLIER', payload: supplierId });
        }
    }
    
    const openModal = (supplier?: Supplier) => {
        setEditingSupplier(supplier);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSupplier(undefined);
    };

    const canManage = hasPermission('suppliers.manage');

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Manajemen Supplier</h1>
                {canManage && (
                    <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600">
                        {ICONS.plus}
                        <span>Tambah Supplier</span>
                    </button>
                )}
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b bg-slate-50">
                            <th className="p-3">Nama</th>
                            <th className="p-3">Telepon</th>
                            <th className="p-3">Email</th>
                            <th className="p-3 hidden md:table-cell">Alamat</th>
                            {canManage && <th className="p-3">Aksi</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {state.suppliers.map(supplier => (
                            <tr key={supplier.id} className="border-b hover:bg-slate-50">
                                <td className="p-3 font-semibold">{supplier.name}</td>
                                <td className="p-3">{supplier.phone}</td>
                                <td className="p-3">{supplier.email}</td>
                                <td className="p-3 hidden md:table-cell">{supplier.address}</td>
                                {canManage && (
                                    <td className="p-3 flex items-center gap-2">
                                        <button onClick={() => openModal(supplier)} className="text-sky-600 hover:text-sky-800 p-1">{ICONS.edit}</button>
                                        <button onClick={() => handleDeleteSupplier(supplier.id)} className="text-red-500 hover:text-red-700 p-1">{ICONS.trash}</button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <Modal title={editingSupplier ? 'Edit Supplier' : 'Tambah Supplier Baru'} onClose={closeModal}>
                    <SupplierForm supplier={editingSupplier} onSave={handleSaveSupplier} onClose={closeModal} />
                </Modal>
            )}
        </div>
    );
};

export default Suppliers;