'use client';

/**
 * RegulatoryGuidance — renders a collapsible regulatory information panel
 * on every feature page. Shows which law, regulatory body, and compliance
 * rules govern the feature. Required by HospiBot dev protocol.
 *
 * Usage:
 *   <RegulatoryGuidance
 *     title="Donor Registration Compliance"
 *     body="NACO Standards for Blood Banks & BTS"
 *     regulations={[
 *       { body: 'NACO', citation: 'Standards for Blood Banks, Section B: Donor Selection', requirement: 'Age 18-65, Hb ≥12.5 g/dL...' },
 *     ]}
 *   />
 */

import { useState } from 'react';
import { ShieldCheck, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

export interface Regulation {
  /** Regulatory body name (e.g. "NACO", "DGHS", "NABL", "AERB") */
  body: string;
  /** Specific citation (e.g. "D&C Rules 1945, Schedule F Part XII-B") */
  citation: string;
  /** What the operator must do / what the feature enforces */
  requirement: string;
  /** Optional link to the actual regulation */
  url?: string;
}

interface Props {
  title: string;
  regulations: Regulation[];
  /** Brief description of why this guidance matters */
  summary?: string;
}

export function RegulatoryGuidance({ title, regulations, summary }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-6 rounded-xl border border-teal-100 bg-teal-50/40">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-bold text-teal-900">{title}</div>
          {summary && !expanded && (
            <div className="text-xs text-teal-700 mt-0.5 line-clamp-1">{summary}</div>
          )}
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-teal-600" />
          : <ChevronDown className="w-4 h-4 text-teal-600" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {summary && (
            <p className="text-xs text-teal-800 leading-relaxed">{summary}</p>
          )}

          {regulations.map((reg, i) => (
            <div key={i} className="rounded-lg bg-white border border-teal-100 p-3">
              <div className="flex items-start gap-2 mb-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800 shrink-0">
                  {reg.body}
                </span>
                <span className="text-xs font-semibold text-slate-700">{reg.citation}</span>
                {reg.url && (
                  <a href={reg.url} target="_blank" rel="noopener noreferrer"
                    className="ml-auto text-teal-600 hover:text-teal-800">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{reg.requirement}</p>
            </div>
          ))}

          <p className="text-[10px] text-teal-600 mt-2 italic">
            This guidance is provided for operator awareness. HospiBot enforces applicable rules
            server-side where legally mandated. Consult your legal advisor for jurisdiction-specific
            requirements.
          </p>
        </div>
      )}
    </div>
  );
}
