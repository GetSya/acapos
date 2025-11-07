import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Purchase } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import Modal from './Modal';

const PaymentForm: React.FC<{ purchase: Purchase; onSave: (payload: { purchaseId: string; amount: number; accountId: string; date: string }) => void; onClose: () => void }> = ({ purchase, onSave, onClose }) => {
    const { state } = useAppContext();
    const amountDue = purchase.total - purchase.amountPaid;
    const [paymentAmount, setPaymentAmount] = useState(amountDue);
    const [accountId, setAccountId] = useState(state.accounts[0]?.id || '');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (paymentAmount <= 0) {
            setError('Jumlah pembayaran harus lebih dari 0.');
            return;
        }
        if (paymentAmount > amountDue) {
            setError(`Jumlah pembayaran tidak boleh melebihi sisa tagihan (${formatCurrency(amountDue)}).`);
            return;
        }
        if (!accountId) {
            setError('Harap pilih akun pembayaran.');
            return;
        }

        onSave({
            purchaseId: purchase.id,
            amount: paymentAmount,
            accountId,
            date: new Date().toISOString(),
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium">Sisa Tagihan</label>
                <p className="text-2xl font-bold">{formatCurrency(amountDue)}</p>
            </div>
            <div>
                <label htmlFor="paymentAmount" className="block text-sm font-medium text-slate-700">Jumlah Pembayaran</label>
                <input id="paymentAmount" type="number" value={paymentAmount} onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)} className="mt-1 p-2 border rounded w-full" required />
            </div>
            <div>
                <label htmlFor="accountId" className="block text-sm font-medium text-slate-700">Dibayar Dari Akun</label>
                <select id="accountId" value={accountId} onChange={e => setAccountId(e.target.value)} className="mt-1 p-2 border rounded bg-white w-full" required>
                    <option value="">Pilih Akun</option>
                    {state.accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
            </div>
             {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300">Batal</button>
                <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600">Simpan Pembayaran</button>
            </div>
        </form>
    );
};

const Payables: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [payingPurchase, setPayingPurchase] = useState<Purchase | null>(null);

    const payables = useMemo(() => {
        return state.purchases.filter(p => p.paymentStatus === 'Belum Lunas')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [state.purchases]);

    const totalPayables = payables.reduce((sum, p) => sum + (p.total - p.amountPaid), 0);
    
    const handleSavePayment = (payload: { purchaseId: string; amount: number; accountId: string; date: string }) => {
        dispatch({ type: 'ADD_PAYABLE_PAYMENT', payload });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Hutang Usaha</h1>
                 <div className="text-right">
                    <p className="text-slate-600">Total Hutang</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(totalPayables)}</p>
                </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b bg-slate-50">
                            <th className="p-3">Tanggal</th>
                            <th className="p-3">No. Faktur</th>
                            <th className="p-3">Supplier</th>
                            <th className="p-3 text-right">Total Tagihan</th>
                            <th className="p-3 text-right">Sudah Dibayar</th>
                            <th className="p-3 text-right">Sisa Tagihan</th>
                            <th className="p-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payables.map(purchase => {
                            const supplier = state.suppliers.find(s => s.id === purchase.supplierId);
                            const amountDue = purchase.total - purchase.amountPaid;
                            return (
                                <tr key={purchase.id} className="border-b hover:bg-slate-50">
                                    <td className="p-3">{formatDate(purchase.date)}</td>
                                    <td className="p-3 font-mono text-sm">{purchase.purchaseNumber}</td>
                                    <td className="p-3 font-semibold">{supplier?.name || '-'}</td>
                                    <td className="p-3 text-right">{formatCurrency(purchase.total)}</td>
                                    <td className="p-3 text-right text-green-600">{formatCurrency(purchase.amountPaid)}</td>
                                    <td className="p-3 text-right font-bold text-red-600">{formatCurrency(amountDue)}</td>
                                    <td className="p-3 text-center">
                                        <button onClick={() => setPayingPurchase(purchase)} className="px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600">
                                            Bayar
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                         {payables.length === 0 && (
                            <tr><td colSpan={7} className="text-center p-6 text-slate-500">Tidak ada hutang yang perlu dibayar.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {payingPurchase && (
                <Modal title={`Bayar Hutang untuk ${payingPurchase.purchaseNumber}`} onClose={() => setPayingPurchase(null)}>
                    <PaymentForm purchase={payingPurchase} onSave={handleSavePayment} onClose={() => setPayingPurchase(null)} />
                </Modal>
            )}
        </div>
    );
};

export default Payables;