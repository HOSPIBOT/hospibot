'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatDate, formatTime, formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar, Activity, HeartPulse,
  Pill, FlaskConical, CreditCard, MessageSquare, Edit3, Plus,
  AlertTriangle, CheckCircle2, Clock, RefreshCw, Loader2, Shield, Send, Download, Eye,
} from 'lucide-react';

type Tab = 'overview' | 'appointments' | 'prescriptions' | 'labReports' | 'billing' | 'whatsapp';

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700', CONFIRMED: 'bg-blue-100 text-blue-700',
  CHECKED_IN: 'bg-purple-100 text-purple-700', IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700', CANCELLED: 'bg-red-100 text-red-700',
  NO_SHOW: 'bg-slate-100 text-slate-600',
  PAID: 'bg-emerald-100 text-emerald-700', DRAFT: 'bg-slate-100 text-slate-600',
  SENT: 'bg-blue-100 text-blue-700', PARTIALLY_PAID: 'bg-amber-100 text-amber-700',
  OVERDUE: 'bg-red-100 text-red-700',
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-slate-50 last:border-0">
      <span className="text-sm text-slate-500 w-36 flex-shrink-0">{label}</span>
      <span className="text-sm text-slate-900 font-medium text-right">{value || '—'}</span>
    </div>
  );
}

function TabButton({ label, active, count, icon: Icon, onClick }: any) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${active ? 'border-[#0D7C66] text-[#0D7C66]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'}`}>
      <Icon className="w-4 h-4" />
      {label}
      {count !== undefined && count > 0 && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-[#0D7C66] text-white' : 'bg-slate-200 text-slate-600'}`}>{count}</span>
      )}
    </button>
  );
}

function QuickMessagePanel({ patientPhone, patientName }: { patientPhone: string; patientName: string }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const TEMPLATES = [
    { label: 'Appointment Reminder', text: `Hi ${patientName}, this is a reminder about your upcoming appointment. Please arrive 10 minutes early. Reply CONFIRM to confirm.` },
    { label: 'Follow-Up', text: `Hi ${patientName}, how are you feeling after your visit? Please let us know if you need any assistance.` },
    { label: 'Report Ready', text: `Hi ${patientName}, your lab report is ready. Please visit us to collect it or ask us to explain the results.` },
    { label: 'Payment Due', text: `Hi ${patientName}, your invoice has a pending balance. Please arrange payment at your earliest convenience.` },
  ];
  const send = async () => {
    if (!message.trim()) { toast.error('Enter a message'); return; }
    setSending(true);
    try {
      await api.post('/whatsapp/send', { to: patientPhone, message });
      toast.success('Message sent via WhatsApp!');
      setMessage('');
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to send'); }
    finally { setSending(false); }
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {TEMPLATES.map(t => (
          <button key={t.label} onClick={() => setMessage(t.text)}
            className="text-[10px] font-semibold bg-white text-[#0D7C66] border border-[#0D7C66]/30 px-2.5 py-1 rounded-full hover:bg-[#0D7C66] hover:text-white transition-all">
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <textarea
          className="flex-1 px-3 py-2.5 text-sm rounded-xl border border-[#0D7C66]/20 bg-white focus:border-[#0D7C66] outline-none resize-none placeholder:text-slate-400"
          rows={3} placeholder="Type a message or select a template above…"
          value={message} onChange={e => setMessage(e.target.value)} />
      </div>
      <button onClick={send} disabled={sending || !message.trim()}
        className="flex items-center gap-2 bg-[#25D366] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all">
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
        {sending ? 'Sending…' : 'Send WhatsApp'}
      </button>
    </div>
  );
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/patients/${id}`);
      setPatient(res.data);
    } catch {
      toast.error('Patient not found');
      router.push('/clinical/patients');
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const ageFromDOB = (dob: string) => {
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-slate-200 rounded-2xl h-36" />
        <div className="animate-pulse bg-slate-200 rounded-2xl h-64" />
      </div>
    );
  }

  if (!patient) return null;

  const p = patient;
  const age = p.dateOfBirth ? ageFromDOB(p.dateOfBirth) : null;

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link href="/clinical/patients" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#0D7C66] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Patients
      </Link>

      {/* Patient header card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-[#E8F5F0] text-[#0D7C66] flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {p.firstName?.[0]}{p.lastName?.[0] || ''}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900">{p.firstName} {p.lastName || ''}</h1>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {p.healthId && (
                    <span className="text-xs font-mono font-bold text-[#0D7C66] bg-[#E8F5F0] px-2.5 py-0.5 rounded-lg">{p.healthId}</span>
                  )}
                  {age && <span className="text-sm text-slate-500">{age} years</span>}
                  {p.gender && <span className="text-sm text-slate-500">{p.gender}</span>}
                  {p.bloodGroup && (
                    <span className="text-xs font-bold bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <HeartPulse className="w-3 h-3" /> {p.bloodGroup}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 text-xs font-medium text-slate-600 border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <Link href={`/clinical/appointments?patientId=${p.id}`}>
                  <button className="flex items-center gap-1.5 text-xs font-medium text-white bg-[#0D7C66] hover:bg-[#0A5E4F] px-3 py-2 rounded-xl transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Book Appointment
                  </button>
                </Link>
              </div>
            </div>

            {/* Contact */}
            <div className="flex items-center gap-5 mt-3 flex-wrap">
              <a href={`tel:${p.phone}`} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-[#0D7C66] transition-colors">
                <Phone className="w-3.5 h-3.5" /> {p.phone}
              </a>
              {p.email && (
                <a href={`mailto:${p.email}`} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-[#0D7C66] transition-colors">
                  <Mail className="w-3.5 h-3.5" /> {p.email}
                </a>
              )}
              {p.city && (
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin className="w-3.5 h-3.5" /> {p.city}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Alert bars */}
        {p.allergies?.length > 0 && (
          <div className="mt-4 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-red-800">ALLERGIES: </span>
              <span className="text-xs text-red-700">{p.allergies.join(', ')}</span>
            </div>
          </div>
        )}
        {p.chronicConditions?.length > 0 && (
          <div className="mt-2 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
            <Activity className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-amber-800">CHRONIC CONDITIONS: </span>
              <span className="text-xs text-amber-700">{p.chronicConditions.join(', ')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Visits', value: p.visits?.length ?? 0,        icon: Calendar,     color: '#0D7C66' },
          { label: 'Prescriptions', value: p.prescriptions?.length ?? 0, icon: Pill,         color: '#3B82F6' },
          { label: 'Lab Orders',    value: p.labOrders?.length ?? 0,     icon: FlaskConical, color: '#F59E0B' },
          { label: 'Outstanding',   value: p.invoices?.filter((i: any) => i.status !== 'PAID').length ?? 0, icon: CreditCard, color: '#EF4444' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
            <div className="w-9 h-9 rounded-xl mx-auto flex items-center justify-center mb-2" style={{ background: `${s.color}15` }}>
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center border-b border-slate-100 px-2 overflow-x-auto">
          <TabButton label="Overview"       icon={Activity}     active={tab === 'overview'}      onClick={() => setTab('overview')} />
          <TabButton label="Appointments"   icon={Calendar}     active={tab === 'appointments'}  onClick={() => setTab('appointments')}  count={p.appointments?.length} />
          <TabButton label="Prescriptions"  icon={Pill}         active={tab === 'prescriptions'} onClick={() => setTab('prescriptions')} count={p.prescriptions?.length} />
          <TabButton label="Lab Reports"    icon={FlaskConical} active={tab === 'labReports'}     onClick={() => setTab('labReports')}    count={p.labOrders?.length} />
          <TabButton label="Billing"        icon={CreditCard}   active={tab === 'billing'}       onClick={() => setTab('billing')}       count={p.invoices?.length} />
          <TabButton label="WhatsApp"       icon={MessageSquare} active={tab === 'whatsapp'}     onClick={() => setTab('whatsapp')} />
        </div>

        <div className="p-5">
          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Personal Details</h3>
                <InfoRow label="Full Name"     value={`${p.firstName} ${p.lastName || ''}`} />
                <InfoRow label="Phone"         value={p.phone} />
                <InfoRow label="Email"         value={p.email} />
                <InfoRow label="Date of Birth" value={p.dateOfBirth ? formatDate(p.dateOfBirth) : null} />
                <InfoRow label="Age"           value={age ? `${age} years` : null} />
                <InfoRow label="Gender"        value={p.gender} />
                <InfoRow label="Blood Group"   value={p.bloodGroup} />
                <InfoRow label="Language"      value={p.language} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Address & Insurance</h3>
                <InfoRow label="Address"       value={p.address} />
                <InfoRow label="City"          value={p.city} />
                <InfoRow label="State"         value={p.state} />
                <InfoRow label="Pincode"       value={p.pincode} />
                <InfoRow label="Insurance"     value={p.insuranceProvider} />
                <InfoRow label="Policy No."    value={p.insurancePolicyNo} />
                <InfoRow label="Health ID"     value={p.healthId} />
                <InfoRow label="Member Since"  value={formatDate(p.createdAt)} />
              </div>
              {p.notes && (
                <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-amber-800 mb-1">NOTES</p>
                  <p className="text-sm text-amber-800">{p.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* ── APPOINTMENTS ── */}
          {tab === 'appointments' && (
            <div className="space-y-3">
              {(!p.appointments || p.appointments.length === 0) ? (
                <div className="py-12 text-center text-slate-400 text-sm">No appointments found.</div>
              ) : p.appointments.map((appt: any) => (
                <div key={appt.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F5F0] text-[#0D7C66] flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      Dr. {appt.doctor?.user?.firstName} {appt.doctor?.user?.lastName || ''}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(appt.scheduledAt)} at {formatTime(appt.scheduledAt)}
                      {appt.tokenNumber && ` · Token: ${appt.tokenNumber}`}
                    </p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[appt.status] || 'bg-slate-100 text-slate-600'}`}>
                    {appt.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ── PRESCRIPTIONS ── */}
          {tab === 'prescriptions' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <a href={`/clinical/prescriptions?patientId=${p.id}`}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#0D7C66] bg-[#E8F5F0] border border-[#0D7C66]/20 px-3 py-1.5 rounded-xl hover:bg-[#0D7C66]/10 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Write Prescription
                </a>
              </div>
              {(!p.prescriptions || p.prescriptions.length === 0) ? (
                <div className="py-12 text-center text-slate-400 text-sm">No prescriptions found.</div>
              ) : p.prescriptions.map((rx: any) => (
                <div key={rx.id} className="p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs text-slate-400">{formatDate(rx.createdAt)}</p>
                      {rx.doctor && <p className="text-xs text-slate-500 mt-0.5">Dr. {rx.doctor?.user?.firstName} {rx.doctor?.user?.lastName || ''}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${rx.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {rx.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button onClick={async () => { try { await api.post(\`/prescriptions/\${rx.id}/send\`); toast.success('Sent via WhatsApp!'); } catch { toast.error('Failed to send'); } }}
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] font-bold text-white bg-[#25D366] px-2 py-1 rounded-lg hover:opacity-90 transition-all">
                        <Send className="w-2.5 h-2.5" /> Send
                      </button>
                    </div>
                  </div>
                  {(rx.medications || []).length > 0 ? (
                    <div className="space-y-1.5">
                      {rx.medications.map((med: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <Pill className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="font-medium text-slate-900">{med.name}</span>
                          {med.dosage && <span className="text-slate-500">{med.dosage}</span>}
                          {med.frequency && <span className="text-slate-500">— {med.frequency}</span>}
                          {med.duration && <span className="text-slate-400">for {med.duration}</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No medication details</p>
                  )}
                  {rx.refillDueDate && (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Refill due: {formatDate(rx.refillDueDate)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── LAB REPORTS ── */}
          {tab === 'labReports' && (
            <div className="space-y-3">
              {(!p.labOrders || p.labOrders.length === 0) ? (
                <div className="py-12 text-center text-slate-400 text-sm">No lab orders found.</div>
              ) : p.labOrders.map((order: any) => (
                <div key={order.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">Order #{order.orderNumber}</p>
                    <p className="text-xs text-slate-400">{formatDate(order.createdAt)} · {order.priority} priority</p>
                    {order.tests?.length > 0 && (
                      <p className="text-xs text-slate-500 mt-0.5">{order.tests.slice(0, 3).map((t: any) => t.testName || t).join(', ')}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[order.status] || 'bg-slate-100 text-slate-600'}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                    {order.reportUrl && (
                      <a href={order.reportUrl} target="_blank" rel="noreferrer"
                        className="block text-xs text-[#0D7C66] hover:underline mt-1">Download Report</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── BILLING ── */}
          {tab === 'billing' && (
            <div className="space-y-3">
              {/* Total outstanding */}
              {p.invoices?.some((i: any) => i.dueAmount > 0) && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <p className="text-sm font-semibold text-red-800">
                    Outstanding: {formatINR(p.invoices.reduce((sum: number, i: any) => sum + i.dueAmount, 0))}
                  </p>
                </div>
              )}
              {(!p.invoices || p.invoices.length === 0) ? (
                <div className="py-12 text-center text-slate-400 text-sm">No billing history.</div>
              ) : p.invoices.map((inv: any) => (
                <div key={inv.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{inv.invoiceNumber}</p>
                    <p className="text-xs text-slate-400">{formatDate(inv.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{formatINR(inv.totalAmount)}</p>
                    {inv.dueAmount > 0 && <p className="text-xs text-red-500">Due: {formatINR(inv.dueAmount)}</p>}
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[inv.status] || 'bg-slate-100'}`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── WHATSAPP ── */}
          {tab === 'whatsapp' && (
            <div className="space-y-4">
              {/* Quick message */}
              <div className="bg-[#E8F5F0] border border-[#0D7C66]/20 rounded-2xl p-4">
                <p className="text-xs font-bold text-[#0D7C66] uppercase tracking-widest mb-3">Quick Message</p>
                <QuickMessagePanel patientPhone={p.phone} patientName={`${p.firstName} ${p.lastName || ''}`.trim()} />
              </div>
              {/* Open full conversation */}
              <div className="text-center py-6 border border-slate-100 rounded-2xl bg-slate-50">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400 text-sm mb-3">View full conversation history</p>
                <Link href={`/clinical/whatsapp?phone=${p.phone}`}>
                  <button className="bg-[#25D366] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto">
                    <MessageSquare className="w-4 h-4" /> Open in WhatsApp Inbox
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
