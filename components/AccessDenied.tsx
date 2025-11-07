import React from 'react';

const AccessDenied: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <h1 className="text-4xl font-bold text-red-500">Akses Ditolak</h1>
            <p className="mt-4 text-lg text-slate-600">Anda tidak memiliki hak akses untuk melihat halaman ini.</p>
        </div>
    );
};

export default AccessDenied;
