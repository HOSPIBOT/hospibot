'use client';
import React, { useMemo } from 'react';
import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
import { PageHeader, DataTable, StatusPill, useList, fmtDate, TEAL } from '../compliance/_components';

export default function Page() {
  const gate = useFeatureGate('allergen-panels');
  if (gate.locked) return <FeatureLockedBlock gate={gate} />;
  const { rows, total, loading, page, setPage } = useList('/diagnostic/allergen-panels');
  const columns = useMemo(() => [
    { key: 'createdAt', label: 'Date', render: (r: any) => fmtDate(r.createdAt) },
    { key: 'title', label: 'Title' },
    { key: 'status', label: 'Status', render: (r: any) => <StatusPill status={r.status} map={{ active: { bg: '#ecfdf5', fg: '#059669', label: 'Active' }, draft: { bg: '#f1f5f9', fg: '#475569', label: 'Draft' }, completed: { bg: '#dbeafe', fg: '#1e40af', label: 'Completed' }, planned: { bg: '#fef3c7', fg: '#92400e', label: 'Planned' }, pending: { bg: '#fef3c7', fg: '#92400e', label: 'Pending' }, reported: { bg: '#ecfdf5', fg: '#059669', label: 'Reported' } }} /> },
  ], []);
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader title="Allergen Panels" subtitle="Respiratory/Food/Drug Panels · Result Interpretation" />
      <DataTable columns={columns} rows={rows} loading={loading} total={total} page={page} onPageChange={setPage} emptyMessage="No records yet." />
    </div>
  );
}
