import React, { useRef, useState, useEffect } from 'react';
import { platformApi } from '../services/platformApi';

interface ShopProduct {
    id: number;
    img: string;
    name: string;
    price: number;
    category: string;
    stock_quantity: number;
}

interface CartItem extends ShopProduct {
    quantity: number;
}

interface ShopPageProps {
    onNavigate?: (page: string) => void;
    cartItems?: CartItem[];
    onCartUpdate?: (items: CartItem[]) => void;
}

const ShopPage: React.FC<ShopPageProps> = ({ onNavigate, cartItems = [], onCartUpdate }) => {
    const collection = 'https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=1200&q=80';
    // --- ÉTATS ---
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState('TOUS');
    const [searchQuery, setSearchQuery] = useState('');
    const productsSectionRef = useRef<HTMLDivElement>(null);

    // Charger les produits depuis la base de données
    useEffect(() => {
        const loadProducts = async () => {
            try {
                setLoading(true);
                const response = await platformApi.getProducts();
                
                // Vérifier si la réponse est un succès et contient des produits
                if (response.success && response.products) {
                    setProducts(response.products.map((p: any) => ({
                        id: p.id,
                        img: p.image_url || '',
                        name: p.name,
                        price: p.price,
                        category: p.category.toUpperCase(),
                        stock_quantity: p.stock_quantity
                    })));
                } else {
                    setError(response.error || 'Erreur lors du chargement des produits');
                }
                setError(null);
            } catch (err) {
                console.error('Erreur lors du chargement des produits:', err);
                setError('Impossible de charger les produits');
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, []);

    const handleNewCollectionClick = () => {
        setActiveCategory('MAILLOTS');
        setSearchQuery('');
        productsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const addToCart = (product: ShopProduct) => {
        const updatedCart = [...cartItems];
        const existingIndex = updatedCart.findIndex(item => item.id === product.id);
        
        if (existingIndex >= 0) {
            updatedCart[existingIndex].quantity += 1;
        } else {
            updatedCart.push({ ...product, quantity: 1 });
        }
        
        onCartUpdate?.(updatedCart);
        console.log(`${product.name} ajouté au panier !`);
    };

    const filteredProducts = products.filter(p => {
        const matchesCategory = activeCategory === 'TOUS' || p.category === activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    // Obtenir les catégories uniques dynamiquement
    const categories = ['TOUS', ...Array.from(new Set(products.map(p => p.category)))];

    if (loading) {
        return (
            <div style={{ backgroundColor: '#070d14', color: '#ffffff', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                    <p>Chargement des produits...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ backgroundColor: '#070d14', color: '#ffffff', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', color: '#ef4444' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#070d14', color: '#ffffff', minHeight: '100vh', paddingBottom: '80px', fontFamily: 'Segoe UI, sans-serif' }}>
            <style>{`
                .menu-icon div { width: 20px; height: 2px; margin: 4px 0; background: #0D7FF2; }
                .logo { font-weight: 900; font-size: 1.1rem; letter-spacing: -1px; }
                .logo span { color: #0D7FF2; }
                .header-icons { display: flex; gap: 15px; align-items: center; }
                .badge { position: absolute; top: -5px; right: -8px; background: #0D7FF2; font-size: 10px; width: 15px; height: 15px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: white; border: 2px solid #070d14; }
                .search-bar { width: 100%; background: #111d2b; border: none; border-radius: 10px; padding: 12px 15px 12px 40px; color: white; font-size: 0.9rem; }
                .categories { display: flex; gap: 10px; padding: 15px; overflow-x: auto; scrollbar-width: none; }
                .cat-btn { padding: 8px 20px; border-radius: 20px; border: none; font-size: 0.75rem; font-weight: bold; background: #1a2942; color: #8a99af; white-space: nowrap; cursor: pointer; transition: 0.3s; }
                .cat-btn.active { background: #0D7FF2; color: white; }
                .hero { margin: 0 15px; height: 180px; border-radius: 20px; padding: 25px; display: flex; flex-direction: column; justify-content: center; }
                .products-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 15px; }
                .product-card { background: #111d2b; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.03); transition: transform 0.2s; }
                .product-card:active { transform: scale(0.98); }
                .product-img { height: 140px; background: rgba(255,255,255,0.05); overflow: hidden; }
                .price { color: #0D7FF2; font-weight: 900; }
                .add-btn { background: #0D7FF2; border: none; width: 35px; height: 35px; border-radius: 10px; color: white; cursor: pointer; transition: 0.2s; }
                .add-btn:hover { background: #0a66c2; }
                .add-btn:active { transform: scale(0.9); }
                .newsletter { margin: 30px 15px; background: linear-gradient(to bottom, #111d2b, #070d14); padding: 30px 20px; border-radius: 25px; text-align: center; border: 1px solid rgba(13, 127, 242, 0.1); }
                .newsletter input { width: 100%; background: #070d14; border: 1px solid #1a2942; padding: 12px; border-radius: 12px; color: white; margin-bottom: 12px; outline: none; }
                .newsletter button { width: 100%; background: #0D7FF2; color: white; border: none; padding: 14px; border-radius: 12px; font-weight: 900; cursor: pointer; }

            `}</style>

            <header style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="menu-icon"><div></div><div></div><div></div></div>
                <div className="logo">EA SPORTS<span>.</span>SHOP</div>
                <div className="header-icons">
                    <button
                        type="button"
                        onClick={() => onNavigate?.('panier')}
                        style={{ position: 'relative', cursor: 'pointer', background: 'transparent', border: 'none', color: 'inherit' }}
                    >
                        🛒{totalItems > 0 && <span className="badge">{totalItems}</span>}
                    </button>
                </div>
            </header>

            <div style={{ padding: '15px' }}>
                <input
                    type="text"
                    className="search-bar"
                    placeholder="Rechercher des Maillots..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="categories">
                {categories.map((cat) => (
                    <button key={cat} className={`cat-btn ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
                        {cat}
                    </button>
                ))}
            </div>

            <div className="hero" style={{
                backgroundImage: `linear-gradient(to right, rgba(26, 41, 66, 0.9), rgba(10, 22, 40, 0.4)), url(${collection})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}>
                <span style={{ color: '#38bdf8', fontSize: '0.6rem', fontWeight: 'bold' }}>NOUVEAUTÉS</span>
                <h2 style={{ fontSize: '1.5rem', margin: '5px 0' }}>COLLECTION NOUVELLE SAISON</h2>
                <button
                    type="button"
                    onClick={handleNewCollectionClick}
                    style={{ background: '#0D7FF2', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', width: 'fit-content', cursor: 'pointer' }}
                >
                    ACHETER &rarr;
                </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', marginTop: '10px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: '900', margin: 0, letterSpacing: '0.5px' }}>
                    MEILLEURES VENTES
                </h2>
                <span style={{ color: '#0D7FF2', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>
                    Voir Tout
                </span>
            </div>

            <div ref={productsSectionRef} className="products-grid">
                {filteredProducts.map((p) => (
                    <div 
                        key={p.id} 
                        className="product-card group"
                        style={{
                            background: '#111d2b',
                            borderRadius: '20px',
                            overflow: 'hidden',
                            border: '1px solid rgba(13, 127, 242, 0.1)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            transform: 'translateZ(0)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(13, 127, 242, 0.05)',
                            cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-8px)';
                            e.currentTarget.style.boxShadow = '0 12px 24px rgba(13, 127, 242, 0.15), 0 0 0 1px rgba(13, 127, 242, 0.1)';
                            e.currentTarget.style.borderColor = 'rgba(13, 127, 242, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(13, 127, 242, 0.05)';
                            e.currentTarget.style.borderColor = 'rgba(13, 127, 242, 0.1)';
                        }}
                    >
                        <div 
                            className="product-img relative overflow-hidden"
                            style={{ height: '150px', background: 'linear-gradient(135deg, rgba(13, 127, 242, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)' }}
                        >
                            <img 
                                src={p.img} 
                                alt={p.name} 
                                style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    objectFit: 'cover',
                                    transition: 'transform 0.4s ease-out'
                                }}
                                onLoad={(e) => {
                                    const parent = e.currentTarget.parentElement?.parentElement;
                                    if (parent) {
                                        const imgElement = e.currentTarget;
                                        parent.addEventListener('mouseenter', () => {
                                            imgElement.style.transform = 'scale(1.08)';
                                        });
                                        parent.addEventListener('mouseleave', () => {
                                            imgElement.style.transform = 'scale(1)';
                                        });
                                    }
                                }}
                            />
                            {p.stock_quantity === 0 && (
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'rgba(0, 0, 0, 0.6)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#ef4444',
                                    fontWeight: 'bold',
                                    fontSize: '12px'
                                }}>
                                    RUPTURE DE STOCK
                                </div>
                            )}
                        </div>

                        <div style={{ padding: '14px 14px' }}>
                            <div style={{ color: '#0D7FF2', fontSize: '8px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                                {p.category}
                            </div>
                            <h3 style={{ fontSize: '12px', fontWeight: 'bold', minHeight: '36px', lineHeight: '1.4', marginBottom: '8px', color: '#e5e7eb' }}>
                                {p.name}
                            </h3>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                                <div>
                                    <span className="price" style={{ 
                                        fontSize: '18px', 
                                        fontWeight: '900',
                                        color: '#0D7FF2',
                                        display: 'block'
                                    }}>
                                        {p.price.toFixed(2)}€
                                    </span>
                                    {p.stock_quantity > 0 && p.stock_quantity <= 5 && (
                                        <span style={{ fontSize: '8px', color: '#f59e0b', fontWeight: 'bold', marginTop: '2px', display: 'block' }}>
                                            ⚠️ {p.stock_quantity} restant{p.stock_quantity > 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                                <button 
                                    className="add-btn" 
                                    onClick={() => addToCart(p)}
                                    disabled={p.stock_quantity === 0}
                                    style={{
                                        background: p.stock_quantity === 0 ? '#4b5563' : '#0D7FF2',
                                        color: 'white',
                                        border: 'none',
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '12px',
                                        cursor: p.stock_quantity === 0 ? 'not-allowed' : 'pointer',
                                        opacity: p.stock_quantity === 0 ? 0.5 : 1,
                                        fontSize: '18px',
                                        transition: 'all 0.3s ease',
                                        fontWeight: 'bold',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: p.stock_quantity === 0 ? 'none' : '0 4px 12px rgba(13, 127, 242, 0.3)',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (p.stock_quantity > 0) {
                                            e.currentTarget.style.background = '#0a66c2';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(13, 127, 242, 0.4)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (p.stock_quantity > 0) {
                                            e.currentTarget.style.background = '#0D7FF2';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(13, 127, 242, 0.3)';
                                        }
                                    }}
                                    onMouseDown={(e) => {
                                        if (p.stock_quantity > 0) {
                                            e.currentTarget.style.transform = 'translateY(0) scale(0.95)';
                                        }
                                    }}
                                    onMouseUp={(e) => {
                                        if (p.stock_quantity > 0) {
                                            e.currentTarget.style.transform = 'translateY(-2px) scale(1)';
                                        }
                                    }}
                                >
                                    🛒
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="newsletter">
                <h3>REJOIGNEZ LE CLUB PRIVÉ</h3>
                <p style={{ marginBottom: '20px', fontSize: '0.8rem', opacity: 0.8 }}>Accès prioritaire et -15% sur votre première commande.</p>
                <input type="email" placeholder="votre@email.com" />
                <button>S'INSCRIRE MAINTENANT</button>
            </div>

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

export default ShopPage;