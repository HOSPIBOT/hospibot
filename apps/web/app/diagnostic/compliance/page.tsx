'use client';

/**
 * Compliance Center — hub page for the diagnostic portal.
 *
 * Surfaces the aggregate `/api/v1/compliance/status` response as status
 * tiles, then offers navigation cards into each of the 6 regulatory
 * surfaces (Form F, AERB, Pregnancy Screenings, Mammo Operator QC, BMW,
 * Biosafety). Operators land here to see at-a-glance whether they can
 * release diagnostic reports.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  FileText, Radiation, Baby, Microscope, Trash2, FlaskConical,
  ShieldCheck, ShieldAlert, Clock, Loader2, ArrowRight,
} from 'lucide-react';
import { TEAL, fmtDateTime } from './_components';

type ComplianceStatus = {
  bmw: { latestLogDate: string | null; isCurrent: boolean; maxAgeHours: number };
  biosafety: { latestChecklistDate: string | null; isCurrent: boolean; isPassing: boolean; maxAgeDays: number };
  pcpndt: { pendingSubmissionCount: number };
  pregnancyScreenings: { flaggedForReviewCount: number };
};

const SURFACES = [
  {
    href: '/diagnostic/compliance/form-f',
    icon: FileText,
    title: 'PC-PNDT Form F',
    blurb: 'Mandatory form for every prenatal imaging procedure. Required before the report can be released.',
    law: 'PC-PNDT Act, 1994',
  },
  {
    href: '/diagnostic/compliance/aerb',
    icon: Radiation,
    title: 'AERB Dose Entries',
    blurb: 'Log radiation dose for every X-ray, CT, mammography, fluoroscopy and nuclear-medicine exam.',
    law: 'Atomic Energy (Radiation Protection) Rules, 2004',
  },
  {
    href: '/diagnostic/compliance/pregnancy',
    icon: Baby,
    title: 'Pregnancy Screenings',
    blurb: 'PC-PNDT sex-determination safeguard — patient-signed declaration and consent form.',
    law: 'PC-PNDT Act, 1994',
  },
  {
    href: '/diagnostic/compliance/mammo',
    icon: Microscope,
    title: 'Mammography Operator QC',
    blurb: 'Operator certification + daily phantom-image QC. Required before every mammo report release.',
    law: 'AERB Mammography Guidelines',
  },
  {
    href: '/diagnostic/compliance/bmw',
    icon: Trash2,
    title: 'Bio-Medical Waste Log',
    blurb: 'Daily segregation log — yellow / red / white / blue bags + CPCB-authorized disposer receipt.',
    law: 'BMW Management Rules, 2016',
  },
  {
    href: '/diagnostic/compliance/biosafety',
    icon: FlaskConical,
    title: 'Biosafety Checklist',
    blurb: 'Weekly BSL-2 compliance — BSC-II, PPE, spill kits, eyewash, autoclave spore test, training log.',
    law: 'ICMR Biosafety Guidelines',
  },
];

export default function ComplianceCenterPage() {
  const [status, setStatus] = useState<ComplianceStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/compliance/status');
        setStatus(res.data);
      } catch {
        setStatus(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Compliance Center</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-3xl">
          Regulatory hard-blocks for diagnostic operations in India. A report cannot be signed & released
          unless every applicable surface below is current and passing.
        </p>
      </div>

      {/* Status tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatusTile
          icon={Trash2}
          label="BMW Waste Log"
          loading={loading}
          status={
            !status ? 'neutral'
            : status.bmw.isCurrent ? 'good'
            : 'bad'
          }
          primary={status?.bmw.isCurrent ? 'Current' : 'Overdue'}
          secondary={
            status?.bmw.latestLogDate
              ? `Last: ${fmtDateTime(status.bmw.latestLogDate)}`
              : 'No logs filed yet'
          }
        />
        <StatusTile
          icon={FlaskConical}
          label="Biosafety"
          loading={loading}
          status={
            !status ? 'neutral'
            : status.biosafety.isCurrent && status.biosafety.isPassing ? 'good'
            : status.biosafety.isCurrent && !status.biosafety.isPassing ? 'bad'
            : 'warn'
          }
          primary={
            !status ? ''
            : status.biosafety.isCurrent && status.biosafety.isPassing ? 'Passing'
            : status.biosafety.isCurrent && !status.biosafety.isPassing ? 'Failing'
            : 'Overdue'
          }
          secondary={
            status?.biosafety.latestChecklistDate
              ? `Last: ${fmtDateTime(status.biosafety.latestChecklistDate)}`
              : 'No checklists filed yet'
          }
        />
        <StatusTile
          icon={FileText}
          label="Form F Pending"
          loading={loading}
          status={
            !status ? 'neutral'
            : status.pcpndt.pendingSubmissionCount === 0 ? 'good'
            : 'warn'
          }
          primary={String(status?.pcpndt.pendingSubmissionCount ?? 0)}
          secondary="Unsubmitted to Authority"
        />
        <StatusTile
          icon={Baby}
          label="Flagged Screenings"
          loading={loading}
          status={
            !status ? 'neutral'
            : status.pregnancyScreenings.flaggedForReviewCount === 0 ? 'good'
            : 'warn'
          }
          primary={String(status?.pregnancyScreenings.flaggedForReviewCount ?? 0)}
          secondary="Awaiting clinical review"
        />
      </div>

      {/* Surface cards */}
      <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">Regulatory Surfaces</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SURFACES.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group bg-white rounded-2xl border border-slate-200 hover:border-[#0D7C66] hover:shadow-md p-5 transition-all"
          >
            <div className="flex items-start gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${TEAL}15` }}
              >
                <s.icon className="w-5 h-5" style={{ color: TEAL }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-bold text-slate-900 group-hover:text-[#0D7C66] transition-colors">
                  {s.title}
                </div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold mt-0.5">
                  {s.law}
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">{s.blurb}</p>
            <div className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D7C66] group-hover:gap-2 transition-all">
              Open
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        ))}
      </div>

      {/* Hard-block explainer */}
      <div className="mt-8 p-5 rounded-2xl bg-amber-50 border border-amber-200">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-amber-900 mb-1">How the hard-block works</div>
            <p className="text-sm text-amber-800 leading-relaxed">
              When you click <strong>Sign &amp; Release</strong> on a diagnostic report, the system automatically
              verifies every applicable surface above. If any gate fails, the release is blocked with a specific
              error message telling you exactly which record to file — no partial state changes happen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusTile({
  icon: Icon,
  label,
  loading,
  status,
  primary,
  secondary,
}: {
  icon: any;
  label: string;
  loading: boolean;
  status: 'good' | 'warn' | 'bad' | 'neutral';
  primary: string;
  secondary: string;
}) {
  const tones: Record<string, { bg: string; text: string; iconColor: string }> = {
    good: { bg: 'bg-emerald-50', text: 'text-emerald-700', iconColor: '#10b981' },
    warn: { bg: 'bg-amber-50', text: 'text-amber-700', iconColor: '#F59E0B' },
    bad: { bg: 'bg-red-50', text: 'text-red-700', iconColor: '#ef4444' },
    neutral: { bg: 'bg-slate-50', text: 'text-slate-600', iconColor: '#64748b' },
  };
  const tone = tones[status];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</div>
        <div className={`w-8 h-8 rounded-lg ${tone.bg} flex items-center justify-center`}>
          <Icon className="w-4 h-4" style={{ color: tone.iconColor }} />
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-7 w-24 bg-slate-100 rounded animate-pulse" />
          <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
        </div>
      ) : (
        <>
          <div className={`text-2xl font-bold ${tone.text} mb-1`}>{primary}</div>
          <div className="text-xs text-slate-500">{secondary}</div>
        </>
      )}
    </div>
  );
}
