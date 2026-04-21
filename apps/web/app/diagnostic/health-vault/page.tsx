'use client';
import { useState } from 'react';

export default function HealthVaultPage() {
  const [searchPhone, setSearchPhone] = useState('');
  const [patient, setPatient] = useState<any>(null);
  const [consented, setConsented] = useState(false);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-slate-800 mb-1">Patient Health Vault</h1>
      <p className="text-sm text-slate-500 mb-6">Universal Health Record — mobile number as portable health ID across providers</p>

      <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-xs text-teal-800 mb-6">
        <strong>Privacy First:</strong> Health Vault uses the patient&apos;s mobile number as a portable health ID. Records are only shared with explicit patient consent (OTP verification). Compliant with IT Act 2000 and upcoming DPDP Act 2023.
      </div>

      <div className="bg-white rounded-xl border p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Search patient by mobile number</h2>
        <div className="flex gap-3">
          <input type="tel" placeholder="+91 98765 43210" value={searchPhone}
            onChange={e => setSearchPhone(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-lg border text-sm" />
          <button className="px-6 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700">
            Search Vault
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: '🔒', title: 'Consent-based access', desc: 'Patient approves each access request via OTP' },
          { icon: '👨‍👩‍👧', title: 'Family health management', desc: 'Link family members under one account' },
          { icon: '🚨', title: 'Emergency access protocol', desc: 'Break-glass access with mandatory audit logging' },
        ].map((f, i) => (
          <div key={i} className="bg-white rounded-xl border p-4">
            <div className="text-lg mb-2">{f.icon}</div>
            <h3 className="text-sm font-semibold text-slate-800">{f.title}</h3>
            <p className="text-xs text-slate-500 mt-1">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Vault contents (when accessed with consent)</h2>
        <div className="space-y-2">
          {['Lab Reports (all providers)', 'Prescriptions', 'Radiology Images', 'Vaccination Records',
            'Allergy & Drug Interaction Alerts', 'Chronic Conditions & Medications', 'Insurance Claims History',
            'ABHA Health ID (if linked)'].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="7" fill="#E8F5F0" />
                <path d="M4 7l2 2 4-4" stroke="#0D7C66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
