import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { User, Role } from '../types';
import Modal from './Modal';
import { ICONS } from '../constants';
import { supabase } from '../supabase/client';
import { usePermissions } from '../hooks/usePermissions';

// --- User Form Component (inside Users.tsx) ---
const UserForm: React.FC<{ user: User; onSave: (user: User) => void; onClose: () => void }> = ({ user, onSave, onClose }) => {
    const { state } = useAppContext();
    const [formData, setFormData] = useState<User>(user);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
             const { checked } = e.target as HTMLInputElement;
             setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
             setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const { id, fullName, roleId, isActive, username } = formData;
        
        // Only update fields that are safe to update
        const { data, error } = await supabase
            .from('users')
            .update({
                fullName,
                roleId,
                isActive,
                username,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            alert(`Gagal memperbarui pengguna: ${error.message}`);
        } else if (data) {
            // Supabase returns the old role name, we need to map to the new one
            const updatedUser: User = {
                id: data.id,
                username: data.username,
                fullName: data.fullName,
                roleId: data.roleId,
                isActive: data.isActive,
                passwordHash: '',
            };
            onSave(updatedUser);
            onClose();
        }
        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">Nama Lengkap</label>
                <input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} className="mt-1 p-2 border rounded w-full" required />
            </div>
             <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700">Username</label>
                <input id="username" name="username" value={formData.username} onChange={handleChange} className="mt-1 p-2 border rounded w-full" required />
            </div>
            <div>
                <label htmlFor="roleId" className="block text-sm font-medium text-slate-700">Role</label>
                <select id="roleId" name="roleId" value={formData.roleId} onChange={handleChange} className="mt-1 p-2 border rounded bg-white w-full">
                    {state.roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                </select>
            </div>
            <div className="flex items-center">
                <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                <label htmlFor="isActive" className="ml-2 block text-sm text-slate-900">Aktif</label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300" disabled={isLoading}>Batal</button>
                <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600" disabled={isLoading}>
                    {isLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
            </div>
        </form>
    );
};

// --- Add User Info Modal Component ---
const AddUserModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <Modal title="Tambah Pengguna Baru" onClose={onClose}>
        <div className="space-y-4">
            <h3 className="font-semibold text-lg">Prosedur Penambahan Pengguna</h3>
            <p className="text-slate-600">
                Untuk menjaga keamanan, penambahan pengguna baru dengan email dan password harus dilakukan melalui Supabase Dashboard.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-slate-600">
                <li>Buka proyek Anda di <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline">Supabase</a>.</li>
                <li>Navigasi ke bagian <span className="font-semibold">Authentication</span>.</li>
                <li>Klik tombol <span className="font-semibold">'Invite user'</span> atau <span className="font-semibold">'Add user'</span> untuk membuat akun login baru.</li>
                <li>Setelah pengguna terdaftar di Authentication, profilnya akan otomatis muncul di halaman ini untuk Anda kelola (mengubah nama, role, dan status).</li>
            </ol>
             <div className="flex justify-end pt-4">
                <button onClick={onClose} className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600">Mengerti</button>
            </div>
        </div>
    </Modal>
);

// --- Main Users Page Component ---
const Users: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { hasPermission } = usePermissions();
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | undefined>(undefined);

    const handleSaveUser = (user: User) => {
        dispatch({ type: 'UPDATE_USER', payload: user });
    };
    
    const openEditModal = (user: User) => {
        setEditingUser(user);
        setEditModalOpen(true);
    };

    const closeEditModal = () => {
        setEditModalOpen(false);
        setEditingUser(undefined);
    };
    
    const getStatusPill = (isActive: boolean) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isActive ? 'Aktif' : 'Tidak Aktif'}
        </span>
    );

    const getRoleName = (roleId: string) => {
        return state.roles.find(r => r.id === roleId)?.name || 'N/A';
    }
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Manajemen Pengguna</h1>
                {hasPermission('users.manage') && (
                    <button onClick={() => setAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600">
                        {ICONS.plus}
                        <span>Tambah Pengguna</span>
                    </button>
                )}
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b bg-slate-50">
                            <th className="p-3">Nama Lengkap</th>
                            <th className="p-3">Username</th>
                            <th className="p-3">Role</th>
                            <th className="p-3 text-center">Status</th>
                            <th className="p-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.users.map(user => (
                            <tr key={user.id} className="border-b hover:bg-slate-50">
                                <td className="p-3 font-semibold">{user.fullName}</td>
                                <td className="p-3">{user.username}</td>
                                <td className="p-3 font-medium">{getRoleName(user.roleId)}</td>
                                <td className="p-3 text-center">{getStatusPill(user.isActive)}</td>
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        {hasPermission('users.manage') && (
                                            <button onClick={() => openEditModal(user)} className="text-sky-600 hover:text-sky-800 p-1">{ICONS.edit}</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {state.users.length === 0 && (
                    <div className="text-center p-6 text-slate-500">
                        Memuat data pengguna atau tidak ada pengguna yang ditemukan.
                    </div>
                )}
            </div>

            {isEditModalOpen && editingUser && (
                <Modal title={`Edit Pengguna: ${editingUser.fullName}`} onClose={closeEditModal}>
                    <UserForm user={editingUser} onSave={handleSaveUser} onClose={closeEditModal} />
                </Modal>
            )}

            {isAddModalOpen && <AddUserModal onClose={() => setAddModalOpen(false)} />}
        </div>
    );
};

export default Users;