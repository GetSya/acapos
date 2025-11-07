import React, { useRef, useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { ICONS } from '../constants';
import { CompanySettings } from '../types';
import { usePermissions } from '../hooks/usePermissions';

const Settings: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { hasPermission } = usePermissions();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    const [currentSettings, setCurrentSettings] = useState<CompanySettings>(state.settings);
    const [logoPreview, setLogoPreview] = useState<string | null>(state.settings.logo);

    if (!hasPermission('settings.manage')) {
        return <div>Anda tidak memiliki akses ke halaman ini.</div>;
    }

    const handleBackup = () => {
        if (!state.settings.companyName) return;
        const { isAuthenticated, currentUser, ...dataToBackup } = state;
        const dataStr = JSON.stringify(dataToBackup, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `acapos_backup_${state.settings.companyName}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleRestoreClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!window.confirm("Apakah Anda yakin ingin me-restore data? Semua data saat ini akan ditimpa.")) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const restoredData = JSON.parse(text);
                if (restoredData.settings && restoredData.items && restoredData.sales) {
                    dispatch({ type: 'RESTORE_STATE', payload: restoredData });
                    alert("Data berhasil di-restore. Silakan login kembali.");
                    dispatch({ type: 'LOGOUT' });
                } else {
                    throw new Error("File backup tidak valid atau format salah.");
                }
            } catch (error) {
                alert(`Gagal me-restore data: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        };
        reader.readAsText(file);
        if (event.target) event.target.value = '';
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setLogoPreview(base64String);
                setCurrentSettings(prev => ({ ...prev, logo: base64String }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setCurrentSettings(prev => ({ ...prev, [name]: checked }));
        } else {
            setCurrentSettings(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSaveSettings = () => {
        dispatch({ type: 'UPDATE_SETTINGS', payload: currentSettings });
        alert("Pengaturan berhasil disimpan.");
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Pengaturan</h1>
            <div className="space-y-8">
                {/* Company Profile Settings */}
                <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl">
                    <h2 className="text-xl font-semibold border-b pb-2 mb-4">Profil Perusahaan</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Nama Perusahaan</label>
                            <input type="text" name="companyName" value={currentSettings.companyName} onChange={handleSettingsChange} className="w-full p-2 mt-1 border rounded" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700">Alamat Toko</label>
                            <textarea name="companyAddress" value={currentSettings.companyAddress} onChange={handleSettingsChange} rows={3} className="w-full p-2 mt-1 border rounded" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">No. Telepon Toko</label>
                            <input type="text" name="companyPhone" value={currentSettings.companyPhone} onChange={handleSettingsChange} className="w-full p-2 mt-1 border rounded" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Logo Perusahaan (untuk Laporan & Struk)</label>
                             <div className="mt-1 flex items-center space-x-4">
                                {logoPreview && <img src={logoPreview} alt="Logo Preview" className="h-16 w-auto object-contain rounded border p-1" />}
                                <button onClick={() => logoInputRef.current?.click()} className="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300 text-sm">
                                    Pilih Gambar
                                </button>
                                <input type="file" ref={logoInputRef} onChange={handleLogoChange} accept="image/*" className="hidden" />
                            </div>
                        </div>
                        <div className="flex items-center">
                            <input type="checkbox" id="autoGenerateSKU" name="autoGenerateSKU" checked={currentSettings.autoGenerateSKU} onChange={handleSettingsChange} className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                            <label htmlFor="autoGenerateSKU" className="ml-2 block text-sm text-slate-900">Buat SKU/Kode Item secara otomatis saat menambah item baru.</label>
                        </div>
                    </div>
                    <div className="flex justify-end mt-6">
                        <button onClick={handleSaveSettings} className="px-6 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600">
                            Simpan Pengaturan
                        </button>
                    </div>
                </div>

                {/* Backup & Restore */}
                <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl">
                    <h2 className="text-xl font-semibold border-b pb-2 mb-4">Backup & Restore Data</h2>
                    <p className="text-slate-600 mb-4">
                        Simpan data Anda secara lokal atau pulihkan dari file backup. Ini adalah fitur penting untuk keamanan data Anda.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button onClick={handleBackup} className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                            {ICONS.download}
                            <span>Backup Data Sekarang</span>
                        </button>
                        <button onClick={handleRestoreClick} className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                            {ICONS.upload}
                            <span>Restore dari File</span>
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                    </div>
                    <div className="mt-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-r-lg">
                        <p className="font-bold">Penting:</p>
                        <p className="text-sm">Proses restore akan menghapus semua data yang ada saat ini. Pastikan Anda memiliki backup data terbaru sebelum melanjutkan.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;