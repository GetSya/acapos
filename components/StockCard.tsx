import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { formatDate } from '../utils/helpers';
import { ICONS } from '../constants';
import { StockMovement } from '../types';

interface StockCardProps {
    itemId: string | null;
    onBack: () => void;
}

const StockCard: React.FC<StockCardProps> = ({ itemId, onBack }) => {
    const { state } = useAppContext();

    const item = state.items.find(i => i.id === itemId);
    const movements = state.stockMovements
        .filter(m => m.itemId === itemId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (!item) {
        return (
            <div className="text-center p-8">
                <h2 className="text-xl font-semibold text-slate-700">Item Tidak Ditemukan</h2>
                <p className="text-slate-500 mt-2">Item yang Anda cari mungkin telah dihapus.</p>
                <button onClick={onBack} className="mt-4 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600">
                    Kembali ke Daftar Item
                </button>
            </div>
        );
    }
    
    const formatType = (type: StockMovement['type']) => {
        const typeMap = {
            'sale': 'Penjualan',
            'purchase': 'Pembelian',
            'adjustment-in': 'Penyesuaian Masuk',
            'adjustment-out': 'Penyesuaian Keluar',
            'initial': 'Stok Awal'
        };
        return typeMap[type] || type;
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full" title="Kembali">
                    {ICONS.backArrow}
                </button>
                <div>
                    <h1 className="text-3xl font-bold">Kartu Stok</h1>
                    <p className="text-slate-600">{item.name} (<span className="font-mono">{item.sku}</span>)</p>
                </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                <div className="mb-4 p-2 bg-slate-50 rounded-md">
                    <span className="font-semibold">Stok Saat Ini: </span>
                    <span className="text-2xl font-bold text-sky-600">{item.stock}</span>
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b bg-slate-50">
                            <th className="p-3 font-semibold">Tanggal</th>
                            <th className="p-3 font-semibold">Tipe</th>
                            <th className="p-3 font-semibold">Referensi</th>
                            <th className="p-3 font-semibold text-center">Masuk</th>
                            <th className="p-3 font-semibold text-center">Keluar</th>
                            <th className="p-3 font-semibold text-center">Saldo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {movements.map(m => {
                            const isIn = m.quantityChange > 0;
                            return (
                                <tr key={m.id} className="border-b hover:bg-slate-50">
                                    <td className="p-3 text-sm">{formatDate(m.date)}</td>
                                    <td className="p-3">{formatType(m.type)}</td>
                                    <td className="p-3 font-mono text-xs">{m.reference}</td>
                                    <td className="p-3 text-center text-green-600 font-semibold">{isIn ? m.quantityChange : '-'}</td>
                                    <td className="p-3 text-center text-red-600 font-semibold">{!isIn ? -m.quantityChange : '-'}</td>
                                    <td className="p-3 text-center font-bold">{m.balance}</td>
                                </tr>
                            )
                        })}
                        {movements.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center p-6 text-slate-500">
                                    Belum ada pergerakan stok untuk item ini.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StockCard;
