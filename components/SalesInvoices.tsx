import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { SalesOrder, Item, CartItem, Sale } from '../types';
import { formatCurrency } from '../utils/helpers';
import Modal from './Modal';
import PaymentModal from './PaymentModal';
import ReceiptModal from './ReceiptModal';
import { ICONS } from '../constants';
// Note: Page access is controlled by router in App.tsx

const SelectSOModal: React.FC<{
    customerId: string;
    onSelect: (so: SalesOrder) => void;
    onClose: () => void;
}> = ({ customerId, onSelect, onClose }) => {
    const { state } = useAppContext();
    const confirmedSOs = state.salesOrders.filter(so => so.customerId === customerId && so.status === 'Confirmed');

    return (
        <Modal title="Pilih dari Pesanan Penjualan (SO)" onClose={onClose}>
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {confirmedSOs.length > 0 ? confirmedSOs.map(so => (
                    <button 
                        key={so.id} 
                        onClick={() => onSelect(so)}
                        className="w-full text-left p-3 border rounded-lg hover:bg-slate-100 flex justify-between items-center"
                    >
                        <div>
                            <p className="font-bold">{so.soNumber}</p>
                            <p className="text-sm text-slate-500">{new Date(so.date).toLocaleDateString('id-ID')}</p>
                        </div>
                        <span className="font-semibold text-lg">{formatCurrency(so.total)}</span>
                    </button>
                )) : <p className="text-slate-500 text-center py-4">Tidak ada pesanan (SO) yang terkonfirmasi untuk pelanggan ini.</p>}
            </div>
        </Modal>
    );
};

interface SalesInvoicesProps {
    salesOrderIdToLoad: string | null;
    clearSalesOrderToLoad: () => void;
}

const SalesInvoices: React.FC<SalesInvoicesProps> = ({ salesOrderIdToLoad, clearSalesOrderToLoad }) => {
    const { state } = useAppContext();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerId, setCustomerId] = useState('');
    const [linkedSO, setLinkedSO] = useState<SalesOrder | null>(null);
    const [isSOModalOpen, setSOModalOpen] = useState(false);
    
    // States for payment flow
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [completedSale, setCompletedSale] = useState<Sale | null>(null);
    const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
    const [discountValue, setDiscountValue] = useState(0);
    const [taxType, setTaxType] = useState<'fixed' | 'percentage'>('fixed');
    const [taxValue, setTaxValue] = useState(0);

    const { subtotal, discountAmount, totalAfterDiscount, taxAmount, grandTotal } = useMemo(() => {
        const sub = cart.reduce((total, item) => total + item.sellPrice * item.quantity, 0);
        const discount = discountType === 'percentage' ? sub * (discountValue / 100) : discountValue;
        const afterDiscount = sub - discount;
        const tax = taxType === 'percentage' ? afterDiscount * (taxValue / 100) : taxValue;
        const grand = afterDiscount + tax;
        return {
            subtotal: sub,
            discountAmount: discount,
            totalAfterDiscount: afterDiscount,
            taxAmount: tax,
            grandTotal: grand
        };
    }, [cart, discountType, discountValue, taxType, taxValue]);


    const handleSelectSO = (so: SalesOrder) => {
        setLinkedSO(so);
        const soItems: CartItem[] = so.items.map(item => {
            const itemData = state.items.find(i => i.id === item.itemId)!;
            return {
                ...itemData,
                quantity: item.quantity,
                sellPrice: item.price,
            };
        });
        setCart(soItems);
        setSOModalOpen(false);
    };
    
    useEffect(() => {
        if (salesOrderIdToLoad) {
            const soToLoad = state.salesOrders.find(so => so.id === salesOrderIdToLoad);
            if (soToLoad) {
                setCustomerId(soToLoad.customerId);
                handleSelectSO(soToLoad);
            }
            clearSalesOrderToLoad();
        }
    }, [salesOrderIdToLoad, state.salesOrders, clearSalesOrderToLoad]);


    const resetTransaction = () => {
        setCart([]);
        setCustomerId('');
        setLinkedSO(null);
        setPaymentModalOpen(false);
        setCompletedSale(null);
        setDiscountValue(0);
        setTaxValue(0);
        setDiscountType('fixed');
        setTaxType('fixed');
    };
    
    const handlePaymentSuccess = (sale: Sale) => {
        setCompletedSale(sale);
        setPaymentModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Faktur Penjualan</h1>
            
            <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700">Pelanggan</label>
                        <select 
                            value={customerId} 
                            onChange={e => setCustomerId(e.target.value)} 
                            className="w-full p-2 mt-1 border rounded bg-white"
                            disabled={!!linkedSO}
                        >
                            <option value="">Pilih Pelanggan</option>
                            {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="self-end">
                        <button 
                            onClick={() => setSOModalOpen(true)} 
                            disabled={!customerId || !!linkedSO}
                            className="w-full p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-slate-300"
                        >
                            Pilih dari Pesanan (SO)
                        </button>
                    </div>
                </div>

                {linkedSO && (
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm flex justify-between items-center">
                        <span>
                            Transaksi ini tertaut ke Pesanan: <span className="font-semibold">{linkedSO.soNumber}</span>
                        </span>
                        <button onClick={() => { setLinkedSO(null); setCart([]); setCustomerId(''); }} className="text-sm text-red-600 hover:underline">Lepas Tautan</button>
                    </div>
                )}
                
                <div className="border-t pt-4 space-y-2">
                    <h2 className="text-lg font-semibold">Rincian Faktur</h2>
                    
                    {cart.length > 0 ? (
                         <div className="overflow-x-auto border rounded-lg">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="p-2 text-left">Item</th>
                                        <th className="p-2 text-center w-24">Jumlah</th>
                                        <th className="p-2 text-right w-32">Harga Jual</th>
                                        <th className="p-2 text-right w-32">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cart.map(item => (
                                        <tr key={item.id} className="border-b">
                                            <td className="p-2 font-semibold">{item.name}</td>
                                            <td className="p-2 text-center">{item.quantity}</td>
                                            <td className="p-2 text-right">{formatCurrency(item.sellPrice)}</td>
                                            <td className="p-2 text-right">{formatCurrency(item.quantity * item.sellPrice)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="mt-2 text-slate-500 text-center py-4">Pilih pelanggan dan pesanan, atau tambahkan item secara manual.</p>
                    )}
                </div>

                {/* Calculation Section */}
                {cart.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 pt-4 border-t">
                        {/* Left Side: Discount & Tax inputs */}
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-slate-600">Diskon</span>
                                <div className="flex items-center max-w-[60%]">
                                    <input type="number" value={discountValue} onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)} className="w-full p-1 border-b text-right" placeholder="0"/>
                                    <div className="flex rounded-md shadow-sm ml-1" role="group">
                                        <button type="button" onClick={() => setDiscountType('fixed')} className={`px-2 py-1 text-xs font-medium ${discountType === 'fixed' ? 'bg-sky-500 text-white' : 'bg-white'} border border-gray-200 rounded-l-lg hover:bg-gray-100`}>Rp</button>
                                        <button type="button" onClick={() => setDiscountType('percentage')} className={`px-2 py-1 text-xs font-medium ${discountType === 'percentage' ? 'bg-sky-500 text-white' : 'bg-white'} border border-gray-200 rounded-r-lg hover:bg-gray-100`}>%</button>
                                    </div>
                                </div>
                            </div>
                             <div className="flex items-center justify-between">
                                <span className="font-medium text-slate-600">Pajak</span>
                                <div className="flex items-center max-w-[60%]">
                                    <input type="number" value={taxValue} onChange={(e) => setTaxValue(parseFloat(e.target.value) || 0)} className="w-full p-1 border-b text-right" placeholder="0"/>
                                    <div className="flex rounded-md shadow-sm ml-1" role="group">
                                        <button type="button" onClick={() => setTaxType('fixed')} className={`px-2 py-1 text-xs font-medium ${taxType === 'fixed' ? 'bg-sky-500 text-white' : 'bg-white'} border border-gray-200 rounded-l-lg hover:bg-gray-100`}>Rp</button>
                                        <button type="button" onClick={() => setTaxType('percentage')} className={`px-2 py-1 text-xs font-medium ${taxType === 'percentage' ? 'bg-sky-500 text-white' : 'bg-white'} border border-gray-200 rounded-r-lg hover:bg-gray-100`}>%</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Totals */}
                        <div className="flex flex-col items-end">
                            <div className="w-full max-w-xs space-y-1 text-sm">
                                <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                                <div className="flex justify-between text-slate-600"><span>Diskon</span><span>- {formatCurrency(discountAmount)}</span></div>
                                <div className="flex justify-between text-slate-600"><span>Pajak</span><span>+ {formatCurrency(taxAmount)}</span></div>
                            </div>
                             <div className="w-full max-w-xs flex justify-between text-xl font-bold mt-2 pt-2 border-t"><span>Total</span><span>{formatCurrency(grandTotal)}</span></div>
                        </div>
                    </div>
                )}


                 <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                    <button onClick={resetTransaction} className="px-6 py-3 bg-slate-500 text-white rounded-lg hover:bg-slate-600">Batal</button>
                    <button 
                        onClick={() => setPaymentModalOpen(true)} 
                        className="px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:bg-slate-300"
                        disabled={cart.length === 0 || !customerId}
                    >
                        Lanjutkan ke Pembayaran
                    </button>
                </div>
            </div>

            {isSOModalOpen && customerId && (
                <SelectSOModal 
                    customerId={customerId}
                    onSelect={handleSelectSO}
                    onClose={() => setSOModalOpen(false)}
                />
            )}

            {isPaymentModalOpen && (
                <PaymentModal 
                    cart={cart}
                    total={grandTotal}
                    customerId={customerId}
                    discountType={discountType}
                    discountValue={discountValue}
                    taxType={taxType}
                    taxValue={taxValue}
                    salesOrderId={linkedSO?.id}
                    onClose={() => setPaymentModalOpen(false)}
                    onPaymentSuccess={handlePaymentSuccess}
                />
             )}
            
             {completedSale && (
                <ReceiptModal 
                    sale={completedSale}
                    onClose={resetTransaction}
                />
             )}
        </div>
    );
};

export default SalesInvoices;