'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Printer, QrCode, Copy, Check, ExternalLink, Download } from 'lucide-react';

export default function RegistrationQRPage() {
  const [tenant, setTenant]   = useState<any>(null);
  const [copied, setCopied]   = useState(false);
  const [qrSize, setQrSize]   = useState(256);

  useEffect(() => {
    api.get('/tenants/current').then(r => setTenant(r.data)).catch(() => {});
  }, []);

  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/register-patient`
    : 'https://hospibot-web.vercel.app/register-patient';

  const checkInUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/check-in`
    : 'https://hospibot-web.vercel.app/check-in';

  const registrationUrl = tenant?.slug
    ? `${baseUrl}?clinic=${tenant.slug}`
    : baseUrl;

  // Google Charts QR API (free, no key needed)
  const qrUrl = `https://chart.googleapis.com/chart?chs=${qrSize}x${qrSize}&cht=qr&chl=${encodeURIComponent(registrationUrl)}&choe=UTF-8&chld=H|2`;

  const copyLink = () => {
    navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3 print:hidden">
        <button onClick={() => window.history.back()} className="text-slate-600 text-sm hover:text-slate-900">← Back</button>
        <div className="flex-1" />
        <button onClick={() => window.print()}
          className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#0A5E4F] transition-colors">
          <Printer className="w-4 h-4" /> Print QR Poster
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* A4 printable poster */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden print:shadow-none print:rounded-none" id="qr-poster">

          {/* Gradient header */}
          <div className="bg-gradient-to-br from-[#0D7C66] to-[#0A5E4F] px-8 py-8 text-white text-center">
            {tenant?.logoUrl && (
              <img src={tenant.logoUrl} alt="" className="h-12 mx-auto mb-4 object-contain" />
            )}
            <h1 className="text-3xl font-black mb-1">{tenant?.name || 'HospiBot Clinic'}</h1>
            {tenant?.address && <p className="text-emerald-200 text-sm">{tenant.address}</p>}
            <div className="mt-4 inline-block bg-white/20 rounded-2xl px-5 py-2">
              <p className="text-emerald-100 text-sm font-semibold">Patient Self-Registration</p>
            </div>
          </div>

          {/* QR + instructions */}
          <div className="px-8 py-8 text-center">
            <p className="text-lg font-bold text-slate-700 mb-2">Scan to Register as a Patient</p>
            <p className="text-slate-400 text-sm mb-6">Complete your registration digitally before seeing the doctor</p>

            {/* QR code */}
            <div className="inline-block p-4 bg-white border-4 border-[#0D7C66] rounded-3xl shadow-lg mb-6">
              <img src={qrUrl} alt="Registration QR Code" width={qrSize} height={qrSize} className="block" />
            </div>

            {/* Steps */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { step: '1', label: 'Scan QR', desc: 'Use your phone camera' },
                { step: '2', label: 'Fill Details', desc: 'Name, phone, health info' },
                { step: '3', label: 'Get Health ID', desc: 'Show to reception' },
              ].map((s: any) => (
                <div key={s.step} className="text-center">
                  <div className="w-10 h-10 rounded-2xl bg-[#E8F5F0] text-[#0D7C66] font-black text-lg flex items-center justify-center mx-auto mb-2">
                    {s.step}
                  </div>
                  <p className="text-sm font-bold text-slate-800">{s.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.desc}</p>
                </div>
              ))}
            </div>

            {/* URL */}
            <div className="bg-slate-50 rounded-2xl px-4 py-3 border border-slate-200 mb-4">
              <p className="text-xs text-slate-400 mb-1">Or visit this link directly:</p>
              <p className="text-sm font-mono text-[#0D7C66] break-all">{registrationUrl}</p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <span>🔒 Secure · DPDPA Compliant · Powered by HospiBot</span>
            </div>
          </div>
        </div>

        {/* Controls (hidden on print) */}
        <div className="mt-6 space-y-4 print:hidden">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            <h3 className="font-semibold text-slate-900">QR Settings</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">QR Size: {qrSize}×{qrSize}px</label>
              <input type="range" min={128} max={512} step={64} value={qrSize}
                onChange={e => setQrSize(Number(e.target.value))}
                className="w-full accent-[#0D7C66]" />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Small (128)</span><span>Medium (256)</span><span>Large (512)</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            <h3 className="font-semibold text-slate-900">Share Registration Link</h3>
            <div className="flex gap-2">
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-600 truncate">
                {registrationUrl}
              </div>
              <button onClick={copyLink}
                className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border transition-all ${copied ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <a href={registrationUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                <ExternalLink className="w-4 h-4" /> Preview
              </a>
            </div>
            <p className="text-xs text-slate-400">
              Place this QR code at reception, on your website, or share via WhatsApp so patients can self-register before arriving.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          body { margin: 0; background: white; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
        }
      `}</style>
    </div>
  );
}
