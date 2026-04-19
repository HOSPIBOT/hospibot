'use client';
import React, { useState, useMemo } from 'react';
import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
import { PageHeader, DataTable, StatusPill, useList, fmtDate, TEAL } from '../compliance/_components';

export default function Page() {
  const gate = useFeatureGate('radiologist-panel');
  if (gate.locked) return <FeatureLockedBlock gate={gate} />;
  const { rows, total, loading, page, setPage } = useList('/diagnostic/radiologist-panel');
  const columns = useMemo(() => [
    { key: 'createdAt', label: 'Date', render: (r: any) => fmtDate(r.createdAt) },
    { key: 'title', label: 'Title' },
    { key: 'status', label: 'Status', render: (r: any) => <StatusPill status={r.status} map={{ active: { bg: '#ecfdf5', fg: '#059669', label: 'Active' }, draft: { bg: '#f1f5f9', fg: '#475569', label: 'Draft' }, completed: { bg: '#dbeafe', fg: '#1e40af', label: 'Completed' }, planned: { bg: '#fef3c7', fg: '#92400e', label: 'Planned' }, received: { bg: '#e0e7ff', fg: '#4338ca', label: 'Received' }, assigned: { bg: '#fef3c7', fg: '#92400e', label: 'Assigned' } }} /> },
  ], []);
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader title="Radiologist Panel — Assignment & TAT" subtitle="Workload Distribution · Priority Queue · Turnaround Tracking" />
      <DataTable columns={columns} rows={rows} loading={loading} total={total} page={page} onPageChange={setPage} emptyMessage="No records yet. This feature is ready for data entry." />
    </div>
  );
}
