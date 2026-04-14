'use client';
import { useState } from 'react';

export const dynamic = 'force-dynamic';

export default function SetupPage() {
  const [secret, setSecret]   = useState('hospibot-init-2026');
  const [email, setEmail]     = useState('admin@hospibot.ai');
  const [password, setPass]   = useState('Admin@1234');
  const [name, setName]       = useState('Super Admin');
  const [result, setResult]   = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const API = (process.env.NEXT_PUBLIC_API_URL || 'https://hospotserver-production.up.railway.app/api/v1').replace('/api/v1','');

  const run = async () => {
    setLoading(true); setResult(null);
    try {
      const r = await fetch(`${API}/api/v1/bootstrap/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, email, password, name }),
      });
      setResult(await r.json());
    } catch (e: any) { setResult({ error: e.message }); }
    finally { setLoading(false); }
  };

  const health = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/v1/health`);
      setResult(await r.json());
    } catch(e: any) { setResult({ error: e.message }); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h1 className="text-2xl font-bold mb-1">🏥 HospiBot Setup</h1>
        <p className="text-sm text-slate-500 mb-6">One-time initialization — creates Super Admin + seeds portal families</p>
        <div className="space-y-3">
          {[
            ['Bootstrap Secret','password',secret,setSecret],
            ['Admin Email','email',email,setEmail],
            ['Admin Password','password',password,setPass],
            ['Your Name','text',name,setName],
          ].map(([label, type, value, setter]: any) => (
            <div key={label}>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
              <input type={type} value={value} onChange={e => setter(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={health} disabled={loading}
            className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">
            Health Check
          </button>
          <button onClick={run} disabled={loading}
            className="flex-1 py-2.5 bg-[#0D7C66] text-white text-sm font-semibold rounded-xl hover:bg-[#0A5E4F] disabled:opacity-50 transition-colors">
            {loading ? 'Running…' : '🚀 Initialize'}
          </button>
        </div>
        {result && (
          <div className={`mt-4 p-4 rounded-xl text-xs font-mono whitespace-pre-wrap break-all ${result.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : result.status === 'ok' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {JSON.stringify(result, null, 2)}
          </div>
        )}
        {result?.success && (
          <a href="/auth/login" className="mt-4 flex items-center justify-center gap-2 bg-[#0D7C66] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#0A5E4F] transition-colors">
            ✅ Go to Super Admin Login →
          </a>
        )}
      </div>
    </div>
  );
}
