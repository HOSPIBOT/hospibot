'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Zap, RefreshCw, Search, Save, ChevronDown, ChevronUp } from 'lucide-react';

const ALL_FLAGS = [
  { key: 'whatsapp',       label: 'WhatsApp Messaging',      desc: 'Send/receive WhatsApp messages, inbox, templates',         category: 'Communication' },
  { key: 'chatbot',        label: 'AI Chatbot',               desc: 'Automated patient conversation handling',                  category: 'Communication' },
  { key: 'automation',     label: 'Revenue Automation',       desc: 'Automated reminders, follow-ups, drip campaigns',          category: 'Automation'    },
  { key: 'crm',            label: 'CRM & Lead Management',    desc: 'Lead pipeline, campaigns, patient lifecycle',              category: 'CRM'           },
  { key: 'lab',            label: 'Lab Module',               desc: 'Test orders, sample tracking, report delivery',            category: 'Clinical'      },
  { key: 'pharmacy',       label: 'Pharmacy Module',          desc: 'Dispensing, inventory, purchase orders',                   category: 'Clinical'      },
  { key: 'patients',       label: 'Extended Patient Data',    desc: 'Visit history, detailed clinical notes',                   category: 'Clinical'      },
  { key: 'billing',        label: 'Advanced Billing',         desc: 'Insurance/TPA, Razorpay, Tally export',                   category: 'Billing'       },
  { key: 'analytics',      label: 'Advanced Analytics',       desc: 'Branch analytics, doctor performance, NPS',               category: 'Analytics'     },
  { key: 'bed_management', label: 'Bed Management',           desc: 'IPD, floor map, admission/discharge',                     category: 'Clinical'      },
  { key: 'telemedicine',   label: 'Telemedicine',             desc: 'Video consultations via Jitsi Meet',                      category: 'Clinical'      },
  { key: 'vaccination',    label: 'Vaccination Module',       desc: 'National immunization schedule tracking',                  category: 'Clinical'      },
  { key: 'ot',             label: 'Operation Theatre',        desc: 'Surgery scheduling, WHO checklist',                       category: 'Clinical'      },
  { key: 'hrms',           label: 'HRMS & Payroll',           desc: 'Staff attendance, payroll calculations',                   category: 'HR'            },
  { key: 'fhir',           label: 'FHIR R4 API',              desc: 'ABDM-compliant healthcare data exchange endpoints',        category: 'Integration'   },
  { key: 'vault',          label: 'Universal Health Vault',   desc: 'Cross-provider patient record sharing with consent',       category: 'Integration'   },
  { key: 'abha',           label: 'ABHA Integration',         desc: 'Ayushman Bharat Health Account linkage',                  category: 'Integration'   },
  { key: 'ab_testing',     label: 'A/B Message Testing',      desc: 'WhatsApp template variant testing',                       category: 'Marketing'     },
  { key: 'drip_campaigns', label: 'Drip Campaigns',           desc: 'Multi-step WhatsApp automation sequences',                category: 'Marketing'     },
  { key: 'nps',            label: 'Patient Feedback & NPS',   desc: 'Net Promoter Score and satisfaction analytics',           category: 'Analytics'     },
];

const CATEGORIES = [...new Set(ALL_FLAGS.map(f => f.category))];

export default function FeatureFlagsPage() {
  const [tenants,   setTenants]   = useState<any[]>([]);
  const [selected,  setSelected]  = useState<any>(null);
  const [flags,     setFlags]     = useState<Record<string,boolean>>({});
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [search,    setSearch]    = useState('');
  const [expanded,  setExpanded]  = useState<string[]>(CATEGORIES);

  const loadTenants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/tenants', { params: { limit: 100 } });
      setTenants(res.data.data ?? []);
    } catch { toast.error('Failed to load tenants'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadTenants(); }, [loadTenants]);

  const selectTenant = async (tenant: any) => {
    setSelected(tenant);
    // Load tenant's current feature flags
    try {
      const res = await api.get(`/super-admin/tenants/${tenant.id}`);
      const tenantData = res.data;
      const currentFlags: Record<string,boolean> = {};
      ALL_FLAGS.forEach(f => {
        currentFlags[f.key] = tenantData.featureFlags?.[f.key] ?? tenantData.settings?.[f.key] ?? true;
      });
      setFlags(currentFlags);
    } catch {
      // Default all flags to true
      const defaults: Record<string,boolean> = {};
      ALL_FLAGS.forEach(f => { defaults[f.key] = true; });
      setFlags(defaults);
    }
  };

  const saveFlags = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.patch(`/super-admin/tenants/${selected.id}/plan`, {
        featureFlags: flags,
      }).catch(() => api.patch(`/super-admin/tenants/${selected.id}/status`, { featureFlags: flags }));
      toast.success(`Feature flags saved for ${selected.name}`);
    } catch { toast.error('Failed to save — flags updated locally'); }
    finally { setSaving(false); }
  };

  const toggleAll = (category: string, value: boolean) => {
    const catFlags = ALL_FLAGS.filter(f => f.category === category);
    setFlags(prev => {
      const updated = { ...prev };
      catFlags.forEach(f => { updated[f.key] = value; });
      return updated;
    });
  };

  const filteredFlags = ALL_FLAGS.filter(f =>
    !search || f.label.toLowerCase().includes(search.toLowerCase()) || f.desc.toLowerCase().includes(search.toLowerCase())
  );

  const enabledCount = Object.values(flags).filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-[#0D7C66]" /> Feature Flags
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Control which features are enabled for each tenant</p>
        </div>
        <div className="flex items-center gap-2">
          {selected && (
            <button onClick={saveFlags} disabled={saving}
              className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-50">
              <Save className="w-4 h-4"/> {saving ? 'Saving…' : 'Save Flags'}
            </button>
          )}
          <button onClick={loadTenants} className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Tenant selector */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-3.5 bg-slate-50 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Select Tenant</p>
          </div>
          <div className="overflow-y-auto max-h-96">
            {loading ? (
              Array.from({length:5}).map((_,i)=><div key={i} className="m-3 animate-pulse bg-slate-200 rounded-xl h-12"/>)
            ) : tenants.map(t => (
              <button key={t.id} onClick={() => selectTenant(t)}
                className={`w-full text-left px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors ${selected?.id===t.id?'bg-[#E8F5F0] border-l-2 border-l-[#0D7C66]':''}`}>
                <p className={`text-sm font-semibold ${selected?.id===t.id?'text-[#0D7C66]':'text-slate-900'}`}>{t.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t.plan||'FREE'} · {t.status}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Flag toggles */}
        <div className="col-span-2 space-y-3">
          {!selected ? (
            <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
              <Zap className="w-12 h-12 text-slate-200 mx-auto mb-3"/>
              <p className="text-slate-400 text-sm">Select a tenant to manage their feature flags</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{selected.name}</p>
                  <p className="text-xs text-slate-400">{enabledCount} of {ALL_FLAGS.length} features enabled</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2">
                    <Search className="w-4 h-4 text-slate-400"/>
                    <input className="text-sm outline-none placeholder:text-slate-400 w-40" placeholder="Search flags…" value={search} onChange={e=>setSearch(e.target.value)} />
                  </div>
                </div>
              </div>

              {CATEGORIES.filter(cat => filteredFlags.some(f=>f.category===cat)).map(category => {
                const catFlags = filteredFlags.filter(f => f.category === category);
                const allOn  = catFlags.every(f => flags[f.key]);
                const allOff = catFlags.every(f => !flags[f.key]);
                const isOpen = expanded.includes(category);
                return (
                  <div key={category} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    <button onClick={() => setExpanded(e => e.includes(category) ? e.filter(c=>c!==category) : [...e, category])}
                      className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-slate-900 text-sm">{category}</p>
                        <span className="text-xs text-slate-400">{catFlags.filter(f=>flags[f.key]).length}/{catFlags.length} on</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={e=>{e.stopPropagation();toggleAll(category,true);}} className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg hover:bg-emerald-100">All On</button>
                        <button onClick={e=>{e.stopPropagation();toggleAll(category,false);}} className="text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg hover:bg-red-100">All Off</button>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="border-t border-slate-100 divide-y divide-slate-50">
                        {catFlags.map(flag => (
                          <div key={flag.key} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/40 transition-colors">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{flag.label}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{flag.desc}</p>
                            </div>
                            <button onClick={() => setFlags(f=>({...f,[flag.key]:!f[flag.key]}))}
                              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${flags[flag.key]?'bg-[#0D7C66]':'bg-slate-200'}`}>
                              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${flags[flag.key]?'translate-x-6':'translate-x-1'}`}/>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
