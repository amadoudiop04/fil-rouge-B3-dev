import React, { useState } from 'react';

interface CartItem {
    id: number;
    name: string;
    price: number;
    img: string;
    category: string;
    stock_quantity: number;
    quantity: number;
}

interface PanierPageProps {
    onNavigate?: (page: string) => void;
    cartItems?: CartItem[];
    onCartUpdate?: (items: CartItem[]) => void;
    onCheckout?: () => void;
}

const CartPage: React.FC<PanierPageProps> = ({ onNavigate, cartItems = [], onCartUpdate, onCheckout }) => {
    const updateQuantity = (id: number, delta: number) => {
        const updatedItems = cartItems.map(item =>
            item.id === id
                ? { ...item, quantity: Math.max(1, item.quantity + delta) }
                : item
        );
        onCartUpdate?.(updatedItems);
    };

    const removeItem = (id: number) => {
        const updatedItems = cartItems.filter(item => item.id !== id);
        onCartUpdate?.(updatedItems);
    };

    const clearCart = () => {
        onCartUpdate?.([]);
    };

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    const [promoCode, setPromoCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [promoMessage, setPromoMessage] = useState('');

    const applyPromo = () => {
        const code = promoCode.toUpperCase().trim();
        
        // Codes promo disponibles
        const promoCodes: { [key: string]: number } = {
            'ESPORT10': 10,
            'BIENVENUE': 15,
            'VIP20': 20,
            'PROMO5': 5
        };

        if (promoCodes[code]) {
            setDiscount(promoCodes[code]);
            setPromoMessage(`✓ Code appliqué : -${promoCodes[code]}%`);
        } else if (code === '') {
            setPromoMessage('Veuillez entrer un code promo');
            setDiscount(0);
        } else {
            setPromoMessage('✗ Code invalide');
            setDiscount(0);
        }
    };

    const discountAmount = (subtotal * discount) / 100;
    const total = subtotal - discountAmount;

    return (
        <div className="min-h-screen bg-[#0a1628] text-white flex flex-col font-sans">
            <header className="flex items-center justify-between px-4 py-6">
                <button className="w-10 h-10 flex items-center justify-center bg-[#1a2942] rounded-lg hover:bg-blue-500/20 transition-all border border-gray-800" onClick={() => onNavigate?.('shop')}>
                    <span className="text-2xl">←</span>
                </button>
                <h1 className="text-lg font-bold tracking-widest">MON PANIER</h1>
                <button className="w-10 h-10 flex items-center justify-center bg-[#1a2942] rounded-lg hover:bg-red-500/20 transition-all border border-gray-800" onClick={clearCart}>
                    <span className="text-2xl">🗑️</span>
                </button>
            </header>

            <main className="flex-1 px-4 pb-32 overflow-y-auto">
                <div className="space-y-4">
                    {cartItems.map((item) => (
                        <div 
                            key={item.id} 
                            className="bg-[#111e31] border border-gray-800 rounded-2xl p-4 flex items-center gap-4 group relative transition-all duration-300 hover:border-blue-500/30"
                            style={{
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                            }}
                        >
                            {/* Delete Button - Better Design */}
                            <button 
                                onClick={() => removeItem(item.id)}
                                className="absolute -top-3 -right-3 w-10 h-10 flex items-center justify-center bg-red-500 hover:bg-red-600 rounded-full transition-all duration-300 border-4 border-[#0a1628] shadow-lg hover:shadow-xl hover:scale-110 active:scale-95"
                                title="Supprimer cet article"
                            >
                                <span className="text-white text-lg font-bold">✕</span>
                            </button>
                            
                            <div className="w-20 h-20 bg-linear-to-br from-gray-900 to-black rounded-xl overflow-hidden flex items-center justify-center border border-gray-700 shrink-0">
                                <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-sm leading-tight text-white truncate">{item.name}</h3>
                                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{item.category}</p>
                                <p className="text-blue-400 font-bold mt-2 text-sm">{item.price.toFixed(2)} €</p>
                                <p className="text-[11px] text-gray-600 mt-1">Sous-total: <span className="text-blue-400 font-bold">{(item.price * item.quantity).toFixed(2)} €</span></p>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2 bg-linear-to-b from-[#1a2942] to-black rounded-full p-2 border border-gray-700 shrink-0">
                                <button 
                                    onClick={() => updateQuantity(item.id, -1)} 
                                    className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#0D7FF2]/20 rounded-full transition-all duration-200"
                                    title="Diminuer la quantité"
                                >
                                    −
                                </button>
                                <span className="text-xs font-bold w-4 text-center text-white min-w-fit">{item.quantity}</span>
                                <button 
                                    onClick={() => updateQuantity(item.id, 1)} 
                                    className="w-7 h-7 bg-linear-to-b from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white hover:from-blue-500 hover:to-blue-600 transition-all duration-200 hover:shadow-lg active:scale-90"
                                    title="Augmenter la quantité"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    ))}

                    {cartItems.length === 0 && (
                        <p className="text-center text-gray-500 mt-10">Votre panier est vide</p>
                    )}
                </div>

                <div className="mt-8 bg-[#111e31] border border-gray-800 rounded-3xl p-6 relative overflow-hidden">
                    <h2 className="text-xs font-bold text-gray-500 tracking-wider mb-6 uppercase">Résumé de la commande</h2>

                    <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Sous-total</span>
                            <span className="font-bold">{subtotal.toFixed(2)} €</span>
                        </div>
                        <div className="flex justify-between text-sm border-b border-gray-800 pb-4">
                            <span className="text-gray-400">Frais de port</span>
                            <span className="text-green-500 font-bold uppercase tracking-tighter">Gratuit</span>
                        </div>
                    </div>

                    {/* Code Promo */}
                    <div className="mt-4 space-y-2">
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="CODE PROMO" 
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && applyPromo()}
                                className="flex-1 bg-[#0a1628] border border-gray-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                            />
                            <button 
                                onClick={applyPromo}
                                className="bg-blue-600 hover:bg-blue-700 px-4 rounded-xl text-xs font-bold uppercase transition-colors"
                            >
                                Appliquer
                            </button>
                        </div>
                        {promoMessage && (
                            <p className={`text-xs ${
                                promoMessage.startsWith('✓') ? 'text-green-500' : 'text-red-500'
                            }`}>
                                {promoMessage}
                            </p>
                        )}
                    </div>

                    {/* Réduction */}
                    {discount > 0 && (
                        <div className="flex justify-between text-sm mt-4 text-green-500">
                            <span>Réduction ({discount}%)</span>
                            <span className="font-bold">-{discountAmount.toFixed(2)} €</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center mt-6">
                        <div>
                            <p className="text-xl font-black italic">TOTAL</p>
                            <p className="text-[10px] text-gray-500">TVA incluse</p>
                        </div>
                        <p className="text-3xl font-black text-blue-500">{total.toFixed(2)} €</p>
                    </div>

                    <button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl mt-8 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={onCheckout}
                        disabled={cartItems.length === 0}
                    >
                        PASSER AU PAIEMENT
                        <span className="text-xl">→</span>
                    </button>
                </div>
            </main>

            <nav className="fixed bottom-0 left-0 right-0 bg-[#0d1b2e] border-t border-gray-800 px-2 py-3">
                <div className="flex justify-around items-center max-w-md mx-auto">
                    <button type="button" onClick={() => onNavigate?.('home')} className="flex flex-col items-center gap-1 text-blue-500">
                        <span className="text-xl">🏠</span>
                        <span className="text-xs font-semibold">Accueil</span>
                    </button>
                    <button type="button" onClick={() => onNavigate?.('stats')} className="flex flex-col items-center gap-1 text-gray-400 hover:text-white">
                        <span className="text-xl">📊</span>
                        <span className="text-xs">Stats</span>
                    </button>
                    <button type="button" onClick={() => onNavigate?.('tournaments')} className="flex flex-col items-center gap-1 text-gray-400 hover:text-white">
                        <span className="text-xl">👥</span>
                        <span className="text-xs">Équipes</span>
                    </button>
                    <button type="button" onClick={() => onNavigate?.('shop')} className="flex flex-col items-center gap-1 text-gray-400 hover:text-white">
                        <span className="text-xl">🎲</span>
                        <span className="text-xs">Shop</span>
                    </button>
                    <button type="button" onClick={() => onNavigate?.('profile')} className="flex flex-col items-center gap-1 text-gray-400 hover:text-white">
                        <span className="text-xl">👤</span>
                        <span className="text-xs">Profil</span>
                    </button>
                </div>
            </nav>
        </div>
    );
};

export default CartPage;