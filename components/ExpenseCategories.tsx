import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { ExpenseCategory } from '../types';
import { generateId } from '../utils/helpers';
import Modal from './Modal';
import { ICONS } from '../constants';

const ExpenseCategoryForm: React.FC<{ category?: ExpenseCategory; onSave: (category: ExpenseCategory) => void; onClose: () => void }> = ({ category, onSave, onClose }) => {
    const [name, setName] = useState(category?.name || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: category?.id || generateId(),
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
                placeholder="Nama Kategori Beban (e.g., Gaji, Sewa)" 
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


const ExpenseCategories: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ExpenseCategory | undefined>(undefined);

    const handleSave = (category: ExpenseCategory) => {
        if (state.expenseCategories.some(c => c.id === category.id)) {
            dispatch({ type: 'UPDATE_EXPENSE_CATEGORY', payload: category });
        } else {
            dispatch({ type: 'ADD_EXPENSE_CATEGORY', payload: category });
        }
    };

    const handleDelete = (id: string) => {
        const isCategoryUsed = state.expenses.some(exp => exp.categoryId === id);
        if (isCategoryUsed) {
            alert('Kategori ini tidak dapat dihapus karena sedang digunakan oleh satu atau lebih catatan beban.');
            return;
        }
        if(window.confirm('Apakah Anda yakin ingin menghapus kategori beban ini?')) {
            dispatch({ type: 'DELETE_EXPENSE_CATEGORY', payload: id });
        }
    }
    
    const openModal = (category?: ExpenseCategory) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCategory(undefined);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Manajemen Kategori Beban</h1>
                <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600">
                    {ICONS.plus}
                    <span>Tambah Kategori</span>
                </button>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b bg-slate-50">
                            <th className="p-3">Nama Kategori Beban</th>
                            <th className="p-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.expenseCategories.map(cat => (
                            <tr key={cat.id} className="border-b hover:bg-slate-50">
                                <td className="p-3 font-semibold">{cat.name}</td>
                                <td className="p-3 flex items-center gap-2">
                                    <button onClick={() => openModal(cat)} className="text-sky-600 hover:text-sky-800 p-1">{ICONS.edit}</button>
                                    <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:text-red-700 p-1">{ICONS.trash}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <Modal title={editingCategory ? 'Edit Kategori Beban' : 'Tambah Kategori Baru'} onClose={closeModal}>
                    <ExpenseCategoryForm category={editingCategory} onSave={handleSave} onClose={closeModal} />
                </Modal>
            )}
        </div>
    );
};

export default ExpenseCategories;