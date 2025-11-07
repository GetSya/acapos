import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Sale } from '../types';
import { formatCurrency } from '../utils/helpers';
import Modal from './Modal';

interface ReceiptModalProps {
    sale: Sale; 
    onClose: () => void;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
    const { state } = useAppContext();
    const cashierName = state.users.find(u => u.id === sale.cashierId)?.fullName || 'N/A';

    const discountAmount = sale.discountType === 'percentage'
        ? sale.subtotal * (sale.discountValue / 100)
        : sale.discountValue;

    const subtotalAfterDiscount = sale.subtotal - discountAmount;

    const taxAmount = sale.taxType === 'percentage'
        ? subtotalAfterDiscount * (sale.taxValue / 100)
        : sale.taxValue;

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <Modal title="Transaksi Berhasil" onClose={onClose}>
                <div className="printable-receipt-container">
                    <div className="text-sm font-mono bg-white p-2" id="receipt-content">
                        {/* Store Info */}
                        <div className="text-center space-y-1 mb-3">
                            {state.settings.logo && <img src={state.settings.logo} alt="Logo" className="mx-auto h-12 w-auto mb-2" />}
                            <h2 className="text-base font-bold">{state.settings.companyName}</h2>
                            <p className="text-xs">{state.settings.companyAddress}</p>
                            <p className="text-xs">{state.settings.companyPhone}</p>
                        </div>
                        
                        {/* Transaction Info */}
                        <div className="text-xs">
                            <div className="flex justify-between">
                                <span>No: {sale.transactionNumber}</span>
                                <span>{new Date(sale.date).toLocaleDateString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Kasir: {cashierName}</span>
                                <span>{new Date(sale.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>

                        {/* Separator */}
                        <div className="border-t border-dashed border-black my-2"></div>

                        {/* Items */}
                        <div>
                            {sale.items.map(saleItem => {
                                const item = state.items.find(i => i.id === saleItem.itemId);
                                return (
                                    <div key={saleItem.itemId} className="text-xs mb-1">
                                        <p>{item?.name}</p>
                                        <div className="flex justify-between">
                                            <span>{saleItem.quantity} x {formatCurrency(saleItem.price)}</span>
                                            <span className="font-semibold">{formatCurrency(saleItem.price * saleItem.quantity)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Separator */}
                        <div className="border-t border-dashed border-black my-2"></div>

                        {/* Totals */}
                        <div className="text-xs space-y-1">
                            <div className="flex justify-between"><p>Subtotal</p><p>{formatCurrency(sale.subtotal)}</p></div>
                            {sale.discountValue > 0 && (
                                <div className="flex justify-between"><p>Diskon</p><p>- {formatCurrency(discountAmount)}</p></div>
                            )}
                            {sale.taxValue > 0 && (
                                <div className="flex justify-between"><p>Pajak</p><p>+ {formatCurrency(taxAmount)}</p></div>
                            )}
                            <div className="border-t border-dashed border-black my-1"></div>
                            <div className="flex justify-between font-bold text-sm"><p>TOTAL</p><p>{formatCurrency(sale.total)}</p></div>
                            <div className="flex justify-between"><p>Bayar ({sale.paymentMethod})</p><p>{formatCurrency(sale.amountPaid)}</p></div>
                            <div className="flex justify-between"><p>Kembali</p><p>{formatCurrency(sale.change)}</p></div>
                        </div>

                        {/* Footer */}
                        <div className="text-center text-xs mt-3 pt-2 border-t border-dashed border-black">
                            <p>Terima Kasih Atas Kunjungan Anda</p>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-2 p-4 mt-4 bg-slate-50 rounded-b-lg no-print">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700">Transaksi Baru</button>
                    <button onClick={handlePrint} className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600">Cetak Struk</button>
                </div>
            </Modal>
             <style>{`
                @media print {
                    /* Hide everything except the receipt content */
                    body * {
                        visibility: hidden;
                    }
                    .no-print {
                        display: none !important;
                    }
                    #receipt-content, #receipt-content * {
                        visibility: visible;
                    }

                    /* Position the receipt content to the top-left of the print page */
                    #receipt-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%; /* The content will take the full width of the @page size */
                    }

                    /* Define the paper size for the printer */
                    @page {
                        size: 80mm; /* Common thermal printer roll width, height will be automatic */
                        margin: 2mm; /* Add a small margin around the receipt */
                    }
                }
            `}</style>
        </>
    );
};

export default ReceiptModal;