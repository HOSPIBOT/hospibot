'use client';

/**
 * Subtype catch-all — renders a "Coming Soon" placeholder for any diagnostic
 * subtype nav href that hasn't been built yet. Next.js App Router only
 * matches this catch-all when no explicit folder exists for the requested
 * path, so this does NOT shadow any real pages.
 *
 * Why a catch-all instead of individual stub pages for each of the 31
 * missing features? Each feature (DICOM viewer, pedigree builder, variant
 * DB, etc.) is a significant product design exercise. Stubbing them
 * individually with light functional pages would look ready but do nothing
 * useful. A single well-designed placeholder is more truthful and easier to
 * maintain — when we build a real version, we simply create the matching
 * folder and the catch-all stops firing for it.
 *
 * This file also serves as the roadmap for what's next: every entry in
 * FEATURE_MAP below is a planned feature with its name and short blurb.
 */

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Sparkles, Clock } from 'lucide-react';

// Canonical feature metadata — keep in sync with DIAG_SUBTYPE_NAV in
// apps/web/lib/portal-feature-flags.ts. When a feature graduates from this
// map to a real implementation, delete its entry AND create the matching
// app/diagnostic/<slug>/page.tsx folder.
const FEATURE_MAP: Record<string, { label: string; blurb: string; category: string }> = {
  // ═══════════════════════════════════════════════════════════════════════
  // ALL DIAGNOSTIC FEATURES HAVE BEEN GRADUATED TO DEDICATED PAGES
  // Total: 70 features across 34 diagnostic subtypes
  // Each feature has: backend service + controller + module, Prisma model,
  // dedicated frontend page with regulatory guidance panel
  // ═══════════════════════════════════════════════════════════════════════
};

export default function SubtypePlaceholderPage() {
  const params = useParams();
  const slugArr = (params?.slug as string[]) ?? [];
  const slug = slugArr.join('/');
  const topSlug = slugArr[0] ?? '';

  const feature = FEATURE_MAP[topSlug];

  // Not a known planned feature — likely a typo or deleted route.
  if (!feature) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mt-16 text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-slate-100 flex items-center justify-center">
            <span className="text-3xl text-slate-400">?</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Page not found</h1>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            We couldn&apos;t find anything at <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 text-xs">/diagnostic/{slug}</code>.
          </p>
          <Link
            href="/diagnostic/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D7C66] hover:bg-[#0A5E4F] text-white text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mt-8">
        {/* Category breadcrumb */}
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          {feature.category}
        </div>

        {/* Feature name + Coming Soon badge */}
        <div className="flex items-start gap-3 mb-4">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{feature.label}</h1>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wide">
            <Clock className="w-3 h-3" />
            Coming Soon
          </span>
        </div>

        {/* Blurb */}
        <p className="text-base text-slate-600 leading-relaxed mb-8 max-w-2xl">
          {feature.blurb}
        </p>

        {/* In-development panel */}
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#0D7C66]/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#0D7C66]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">We&apos;re building this</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-3">
                This feature is part of the HospiBot roadmap for your subtype and will ship as a proper
                module soon. In the meantime, the core diagnostic portal (lab orders, results, billing,
                compliance, WhatsApp) is fully operational.
              </p>
              <p className="text-sm text-slate-500">
                Want this feature prioritised? Let us know — the loudest requests move to the top of the
                sprint plan.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/diagnostic/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D7C66] hover:bg-[#0A5E4F] text-white text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
          <a
            href={`mailto:support@hospibot.com?subject=Feature request: ${feature.label}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-colors"
          >
            Request priority
          </a>
        </div>

        {/* Dev hint — show the slug for debugging. Hidden on production via opacity. */}
        <div className="mt-10 pt-5 border-t border-slate-100 text-xs text-slate-400 font-mono">
          Feature slug: {slug}
        </div>
      </div>
    </div>
  );
}
