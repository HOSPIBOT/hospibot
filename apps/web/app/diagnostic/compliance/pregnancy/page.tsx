'use client';

/**
 * Pregnancy screenings — PC-PNDT sex-determination safeguard.
 *
 * Before any prenatal procedure, the patient must sign a non-sex-
 * determination declaration and provide a consent form. Staff can flag
 * suspicious screenings for clinical review; flagged entries block report
 * release until unflagged.
 */

import { useState } from 'react';
import {
  PageHeader, Modal, Field, Check, DataTable, StatusPill,
  inputCls, useList, fmtDate, savePost, savePatch,
} from '../_components';
import toast from 'react-hot-toast';

export default function PregnancyPage() {
  const { rows, loading, reload } = useList('/compliance/pregnancy-screenings');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const emptyForm = {
    patientId: '',
    labOrderId: '',
    gestationalAgeWeeks: '',
    hasConsentForm: false,
    sexDeterminationDeclarationSigned: false,
    flaggedForReview: false,
    screenedByUserId: '',
    notes: '',
  };
  const [form, setForm] = useState(emptyForm);

  const set = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.patientId || !form.screenedByUserId) {
      toast.error('Patient ID and screened-by user are required');
      return;
    }
    if (!form.sexDeterminationDeclarationSigned) {
      toast.error('The non-sex-determination declaration must be signed for the screening to pass compliance');
      return;
    }
    await savePost({
      path: '/compliance/pregnancy-screenings',
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
      successMsg: 'Pregnancy screening recorded',
    });
  };

  const toggleFlag = async (id: string, currentlyFlagged: boolean) => {
    // Use setSaving as the togglingId setter — savePatch's finally{} will
    // always call it with false, so the button un-disables even if the
    // request throws (e.g. 403 or network error).
    setTogglingId(id);
    await savePatch({
      path: `/compliance/pregnancy-screenings/${id}`,
      body: { flaggedForReview: !currentlyFlagged },
      setSaving: (active: boolean) => { if (!active) setTogglingId(null); },
      onDone: () => reload(),
      successMsg: currentlyFlagged ? 'Flag cleared' : 'Flagged for review',
    });
  };

  const tableRows = rows.map((r: any) => [
    <span className="text-sm text-slate-700">{fmtDate(r.screenedAt)}</span>,
    <span className="font-mono text-xs text-slate-600">{r.patientId?.slice(0, 8)}…</span>,
    <span className="text-sm text-slate-700">{r.gestationalAgeWeeks ? `${r.gestationalAgeWeeks}w` : '—'}</span>,
    r.hasConsentForm
      ? <StatusPill label="Consent form" tone="good" />
      : <StatusPill label="No consent" tone="bad" />,
    r.sexDeterminationDeclarationSigned
      ? <StatusPill label="Declaration signed" tone="good" />
      : <StatusPill label="Not signed" tone="bad" />,
    r.flaggedForReview
      ? <StatusPill label="Flagged" tone="warn" />
      : <StatusPill label="OK" tone="good" />,
    <button
      onClick={() => toggleFlag(r.id, r.flaggedForReview)}
      disabled={togglingId === r.id}
      className="text-xs font-semibold text-[#0D7C66] hover:text-[#0A5E4F] disabled:opacity-50"
    >
      {togglingId === r.id ? '…' : r.flaggedForReview ? 'Clear flag' : 'Flag for review'}
    </button>,
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Pregnancy Screenings"
        subtitle="PC-PNDT sex-determination safeguard. Patient must sign the non-sex-determination declaration before any prenatal procedure."
        actionLabel="New Screening"
        onAction={() => setShowForm(true)}
      />

      <DataTable
        columns={['Screened', 'Patient', 'Gest. Age', 'Consent', 'Declaration', 'Status', 'Action']}
        rows={tableRows}
        loading={loading}
        empty="No screenings recorded yet. Click 'New Screening' to record the first one."
      />

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="New Pregnancy Screening"
        saving={saving}
        onSave={submit}
        saveLabel="Record Screening"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Patient ID" required>
            <input className={inputCls} value={form.patientId} onChange={set('patientId')} placeholder="Patient UUID" />
          </Field>
          <Field label="Gestational Age (weeks)">
            <input type="number" min="1" max="42" className={inputCls} value={form.gestationalAgeWeeks} onChange={set('gestationalAgeWeeks')} />
          </Field>
          <Field label="Lab Order ID" span={2}>
            <input className={inputCls} value={form.labOrderId} onChange={set('labOrderId')} placeholder="Optional — links screening to a specific order" />
          </Field>
          <Field label="Screened By (User ID)" required span={2}>
            <input className={inputCls} value={form.screenedByUserId} onChange={set('screenedByUserId')} placeholder="Staff member who conducted the screening" />
          </Field>

          <div className="md:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Compliance Declarations</div>
            <Check
              label="Patient has provided a signed consent form for the prenatal procedure."
              value={form.hasConsentForm}
              onChange={(v) => setForm((f) => ({ ...f, hasConsentForm: v }))}
            />
            <Check
              label="Patient has signed the non-sex-determination declaration as required under PC-PNDT Act, 1994."
              value={form.sexDeterminationDeclarationSigned}
              onChange={(v) => setForm((f) => ({ ...f, sexDeterminationDeclarationSigned: v }))}
            />
            <Check
              label="Flag for clinical review (optional — blocks report release until cleared)."
              value={form.flaggedForReview}
              onChange={(v) => setForm((f) => ({ ...f, flaggedForReview: v }))}
            />
          </div>

          <Field label="Notes" span={2}>
            <textarea className={`${inputCls} min-h-[70px] resize-y`} value={form.notes} onChange={set('notes')} placeholder="Optional context for reviewer" />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
