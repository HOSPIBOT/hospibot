'use client';

/**
 * PC-PNDT Form F — list, create, mark submitted.
 *
 * A Form F must exist with informedConsentTaken=true before a prenatal
 * imaging report can be released. Form F also tracks whether it has been
 * submitted to the Appropriate Authority in the monthly filing.
 */

import { useState } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { FileText, CheckCircle2 } from 'lucide-react';
import {
  PageHeader, Modal, Field, Check, DataTable, StatusPill,
  inputCls, useList, fmtDate, savePost, errMsg,
} from '../_components';

export default function FormFPage() {
  const { rows, loading, reload } = useList('/compliance/pcpndt/form-f');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const emptyForm = {
    formFNumber: '',
    labOrderId: '',
    patientId: '',
    referringDoctorName: '',
    referringDoctorRegNo: '',
    performedByDoctorName: '',
    performedByDoctorRegNo: '',
    gestationalAgeWeeks: '',
    indicationForScan: '',
    scanType: 'USG',
    findings: '',
    informedConsentTaken: false,
  };
  const [form, setForm] = useState(emptyForm);

  const set = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    const required = [
      ['formFNumber', 'Form F number'],
      ['patientId', 'Patient ID'],
      ['referringDoctorName', 'Referring doctor name'],
      ['referringDoctorRegNo', 'Referring doctor reg no'],
      ['performedByDoctorName', 'Performing doctor name'],
      ['performedByDoctorRegNo', 'Performing doctor reg no'],
      ['indicationForScan', 'Indication for scan'],
      ['scanType', 'Scan type'],
    ];
    for (const [k, label] of required) {
      if (!(form as any)[k]) {
        toast.error(`${label} is required`);
        return;
      }
    }
    if (!form.informedConsentTaken) {
      toast.error('Informed consent must be taken for Form F to be valid');
      return;
    }
    await savePost({
      path: '/compliance/pcpndt/form-f',
      body: {
        ...form,
        gestationalAgeWeeks: form.gestationalAgeWeeks ? Number(form.gestationalAgeWeeks) : null,
        labOrderId: form.labOrderId || null,
      },
      setSaving,
      onDone: () => {
        setShowForm(false);
        setForm(emptyForm);
        reload();
      },
      successMsg: 'Form F created',
    });
  };

  const markSubmitted = async (id: string) => {
    setSubmittingId(id);
    try {
      await api.patch(`/compliance/pcpndt/form-f/${id}/submit`);
      toast.success('Marked as submitted to Authority');
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSubmittingId(null);
    }
  };

  const tableRows = rows.map((r: any) => [
    <span className="font-mono text-xs text-slate-600">{r.formFNumber}</span>,
    <div>
      <div className="font-medium text-slate-900">{r.patientId?.slice(0, 8)}…</div>
      {r.labOrderId && <div className="text-xs text-slate-400 font-mono">Order {r.labOrderId.slice(0, 8)}…</div>}
    </div>,
    <div>
      <div className="text-sm">{r.referringDoctorName}</div>
      <div className="text-xs text-slate-400 font-mono">{r.referringDoctorRegNo}</div>
    </div>,
    <span className="text-sm text-slate-700">{r.scanType}</span>,
    <span className="text-sm text-slate-700">{r.gestationalAgeWeeks ? `${r.gestationalAgeWeeks}w` : '—'}</span>,
    r.informedConsentTaken
      ? <StatusPill label="Consent" tone="good" />
      : <StatusPill label="No consent" tone="bad" />,
    r.submittedToAuthority
      ? <StatusPill label={`Submitted ${fmtDate(r.submittedAt)}`} tone="good" />
      : (
        <button
          onClick={() => markSubmitted(r.id)}
          disabled={submittingId === r.id}
          className="text-xs font-semibold text-[#0D7C66] hover:text-[#0A5E4F] disabled:opacity-50"
        >
          {submittingId === r.id ? 'Submitting…' : 'Mark submitted →'}
        </button>
      ),
    <span className="text-xs text-slate-500">{fmtDate(r.createdAt)}</span>,
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="PC-PNDT Form F"
        subtitle="Mandatory Form F records for every prenatal imaging procedure. Required under the PC-PNDT Act, 1994."
        actionLabel="New Form F"
        onAction={() => setShowForm(true)}
      />

      <DataTable
        columns={['Form F #', 'Patient / Order', 'Referring Dr.', 'Scan', 'Gest. Age', 'Consent', 'Submission', 'Created']}
        rows={tableRows}
        loading={loading}
        empty="No Form F records yet. Click 'New Form F' to file the first one."
      />

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Create PC-PNDT Form F"
        saving={saving}
        onSave={submit}
        saveLabel="File Form F"
        wide
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Form F Number" required>
            <input className={inputCls} value={form.formFNumber} onChange={set('formFNumber')} placeholder="e.g. FF-2026-00123" />
          </Field>
          <Field label="Scan Type" required>
            <select className={inputCls} value={form.scanType} onChange={set('scanType')}>
              <option value="USG">USG (Ultrasound)</option>
              <option value="FETAL_MRI">Fetal MRI</option>
              <option value="NT_SCAN">NT Scan</option>
              <option value="ANOMALY_SCAN">Anomaly Scan</option>
              <option value="GROWTH_SCAN">Growth Scan</option>
            </select>
          </Field>
          <Field label="Patient ID" required>
            <input className={inputCls} value={form.patientId} onChange={set('patientId')} placeholder="Patient UUID" />
          </Field>
          <Field label="Lab Order ID">
            <input className={inputCls} value={form.labOrderId} onChange={set('labOrderId')} placeholder="Optional — links Form F to a specific order" />
          </Field>
          <Field label="Referring Doctor Name" required>
            <input className={inputCls} value={form.referringDoctorName} onChange={set('referringDoctorName')} placeholder="Dr. Full Name" />
          </Field>
          <Field label="Referring Doctor Reg No" required>
            <input className={inputCls} value={form.referringDoctorRegNo} onChange={set('referringDoctorRegNo')} placeholder="MCI / State Medical Council" />
          </Field>
          <Field label="Performing Doctor Name" required>
            <input className={inputCls} value={form.performedByDoctorName} onChange={set('performedByDoctorName')} placeholder="Dr. Full Name" />
          </Field>
          <Field label="Performing Doctor Reg No" required>
            <input className={inputCls} value={form.performedByDoctorRegNo} onChange={set('performedByDoctorRegNo')} placeholder="MCI / State Medical Council" />
          </Field>
          <Field label="Gestational Age (weeks)">
            <input type="number" min="1" max="42" className={inputCls} value={form.gestationalAgeWeeks} onChange={set('gestationalAgeWeeks')} />
          </Field>
          <Field label="Indication for Scan" required span={2}>
            <input className={inputCls} value={form.indicationForScan} onChange={set('indicationForScan')} placeholder="e.g. Routine dating scan, follow-up for IUGR" />
          </Field>
          <Field label="Findings" span={2}>
            <textarea
              className={`${inputCls} min-h-[80px] resize-y`}
              value={form.findings}
              onChange={set('findings')}
              placeholder="Brief findings from the scan"
            />
          </Field>
          <div className="md:col-span-2 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <Check
              label="Informed consent has been taken from the patient as required under the PC-PNDT Act, 1994."
              value={form.informedConsentTaken}
              onChange={(v) => setForm((f) => ({ ...f, informedConsentTaken: v }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
