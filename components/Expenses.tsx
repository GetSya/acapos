import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Expense } from '../types';
import { generateId, formatCurrency, formatDate } from '../utils/helpers';
import Modal from './Modal';
import { ICONS } from '../constants';

const ExpenseForm: React.FC<{ expense?: Expense; onSave: (expense: Expense) => void; onClose: () => void }> = ({ expense, onSave, onClose }) => {
    const { state } = useAppContext();
    const [formData, setFormData] = useState<Omit<Expense, 'id'>>(expense ? { ...expense } : {
        date: new Date().toISOString().split('T')[0],
        description: '',
        categoryId: '',
        amount: 0,
        accountId: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.categoryId || !formData.accountId || formData.amount <= 0) {
            alert("Harap lengkapi semua field yang diperlukan (Kategori, Akun, Jumlah > 0).");
            return;
        }
        onSave({
            ...formData,
            id: expense?.id || generateId(),
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700">Deskripsi Beban</label>
                <input id="description" name="description" value={formData.description} onChange={handleChange} placeholder="e.g., Pembayaran Listrik Bulan Juni" className="mt-1 p-2 border rounded w-full" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-slate-700">Tanggal</label>
                    <input id="date" name="date" type="date" value={formData.date} onChange={handleChange} className="mt-1 p-2 border rounded w-full" required />
                </div>
                 <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-slate-700">Jumlah</label>
                    <input id="amount" name="amount" type="number" value={formData.amount} onChange={handleChange} placeholder="0" className="mt-1 p-2 border rounded w-full" required />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="categoryId" className="block text-sm font-medium text-slate-700">Kategori Beban</label>
                    <select id="categoryId" name="categoryId" value={formData.categoryId} onChange={handleChange} className="mt-1 p-2 border rounded bg-white w-full" required>
                        <option value="">Pilih Kategori</option>
                        {state.expenseCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="accountId" className="block text-sm font-medium text-slate-700">Dibayar Dari Akun</label>
                    <select id="accountId" name="accountId" value={formData.accountId} onChange={handleChange} className="mt-1 p-2 border rounded bg-white w-full" required>
                        <option value="">Pilih Akun</option>
                        {state.accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300">Batal</button>
                <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600">Simpan</button>
            </div>
        </form>
    );
};

const Expenses: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);

    const handleSave = (expense: Expense) => {
        if (state.expenses.some(e => e.id === expense.id)) {
            dispatch({ type: 'UPDATE_EXPENSE', payload: expense });
        } else {
            dispatch({ type: 'ADD_EXPENSE', payload: expense });
        }
    };

    const handleDelete = (id: string) => {
        if(window.confirm('Apakah Anda yakin ingin menghapus catatan beban ini? Saldo akun terkait akan dikembalikan.')) {
            dispatch({ type: 'DELETE_EXPENSE', payload: id });
        }
    }
    
    const openModal = (expense?: Expense) => {
        setEditingExpense(expense);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingExpense(undefined);
    };
    
    const getCategoryName = (id: string) => state.expenseCategories.find(c => c.id === id)?.name || '-';
    const getAccountName = (id: string) => state.accounts.find(a => a.id === id)?.name || '-';

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Manajemen Beban Operasional</h1>
                <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600">
                    {ICONS.plus}
                    <span>Tambah Beban</span>
                </button>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b bg-slate-50">
                            <th className="p-3">Tanggal</th>
                            <th className="p-3">Deskripsi</th>
                            <th className="p-3">Kategori</th>
                            <th className="p-3">Akun</th>
                            <th className="p-3 text-right">Jumlah</th>
                            <th className="p-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...state.expenses].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => (
                            <tr key={exp.id} className="border-b hover:bg-slate-50">
                                <td className="p-3">{formatDate(exp.date)}</td>
                                <td className="p-3 font-semibold">{exp.description}</td>
                                <td className="p-3">{getCategoryName(exp.categoryId)}</td>
                                <td className="p-3">{getAccountName(exp.accountId)}</td>
                                <td className="p-3 text-right font-mono">{formatCurrency(exp.amount)}</td>
                                <td className="p-3 flex items-center gap-2">
                                    <button onClick={() => openModal(exp)} className="text-sky-600 hover:text-sky-800 p-1">{ICONS.edit}</button>
                                    <button onClick={() => handleDelete(exp.id)} className="text-red-500 hover:text-red-700 p-1">{ICONS.trash}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {state.expenses.length === 0 && (
                    <div className="text-center p-6 text-slate-500">
                        Belum ada catatan beban operasional.
                    </div>
                )}
            </div>

            {isModalOpen && (
                <Modal title={editingExpense ? 'Edit Beban' : 'Tambah Beban Baru'} onClose={closeModal}>
                    <ExpenseForm expense={editingExpense} onSave={handleSave} onClose={closeModal} />
                </Modal>
            )}
        </div>
    );
};

export default Expenses;