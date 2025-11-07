import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Unit } from '../types';
import { generateId } from '../utils/helpers';
import Modal from './Modal';
import { ICONS } from '../constants';
import { usePermissions } from '../hooks/usePermissions';

const UnitForm: React.FC<{ unit?: Unit; onSave: (unit: Unit) => void; onClose: () => void }> = ({ unit, onSave, onClose }) => {
    const [name, setName] = useState(unit?.name || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: unit?.id || generateId(),
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
                placeholder="Nama Satuan (e.g., pcs, kg, box)" 
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

const Units: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { hasPermission } = usePermissions();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | undefined>(undefined);

    const handleSave = (unit: Unit) => {
        if (state.units.some(u => u.id === unit.id)) {
            dispatch({ type: 'UPDATE_UNIT', payload: unit });
        } else {
            dispatch({ type: 'ADD_UNIT', payload: unit });
        }
    };

    const handleDelete = (id: string) => {
        const isUnitUsed = state.items.some(item => item.unitId === id);
        if (isUnitUsed) {
            alert('Satuan ini tidak dapat dihapus karena sedang digunakan oleh satu atau lebih item.');
            return;
        }
        if(window.confirm('Apakah Anda yakin ingin menghapus satuan ini?')) {
            dispatch({ type: 'DELETE_UNIT', payload: id });
        }
    }
    
    const openModal = (unit?: Unit) => {
        setEditingUnit(unit);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUnit(undefined);
    };
    
    const canManage = hasPermission('units.manage');

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Manajemen Satuan</h1>
                {canManage && (
                    <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600">
                        {ICONS.plus}
                        <span>Tambah Satuan</span>
                    </button>
                )}
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b bg-slate-50">
                            <th className="p-3">Nama Satuan</th>
                            {canManage && <th className="p-3">Aksi</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {state.units.map(unit => (
                            <tr key={unit.id} className="border-b hover:bg-slate-50">
                                <td className="p-3 font-semibold">{unit.name}</td>
                                {canManage && (
                                    <td className="p-3 flex items-center gap-2">
                                        <button onClick={() => openModal(unit)} className="text-sky-600 hover:text-sky-800 p-1">{ICONS.edit}</button>
                                        <button onClick={() => handleDelete(unit.id)} className="text-red-500 hover:text-red-700 p-1">{ICONS.trash}</button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <Modal title={editingUnit ? 'Edit Satuan' : 'Tambah Satuan Baru'} onClose={closeModal}>
                    <UnitForm unit={editingUnit} onSave={handleSave} onClose={closeModal} />
                </Modal>
            )}
        </div>
    );
};

export default Units;