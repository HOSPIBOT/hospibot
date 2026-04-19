'use client';

import { useState } from 'react';
import {
  PageHeader, Modal, Field, DataTable, StatusPill,
  useList, savePost, fmtDate, today, TEAL,
} from '../compliance/_components';

const CONTAINER_OPTIONS = [
  { value: 'refrigerator_2_8', label: 'Refrigerator (2–8°C)', min: 2, max: 8 },
  { value: 'freezer_minus20', label: 'Freezer (−20°C)', min: -25, max: -15 },
  { value: 'ice_pack', label: 'Ice Pack (2–8°C)', min: 2, max: 8 },
  { value: 'dry_ice', label: 'Dry Ice (−70°C)', min: -80, max: -60 },
  { value: 'reefer_box', label: 'Reefer Box (2–8°C)', min: 2, max: 8 },
  { value: 'ambient', label: 'Ambient (15–25°C)', min: 15, max: 25 },
];

export default function ColdChainLogPage() {
  const { rows, loading, reload } = useList('/cold-chain/logs');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const defaultContainer = CONTAINER_OPTIONS[0];
  const [form, setForm] = useState({
    logDate: today(),
    timeChecked: '',
    containerType: defaultContainer.value,
    temperatureReading: '',
    minAcceptableTemp: String(defaultContainer.min),
    maxAcceptableTemp: String(defaultContainer.max),
    correctionTaken: '',
    checkedByUserId: '',
    notes: '',
  });

  const patch = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Auto-fill min/max when container changes
  const onContainerChange = (val: string) => {
    const c = CONTAINER_OPTIONS.find((o) => o.value === val);
    setForm((f) => ({
      ...f,
      containerType: val,
      minAcceptableTemp: String(c?.min ?? 2),
      maxAcceptableTemp: String(c?.max ?? 8),
    }));
  };

  const temp = Number(form.temperatureReading);
  const min = Number(form.minAcceptableTemp);
  const max = Number(form.maxAcceptableTemp);
  const isOutOfRange = form.temperatureReading !== '' && (temp < min || temp > max);

  const canSave = form.timeChecked && form.temperatureReading !== '' && form.checkedByUserId.trim();

  const handleSave = () => {
    if (!canSave) return;
    savePost({
      path: '/cold-chain/logs',
      body: {
        logDate: form.logDate,
        timeChecked: form.timeChecked,
        containerType: form.containerType,
        temperatureReading: temp,
        minAcceptableTemp: min,
        maxAcceptableTemp: max,
        correctionTaken: isOutOfRange ? form.correctionTaken.trim() || null : null,
        checkedByUserId: form.checkedByUserId.trim(),
        notes: form.notes.trim() || null,
      },
      setSaving,
      onDone: () => {
        setOpen(false);
        setForm({
          logDate: today(), timeChecked: '', containerType: defaultContainer.value,
          temperatureReading: '', minAcceptableTemp: String(defaultContainer.min),
          maxAcceptableTemp: String(defaultContainer.max),
          correctionTaken: '', checkedByUserId: '', notes: '',
        });
        reload();
      },
      successMsg: 'Temperature reading logged',
    });
  };

  const tableRows = rows.map((r: any) => [
    <span className="text-sm text-slate-700">{fmtDate(r.logDate)}</span>,
    <span className="font-mono text-sm text-slate-700">{r.timeChecked}</span>,
    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
      {CONTAINER_OPTIONS.find(c => c.value === r.containerType)?.label ?? r.containerType}
    </span>,
    <span className={`font-mono text-sm font-bold ${r.isWithinRange ? 'text-emerald-700' : 'text-red-600'}`}>
      {r.temperatureReading}°C
    </span>,
    <span className="text-xs text-slate-500">{r.minAcceptableTemp}–{r.maxAcceptableTemp}°C</span>,
    r.isWithinRange
      ? <StatusPill label="In Range" tone="good" />
      : <StatusPill label="EXCURSION" tone="bad" />,
    r.correctionTaken
      ? <span className="text-xs text-slate-600">{r.correctionTaken}</span>
      : <span className="text-slate-400">—</span>,
  ]);

  return (
    <div className="p-6">
      <PageHeader
        title="Cold Chain Log"
        subtitle="Temperature monitoring for sample storage and transport"
        onAction={() => setOpen(true)}
        actionLabel="Log Reading"
      />

      <DataTable
        columns={['Date', 'Time', 'Container', 'Temp', 'Range', 'Status', 'Correction']}
        rows={tableRows}
        loading={loading}
        empty="No temperature readings yet — log your first reading."
      />

      <Modal open={open} onClose={() => setOpen(false)} title="Log Temperature Reading"
        saving={saving} onSave={handleSave} saveLabel="Log Reading" wide>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Log Date" required>
            <input type="date" value={form.logDate} onChange={(e) => patch('logDate', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7C66]/30" />
          </Field>

          <Field label="Time Checked" required>
            <input type="time" value={form.timeChecked} onChange={(e) => patch('timeChecked', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7C66]/30" />
          </Field>

          <Field label="Container / Equipment">
            <select value={form.containerType} onChange={(e) => onContainerChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7C66]/30">
              {CONTAINER_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Temperature Reading (°C)" required>
            <input type="number" step="0.1" value={form.temperatureReading}
              onChange={(e) => patch('temperatureReading', e.target.value)}
              placeholder="e.g. 4.2"
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                isOutOfRange ? 'border-red-300 bg-red-50 focus:ring-red-300' : 'border-slate-200 focus:ring-[#0D7C66]/30'
              }`} />
          </Field>

          {isOutOfRange && (
            <Field label="Correction Action Taken" span={2}>
              <textarea rows={2} value={form.correctionTaken}
                onChange={(e) => patch('correctionTaken', e.target.value)}
                placeholder="Describe corrective action (e.g. replaced ice packs, moved samples to backup fridge)"
                className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300" />
              <p className="mt-1 text-xs text-red-600 font-medium">
                ⚠ Temperature {temp}°C is outside acceptable range ({min}–{max}°C)
              </p>
            </Field>
          )}

          <Field label="Checked By (User ID)" required>
            <input type="text" value={form.checkedByUserId}
              onChange={(e) => patch('checkedByUserId', e.target.value)}
              placeholder="Staff user ID"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7C66]/30" />
          </Field>

          <Field label="Notes">
            <input type="text" value={form.notes} onChange={(e) => patch('notes', e.target.value)}
              placeholder="Optional notes"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7C66]/30" />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
