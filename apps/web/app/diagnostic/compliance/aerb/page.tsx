'use client';

/**
 * AERB dose entries — list + create.
 *
 * Every X-ray, CT, mammography, fluoroscopy, or nuclear-medicine exam must
 * log a patient dose in mSv + the operator's TLD badge reading. Required
 * under Atomic Energy (Radiation Protection) Rules, 2004.
 */

import { useState } from 'react';
import {
  PageHeader, Modal, Field, DataTable, inputCls, useList, fmtDate, savePost,
} from '../_components';
import toast from 'react-hot-toast';

const EXAM_TYPES = ['XRAY', 'CT', 'MAMMO', 'FLUORO', 'NUCLEAR_MEDICINE'] as const;

export default function AerbPage() {
  const { rows, loading, reload } = useList('/compliance/aerb/dose-entries');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    labOrderId: '',
    patientId: '',
    equipmentId: '',
    examDate: new Date().toISOString().slice(0, 16),
    examType: 'XRAY',
    doseMSv: '',
    operatorUserId: '',
    operatorTldBadgeReading: '',
    notes: '',
  };
  const [form, setForm] = useState(emptyForm);

  const set = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.examType || !form.doseMSv || !form.operatorUserId || !form.examDate) {
      toast.error('Exam date, exam type, dose, and operator are required');
      return;
    }
    await savePost({
      path: '/compliance/aerb/dose-entries',
      body: {
        ...form,
        doseMSv: Number(form.doseMSv),
        operatorTldBadgeReading: form.operatorTldBadgeReading ? Number(form.operatorTldBadgeReading) : null,
        labOrderId: form.labOrderId || null,
        patientId: form.patientId || null,
        equipmentId: form.equipmentId || null,
      },
      setSaving,
      onDone: () => {
        setShowForm(false);
        setForm(emptyForm);
        reload();
      },
      successMsg: 'Dose entry logged',
    });
  };

  const tableRows = rows.map((r: any) => [
    <span className="text-sm text-slate-700">{fmtDate(r.examDate)}</span>,
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 uppercase tracking-wider">
      {r.examType}
    </span>,
    <span className="font-mono text-sm text-slate-900 font-semibold">{Number(r.doseMSv).toFixed(3)} mSv</span>,
    <span className="text-sm text-slate-600 font-mono">{r.operatorUserId?.slice(0, 8)}…</span>,
    <span className="font-mono text-sm text-slate-700">
      {r.operatorTldBadgeReading != null ? `${Number(r.operatorTldBadgeReading).toFixed(3)} mSv` : '—'}
    </span>,
    <span className="text-sm text-slate-600 font-mono">{r.labOrderId ? `${r.labOrderId.slice(0, 8)}…` : '—'}</span>,
    <span className="text-xs text-slate-500">{fmtDate(r.createdAt)}</span>,
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="AERB Radiation Dose Entries"
        subtitle="Every radiation-bearing exam requires a dose log (patient mSv + operator TLD badge reading) before the report can be released."
        actionLabel="New Dose Entry"
        onAction={() => setShowForm(true)}
      />

      <DataTable
        columns={['Exam Date', 'Type', 'Patient Dose', 'Operator', 'TLD Reading', 'Lab Order', 'Logged']}
        rows={tableRows}
        loading={loading}
        empty="No dose entries logged yet. Click 'New Dose Entry' to log the first radiation exam."
      />

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Log AERB Dose Entry"
        saving={saving}
        onSave={submit}
        saveLabel="Log Dose"
        wide
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Exam Date & Time" required>
            <input type="datetime-local" className={inputCls} value={form.examDate} onChange={set('examDate')} />
          </Field>
          <Field label="Exam Type" required>
            <select className={inputCls} value={form.examType} onChange={set('examType')}>
              {EXAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Patient Dose (mSv)" required>
            <input type="number" step="0.001" min="0" className={inputCls} value={form.doseMSv} onChange={set('doseMSv')} placeholder="e.g. 0.025" />
          </Field>
          <Field label="Operator TLD Badge Reading (mSv)">
            <input type="number" step="0.001" min="0" className={inputCls} value={form.operatorTldBadgeReading} onChange={set('operatorTldBadgeReading')} placeholder="e.g. 0.001" />
          </Field>
          <Field label="Operator User ID" required>
            <input className={inputCls} value={form.operatorUserId} onChange={set('operatorUserId')} placeholder="Staff member who performed the exam" />
          </Field>
          <Field label="Equipment ID">
            <input className={inputCls} value={form.equipmentId} onChange={set('equipmentId')} placeholder="Optional" />
          </Field>
          <Field label="Patient ID">
            <input className={inputCls} value={form.patientId} onChange={set('patientId')} placeholder="Optional" />
          </Field>
          <Field label="Lab Order ID">
            <input className={inputCls} value={form.labOrderId} onChange={set('labOrderId')} placeholder="Links dose entry to a specific order" />
          </Field>
          <Field label="Notes" span={2}>
            <textarea className={`${inputCls} min-h-[60px] resize-y`} value={form.notes} onChange={set('notes')} placeholder="Optional notes on exam conditions or deviations" />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
