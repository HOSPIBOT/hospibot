'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  FlaskConical, Plus, RefreshCw, Search, X, Loader2,
  ChevronLeft, ChevronRight, Clock, CheckCircle2, AlertTriangle,
  Send, Upload, Eye, Filter, Printer, Download,
} from 'lucide-react';

const STATUS_PIPELINE = [
  { key: 'ORDERED',          label: 'Ordered',          color: '#64748B', bg: '#F8FAFC',  next: 'SAMPLE_COLLECTED', nextLabel: 'Collect Sample' },
  { key: 'SAMPLE_COLLECTED', label: 'Sample Collected',  color: '#3B82F6', bg: '#EFF6FF',  next: 'PROCESSING',        nextLabel: 'Start Processing' },
  { key: 'PROCESSING',       label: 'Processing',        color: '#8B5CF6', bg: '#FAF5FF',  next: 'COMPLETED',         nextLabel: 'Mark Complete' },
  { key: 'COMPLETED',        label: 'Completed',         color: '#F59E0B', bg: '#FFFBEB',  next: 'DELIVERED',         nextLabel: 'Deliver Report' },
  { key: 'DELIVERED',        label: 'Delivered',         color: '#10B981', bg: '#F0FDF4',  next: null,                nextLabel: null },
  { key: 'CANCELLED',        label: 'Cancelled',         color: '#EF4444', bg: '#FFF1F2',  next: null,                nextLabel: null },
];

const PRIORITY_COLORS: Record<string, string> = {
  normal: 'bg-slate-100 text-slate-600',
  urgent: 'bg-red-100 text-red-700',
  stat:   'bg-red-500 text-white',
};

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none transition-all placeholder:text-slate-400';

function OrderRow({ order, onStatusChange, onUploadReport }: {
  order: any; onStatusChange: (id: string, status: string) => void; onUploadReport: (order: any) => void;
}) {
  const [updating, setUpdating] = useState(false);
  const statusInfo = STATUS_PIPELINE.find(s => s.key === order.status);
  const tests = (order.tests as any[]) || [];
  const patientName = `${order.patient?.firstName} ${order.patient?.lastName || ''}`.trim();

  const handleNext = async () => {
    if (!statusInfo?.next) return;
    setUpdating(true);
    try {
      await onStatusChange(order.id, statusInfo.next);
    } finally { setUpdating(false); }
  };

  return (
    <tr className="hover:bg-slate-50/60 transition-colors group">
      <td className="px-5 py-3.5">
        <div>
          <p className="text-sm font-bold text-[#1E3A5F] font-mono">{order.orderNumber}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(order.createdAt)} {formatTime(order.createdAt)}</p>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <div>
          <p className="text-sm font-semibold text-slate-900">{patientName}</p>
          <p className="text-xs text-slate-400">{order.patient?.phone}</p>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex flex-wrap gap-1">
          {tests.slice(0, 3).map((t: any, i: number) => (
            <span key={i} className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
              {t.testCode || t.code || t.testName || t.name}
            </span>
          ))}
          {tests.length > 3 && <span className="text-[10px] text-slate-400">+{tests.length - 3}</span>}
        </div>
      </td>
      <td className="px-5 py-3.5">
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${PRIORITY_COLORS[order.priority] || PRIORITY_COLORS.normal}`}>
          {order.priority}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: statusInfo?.color }} />
          <span className="text-xs font-semibold" style={{ color: statusInfo?.color }}>
            {statusInfo?.label || order.status}
          </span>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
          {statusInfo?.next && statusInfo.next !== 'DELIVERED' && (
            <button onClick={handleNext} disabled={updating}
              className="text-[10px] font-bold text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-60 transition-all"
              style={{ background: '#1E3A5F' }}>
              {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              {statusInfo.nextLabel}
            </button>
          )}
          {(order.status === 'COMPLETED' || order.status === 'PROCESSING') && (
            <button onClick={() => onUploadReport(order)}
              className="text-[10px] font-bold text-white bg-emerald-600 px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-emerald-700 transition-colors">
              <Upload className="w-3 h-3" /> Upload Report
            </button>
          )}
          {order.status === 'DELIVERED' && order.reportUrl && (
            <a href={order.reportUrl} target="_blank" rel="noreferrer"
              className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-emerald-100 transition-colors">
              <Eye className="w-3 h-3" /> View Report
            </a>
          )}
          {order.status === 'DELIVERED' && (
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-1">
              <Send className="w-3 h-3" /> WA Sent
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

function CreateOrderModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep]             = useState<1|2>(1);
  const [patients, setPatients]     = useState<any[]>([]);
  const [catalog, setCatalog]       = useState<any[]>([]);
  const [patSearch, setPatSearch]   = useState('');
  const [testSearch, setTestSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    patientId: '', patientName: '', doctorId: '', priority: 'normal',
    referringDoctor: '', clinicalInfo: '', notes: '',
    selectedTests: [] as any[],
  });

  useEffect(() => {
    if (patSearch.length < 2) { setPatients([]); return; }
    const t = setTimeout(async () => {
      const r = await api.get('/patients', { params: { search: patSearch, limit: 5 } }).catch(() => ({ data: { data: [] } }));
      setPatients(r.data.data || []);
    }, 300);
    return () => clearTimeout(t);
  }, [patSearch]);

  useEffect(() => {
    api.get('/lab/catalog').then(r => setCatalog(r.data.data || [])).catch(() => {});
  }, []);

  const filteredTests = testSearch
    ? catalog.filter(t => t.name.toLowerCase().includes(testSearch.toLowerCase()) || t.code.toLowerCase().includes(testSearch.toLowerCase()))
    : catalog;

  const toggleTest = (test: any) => {
    setForm(f => ({
      ...f,
      selectedTests: f.selectedTests.find(t => t.id === test.id)
        ? f.selectedTests.filter(t => t.id !== test.id)
        : [...f.selectedTests, { id: test.id, testCode: test.code, testName: test.name, price: test.price }],
    }));
  };

  const handleSubmit = async () => {
    if (!form.patientId || form.selectedTests.length === 0) {
      toast.error('Select patient and at least one test');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/lab/orders', {
        patientId: form.patientId,
        tests: form.selectedTests,
        priority: form.priority,
        referringDoctor: form.referringDoctor,
        clinicalInfo: form.clinicalInfo,
        notes: form.notes,
      });
      toast.success('Lab order created! Patient notified via WhatsApp.');
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create order');
    } finally { setSubmitting(false); }
  };

  const totalPrice = form.selectedTests.reduce((s, t) => s + (t.price || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-900">Create Lab Order — Step {step} of 2</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {step === 1 && (
            <>
              {/* Patient */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Patient <span className="text-red-500">*</span></label>
                {form.patientId ? (
                  <div className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-2.5 border border-blue-200">
                    <span className="text-sm font-semibold text-blue-800">{form.patientName}</span>
                    <button onClick={() => setForm(f => ({ ...f, patientId: '', patientName: '' }))}><X className="w-4 h-4 text-blue-400" /></button>
                  </div>
                ) : (
                  <div className="relative">
                    <input className={inputCls} placeholder="Search patient by name or phone…"
                      value={patSearch} onChange={e => setPatSearch(e.target.value)} />
                    {patients.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                        {patients.map(p => (
                          <button key={p.id} onClick={() => { setForm(f => ({ ...f, patientId: p.id, patientName: `${p.firstName} ${p.lastName || ''}` })); setPatSearch(''); setPatients([]); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                            <p className="text-sm font-medium text-slate-900">{p.firstName} {p.lastName || ''}</p>
                            <p className="text-xs text-slate-400">{p.phone} · {p.healthId}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Priority</label>
                  <select className={inputCls} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent (4-6 hrs)</option>
                    <option value="stat">STAT (2 hrs)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Referring Doctor</label>
                  <input className={inputCls} placeholder="Dr. Name" value={form.referringDoctor} onChange={e => setForm(f => ({ ...f, referringDoctor: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Clinical Information</label>
                <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Symptoms, provisional diagnosis, relevant history…"
                  value={form.clinicalInfo} onChange={e => setForm(f => ({ ...f, clinicalInfo: e.target.value }))} />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input className="bg-transparent text-sm outline-none flex-1" placeholder="Search tests (e.g. CBC, HbA1c, LFT)…"
                    value={testSearch} onChange={e => setTestSearch(e.target.value)} />
                </div>
                {form.selectedTests.length > 0 && (
                  <span className="text-xs font-bold text-white bg-[#1E3A5F] px-3 py-1.5 rounded-full">
                    {form.selectedTests.length} selected · ₹{(totalPrice / 100).toFixed(0)}
                  </span>
                )}
              </div>

              <div className="space-y-1 max-h-72 overflow-y-auto">
                {filteredTests.map(test => {
                  const selected = form.selectedTests.some(t => t.id === test.id);
                  return (
                    <button key={test.id} onClick={() => toggleTest(test)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                        selected ? 'border-[#1E3A5F] bg-blue-50' : 'border-slate-100 hover:border-slate-200 bg-white'
                      }`}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        selected ? 'bg-[#1E3A5F] border-[#1E3A5F]' : 'border-slate-300'
                      }`}>
                        {selected && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#1E3A5F] font-mono">{test.code}</span>
                          <span className="text-sm font-medium text-slate-900">{test.name}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{test.category}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{test.sampleType} · TAT: {test.turnaroundHrs}h</p>
                      </div>
                      <p className="text-sm font-bold text-slate-900 flex-shrink-0">₹{(test.price / 100).toFixed(0)}</p>
                    </button>
                  );
                })}
                {filteredTests.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-sm">
                    No tests found. <button onClick={() => api.post('/lab/catalog/seed')} className="text-[#1E3A5F] underline">Seed default catalog</button>
                  </div>
                )}
              </div>

              {form.selectedTests.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-xs font-bold text-blue-800 mb-2">SELECTED TESTS ({form.selectedTests.length})</p>
                  <div className="space-y-1">
                    {form.selectedTests.map(t => (
                      <div key={t.id} className="flex items-center justify-between text-sm">
                        <span className="text-blue-800">{t.testCode} — {t.testName}</span>
                        <span className="font-bold text-blue-900">₹{(t.price / 100).toFixed(0)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between text-sm font-bold text-blue-900 border-t border-blue-200 pt-2 mt-2">
                      <span>Total</span>
                      <span>₹{(totalPrice / 100).toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button onClick={() => step === 1 ? onClose() : setStep(1)} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors">
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          {step === 1 ? (
            <button onClick={() => setStep(2)} disabled={!form.patientId}
              className="bg-[#1E3A5F] text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity">
              Select Tests →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting || form.selectedTests.length === 0}
              className="bg-[#1E3A5F] text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Creating…' : 'Create Order'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadReportModal({ order, onClose, onUploaded }: { order: any; onClose: () => void; onUploaded: () => void }) {
  const [url, setUrl]         = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleUpload = async () => {
    if (!url.trim()) { toast.error('Enter report URL'); return; }
    setSubmitting(true);
    try {
      const res = await api.post(`/lab/orders/${order.id}/report`, { reportUrl: url });
      toast.success(`Report uploaded! Sent to patient via WhatsApp at ${res.data.sentTo}`);
      onUploaded();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Upload Report</h2>
            <p className="text-xs text-slate-400 mt-0.5">Order: {order.orderNumber} · Patient: {order.patient?.firstName} {order.patient?.lastName || ''}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Report URL (PDF Link)</label>
            <input className={`w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E3A5F] outline-none transition-all`}
              placeholder="https://storage.example.com/report.pdf"
              value={url} onChange={e => setUrl(e.target.value)} />
            <p className="text-xs text-slate-400 mt-1.5">Upload the PDF to your storage (S3, Cloudinary, etc.) and paste the URL here. The URL will be sent to the patient via WhatsApp.</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-start gap-2">
            <Send className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-700">
              Once you submit, the patient will automatically receive a WhatsApp message with a download link to their report. The order status will be updated to DELIVERED.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
          <button onClick={handleUpload} disabled={submitting || !url.trim()}
            className="bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <Send className="w-4 h-4" />
            {submitting ? 'Uploading…' : 'Upload & Send via WhatsApp'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LabOrdersPage() {
  const [orders, setOrders]         = useState<any[]>([]);
  const [meta, setMeta]             = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading]       = useState(true);
  const [statusFilter, setStatus]   = useState('');
  const [priorityFilter, setPriority] = useState('');
  const [search, setSearch]         = useState('');
  const [debSearch, setDebSearch]   = useState('');
  const [dateFilter, setDate]       = useState(new Date().toISOString().split('T')[0]);
  const [showCreate, setShowCreate] = useState(false);
  const [uploadOrder, setUploadOrder] = useState<any>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter)  params.status   = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (debSearch)     params.search   = debSearch;
      if (dateFilter)    params.date     = dateFilter;
      const res = await api.get('/lab/orders', { params });
      setOrders(res.data.data ?? []);
      setMeta(res.data.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [statusFilter, priorityFilter, debSearch, dateFilter]);

  useEffect(() => { load(1); }, [load]);

  const [exporting, setExporting] = useState(false);
  const exportCSV = async () => {
    setExporting(true);
    try {
      const params: any = { limit: 5000 };
      if (statusFilter)   params.status   = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (debSearch)      params.search   = debSearch;
      if (dateFilter)     params.date     = dateFilter;
      const res  = await api.get('/lab/orders', { params });
      const all: any[] = res.data.data ?? orders;
      const header = ['Order #', 'Patient', 'Phone', 'Tests', 'Priority', 'Status', 'Date', 'Report'];
      const rows = all.map(o => [
        o.id?.slice(0,8).toUpperCase() ?? '',
        `${o.patient?.firstName ?? ''} ${o.patient?.lastName ?? ''}`.trim(),
        o.patient?.phone ?? '',
        (o.tests as any[])?.map((t: any) => t.testName).join('; ') ?? '',
        o.priority ?? 'ROUTINE', o.status ?? '',
        o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : '',
        o.reportUrl ? 'Yes' : 'No',
      ]);
      const csv  = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `lab-orders-${new Date().toISOString().slice(0,10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast.success(`Exported ${all.length} orders`);
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };
    try {
      await api.patch(`/lab/orders/${id}/status`, { status: newStatus });
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      load(meta.page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Status update failed');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lab Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">{meta.total.toLocaleString('en-IN')} total orders</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(meta.page)} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={exportCSV} disabled={exporting}
            className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
            <Download className="w-4 h-4" /> {exporting ? 'Exporting…' : 'Export'}
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            style={{ background: '#1E3A5F' }}>
            <Plus className="w-4 h-4" /> New Order
          </button>
        </div>
      </div>

      {/* Status pipeline tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[{ key: '', label: 'All' }, ...STATUS_PIPELINE].map(s => (
          <button key={s.key} onClick={() => setStatus(s.key)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all flex-shrink-0 ${
              statusFilter === s.key ? 'text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            style={statusFilter === s.key ? { background: (s as any).color || '#1E3A5F' } : {}}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-52">
          <Search className="w-4 h-4 text-slate-400" />
          <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
            placeholder="Search by order no., patient name, phone…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <input type="date" value={dateFilter} onChange={e => setDate(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none cursor-pointer" />
        <select value={priorityFilter} onChange={e => setPriority(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none cursor-pointer">
          <option value="">All Priority</option>
          <option value="normal">Normal</option>
          <option value="urgent">Urgent</option>
          <option value="stat">STAT</option>
        </select>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Order #', 'Patient', 'Tests', 'Priority', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 6 }).map((__, j) => (
                  <td key={j} className="px-5 py-4"><div className="animate-pulse bg-slate-200 rounded h-4" /></td>
                ))}</tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <FlaskConical className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-medium">No lab orders found</p>
                </td>
              </tr>
            ) : orders.map(order => (
              <OrderRow key={order.id} order={order}
                onStatusChange={handleStatusChange}
                onUploadReport={setUploadOrder} />
            ))}
          </tbody>
        </table>
        {!loading && meta.total > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">Showing {(meta.page-1)*meta.limit+1}–{Math.min(meta.page*meta.limit, meta.total)} of {meta.total}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => load(meta.page-1)} disabled={meta.page===1} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-xs text-slate-600 px-3">{meta.page} / {meta.totalPages}</span>
              <button onClick={() => load(meta.page+1)} disabled={meta.page>=meta.totalPages} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {showCreate && <CreateOrderModal onClose={() => setShowCreate(false)} onCreated={() => load(1)} />}
      {uploadOrder && <UploadReportModal order={uploadOrder} onClose={() => setUploadOrder(null)} onUploaded={() => load(meta.page)} />}
    </div>
  );
}
