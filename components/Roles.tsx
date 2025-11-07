import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Role, Permission } from '../types';
import { generateId } from '../utils/helpers';
import Modal from './Modal';
import { ICONS, ALL_PERMISSIONS } from '../constants';
import { supabase } from '../supabase/client';

const RoleForm: React.FC<{ role?: Role; onSave: (role: Role) => Promise<boolean>; onClose: () => void }> = ({ role, onSave, onClose }) => {
    const [name, setName] = useState(role?.name || '');
    const [permissions, setPermissions] = useState<Set<Permission>>(new Set(role?.permissions || []));
    const [isLoading, setIsLoading] = useState(false);

    const handlePermissionChange = (permission: Permission, checked: boolean) => {
        setPermissions(prev => {
            const newPermissions = new Set(prev);
            if (checked) {
                newPermissions.add(permission);
            } else {
                newPermissions.delete(permission);
            }
            return newPermissions;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const success = await onSave({
            id: role?.id || generateId(),
            name,
            permissions: Array.from(permissions),
        });
        setIsLoading(false);
        if (success) {
            onClose();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nama Role</label>
                <input 
                    id="name"
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="e.g., Manajer Gudang" 
                    className="mt-1 p-2 border rounded w-full" 
                    required 
                />
            </div>
            
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Hak Akses</h3>
                {ALL_PERMISSIONS.map(category => (
                    <div key={category.category} className="border p-4 rounded-lg">
                        <h4 className="font-semibold text-md mb-2">{category.category}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {category.permissions.map(p => (
                                <label key={p.id} className="flex items-center space-x-2">
                                    <input 
                                        type="checkbox" 
                                        checked={permissions.has(p.id)}
                                        onChange={e => handlePermissionChange(p.id, e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                    />
                                    <span className="text-sm">{p.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300" disabled={isLoading}>Batal</button>
                <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600" disabled={isLoading}>
                    {isLoading ? 'Menyimpan...' : 'Simpan Role'}
                </button>
            </div>
        </form>
    );
};


const Roles: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);

    const handleSave = async (role: Role): Promise<boolean> => {
        let error;
        let data;

        if (state.roles.some(r => r.id === role.id)) { // Update
            const result = await supabase
                .from('roles')
                .update({ name: role.name, permissions: role.permissions })
                .eq('id', role.id)
                .select()
                .single();
            error = result.error;
            data = result.data;
            if (!error && data) {
                dispatch({ type: 'UPDATE_ROLE', payload: data as Role });
            }
        } else { // Add
            const result = await supabase
                .from('roles')
                .insert(role)
                .select()
                .single();
            error = result.error;
            data = result.data;
            if (!error && data) {
                dispatch({ type: 'ADD_ROLE', payload: data as Role });
            }
        }

        if (error) {
            alert(`Gagal menyimpan role: ${error.message}`);
            return false;
        }
        return true;
    };

    const handleDelete = async (id: string) => {
        const isRoleUsed = state.users.some(user => user.roleId === id);
        if (isRoleUsed) {
            alert('Role ini tidak dapat dihapus karena sedang digunakan oleh satu atau lebih pengguna.');
            return;
        }
        if(window.confirm('Apakah Anda yakin ingin menghapus role ini?')) {
            const { error } = await supabase
                .from('roles')
                .delete()
                .eq('id', id);

            if (error) {
                alert(`Gagal menghapus role: ${error.message}`);
            } else {
                dispatch({ type: 'DELETE_ROLE', payload: id });
            }
        }
    }
    
    const openModal = (role?: Role) => {
        setEditingRole(role);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingRole(undefined);
    };

    const defaultRoles = ['role_admin', 'role_cashier'];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Role & Hak Akses</h1>
                <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600">
                    {ICONS.plus}
                    <span>Tambah Role Baru</span>
                </button>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b bg-slate-50">
                            <th className="p-3">Nama Role</th>
                            <th className="p-3">Jumlah Hak Akses</th>
                            <th className="p-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.roles.map(role => (
                            <tr key={role.id} className="border-b hover:bg-slate-50">
                                <td className="p-3 font-semibold">{role.name}</td>
                                <td className="p-3">{role.permissions.length}</td>
                                <td className="p-3 flex items-center gap-2">
                                    <button onClick={() => openModal(role)} className="text-sky-600 hover:text-sky-800 p-1" title="Edit">{ICONS.edit}</button>
                                    <button 
                                        onClick={() => handleDelete(role.id)} 
                                        className="text-red-500 hover:text-red-700 p-1 disabled:text-slate-300 disabled:cursor-not-allowed" 
                                        disabled={defaultRoles.includes(role.id)}
                                        title={defaultRoles.includes(role.id) ? "Role default tidak bisa dihapus" : "Hapus"}
                                    >
                                        {ICONS.trash}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <Modal title={editingRole ? 'Edit Role' : 'Tambah Role Baru'} onClose={closeModal}>
                    <RoleForm role={editingRole} onSave={handleSave} onClose={closeModal} />
                </Modal>
            )}
        </div>
    );
};

export default Roles;
