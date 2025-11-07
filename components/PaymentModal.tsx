import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { CartItem, Sale } from '../types';
import { formatCurrency, generateId } from '../utils/helpers';
import Modal from './Modal';

interface PaymentModalProps {
    cart: CartItem[];
    total: number;
    customerId: string;
    discountType: 'fixed' | 'percentage';
    discountValue: number;
    taxType: 'fixed' | 'percentage';
    taxValue: number;
    salesOrderId?: string;
    onClose: () => void;
    onPaymentSuccess: (sale: Sale) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
    cart, 
    total, 
    customerId, 
    discountType, 
    discountValue, 
    taxType, 
    taxValue, 
    salesOrderId,
    onClose, 
    onPaymentSuccess 
}) => {
    const { state, dispatch } = useAppContext();
    const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'Kartu' | 'Transfer'>('Tunai');
    const [accountId, setAccountId] = useState(state.accounts[0]?.id || '');
    const [amountPaid, setAmountPaid] = useState(total);
    const [error, setError] = useState('');

    const change = Math.max(0, amountPaid - total);

    const handleConfirmPayment = () => {
        setError('');
        if (amountPaid < 0) {
            setError('Jumlah bayar tidak boleh negatif.');
            return;
        }
        if (!accountId) {
            setError('Silakan pilih akun pembayaran.');
            return;
        }

        const subtotal = cart.reduce((acc, item) => acc + item.sellPrice * item.quantity, 0);

        const newSale: Sale = {
            id: generateId(),
            transactionNumber: `SALE-${Date.now()}`,
            date: new Date().toISOString(),
            cashierId: state.currentUser!.id,
            customerId,
            items: cart.map(item => ({ itemId: item.id, quantity: item.quantity, price: item.sellPrice })),
            subtotal,
            discountType,
            discountValue,
            taxType,
            taxValue,
            total,
            paymentMethod,
            accountId,
            amountPaid,
            change,
            paymentStatus: amountPaid >= total ? 'Lunas' : 'Belum Lunas', // Ditentukan di reducer, tapi set di sini juga bisa
            salesOrderId,
        };

        dispatch({
            type: 'CREATE_SALE',
            payload: newSale
        });
        
        onPaymentSuccess(newSale);
    };

    return (
        <Modal title="Pembayaran" onClose={onClose}>
            <div className="space-y-4">
                <div className="text-center p-4 bg-slate-100 rounded-lg">
                    <p className="text-lg text-slate-600">Total Belanja</p>
                    <p className="text-4xl font-bold text-sky-600">{formatCurrency(total)}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Metode Bayar</label>
                        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)} className="w-full mt-1 p-2 border rounded bg-white">
                            <option>Tunai</option>
                            <option>Kartu</option>
                            <option>Transfer</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700">Setor ke Akun</label>
                        <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full mt-1 p-2 border rounded bg-white" required>
                             <option value="">Pilih Akun</option>
                             {state.accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700">Jumlah Bayar</label>
                    <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)} className="w-full mt-1 p-2 border rounded" />
                </div>

                {amountPaid >= total && (
                    <div className="text-right">
                        <p className="text-md text-slate-600">Kembalian</p>
                        <p className="text-2xl font-semibold">{formatCurrency(change)}</p>
                    </div>
                )}
                 {amountPaid < total && (
                    <div className="text-right">
                        <p className="text-md text-slate-600">Sisa Tagihan</p>
                        <p className="text-2xl font-semibold text-red-600">{formatCurrency(total - amountPaid)}</p>
                    </div>
                )}
                
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <div className="flex justify-end gap-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300">Batal</button>
                    <button onClick={handleConfirmPayment} className="px-6 py-2 bg-sky-500 text-white rounded hover:bg-sky-600 disabled:opacity-50" disabled={!accountId}>
                        Konfirmasi Bayar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default PaymentModal;