
import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { APP_NAME } from '../constants';
import { supabase } from '../supabase/client';
import { User, Role } from '../types';

const Login: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // First, check if local data needs initialization (for items, customers, etc.)
        // This is a one-time setup for the demo data.
        if (!localStorage.getItem('ACAPOS_DATA_acapos')) {
            dispatch({ type: 'INITIALIZE_COMPANY', payload: { companyName: 'acapos' } });
        }

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (authError || !authData.user) {
            setError(authError?.message || 'Email atau password salah.');
            setIsLoading(false);
            return;
        }

        // If auth is successful, fetch user profile from 'users' table
        const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError || !profileData) {
            setError(profileError?.message || 'Profil pengguna tidak ditemukan.');
            await supabase.auth.signOut(); // Log out if profile is missing
            setIsLoading(false);
            return;
        }
        
        // FIX: The User type expects 'roleId', not 'role'.
        const user: User = {
            id: profileData.id,
            username: profileData.username,
            fullName: profileData.fullName,
            roleId: profileData.roleId,
            isActive: profileData.isActive,
            passwordHash: '', // Not needed anymore
        };

        if (!user.isActive) {
             setError('Akun Anda tidak aktif.');
             await supabase.auth.signOut();
             setIsLoading(false);
             return;
        }

        // FIX: The 'LOGIN' action requires roles to be passed in the payload.
        const { data: roles, error: rolesError } = await supabase.from('roles').select('*');
        if (rolesError) {
            setError(rolesError.message || 'Gagal memuat roles.');
            await supabase.auth.signOut();
            setIsLoading(false);
            return;
        }

        dispatch({ type: 'LOGIN', payload: { user, roles: roles || [] } });
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
                <h1 className="text-3xl font-bold text-center text-slate-800">{APP_NAME}</h1>
                <p className="text-center text-slate-500">Aplikasi Kasir Lokal dengan Supabase</p>
                <form onSubmit={handleLogin} className="space-y-4">
                     <div>
                        <label className="text-sm font-medium text-slate-600">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                            required
                        />
                    </div>
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <button 
                        type="submit" 
                        className="w-full py-3 font-semibold text-white bg-sky-500 rounded-lg hover:bg-sky-600 transition-colors disabled:bg-slate-400"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Loading...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
