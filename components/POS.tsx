import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Item, CartItem, Sale } from '../types';
import { ICONS } from '../constants';
import { formatCurrency } from '../utils/helpers';
import PaymentModal from './PaymentModal';
import ReceiptModal from './ReceiptModal';
// Note: Permissions are checked at the App.tsx router level for this component.

const POS: React.FC = () => {
    const { state } = useAppContext();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('c1');
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [completedSale, setCompletedSale] = useState<Sale | null>(null);

    const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
    const [discountValue, setDiscountValue] = useState(0);
    const [taxType, setTaxType] = useState<'fixed' | 'percentage'>('fixed');
    const [taxValue, setTaxValue] = useState(0);

    const selectedCustomer = useMemo(() => {
        return state.customers.find(c => c.id === selectedCustomerId);
    }, [selectedCustomerId, state.customers]);

    useEffect(() => {
        // When customer changes, update prices in the cart
        const customer = state.customers.find(c => c.id === selectedCustomerId);
        if (!customer) return;

        setCart(currentCart => {
            return currentCart.map(cartItem => {
                const originalItem = state.items.find(i => i.id === cartItem.id);
                if (!originalItem) return cartItem;

                let newSellPrice = originalItem.sellPrice;
                if (customer.priceTierId && originalItem.priceTiers && originalItem.priceTiers[customer.priceTierId]) {
                    newSellPrice = originalItem.priceTiers[customer.priceTierId];
                }
                return { ...cartItem, sellPrice: newSellPrice };
            });
        });
    }, [selectedCustomerId, state.customers, state.items]);

    const getDisplayPrice = (item: Item) => {
        if (selectedCustomer && selectedCustomer.priceTierId && item.priceTiers[selectedCustomer.priceTierId]) {
            return item.priceTiers[selectedCustomer.priceTierId];
        }
        return item.sellPrice;
    };

    const filteredItems = useMemo(() => {
        return state.items.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, state.items]);

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

    const addToCart = (item: Item) => {
        const sellPrice = getDisplayPrice(item);
        setCart(currentCart => {
            const existingItem = currentCart.find(cartItem => cartItem.id === item.id);
            if (item.stock <= (existingItem?.quantity || 0)) {
                alert('Stok tidak mencukupi!');
                return currentCart;
            }
            if (existingItem) {
                return currentCart.map(cartItem =>
                    cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
                );
            }
            return [...currentCart, { ...item, quantity: 1, sellPrice }];
        });
    };

    const updateQuantity = (itemId: string, newQuantity: number) => {
        setCart(currentCart => {
            const itemInCart = currentCart.find(ci => ci.id === itemId);
            const itemData = state.items.find(i => i.id === itemId);
            if (!itemInCart || !itemData) return currentCart;

            if (newQuantity > itemData.stock) {
                 alert('Stok tidak mencukupi!');
                 return currentCart;
            }

            if (newQuantity <= 0) {
                return currentCart.filter(cartItem => cartItem.id !== itemId);
            }
            return currentCart.map(cartItem =>
                cartItem.id === itemId ? { ...cartItem, quantity: newQuantity } : cartItem
            );
        });
    };
    
    const resetTransaction = () => {
        setCart([]);
        setSearchTerm('');
        setSelectedCustomerId('c1');
        setPaymentModalOpen(false);
        setCompletedSale(null);
        setDiscountValue(0);
        setTaxValue(0);
        setDiscountType('fixed');
        setTaxType('fixed');
    }
    
    const handlePaymentSuccess = (sale: Sale) => {
        setCompletedSale(sale);
        setPaymentModalOpen(false);
    }

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-104px)] bg-slate-50">
            {/* --- Cart Panel (Top on mobile) --- */}
            <div className="w-full lg:w-2/5 xl:w-1/3 bg-white p-4 flex flex-col shadow-lg lg:border-l border-b lg:border-b-0 flex-shrink-0">
                <h2 className="text-2xl font-bold mb-4 border-b pb-2">Keranjang</h2>
                <div className="mb-4">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-medium">Pelanggan</label>
                        {selectedCustomer && selectedCustomer.id !== 'c1' && (
                             <span className="text-sm font-semibold text-amber-600">Poin: {selectedCustomer.points}</span>
                        )}
                    </div>
                    <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className="w-full p-2 mt-1 border rounded-md bg-white">
                        {state.customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
                    </select>
                </div>
                <div className="overflow-y-auto max-h-40 sm:max-h-48 lg:max-h-none lg:flex-grow -mx-4 px-4">
                    {cart.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-500">Keranjang kosong</div>
                    ) : (
                        <div className="space-y-3">
                        {cart.map(item => (
                            <div key={item.id} className="flex items-center gap-3">
                                <div className="flex-grow">
                                    <p className="font-semibold truncate text-sm">{item.name}</p>
                                    <p className="text-xs text-slate-500">{formatCurrency(item.sellPrice)}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 rounded-full bg-slate-200 hover:bg-slate-300">{ICONS.minus}</button>
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                        className="w-10 text-center font-semibold border-b-2"
                                    />
                                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 rounded-full bg-slate-200 hover:bg-slate-300">{ICONS.plus}</button>
                                </div>
                                <p className="font-bold w-20 text-right">{formatCurrency(item.sellPrice * item.quantity)}</p>
                            </div>
                        ))}
                        </div>
                    )}
                </div>
                <div className="border-t pt-4 mt-4 space-y-2 text-sm">
                     {/* Discount */}
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600">Diskon</span>
                        <div className="flex items-center max-w-[60%]">
                            <input
                                type="number"
                                value={discountValue}
                                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                                className="w-full p-1 border-b text-right"
                                placeholder="0"
                            />
                            <div className="flex rounded-md shadow-sm ml-1" role="group">
                                <button type="button" onClick={() => setDiscountType('fixed')} className={`px-2 py-1 text-xs font-medium ${discountType === 'fixed' ? 'bg-sky-500 text-white' : 'bg-white text-gray-900'} border border-gray-200 rounded-l-lg hover:bg-gray-100`}>
                                    Rp
                                </button>
                                <button type="button" onClick={() => setDiscountType('percentage')} className={`px-2 py-1 text-xs font-medium ${discountType === 'percentage' ? 'bg-sky-500 text-white' : 'bg-white text-gray-900'} border border-gray-200 rounded-r-lg hover:bg-gray-100`}>
                                    %
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Tax */}
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600">Pajak</span>
                        <div className="flex items-center max-w-[60%]">
                            <input
                                type="number"
                                value={taxValue}
                                onChange={(e) => setTaxValue(parseFloat(e.target.value) || 0)}
                                className="w-full p-1 border-b text-right"
                                placeholder="0"
                            />
                            <div className="flex rounded-md shadow-sm ml-1" role="group">
                                <button type="button" onClick={() => setTaxType('fixed')} className={`px-2 py-1 text-xs font-medium ${taxType === 'fixed' ? 'bg-sky-500 text-white' : 'bg-white text-gray-900'} border border-gray-200 rounded-l-lg hover:bg-gray-100`}>
                                    Rp
                                </button>
                                <button type="button" onClick={() => setTaxType('percentage')} className={`px-2 py-1 text-xs font-medium ${taxType === 'percentage' ? 'bg-sky-500 text-white' : 'bg-white text-gray-900'} border border-gray-200 rounded-r-lg hover:bg-gray-100`}>
                                    %
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="border-t pt-4 mt-4">
                     <div className="space-y-1 text-sm">
                        <div className="flex justify-between text-slate-600">
                            <span>Subtotal</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                         <div className="flex justify-between text-slate-600">
                            <span>Diskon</span>
                            <span>- {formatCurrency(discountAmount)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>Pajak</span>
                            <span>+ {formatCurrency(taxAmount)}</span>
                        </div>
                    </div>
                    <div className="flex justify-between text-xl font-bold mt-2 pt-2 border-t">
                        <span>Total</span>
                        <span>{formatCurrency(grandTotal)}</span>
                    </div>
                    <button
                        onClick={() => setPaymentModalOpen(true)}
                        disabled={cart.length === 0}
                        className="w-full mt-4 p-4 bg-sky-500 text-white font-bold rounded-lg hover:bg-sky-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                    >
                        Bayar
                    </button>
                </div>
            </div>

            {/* --- Item Selection Panel (Bottom on mobile) --- */}
            <div className="w-full lg:w-3/5 xl:w-2/3 p-4 flex flex-col flex-grow">
                <div className="relative mb-4">
                    <input
                        type="text"
                        placeholder="Cari item berdasarkan nama atau SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-3 pl-10 border rounded-lg"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        {ICONS.search}
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => addToCart(item)}
                                className="bg-white p-2 rounded-lg shadow-sm text-left hover:shadow-md hover:-translate-y-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
                                disabled={item.stock <= (cart.find(ci => ci.id === item.id)?.quantity || 0)}
                            >
                                <div className="w-full h-24 bg-slate-200 rounded-md flex items-center justify-center mb-2">
                                    {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover rounded-md" /> : <span className="text-slate-400 text-xs">No Image</span>}
                                </div>
                                <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                                <p className="text-xs text-slate-500">Stok: {item.stock}</p>
                                <p className="text-sky-600 font-bold mt-1">{formatCurrency(getDisplayPrice(item))}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

             {isPaymentModalOpen && (
                <PaymentModal 
                    cart={cart}
                    total={grandTotal}
                    customerId={selectedCustomerId}
                    discountType={discountType}
                    discountValue={discountValue}
                    taxType={taxType}
                    taxValue={taxValue}
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

export default POS;