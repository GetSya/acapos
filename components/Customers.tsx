import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Customer, MembershipTier } from '../types';
import { generateId } from '../utils/helpers';
import Modal from './Modal';
import { ICONS } from '../constants';
import { usePermissions } from '../hooks/usePermissions';

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


const CustomerForm: React.FC<{ customer?: Customer; onSave: (customer: Customer) => void; onClose: () => void; totalSpent: number; }> = ({ customer, onSave, onClose, totalSpent }) => {
    const { state } = useAppContext();
    const [formData, setFormData] = useState<Omit<Customer, 'id'>>(customer ? { ...customer } : {
        name: '', phone: '', email: '', address: '', points: 0, priceTierId: undefined
    });

    const tier = getMembershipTier(totalSpent);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'points') {
            setFormData(prev => ({ ...prev, points: parseInt(value, 10) || 0 }));
        } else if (name === 'priceTierId') {
            setFormData(prev => ({ ...prev, priceTierId: value === '' ? undefined : value }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            id: customer?.id || generateId(),
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Nama Lengkap" className="p-2 border rounded w-full" required />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="phone" value={formData.phone} onChange={handleChange} placeholder="No. Telepon" className="p-2 border rounded" />
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="p-2 border rounded" />
            </div>
            <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Alamat" className="w-full p-2 border rounded" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                 <div>
                    <label htmlFor="points" className="block text-sm font-medium text-slate-700">Poin Loyalitas</label>
                    <input id="points" name="points" type="number" value={formData.points} onChange={handleChange} className="p-2 border rounded w-full mt-1" />
                </div>
                <div>
                    <label htmlFor="priceTierId" className="block text-sm font-medium text-slate-700">Tingkatan Harga</label>
                     <select id="priceTierId" name="priceTierId" value={formData.priceTierId || ''} onChange={handleChange} className="mt-1 p-2 border rounded bg-white w-full">
                        <option value="">Default (Ecer)</option>
                        {state.priceTiers.map(tier => <option key={tier.id} value={tier.id}>{tier.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700">Tier Keanggotaan</label>
                    <div className={`mt-1 p-2 border rounded w-full bg-slate-100 flex items-center gap-2`}>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getTierBadgeClass(tier)}`}>{tier}</span>
                        <span className="text-sm text-slate-600">(Ditentukan oleh total belanja)</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300">Batal</button>
                <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600">Simpan</button>
            </div>
        </form>
    );
};

interface CustomersProps {
    onViewHistory: (customerId: string) => void;
}


const Customers: React.FC<CustomersProps> = ({ onViewHistory }) => {
    const { state, dispatch } = useAppContext();
    const { hasPermission } = usePermissions();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);
    const [editingCustomerTotalSpent, setEditingCustomerTotalSpent] = useState<number>(0);

    const customerStats = useMemo(() => {
        const statsMap = new Map<string, { totalSpent: number }>();
        state.sales.forEach(sale => {
            if (sale.customerId) {
                const id = sale.customerId;
                const current = statsMap.get(id) || { totalSpent: 0 };
                current.totalSpent += sale.total;
                statsMap.set(id, current);
            }
        });
        return statsMap;
    }, [state.sales]);

    const handleSaveCustomer = (customer: Customer) => {
        if (state.customers.some(c => c.id === customer.id)) {
            dispatch({ type: 'UPDATE_CUSTOMER', payload: customer });
        } else {
            dispatch({ type: 'ADD_CUSTOMER', payload: customer });
        }
    };

    const handleDeleteCustomer = (customerId: string) => {
        if (customerId === 'c1') {
            alert('"Pelanggan Umum" tidak dapat dihapus.');
            return;
        }
        if(window.confirm('Apakah Anda yakin ingin menghapus pelanggan ini?')) {
            dispatch({ type: 'DELETE_CUSTOMER', payload: customerId });
        }
    }
    
    const openModal = (customer?: Customer) => {
        setEditingCustomer(customer);
        setEditingCustomerTotalSpent(customer ? customerStats.get(customer.id)?.totalSpent || 0 : 0);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCustomer(undefined);
    };
    
    const getPriceTierName = (tierId?: string) => {
        if (!tierId) return 'Ecer';
        return state.priceTiers.find(t => t.id === tierId)?.name || 'Ecer';
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Manajemen Pelanggan</h1>
                {hasPermission('customers.manage') && (
                    <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600">
                        {ICONS.plus}
                        <span>Tambah Pelanggan</span>
                    </button>
                )}
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b bg-slate-50">
                            <th className="p-3">Nama</th>
                            <th className="p-3">Telepon</th>
                            <th className="p-3">Tingkat Harga</th>
                            <th className="p-3">Tier Membership</th>
                            <th className="p-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.customers.map(customer => {
                            const stats = customerStats.get(customer.id);
                            const tier = getMembershipTier(stats?.totalSpent || 0);
                            return (
                                <tr key={customer.id} className="border-b hover:bg-slate-50">
                                    <td className="p-3 font-semibold">{customer.name}</td>
                                    <td className="p-3">{customer.phone}</td>
                                    <td className="p-3 font-medium text-blue-600">{getPriceTierName(customer.priceTierId)}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTierBadgeClass(tier)}`}>
                                            {tier}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => onViewHistory(customer.id)} title="Lihat Riwayat Pembelian" className="text-slate-500 hover:text-slate-800 p-1">{ICONS.purchaseHistory}</button>
                                            {hasPermission('customers.manage') && (
                                                <>
                                                    <button onClick={() => openModal(customer)} title="Edit" className="text-sky-600 hover:text-sky-800 p-1">{ICONS.edit}</button>
                                                    <button 
                                                        onClick={() => handleDeleteCustomer(customer.id)} 
                                                        title="Hapus"
                                                        className="text-red-500 hover:text-red-700 p-1 disabled:text-slate-300 disabled:cursor-not-allowed"
                                                        disabled={customer.id === 'c1'}>
                                                            {ICONS.trash}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <Modal title={editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'} onClose={closeModal}>
                    <CustomerForm 
                        customer={editingCustomer} 
                        onSave={handleSaveCustomer} 
                        onClose={closeModal} 
                        totalSpent={editingCustomerTotalSpent}
                    />
                </Modal>
            )}
        </div>
    );
};

export default Customers;