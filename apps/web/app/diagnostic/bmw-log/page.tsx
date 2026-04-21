'use client';
import { useState } from 'react';

const WASTE_CATEGORIES = [
  { code: 'Yellow', label: 'Yellow (Human anatomical, soiled, expired medicines)', color: '#FCD34D' },
  { code: 'Red', label: 'Red (Contaminated recyclable waste)', color: '#EF4444' },
  { code: 'White', label: 'White (Sharps — needles, blades, glass)', color: '#F3F4F6' },
  { code: 'Blue', label: 'Blue (Glassware, metallic implants)', color: '#3B82F6' },
];

export default function BMWLogPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [form, setForm] = useState({ category: 'Yellow', weight: '', handledBy: '', remarks: '' });
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const addEntry = () => {
    if (!form.weight || !form.handledBy) return;
    setEntries(prev => [...prev, { ...form, id: Date.now(), time: new Date().toLocaleTimeString('en-IN') }]);
    setForm({ category: 'Yellow', weight: '', handledBy: '', remarks: '' });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-slate-800 mb-1">Biomedical Waste (BMW) Daily Log</h1>
      <p className="text-sm text-slate-500 mb-1">{today}</p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 mb-6">
        <strong>Per BMW Management Rules 2016 (amended 2018):</strong> All healthcare facilities must maintain a daily log of biomedical waste generated, segregated by category (Yellow/Red/White/Blue), with weight, handler name, and disposal method. Records must be retained for 5 years.
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {WASTE_CATEGORIES.map(w => {
          const total = entries.filter(e => e.category === w.code).reduce((s, e) => s + parseFloat(e.weight || 0), 0);
          return (
            <div key={w.code} className="bg-white rounded-xl border p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded" style={{ background: w.color, border: '1px solid #ccc' }} />
                <span className="text-xs font-semibold text-slate-700">{w.code}</span>
              </div>
              <p className="text-xl font-bold text-slate-800">{total.toFixed(1)} kg</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border p-4 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Add waste entry</h2>
        <div className="grid grid-cols-4 gap-3">
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
            className="px-3 py-2 rounded-lg border text-sm">
            {WASTE_CATEGORIES.map(w => <option key={w.code} value={w.code}>{w.code}</option>)}
          </select>
          <input type="number" step="0.1" placeholder="Weight (kg)" value={form.weight}
            onChange={e => setForm({ ...form, weight: e.target.value })}
            className="px-3 py-2 rounded-lg border text-sm" />
          <input type="text" placeholder="Handled by" value={form.handledBy}
            onChange={e => setForm({ ...form, handledBy: e.target.value })}
            className="px-3 py-2 rounded-lg border text-sm" />
          <button onClick={addEntry} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700">
            Add Entry
          </button>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b">
              <th className="px-4 py-2 text-left text-xs text-slate-500">Time</th>
              <th className="px-4 py-2 text-left text-xs text-slate-500">Category</th>
              <th className="px-4 py-2 text-left text-xs text-slate-500">Weight</th>
              <th className="px-4 py-2 text-left text-xs text-slate-500">Handled By</th>
              <th className="px-4 py-2 text-left text-xs text-slate-500">Remarks</th>
            </tr></thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id} className="border-b">
                  <td className="px-4 py-2">{e.time}</td>
                  <td className="px-4 py-2"><span className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{ background: WASTE_CATEGORIES.find(w => w.code === e.category)?.color }}>{e.category}</span></td>
                  <td className="px-4 py-2">{e.weight} kg</td>
                  <td className="px-4 py-2">{e.handledBy}</td>
                  <td className="px-4 py-2 text-slate-400">{e.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
