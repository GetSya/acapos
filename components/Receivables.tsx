import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Sale } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import Modal from './Modal';

const PaymentForm: React.FC<{ sale: Sale; onSave: (payload: { saleId: string; amount: number; accountId: string; date: string }) => void; onClose: () => void }> = ({ sale, onSave, onClose }) => {
    const { state } = useAppContext();
    const amountDue = sale.total - sale.amountPaid;
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
            setError('Harap pilih akun penerimaan.');
            return;
        }

        onSave({
            saleId: sale.id,
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
                <label htmlFor="accountId" className="block text-sm font-medium text-slate-700">Setor ke Akun</label>
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

const Receivables: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [payingSale, setPayingSale] = useState<Sale | null>(null);

    const receivables = useMemo(() => {
        return state.sales.filter(s => s.paymentStatus === 'Belum Lunas')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [state.sales]);
    
    const totalReceivables = receivables.reduce((sum, s) => sum + (s.total - s.amountPaid), 0);

    const handleSavePayment = (payload: { saleId: string; amount: number; accountId: string; date: string }) => {
        dispatch({ type: 'ADD_RECEIVABLE_PAYMENT', payload });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Piutang Usaha</h1>
                <div className="text-right">
                    <p className="text-slate-600">Total Piutang</p>
                    <p className="text-2xl font-bold text-sky-600">{formatCurrency(totalReceivables)}</p>
                </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b bg-slate-50">
                            <th className="p-3">Tanggal</th>
                            <th className="p-3">No. Faktur</th>
                            <th className="p-3">Pelanggan</th>
                            <th className="p-3 text-right">Total Tagihan</th>
                            <th className="p-3 text-right">Sudah Dibayar</th>
                            <th className="p-3 text-right">Sisa Tagihan</th>
                            <th className="p-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {receivables.map(sale => {
                            const customer = state.customers.find(c => c.id === sale.customerId);
                            const amountDue = sale.total - sale.amountPaid;
                            return (
                                <tr key={sale.id} className="border-b hover:bg-slate-50">
                                    <td className="p-3">{formatDate(sale.date)}</td>
                                    <td className="p-3 font-mono text-sm">{sale.transactionNumber}</td>
                                    <td className="p-3 font-semibold">{customer?.name || 'Pelanggan Umum'}</td>
                                    <td className="p-3 text-right">{formatCurrency(sale.total)}</td>
                                    <td className="p-3 text-right text-green-600">{formatCurrency(sale.amountPaid)}</td>
                                    <td className="p-3 text-right font-bold text-red-600">{formatCurrency(amountDue)}</td>
                                    <td className="p-3 text-center">
                                        <button onClick={() => setPayingSale(sale)} className="px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600">
                                            Bayar
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                         {receivables.length === 0 && (
                            <tr><td colSpan={7} className="text-center p-6 text-slate-500">Tidak ada piutang yang perlu ditagih.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {payingSale && (
                <Modal title={`Terima Pembayaran untuk ${payingSale.transactionNumber}`} onClose={() => setPayingSale(null)}>
                    <PaymentForm sale={payingSale} onSave={handleSavePayment} onClose={() => setPayingSale(null)} />
                </Modal>
            )}
        </div>
    );
};

export default Receivables;