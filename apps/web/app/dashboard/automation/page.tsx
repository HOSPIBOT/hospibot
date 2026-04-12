'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Zap, Play, Pause, Download, BarChart3, Clock } from 'lucide-react';

export default function AutomationPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [protocols, setProtocols] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'rules' | 'protocols'>('rules');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [rulesRes, protRes, statsRes] = await Promise.all([
          api.get('/automation/rules'),
          api.get('/automation/protocols'),
          api.get('/automation/stats'),
        ]);
        setRules(rulesRes.data.data);
        setProtocols(protRes.data);
        setStats(statsRes.data);
      } catch { toast.error('Failed to load automation data'); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const toggleRule = async (id: string) => {
    try {
      await api.post(`/automation/rules/${id}/toggle`);
      toast.success('Rule toggled');
      const res = await api.get('/automation/rules');
      setRules(res.data.data);
    } catch { toast.error('Failed to toggle rule'); }
  };

  const installProtocol = async (protocolId: string) => {
    try {
      const res = await api.post(`/automation/protocols/${protocolId}/install`);
      toast.success(`Installed! ${res.data.rulesCreated} rules created.`);
      const rulesRes = await api.get('/automation/rules');
      setRules(rulesRes.data.data);
    } catch { toast.error('Failed to install protocol'); }
  };

  const executeAll = async () => {
    try {
      const res = await api.post('/automation/execute');
      toast.success(`Processed ${res.data.rulesProcessed} rules, sent ${res.data.totalSent} messages.`);
    } catch { toast.error('Failed to execute'); }
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue Engine</h1>
          <p className="text-sm text-gray-500 mt-0.5">Automated follow-ups that bring patients back</p>
        </div>
        <button onClick={executeAll} className="btn-accent flex items-center gap-2 text-sm">
          <Play className="w-4 h-4" /> Run all rules now
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="card text-center"><p className="text-2xl font-bold text-primary-600">{stats.activeRules}</p><p className="text-xs text-gray-500">Active rules</p></div>
          <div className="card text-center"><p className="text-2xl font-bold text-gray-900">{stats.totalTriggered}</p><p className="text-xs text-gray-500">Total triggered</p></div>
          <div className="card text-center"><p className="text-2xl font-bold text-emerald-600">{stats.totalConverted}</p><p className="text-xs text-gray-500">Converted</p></div>
          <div className="card text-center"><p className="text-2xl font-bold text-amber-600">{stats.conversionRate}%</p><p className="text-xs text-gray-500">Conversion rate</p></div>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => setTab('rules')} className={`text-sm px-4 py-2 rounded-xl font-medium ${tab === 'rules' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'}`}>Active rules</button>
        <button onClick={() => setTab('protocols')} className={`text-sm px-4 py-2 rounded-xl font-medium ${tab === 'protocols' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'}`}>Protocol templates</button>
      </div>

      {tab === 'rules' && (
        <div className="space-y-2">
          {rules.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No rules yet. Install a protocol template to get started.</div>
          ) : (
            rules.map(rule => (
              <div key={rule.id} className="card flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Zap className={`w-5 h-5 ${rule.isActive ? 'text-amber-500' : 'text-gray-300'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{rule.name}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{rule.trigger.replace('_', ' ')}</span>
                    <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{rule.waitDays} days wait</span>
                    <span>{rule.triggeredCount} triggered</span>
                    <span>{rule.convertedCount} converted</span>
                  </div>
                </div>
                <button onClick={() => toggleRule(rule.id)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium ${rule.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {rule.isActive ? 'Active' : 'Paused'}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'protocols' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {protocols.map(p => (
            <div key={p.id} className="card">
              <h3 className="font-semibold text-gray-900">{p.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{p.description}</p>
              <p className="text-xs text-gray-400 mt-2">{p.rules.length} automated rules</p>
              <button onClick={() => installProtocol(p.id)} className="btn-primary text-xs mt-3 flex items-center gap-1">
                <Download className="w-3 h-3" /> Install protocol
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
