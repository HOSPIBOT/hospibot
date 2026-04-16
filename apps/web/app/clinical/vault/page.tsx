'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Shield, Search, Phone, AlertTriangle, CheckCircle2,
  Clock, X, Loader2, RefreshCw, Plus, Lock, Unlock,
  FileText, Pill, FlaskConical, Heart, Activity,
  Users, Eye, AlertCircle, ChevronRight, History,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

const RECORD_ICONS: Record<string, any> = {
  VISIT:        Activity,
  LAB:          FlaskConical,
  PRESCRIPTION: Pill,
  IMAGING:      FileText,
  VITALS:       Heart,
  VACCINATION:  Shield,
  DISCHARGE:    FileText,
};

const RECORD_COLORS: Record<string, string> = {
  VISIT:        '#0D7C66',
  LAB:          '#F59E0B',
  PRESCRIPTION: '#3B82F6',
  IMAGING:      '#8B5CF6',
  VITALS:       '#EF4444',
  VACCINATION:  '#10B981',
  DISCHARGE:    '#6B7280',
};

const SCOPE_LABELS: Record<string, string> = {
  full:      'Full History',
  last_year: 'Last 1 Year',
  lab_only:  'Lab Reports Only',
  denied:    'Access Denied',
  own_only:  'Own Records Only',
};

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] focus:ring-2 focus:ring-[#0D7C66]/10 outline-none transition-all placeholder:text-slate-400';

// ─── Emergency Access Modal ───────────────────────────────────────────────────

function EmergencyModal({ phone, onClose }: { phone: string; onClose: () => void }) {
  const [reason, setReason]   = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<any>(null);

  const access = async () => {
    if (!reason.trim()) { toast.error('Please state the reason for emergency access'); return; }
    setLoading(true);
    try {
      const res = await api.post('/vault/emergency-access', { mobileNumber: phone, reason });
      setResult(res.data.criticalData);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Emergency access failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-red-100 bg-red-50 rounded-t-2xl">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <h2 className="font-bold text-red-900">Emergency Access</h2>
            <p className="text-xs text-red-600">Critical data only — fully audited</p>
          </div>
          <button onClick={onClose} className="ml-auto text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
        </div>

        {!result ? (
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-slate-600">This will log an emergency access event in the immutable audit trail.</p>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Patient Phone</label>
              <div className="bg-slate-50 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-700">{phone}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Reason for Emergency Access <span className="text-red-500">*</span></label>
              <textarea className={`${inputCls} resize-none`} rows={3}
                placeholder="e.g. Patient brought to emergency unconscious, allergies unknown, requires immediate treatment"
                value={reason} onChange={e => setReason(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 text-sm text-slate-500 border border-slate-200 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={access} disabled={loading || !reason.trim()}
                className="flex-1 bg-red-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                Access Critical Data
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-800">Emergency access granted — access logged</p>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Patient Name',    value: result.name },
                { label: 'Blood Group',     value: result.bloodGroup, highlight: true },
                { label: 'Health ID',       value: result.healthId },
              ].map((item: any) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-sm text-slate-500">{item.label}</span>
                  <span className={`text-sm font-bold ${item.highlight ? 'text-red-700 bg-red-50 px-3 py-1 rounded-full' : 'text-slate-900'}`}>{item.value || '—'}</span>
                </div>
              ))}

              {result.allergies?.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-xs font-bold text-red-800 mb-1.5">⚠️ KNOWN ALLERGIES</p>
                  <p className="text-sm font-semibold text-red-800">{result.allergies.join(', ')}</p>
                </div>
              )}

              {result.chronicConditions?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <p className="text-xs font-bold text-amber-800 mb-1.5">CHRONIC CONDITIONS</p>
                  <p className="text-sm text-amber-800">{result.chronicConditions.join(', ')}</p>
                </div>
              )}

              {result.currentMedications?.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                  <p className="text-xs font-bold text-blue-800 mb-1.5">CURRENT MEDICATIONS</p>
                  <p className="text-sm text-blue-800">{result.currentMedications.join(', ')}</p>
                </div>
              )}

              {result.emergencyContact?.name && (
                <div className="bg-slate-50 rounded-xl px-4 py-3">
                  <p className="text-xs font-bold text-slate-600 mb-1">EMERGENCY CONTACT</p>
                  <p className="text-sm text-slate-700">{result.emergencyContact.name} — {result.emergencyContact.phone}</p>
                </div>
              )}
            </div>

            <button onClick={onClose}
              className="w-full bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-800 transition-colors">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Patient Vault Card ───────────────────────────────────────────────────────

function VaultCard({ uhr, records, consentScope, onRequestAccess }: {
  uhr: any; records: any[]; consentScope: string; onRequestAccess: () => void;
}) {
  const hasFullAccess = ['full', 'last_year', 'lab_only'].includes(consentScope);
  const byType = records.reduce((acc: any, r) => {
    acc[r.recordType] = (acc[r.recordType] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0D7C66] to-[#0A5E4F] px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white text-xl font-bold">
              {uhr.firstName?.[0]}{uhr.lastName?.[0] || ''}
            </div>
            <div>
              <p className="font-bold text-white text-lg">{uhr.firstName} {uhr.lastName || ''}</p>
              <p className="text-emerald-200 text-xs font-mono mt-0.5">{uhr.hospibot_health_id}</p>
            </div>
          </div>
          {uhr.bloodGroup && (
            <div className="bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-xl">
              {uhr.bloodGroup}
            </div>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Consent status */}
        <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
          hasFullAccess
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-2">
            {hasFullAccess ? <Unlock className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-amber-600" />}
            <div>
              <p className={`text-sm font-semibold ${hasFullAccess ? 'text-emerald-800' : 'text-amber-800'}`}>
                {hasFullAccess ? 'Access Granted' : 'Consent Pending'}
              </p>
              <p className={`text-xs ${hasFullAccess ? 'text-emerald-600' : 'text-amber-600'}`}>
                Scope: {SCOPE_LABELS[consentScope] || consentScope}
              </p>
            </div>
          </div>
          {!hasFullAccess && (
            <button onClick={onRequestAccess}
              className="text-xs font-semibold text-amber-700 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-200 transition-colors">
              Request Access
            </button>
          )}
        </div>

        {/* Critical alerts */}
        {uhr.allergies?.length > 0 && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-red-800">ALLERGIES: </span>
              <span className="text-xs text-red-700">{uhr.allergies.join(', ')}</span>
            </div>
          </div>
        )}

        {uhr.chronicConditions?.length > 0 && (
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
            <Activity className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-amber-800">CONDITIONS: </span>
              <span className="text-xs text-amber-700">{uhr.chronicConditions.join(', ')}</span>
            </div>
          </div>
        )}

        {/* Record type breakdown */}
        {records.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Health Records ({records.length} total)</p>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(byType).map(([type, count]) => {
                const Icon = RECORD_ICONS[type] || FileText;
                const color = RECORD_COLORS[type] || '#6B7280';
                return (
                  <div key={type} className="text-center bg-slate-50 rounded-xl py-2.5">
                    <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
                    <p className="text-sm font-bold text-slate-900">{count as number}</p>
                    <p className="text-[9px] text-slate-400 leading-tight">{type}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent records */}
        {hasFullAccess && records.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Recent Records</p>
            <div className="space-y-2">
              {records.slice(0, 5).map((record: any) => {
                const Icon = RECORD_ICONS[record.recordType] || FileText;
                const color = RECORD_COLORS[record.recordType] || '#6B7280';
                return (
                  <div key={record.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{record.title}</p>
                      <p className="text-xs text-slate-400">{record.tenantName} · {formatDate(record.recordDate)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!hasFullAccess && (
          <div className="text-center py-4 bg-slate-50 rounded-xl">
            <Lock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Request patient consent to view their records from other providers</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function VaultPage() {
  const [phone, setPhone]             = useState('');
  const [searching, setSearching]     = useState(false);
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [vaultData, setVaultData]     = useState<any>(null);
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [stats, setStats]             = useState<any>(null);
  const [tenantName, setTenantName]   = useState('');

  useEffect(() => {
    api.get('/vault/stats').then(r => setStats(r.data)).catch(() => {});
    api.get('/tenants/current').then(r => setTenantName(r.data.name || '')).catch(() => {});
  }, []);

  const lookup = async () => {
    if (!phone.trim()) { toast.error('Enter a phone number'); return; }
    setSearching(true);
    setLookupResult(null);
    setVaultData(null);
    try {
      const res = await api.get(`/vault/lookup?phone=${encodeURIComponent(phone.trim())}`);
      setLookupResult(res.data);

      if (res.data.found && (res.data.consentStatus === 'GRANTED')) {
        const records = await api.get(`/vault/records/${res.data.uhr.id}`);
        setVaultData(records.data);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lookup failed');
    } finally { setSearching(false); }
  };

  const requestAccess = async () => {
    if (!lookupResult?.uhr || !tenantName) { toast.error('Could not request access'); return; }
    setRequestingAccess(true);
    try {
      await api.post('/vault/request-access', {
        mobileNumber: phone,
        tenantName,
      });
      toast.success('Consent request sent to patient via WhatsApp! Waiting for approval.');
      setLookupResult((prev: any) => ({ ...prev, consentStatus: 'PENDING' }));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to request access');
    } finally { setRequestingAccess(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#0D7C66]" />
            Universal Health Vault
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Cross-provider patient records with consent-based access</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Records Created', value: stats.recordsCreated, icon: FileText,    color: '#0D7C66', desc: 'by this facility' },
            { label: 'Active Consents', value: stats.activeConsents, icon: Unlock,       color: '#3B82F6', desc: 'from other providers' },
            { label: 'Emergency Accesses', value: stats.emergencyAccesses, icon: AlertCircle, color: '#EF4444', desc: 'all fully audited' },
          ].map((s: any) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
                <span className="text-xs text-slate-500">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* How it works banner */}
      <div className="bg-[#E8F5F0] border border-[#0D7C66]/20 rounded-2xl p-5">
        <p className="text-sm font-bold text-[#0D7C66] mb-3">How the Universal Health Vault Works</p>
        <div className="grid grid-cols-4 gap-4">
          {[
            { step: '1', title: 'Enter Phone Number', desc: 'Type the patient\'s mobile number below to look up their vault' },
            { step: '2', title: 'System Checks Records', desc: 'HospiBot finds their Health ID and records from all connected facilities' },
            { step: '3', title: 'Patient Gets WhatsApp', desc: 'Patient receives consent request with scope options on their WhatsApp' },
            { step: '4', title: 'Access Granted', desc: 'Once approved, doctor sees complete cross-provider history' },
          ].map((s: any) => (
            <div key={s.step} className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-[#0D7C66] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{s.step}</div>
              <div>
                <p className="text-xs font-semibold text-[#0D7C66]">{s.title}</p>
                <p className="text-xs text-[#0A5E4F] mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lookup */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <p className="text-sm font-semibold text-slate-900 mb-3">Patient Lookup</p>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex-1">
            <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
              placeholder="Enter patient's mobile number (e.g. +91 98765 43210)"
              value={phone} onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && lookup()} />
          </div>
          <button onClick={lookup} disabled={searching}
            className="px-5 py-2.5 bg-[#0D7C66] text-white text-sm font-semibold rounded-xl hover:bg-[#0A5E4F] disabled:opacity-60 transition-colors flex items-center gap-2">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {searching ? 'Looking up…' : 'Look Up'}
          </button>
          <button onClick={() => setShowEmergency(true)}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Emergency
          </button>
        </div>

        {/* Lookup result */}
        {lookupResult && !lookupResult.found && (
          <div className="mt-4 bg-slate-50 rounded-xl px-4 py-4 text-center">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">No Universal Health Record found</p>
            <p className="text-xs text-slate-400 mt-1">This patient will be registered as new. A Health Vault will be created automatically when you add them as a patient.</p>
          </div>
        )}

        {lookupResult?.found && (
          <div className="mt-4 flex items-center gap-3 bg-[#E8F5F0] border border-[#0D7C66]/30 rounded-xl px-4 py-3">
            <CheckCircle2 className="w-5 h-5 text-[#0D7C66]" />
            <div className="flex-1">
              <p className="text-sm font-bold text-[#0D7C66]">
                {lookupResult.uhr.firstName} {lookupResult.uhr.lastName || ''} found
              </p>
              <p className="text-xs text-[#0A5E4F]">
                Health ID: <strong>{lookupResult.uhr.hospibot_health_id}</strong> ·
                Consent: <strong>{lookupResult.consentStatus}</strong>
              </p>
            </div>
            {lookupResult.consentStatus !== 'GRANTED' && (
              <button onClick={requestAccess} disabled={requestingAccess}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#0D7C66] px-3 py-2 rounded-lg hover:bg-[#0A5E4F] disabled:opacity-60 transition-colors">
                {requestingAccess ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                {requestingAccess ? 'Sending…' : 'Request Consent'}
              </button>
            )}
            {lookupResult.consentStatus === 'PENDING' && (
              <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Waiting for patient
              </span>
            )}
          </div>
        )}
      </div>

      {/* Vault data */}
      {vaultData && (
        <VaultCard
          uhr={vaultData.uhr}
          records={vaultData.records}
          consentScope={vaultData.consentScope}
          onRequestAccess={requestAccess}
        />
      )}

      {lookupResult?.found && !vaultData && lookupResult.consentStatus === 'GRANTED' && (
        <button onClick={async () => {
          const r = await api.get(`/vault/records/${lookupResult.uhr.id}`);
          setVaultData(r.data);
        }} className="w-full bg-[#0D7C66] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[#0A5E4F] transition-colors flex items-center justify-center gap-2">
          <Eye className="w-4 h-4" /> Load Health Records
        </button>
      )}

      {showEmergency && (
        <EmergencyModal phone={phone} onClose={() => setShowEmergency(false)} />
      )}
    </div>
  );
}

// Fix missing import
function MessageSquare({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
