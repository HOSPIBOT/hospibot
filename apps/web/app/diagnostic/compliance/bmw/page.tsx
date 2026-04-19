'use client';

/**
 * Bio-Medical Waste (BMW) daily logs — list + create.
 *
 * Required under BMW Management Rules, 2016. Daily category-wise weight
 * (yellow/red/white/blue bags) must be logged with a CPCB-authorized
 * disposer's name and receipt number. The most recent log must be within
 * 24 hours before any diagnostic report can be released.
 */

import { useState } from 'react';
import {
  PageHeader, Modal, Field, DataTable, inputCls, useList, fmtDate, today, savePost,
} from '../_components';
import toast from 'react-hot-toast';

export default function BmwPage() {
  const { rows, loading, reload } = useList('/compliance/bmw/waste-logs');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    branchId: '',
    logDate: today(),
    yellowBagKg: '',
    redBagKg: '',
    whiteBagKg: '',
    blueBagKg: '',
    authorizedDisposerName: '',
    authorizedDisposerReceipt: '',
    loggedByUserId: '',
    notes: '',
  };
  const [form, setForm] = useState(emptyForm);

  const set = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.logDate || !form.authorizedDisposerName || !form.authorizedDisposerReceipt || !form.loggedByUserId) {
      toast.error('Log date, disposer name, receipt number, and logged-by user are required');
      return;
    }
    await savePost({
      path: '/compliance/bmw/waste-logs',
      body: {
        ...form,
        branchId: form.branchId || null,
        yellowBagKg: Number(form.yellowBagKg || 0),
        redBagKg: Number(form.redBagKg || 0),
        whiteBagKg: Number(form.whiteBagKg || 0),
        blueBagKg: Number(form.blueBagKg || 0),
      },
      setSaving,
      onDone: () => {
        setShowForm(false);
        setForm(emptyForm);
        reload();
      },
      successMsg: 'BMW log filed',
    });
  };

  const tableRows = rows.map((r: any) => {
    const total = Number(r.yellowBagKg) + Number(r.redBagKg) + Number(r.whiteBagKg) + Number(r.blueBagKg);
    return [
      <span className="text-sm font-medium text-slate-900">{fmtDate(r.logDate)}</span>,
      <div className="flex items-center gap-1.5">
        <BagChip color="#EAB308" label="Y" value={r.yellowBagKg} />
        <BagChip color="#DC2626" label="R" value={r.redBagKg} />
        <BagChip color="#64748B" label="W" value={r.whiteBagKg} />
        <BagChip color="#2563EB" label="B" value={r.blueBagKg} />
      </div>,
      <span className="font-mono text-sm text-slate-900 font-semibold">{total.toFixed(2)} kg</span>,
      <div>
        <div className="text-sm text-slate-700">{r.authorizedDisposerName}</div>
        <div className="text-xs text-slate-400 font-mono">Receipt: {r.authorizedDisposerReceipt}</div>
      </div>,
      <span className="font-mono text-xs text-slate-600">{r.loggedByUserId?.slice(0, 8)}…</span>,
      <span className="text-xs text-slate-500">{fmtDate(r.createdAt)}</span>,
    ];
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Bio-Medical Waste Log"
        subtitle="Daily category-wise waste segregation log. Mandatory under BMW Management Rules, 2016."
        actionLabel="New Daily Log"
        onAction={() => setShowForm(true)}
      />

      <DataTable
        columns={['Date', 'Bags (Y/R/W/B)', 'Total', 'Authorized Disposer', 'Logged By', 'Filed']}
        rows={tableRows}
        loading={loading}
        empty="No BMW logs filed yet. Click 'New Daily Log' to file the first segregation log."
      />

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="New BMW Daily Segregation Log"
        saving={saving}
        onSave={submit}
        saveLabel="File Log"
        wide
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Log Date" required>
            <input type="date" className={inputCls} value={form.logDate} onChange={set('logDate')} />
          </Field>
          <Field label="Branch ID">
            <input className={inputCls} value={form.branchId} onChange={set('branchId')} placeholder="Optional — leave blank for main branch" />
          </Field>

          <div className="md:col-span-2 pt-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Category Weights (kg)</div>
          </div>

          <BagInput label="Yellow — Anatomical / Contaminated" color="#EAB308" value={form.yellowBagKg} onChange={set('yellowBagKg')} />
          <BagInput label="Red — Plastic / Contaminated" color="#DC2626" value={form.redBagKg} onChange={set('redBagKg')} />
          <BagInput label="White — Sharps" color="#64748B" value={form.whiteBagKg} onChange={set('whiteBagKg')} />
          <BagInput label="Blue — Glass / Metal" color="#2563EB" value={form.blueBagKg} onChange={set('blueBagKg')} />

          <div className="md:col-span-2 pt-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">CPCB-Authorized Disposer</div>
          </div>

          <Field label="Disposer Name" required>
            <input className={inputCls} value={form.authorizedDisposerName} onChange={set('authorizedDisposerName')} placeholder="e.g. Medicare Environment Ltd." />
          </Field>
          <Field label="Receipt Number" required>
            <input className={inputCls} value={form.authorizedDisposerReceipt} onChange={set('authorizedDisposerReceipt')} placeholder="e.g. MEL-2026-04-1234" />
          </Field>
          <Field label="Logged By (User ID)" required span={2}>
            <input className={inputCls} value={form.loggedByUserId} onChange={set('loggedByUserId')} placeholder="Staff member filing this log" />
          </Field>
          <Field label="Notes" span={2}>
            <textarea className={`${inputCls} min-h-[60px] resize-y`} value={form.notes} onChange={set('notes')} placeholder="Optional — anomalies, special disposal events" />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

function BagChip({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold"
      style={{ background: `${color}18`, color }}
      title={`${label} bag`}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {Number(value || 0).toFixed(1)}
    </span>
  );
}

function BagInput({ label, color, value, onChange }: { label: string; color: string; value: string; onChange: (e: any) => void }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
        {label}
      </label>
      <input
        type="number"
        step="0.01"
        min="0"
        className={inputCls}
        value={value}
        onChange={onChange}
        placeholder="0.00 kg"
      />
    </div>
  );
}
