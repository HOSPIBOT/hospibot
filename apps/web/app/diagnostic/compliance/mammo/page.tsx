'use client';

/**
 * Mammography operator logs — list + create.
 *
 * Each mammography operator needs: (1) valid, non-expired certification,
 * (2) a passing daily phantom-image QC within the last 24 hours. Both are
 * checked before any mammography report can be signed & released.
 */

import { useState } from 'react';
import {
  PageHeader, Modal, Field, Check, DataTable, StatusPill,
  inputCls, useList, fmtDate, today, savePost,
} from '../_components';
import toast from 'react-hot-toast';

export default function MammoPage() {
  const { rows, loading, reload } = useList('/compliance/mammography/operator-logs');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    operatorUserId: '',
    certificationNumber: '',
    certificationExpiresAt: '',
    dailyQcDate: today(),
    dailyQcPassed: true,
    phantomImageScore: '',
    notes: '',
  };
  const [form, setForm] = useState(emptyForm);

  const set = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.operatorUserId || !form.certificationNumber || !form.certificationExpiresAt || !form.dailyQcDate) {
      toast.error('Operator, certification, expiry, and QC date are required');
      return;
    }
    await savePost({
      path: '/compliance/mammography/operator-logs',
      body: {
        ...form,
        phantomImageScore: form.phantomImageScore ? Number(form.phantomImageScore) : null,
      },
      setSaving,
      onDone: () => {
        setShowForm(false);
        setForm(emptyForm);
        reload();
      },
      successMsg: 'Operator log recorded',
    });
  };

  // Certification status: expired / expiring in 30d / valid
  const certStatus = (expiresAt: string) => {
    const now = Date.now();
    const exp = new Date(expiresAt).getTime();
    const daysLeft = Math.floor((exp - now) / 86400_000);
    if (daysLeft < 0) return { tone: 'bad' as const, label: 'Expired' };
    if (daysLeft < 30) return { tone: 'warn' as const, label: `${daysLeft}d left` };
    return { tone: 'good' as const, label: 'Valid' };
  };

  const tableRows = rows.map((r: any) => {
    const cs = certStatus(r.certificationExpiresAt);
    return [
      <span className="font-mono text-xs text-slate-600">{r.operatorUserId?.slice(0, 8)}…</span>,
      <div>
        <div className="font-mono text-sm text-slate-700">{r.certificationNumber}</div>
        <div className="text-xs text-slate-400">Exp. {fmtDate(r.certificationExpiresAt)}</div>
      </div>,
      <StatusPill label={cs.label} tone={cs.tone} />,
      <span className="text-sm text-slate-700">{fmtDate(r.dailyQcDate)}</span>,
      r.dailyQcPassed
        ? <StatusPill label="Pass" tone="good" />
        : <StatusPill label="Fail" tone="bad" />,
      <span className="font-mono text-sm text-slate-900">
        {r.phantomImageScore != null ? `${r.phantomImageScore}/100` : '—'}
      </span>,
      <span className="text-xs text-slate-500">{fmtDate(r.createdAt)}</span>,
    ];
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Mammography Operator QC"
        subtitle="Operator certification + daily phantom-image QC. Mandatory before every mammography report is released."
        actionLabel="New Operator Log"
        onAction={() => setShowForm(true)}
      />

      <DataTable
        columns={['Operator', 'Certification', 'Cert Status', 'QC Date', 'QC Result', 'Phantom Score', 'Logged']}
        rows={tableRows}
        loading={loading}
        empty="No operator logs recorded yet. Click 'New Operator Log' to record the first one."
      />

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="New Mammography Operator Log"
        saving={saving}
        onSave={submit}
        saveLabel="Save Log"
        wide
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Operator User ID" required span={2}>
            <input className={inputCls} value={form.operatorUserId} onChange={set('operatorUserId')} placeholder="Staff member performing mammograms" />
          </Field>
          <Field label="Certification Number" required>
            <input className={inputCls} value={form.certificationNumber} onChange={set('certificationNumber')} placeholder="e.g. AERB-MAMMO-2025-1234" />
          </Field>
          <Field label="Certification Expires At" required>
            <input type="date" className={inputCls} value={form.certificationExpiresAt} onChange={set('certificationExpiresAt')} />
          </Field>

          <div className="md:col-span-2 pt-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Daily Phantom-Image QC</div>
          </div>

          <Field label="QC Date" required>
            <input type="date" className={inputCls} value={form.dailyQcDate} onChange={set('dailyQcDate')} />
          </Field>
          <Field label="Phantom Image Score (0–100)">
            <input type="number" min="0" max="100" className={inputCls} value={form.phantomImageScore} onChange={set('phantomImageScore')} />
          </Field>
          <div className="md:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <Check
              label="Daily phantom-image QC passed — image quality meets AERB standards for this date."
              value={form.dailyQcPassed}
              onChange={(v) => setForm((f) => ({ ...f, dailyQcPassed: v }))}
            />
          </div>
          <Field label="Notes" span={2}>
            <textarea className={`${inputCls} min-h-[60px] resize-y`} value={form.notes} onChange={set('notes')} placeholder="Optional — QC deviations, equipment observations" />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
