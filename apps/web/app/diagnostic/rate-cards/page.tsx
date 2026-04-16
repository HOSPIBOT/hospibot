'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  IndianRupee, Plus, X, Loader2, CheckCircle2, Edit3,
  Users, Stethoscope, Building2, Shield, ChevronRight, Search,
} from 'lucide-react';

const NAVY = '#1E3A5F';
const TEAL = '#0D7C66';
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none transition-all placeholder:text-slate-400';
const labelCls = 'block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide';

const RATE_CARD_TYPES = [
  { value: 'WALKIN',     label: 'Walk-in',           icon: Users,      color: '#1E3A5F', desc: 'Standard MRP for direct patients' },
  { value: 'DOCTOR',     label: 'Doctor Referred',   icon: Stethoscope,color: '#0D7C66', desc: 'Discounted rates for referring doctors' },
  { value: 'CORPORATE',  label: 'Corporate',         icon: Building2,  color: '#8B5CF6', desc: 'Negotiated rates for corporate clients' },
  { value: 'TPA',        label: 'TPA / Insurance',   icon: Shield,     color: '#F59E0B', desc: 'Insurance panel rates' },
  { value: 'GOVT',       label: 'Government / CGHS', icon: Shield,     color: '#EF4444', desc: 'CGHS/ESI/PMJAY empanelled rates' },
];

interface RateCard {
  id: string;
  name: string;
  type: string;
  discountPct: number;
  isDefault: boolean;
  testOverrides: { testCode: string; customPrice: number }[];
  createdAt: string;
}

function RateCardModal({ card, onClose, onSaved }: { card?: RateCard; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: card?.name ?? '',
    type: card?.type ?? 'DOCTOR',
    discountPct: card?.discountPct?.toString() ?? '15',
    isDefault: card?.isDefault ?? false,
  });
  const [saving, setSaving] = useState(false);
  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.name) { toast.error('Rate card name required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, discountPct: +form.discountPct };
      if (card?.id) {
        await api.put(`/diagnostic/rate-cards/${card.id}`, payload);
      } else {
        await api.post('/diagnostic/rate-cards', payload);
      }
      toast.success(card?.id ? 'Rate card updated' : 'Rate card created');
      onSaved(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const selectedType = RATE_CARD_TYPES.find(t => t.value === form.type);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            {card?.id ? 'Edit Rate Card' : 'Create Rate Card'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className={labelCls}>Card Name *</label>
            <input className={inputCls} placeholder="e.g. Apollo Hospitals Rate" value={form.name}
              onChange={setF('name')} />
          </div>

          <div>
            <label className={labelCls}>Card Type</label>
            <div className="grid grid-cols-1 gap-2">
              {RATE_CARD_TYPES.map(t => (
                <button key={t.value} onClick={() => setForm(f => ({ ...f, type: t.value }))}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    form.type === t.value ? 'border-[#1E3A5F] bg-[#1E3A5F]/5' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                  <t.icon className={`w-4 h-4 flex-shrink-0 ${form.type === t.value ? 'text-[#1E3A5F]' : 'text-slate-400'}`} />
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${form.type === t.value ? 'text-[#1E3A5F]' : 'text-slate-700'}`}>
                      {t.label}
                    </p>
                    <p className="text-xs text-slate-400">{t.desc}</p>
                  </div>
                  {form.type === t.value && (
                    <CheckCircle2 className="w-4 h-4 text-[#1E3A5F] flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Base Discount off MRP (%)</label>
            <div className="flex items-center gap-3">
              <input className={inputCls} type="number" min="0" max="90" placeholder="15"
                value={form.discountPct} onChange={setF('discountPct')} />
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 whitespace-nowrap">
                {form.discountPct}% off
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              A test priced at ₹1,000 will be charged at ₹{(1000 * (1 - +form.discountPct / 100)).toFixed(0)} under this rate card
            </p>
          </div>

          <div className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-bold text-blue-900">Set as Default</p>
              <p className="text-xs text-blue-600">Auto-apply this rate card for {selectedType?.label} patients</p>
            </div>
            <button onClick={() => setForm(f => ({ ...f, isDefault: !f.isDefault }))}
              className={`w-11 h-6 rounded-full transition-all flex-shrink-0 ${form.isDefault ? 'bg-blue-500' : 'bg-slate-300'}`}>
              <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${form.isDefault ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="flex-[2] flex items-center justify-center gap-2 py-3 text-white font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-50"
            style={{ background: NAVY }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {card?.id ? 'Save Changes' : 'Create Rate Card'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RateCardCard({ card, onEdit }: { card: RateCard; onEdit: () => void }) {
  const type = RATE_CARD_TYPES.find(t => t.value === card.type);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${type?.color ?? NAVY}14` }}>
            {type && <type.icon className="w-5 h-5" style={{ color: type.color }} />}
          </div>
          <div>
            <p className="font-bold text-slate-900">{card.name}</p>
            <p className="text-xs text-slate-400">{type?.label ?? card.type}</p>
          </div>
        </div>
        {card.isDefault && (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700">DEFAULT</span>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-3xl font-black" style={{ color: type?.color ?? NAVY }}>
            {card.discountPct}%
          </p>
          <p className="text-xs text-slate-400">discount off MRP</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-900">
            ₹850 <span className="text-xs text-slate-400 line-through">₹1,000</span>
          </p>
          <p className="text-xs text-slate-400">sample test</p>
        </div>
      </div>

      {card.testOverrides?.length > 0 && (
        <p className="text-xs text-slate-400 mb-3">
          + {card.testOverrides.length} custom price overrides
        </p>
      )}

      <button onClick={onEdit}
        className="w-full flex items-center justify-center gap-2 text-sm font-bold text-slate-700 border border-slate-200 rounded-xl py-2 hover:bg-slate-50 transition-colors">
        <Edit3 className="w-3.5 h-3.5" /> Edit Rate Card
      </button>
    </div>
  );
}

export default function RateCardsPage() {
  const [cards, setCards] = useState<RateCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<RateCard | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/diagnostic/rate-cards').catch(() => ({ data: [] }));
      setCards(res.data ?? []);
    } finally { setLoading(false); }
  }, [refreshKey]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Rate Cards</h1>
          <p className="text-sm text-slate-500">
            Manage pricing for walk-in, referral, corporate and TPA patients
          </p>
        </div>
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
          style={{ background: NAVY }}>
          <Plus className="w-4 h-4" /> Create Rate Card
        </button>
      </div>

      {/* How it works info */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4">
        <p className="text-sm font-bold text-blue-900 mb-1">How Rate Cards Work</p>
        <p className="text-sm text-blue-700">
          Assign rate cards to referring doctors or corporate clients. When creating a lab order,
          the assigned rate card automatically applies the discount. Default rate cards are used
          when no specific assignment exists.
        </p>
      </div>

      {/* Type overview */}
      <div className="grid grid-cols-5 gap-3">
        {RATE_CARD_TYPES.map(t => {
          const count = cards.filter(c => c.type === t.value).length;
          return (
            <div key={t.value} className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                style={{ background: `${t.color}14` }}>
                <t.icon className="w-5 h-5" style={{ color: t.color }} />
              </div>
              <p className="text-xl font-black text-slate-900">{count}</p>
              <p className="text-xs text-slate-500">{t.label}</p>
            </div>
          );
        })}
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-44" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center text-slate-400">
          <IndianRupee className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="font-semibold text-slate-500 text-lg">No rate cards yet</p>
          <p className="text-sm mt-1">Create rate cards for doctors, corporates, and insurance panels</p>
          <button onClick={() => setAdding(true)}
            className="mt-4 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 mx-auto flex items-center gap-2"
            style={{ background: NAVY }}>
            <Plus className="w-4 h-4" /> Create First Rate Card
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {cards.map(card => (
            <RateCardCard
              key={card.id}
              card={card}
              onEdit={() => setEditing(card)}
            />
          ))}
        </div>
      )}

      {adding && (
        <RateCardModal
          onClose={() => setAdding(false)}
          onSaved={() => setRefreshKey(k => k + 1)}
        />
      )}
      {editing && (
        <RateCardModal
          card={editing}
          onClose={() => setEditing(null)}
          onSaved={() => setRefreshKey(k => k + 1)}
        />
      )}
    </div>
  );
}
