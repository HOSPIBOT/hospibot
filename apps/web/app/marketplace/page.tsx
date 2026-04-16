'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Search, ShoppingCart, Filter, X, Star, Package, Home,
  Truck, Tag, ChevronLeft, ChevronRight, Loader2, Plus, Minus,
  Heart, Shield, Zap,
} from 'lucide-react';

const PORTAL_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pharmacy:   { label: 'Pharmacy',    color: '#166534', bg: '#F0FDF4' },
  equipment:  { label: 'Equipment',   color: '#1E40AF', bg: '#EFF6FF' },
  wellness:   { label: 'Wellness',    color: '#BE185D', bg: '#FDF2F8' },
  diagnostic: { label: 'Diagnostic',  color: '#1E3A5F', bg: '#EFF6FF' },
  homecare:   { label: 'Home Care',   color: '#6B21A8', bg: '#FAF5FF' },
  services:   { label: 'Services',    color: '#334155', bg: '#F8FAFC' },
};

interface CartItem { id: string; name: string; price: number; quantity: number; tenantName: string; }

function ProductCard({ product, onAddToCart }: { product: any; onAddToCart: (p: any) => void }) {
  const portal = PORTAL_LABELS[product.portalFamily] || { label: product.portalFamily, color: '#0D7C66', bg: '#E8F5F0' };
  const discount = product.mrp ? Math.round((1 - product.price / product.mrp) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all group">
      {/* Product image placeholder */}
      <div className="h-44 flex items-center justify-center text-5xl" style={{ background: portal.bg }}>
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <Package className="w-16 h-16 opacity-30" style={{ color: portal.color }} />
        )}
      </div>

      <div className="p-4">
        {/* Portal badge */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: portal.color, background: portal.bg }}>
            {portal.label}
          </span>
          {product.featured && (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Star className="w-2.5 h-2.5" /> Featured
            </span>
          )}
        </div>

        <h3 className="font-bold text-slate-900 text-sm leading-tight mb-0.5 group-hover:text-[#0D7C66] transition-colors">{product.name}</h3>
        <p className="text-xs text-slate-400 mb-2">{product.tenantName}</p>

        {product.description && (
          <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">{product.description}</p>
        )}

        {/* Tags */}
        {product.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.tags.slice(0, 3).map((tag: string) => (
              <span key={tag} className="text-[9px] font-medium bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <p className="text-lg font-bold text-slate-900">{formatINR(product.price)}</p>
          {product.mrp && product.mrp > product.price && (
            <>
              <p className="text-xs text-slate-400 line-through">{formatINR(product.mrp)}</p>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">{discount}% off</span>
            </>
          )}
          <span className="text-xs text-slate-400 ml-auto">{product.priceUnit}</span>
        </div>

        {/* Delivery info */}
        {product.isHomeDelivery && (
          <div className="flex items-center gap-1 text-xs text-emerald-600 mb-3">
            <Truck className="w-3 h-3" /> Home delivery {product.deliveryDays ? `in ${product.deliveryDays} days` : 'available'}
          </div>
        )}

        {/* Stock */}
        {!product.inStock && (
          <p className="text-xs text-red-500 font-semibold mb-2">Out of Stock</p>
        )}

        <button
          onClick={() => onAddToCart(product)}
          disabled={!product.inStock}
          className="w-full text-sm font-bold py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white hover:opacity-90"
          style={{ background: portal.color }}>
          {product.inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}

function CartDrawer({ items, onClose, onRemove, onUpdateQty }: {
  items: CartItem[]; onClose: () => void;
  onRemove: (id: string) => void; onUpdateQty: (id: string, qty: number) => void;
}) {
  const [step, setStep]         = useState<'cart' | 'checkout'>('cart');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', city: '', pincode: '' });
  const total = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);

  const placeOrder = async () => {
    if (!form.name || !form.phone || !form.address) { toast.error('Name, phone and address required'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/marketplace/orders', {
        buyerName: form.name, buyerPhone: form.phone, buyerEmail: form.email,
        buyerAddress: form.address, buyerCity: form.city, buyerPincode: form.pincode,
        items: items.map((i: any) => ({ productId: i.id, productName: i.name, quantity: i.quantity, price: i.price })),
      });
      toast.success(`Order placed! Order #${res.data.orderNumber}. The seller will contact you shortly.`);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Order failed');
    } finally { setSubmitting(false); }
  };

  const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none transition-all placeholder:text-slate-400';

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="w-96 bg-white flex flex-col h-full shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">{step === 'cart' ? `Cart (${items.length})` : 'Checkout'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === 'cart' ? (
            items.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingCart className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.tenantName}</p>
                      <p className="text-sm font-bold text-slate-900">{formatINR(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-colors">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                      <button onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                      <button onClick={() => onRemove(item.id)} className="text-slate-300 hover:text-red-500 transition-colors ml-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Delivery Details</p>
              {[
                { key: 'name',    label: 'Full Name *',       placeholder: 'Your name' },
                { key: 'phone',   label: 'Phone *',           placeholder: '+91 98765 43210' },
                { key: 'email',   label: 'Email',             placeholder: 'you@email.com' },
                { key: 'address', label: 'Delivery Address *', placeholder: 'Street, Area' },
                { key: 'city',    label: 'City',              placeholder: 'Hyderabad' },
                { key: 'pincode', label: 'Pincode',           placeholder: '500001' },
              ].map((f: any) => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{f.label}</label>
                  <input className={inputCls} placeholder={f.placeholder}
                    value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-600">Total ({items.reduce((s: number, i: any) => s + i.quantity, 0)} items)</span>
              <span className="text-lg font-bold text-slate-900">{formatINR(total)}</span>
            </div>
            {step === 'cart' ? (
              <button onClick={() => setStep('checkout')}
                className="w-full bg-[#0D7C66] text-white font-bold py-3 rounded-xl hover:bg-[#0A5E4F] transition-colors">
                Proceed to Checkout
              </button>
            ) : (
              <div className="space-y-2">
                <button onClick={() => setStep('cart')} className="w-full text-sm text-slate-500 py-2 hover:text-slate-700 transition-colors">← Back to Cart</button>
                <button onClick={placeOrder} disabled={submitting}
                  className="w-full bg-[#0D7C66] text-white font-bold py-3 rounded-xl hover:bg-[#0A5E4F] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Placing Order…' : 'Place Order'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const [products, setProducts]   = useState<any[]>([]);
  const [meta, setMeta]           = useState({ page: 1, limit: 24, total: 0, totalPages: 1 });
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [debSearch, setDebSearch] = useState('');
  const [portalFilter, setPortal] = useState('');
  const [homeDelivery, setHomeDelivery] = useState(false);
  const [cart, setCart]           = useState<CartItem[]>([]);
  const [showCart, setShowCart]   = useState(false);
  const [stats, setStats]         = useState<any>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 24 };
      if (debSearch)   params.search = debSearch;
      if (portalFilter) params.portalFamily = portalFilter;
      if (homeDelivery) params.homeDelivery = 'true';
      const [productsRes, statsRes] = await Promise.all([
        api.get('/marketplace/products', { params }),
        api.get('/marketplace/stats').catch(() => ({ data: null })),
      ]);
      setProducts(productsRes.data.data ?? []);
      setMeta(productsRes.data.meta ?? { page: 1, limit: 24, total: 0, totalPages: 1 });
      if (statsRes.data) setStats(statsRes.data);
    } catch { toast.error('Failed to load marketplace'); }
    finally { setLoading(false); }
  }, [debSearch, portalFilter, homeDelivery]);

  useEffect(() => { load(1); }, [load]);

  const addToCart = (product: any) => {
    setCart(c => {
      const existing = c.find((i: any) => i.id === product.id);
      if (existing) return c.map((i: any) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...c, { id: product.id, name: product.name, price: product.price, quantity: 1, tenantName: product.tenantName }];
    });
    toast.success(`${product.name} added to cart`, { duration: 2000 });
  };

  const removeFromCart = (id: string) => setCart(c => c.filter((i: any) => i.id !== id));
  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) removeFromCart(id);
    else setCart(c => c.map((i: any) => i.id === id ? { ...i, quantity: qty } : i));
  };

  const cartCount = cart.reduce((s: number, i: any) => s + i.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0D7C66] to-[#0A5E4F] text-white py-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="w-6 h-6 text-emerald-300" />
            <span className="text-emerald-300 text-sm font-medium">HospiBot Marketplace</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Healthcare Products & Services</h1>
          <p className="text-emerald-200 mb-6">From verified hospitals, pharmacies, labs, and wellness centres</p>

          {/* Search */}
          <div className="max-w-lg mx-auto flex items-center bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 flex-1">
              <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <input className="text-slate-800 text-sm outline-none flex-1 placeholder:text-slate-400 bg-transparent"
                placeholder="Search medicines, equipment, wellness services…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="bg-[#0D7C66] text-white px-5 py-3 text-sm font-bold hover:bg-[#0A5E4F] transition-colors">
              Search
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="flex items-center justify-center gap-8 mt-6 text-center">
              {[
                { label: 'Products',  value: stats.totalProducts },
                { label: 'Orders',    value: stats.totalOrders },
                { label: 'Providers', value: stats.portalBreakdown?.length || 0 },
              ].map((s: any) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold">{s.value.toLocaleString('en-IN')}</p>
                  <p className="text-emerald-300 text-xs">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filters + Cart */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            {[{ key: '', label: 'All' }, ...Object.entries(PORTAL_LABELS).map(([k, v]) => ({ key: k, label: v.label }))].map((p: any) => (
              <button key={p.key} onClick={() => setPortal(p.key)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                  portalFilter === p.key ? 'bg-[#0D7C66] text-white border-[#0D7C66]' : 'bg-white border-slate-200 text-slate-600 hover:border-[#0D7C66] hover:text-[#0D7C66]'
                }`}>
                {p.label}
              </button>
            ))}
          </div>

          <button onClick={() => setHomeDelivery(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ml-auto ${
              homeDelivery ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
            <Truck className="w-3.5 h-3.5" /> Home Delivery
          </button>

          <button onClick={() => setShowCart(true)}
            className="relative flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-[#0A5E4F] transition-colors">
            <ShoppingCart className="w-4 h-4" />
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-4">{meta.total.toLocaleString('en-IN')} products</p>

        {/* Products grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-64" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">No products found</p>
            <p className="text-slate-300 text-sm mt-1">Try different filters or search terms</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p: any) => (
                <ProductCard key={p.id} product={p} onAddToCart={addToCart} />
              ))}
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button onClick={() => load(meta.page - 1)} disabled={meta.page === 1}
                  className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-slate-600 px-4">{meta.page} of {meta.totalPages}</span>
                <button onClick={() => load(meta.page + 1)} disabled={meta.page >= meta.totalPages}
                  className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showCart && (
        <CartDrawer items={cart} onClose={() => setShowCart(false)} onRemove={removeFromCart} onUpdateQty={updateQty} />
      )}
    </div>
  );
}
