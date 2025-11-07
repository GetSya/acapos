import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Account } from '../types';
import { generateId, formatCurrency } from '../utils/helpers';
import Modal from './Modal';
import { ICONS } from '../constants';

const AccountForm: React.FC<{ account?: Account; onSave: (account: Account) => void; onClose: () => void }> = ({ account, onSave, onClose }) => {
    const [name, setName] = useState(account?.name || '');
    const [balance, setBalance] = useState(account?.balance || 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: account?.id || generateId(),
            name,
            balance,
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input 
                name="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Nama Akun (e.g., Kas Tunai, BCA)" 
                className="p-2 border rounded w-full" 
                required 
            />
            <div className="grid grid-cols-1">
                <label htmlFor="balance" className="text-sm font-medium text-slate-600">Saldo Awal/Saat Ini</label>
                <input 
                    id="balance"
                    type="number"
                    name="balance" 
                    value={balance} 
                    onChange={(e) => setBalance(parseFloat(e.target.value) || 0)} 
                    placeholder="Saldo" 
                    className="p-2 border rounded" 
                />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300">Batal</button>
                <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600">Simpan</button>
            </div>
        </form>
    );
};

const Accounts: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | undefined>(undefined);

    const handleSaveAccount = (account: Account) => {
        if (state.accounts.some(c => c.id === account.id)) {
            dispatch({ type: 'UPDATE_ACCOUNT', payload: account });
        } else {
            dispatch({ type: 'ADD_ACCOUNT', payload: account });
        }
    };

    const handleDeleteAccount = (accountId: string) => {
        const isAccountUsed = state.sales.some(sale => sale.accountId === accountId);
        if (isAccountUsed) {
            alert('Akun ini tidak dapat dihapus karena sudah digunakan dalam transaksi penjualan.');
            return;
        }
        if(window.confirm('Apakah Anda yakin ingin menghapus akun ini?')) {
            dispatch({ type: 'DELETE_ACCOUNT', payload: accountId });
        }
    }
    
    const openModal = (account?: Account) => {
        setEditingAccount(account);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingAccount(undefined);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Manajemen Kode Akun</h1>
                <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600">
                    {ICONS.plus}
                    <span>Tambah Akun</span>
                </button>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b bg-slate-50">
                            <th className="p-3">Nama Akun</th>
                            <th className="p-3 text-right">Saldo</th>
                            <th className="p-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.accounts.map(account => (
                            <tr key={account.id} className="border-b hover:bg-slate-50">
                                <td className="p-3 font-semibold">{account.name}</td>
                                <td className="p-3 text-right font-mono">{formatCurrency(account.balance)}</td>
                                <td className="p-3 flex items-center gap-2">
                                    <button onClick={() => openModal(account)} className="text-sky-600 hover:text-sky-800 p-1">{ICONS.edit}</button>
                                    <button onClick={() => handleDeleteAccount(account.id)} className="text-red-500 hover:text-red-700 p-1">{ICONS.trash}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <Modal title={editingAccount ? 'Edit Akun' : 'Tambah Akun Baru'} onClose={closeModal}>
                    <AccountForm account={editingAccount} onSave={handleSaveAccount} onClose={closeModal} />
                </Modal>
            )}
        </div>
    );
};

export default Accounts;
