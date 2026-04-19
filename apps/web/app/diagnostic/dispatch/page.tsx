'use client';

/**
 * Dispatch Manifest — track sample shipments from collection center to lab.
 *
 * Used by: sample-collection-center, home-sample-collection, pickup-point,
 * reference-lab (hub-spoke routing).
 *
 * This is the FIRST diagnostic subtype feature to graduate from the catch-all
 * "Coming Soon" placeholder to a real functional page. The pattern here
 * (list + create modal + status transitions) is the template for all future
 * subtype features.
 */

import { useState } from 'react';
import {
  PageHeader, Modal, Field, DataTable, StatusPill,
  useList, savePost, fmtDate, fmtDateTime, today, errMsg, TEAL,
} from '../compliance/_components';

const STATUS_TONES: Record<string, 'good' | 'warn' | 'bad' | 'neutral'> = {
  PACKING: 'neutral',
  DISPATCHED: 'warn',
  IN_TRANSIT: 'warn',
  RECEIVED: 'good',
  REJECTED: 'bad',
};

const CONTAINER_OPTIONS = [
  { value: 'ice_pack', label: 'Ice Pack' },
  { value: 'dry_ice', label: 'Dry Ice' },
  { value: 'reefer_box', label: 'Reefer Box' },
  { value: 'ambient', label: 'Ambient' },
];

export default function DispatchManifestPage() {
  const { rows, loading, reload } = useList('/dispatch/manifests');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    dispatchDate: today(),
    destinationLabName: '',
    transporterName: '',
    sampleCount: '',
    temperatureAtDispatch: '',
    containerType: 'ice_pack',
    dispatchedByUserId: '',
    notes: '',
  });

  const patch = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const canSave = form.destinationLabName.trim() && Number(form.sampleCount) >= 1 && form.dispatchedByUserId.trim();

  const handleSave = () => {
    if (!canSave) return;
    savePost({
      path: '/dispatch/manifests',
      body: {
        dispatchDate: form.dispatchDate,
        destinationLabName: form.destinationLabName.trim(),
        transporterName: form.transporterName.trim() || null,
        sampleCount: Number(form.sampleCount),
        temperatureAtDispatch: form.temperatureAtDispatch ? Number(form.temperatureAtDispatch) : null,
        containerType: form.containerType || null,
        dispatchedByUserId: form.dispatchedByUserId.trim(),
        notes: form.notes.trim() || null,
      },
      setSaving,
      onDone: () => {
        setOpen(false);
        setForm({
          dispatchDate: today(), destinationLabName: '', transporterName: '',
          sampleCount: '', temperatureAtDispatch: '', containerType: 'ice_pack',
          dispatchedByUserId: '', notes: '',
        });
        reload();
      },
      successMsg: 'Dispatch manifest created',
    });
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const { api } = await import('@/lib/api');
      await api.patch(`/dispatch/manifests/${id}/status`, { status: newStatus });
      const toast = (await import('react-hot-toast')).default;
      toast.success(`Status → ${newStatus}`);
      reload();
    } catch (err) {
      const toast = (await import('react-hot-toast')).default;
      toast.error(errMsg(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const tableRows = rows.map((r: any) => [
    <span className="font-mono text-sm font-bold text-slate-800">{r.manifestNumber}</span>,
    <span className="text-sm text-slate-700">{fmtDate(r.dispatchDate)}</span>,
    <span className="text-sm text-slate-700">{r.destinationLabName}</span>,
    <span className="text-sm text-slate-700 font-semibold">{r.sampleCount}</span>,
    r.containerType
      ? <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
          {CONTAINER_OPTIONS.find(c => c.value === r.containerType)?.label ?? r.containerType}
        </span>
      : <span className="text-slate-400">—</span>,
    r.temperatureAtDispatch != null
      ? <span className="text-sm text-slate-700">{r.temperatureAtDispatch}°C</span>
      : <span className="text-slate-400">—</span>,
    <StatusPill label={r.status.replace(/_/g, ' ')} tone={STATUS_TONES[r.status] ?? 'neutral'} />,
    <div className="flex items-center gap-2">
      {r.status === 'PACKING' && (
        <button
          onClick={() => updateStatus(r.id, 'DISPATCHED')}
          disabled={updatingId === r.id}
          className="text-xs px-2 py-1 rounded-lg font-semibold transition-colors"
          style={{ background: '#E8F5F0', color: TEAL }}
        >
          {updatingId === r.id ? '…' : 'Mark Dispatched →'}
        </button>
      )}
      {r.status === 'DISPATCHED' && (
        <button
          onClick={() => updateStatus(r.id, 'RECEIVED')}
          disabled={updatingId === r.id}
          className="text-xs px-2 py-1 rounded-lg font-semibold transition-colors"
          style={{ background: '#E8F5F0', color: TEAL }}
        >
          {updatingId === r.id ? '…' : 'Mark Received ✓'}
        </button>
      )}
      {r.receivedAt && (
        <span className="text-xs text-slate-400">{fmtDateTime(r.receivedAt)}</span>
      )}
    </div>,
  ]);

  return (
    <div className="p-6">
      <PageHeader
        title="Dispatch Manifests"
        subtitle="Track sample shipments from collection to destination lab"
        onAction={() => setOpen(true)}
        actionLabel="New Manifest"
      />

      <DataTable
        columns={['Manifest #', 'Date', 'Destination', 'Samples', 'Container', 'Temp', 'Status', 'Actions']}
        rows={tableRows}
        loading={loading}
        empty="No dispatch manifests yet — create your first shipment."
      />

      <Modal open={open} onClose={() => setOpen(false)} title="Create Dispatch Manifest" wide
        saving={saving} onSave={handleSave} saveLabel="Create Manifest">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Dispatch Date" required>
            <input type="date" value={form.dispatchDate} onChange={(e) => patch('dispatchDate', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7C66]/30" />
          </Field>

          <Field label="Destination Lab" required>
            <input type="text" value={form.destinationLabName} onChange={(e) => patch('destinationLabName', e.target.value)}
              placeholder="e.g. Metro Central Lab"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7C66]/30" />
          </Field>

          <Field label="Sample Count" required>
            <input type="number" min="1" value={form.sampleCount} onChange={(e) => patch('sampleCount', e.target.value)}
              placeholder="e.g. 25"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7C66]/30" />
          </Field>

          <Field label="Container Type">
            <select value={form.containerType} onChange={(e) => patch('containerType', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7C66]/30">
              {CONTAINER_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Temperature at Dispatch (°C)">
            <input type="number" step="0.1" value={form.temperatureAtDispatch}
              onChange={(e) => patch('temperatureAtDispatch', e.target.value)}
              placeholder="e.g. 4.2"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7C66]/30" />
          </Field>

          <Field label="Transporter Name">
            <input type="text" value={form.transporterName} onChange={(e) => patch('transporterName', e.target.value)}
              placeholder="e.g. Blue Dart / Staff runner"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7C66]/30" />
          </Field>

          <Field label="Dispatched By (User ID)" required>
            <input type="text" value={form.dispatchedByUserId} onChange={(e) => patch('dispatchedByUserId', e.target.value)}
              placeholder="Staff user ID"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7C66]/30" />
          </Field>

          <Field label="Notes">
            <textarea rows={2} value={form.notes} onChange={(e) => patch('notes', e.target.value)}
              placeholder="Special instructions, fragile samples, etc."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7C66]/30" />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
