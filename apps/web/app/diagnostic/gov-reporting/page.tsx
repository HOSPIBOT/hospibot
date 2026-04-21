'use client';
import Link from 'next/link';

const reports = [
  { href: '/diagnostic/dghs-reporting', title: 'DGHS Reporting', desc: 'Directorate General of Health Services — notifiable disease reporting' },
  { href: '/diagnostic/icmr-naco', title: 'ICMR / NACO Reports', desc: 'Blood safety, AMR surveillance, HIV/AIDS program reporting' },
  { href: '/diagnostic/cdsco-reports', title: 'CDSCO Reports', desc: 'Central Drugs Standard Control Organization — IVD device reporting' },
];

export default function GovReportingPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-slate-800 mb-1">Government Reporting</h1>
      <p className="text-sm text-slate-500 mb-6">Submit regulatory reports to government health authorities</p>
      <div className="space-y-3">
        {reports.map(r => (
          <Link key={r.href} href={r.href}
            className="block p-4 rounded-xl border border-gray-200 bg-white hover:border-[#0D7C66] hover:bg-[#E8F5F0] transition-all">
            <div className="font-semibold text-sm text-slate-800">{r.title}</div>
            <div className="text-xs text-slate-500 mt-1">{r.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
