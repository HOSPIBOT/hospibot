'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, Download, Share2, FlaskConical, AlertCircle } from 'lucide-react';

const NAVY = '#1E3A5F';

export default function ReportViewerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params?.orderId as string;
  const token = searchParams?.get('token') ?? '';

  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return;
    // Try to load report HTML — requires token
    api.get(`/diagnostic/orders/${orderId}/report-html`, { params: { token } })
      .then(r => {
        if (typeof r.data === 'string') {
          setHtml(r.data);
        }
      })
      .catch(err => {
        setError(err?.response?.data?.message || 'Report not found or link expired');
      })
      .finally(() => setLoading(false));
  }, [orderId, token]);

  const handlePrint = () => window.print();

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Lab Report', url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Report link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#1E3A5F] animate-spin mx-auto mb-4" />
          <p className="font-semibold text-slate-600">Loading your report…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-10 max-w-md text-center shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Report Unavailable</h1>
          <p className="text-slate-500 text-sm">{error}</p>
          <p className="text-xs text-slate-400 mt-3">This link may have expired or the report hasn't been released yet.</p>
          <p className="text-xs text-slate-400 mt-1">Contact your lab for a fresh link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Sticky action bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: NAVY }}>
            <FlaskConical className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Lab Test Report</p>
            <p className="text-xs text-slate-400">Powered by HospiBot</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleShare}
            className="flex items-center gap-2 text-slate-600 text-sm font-semibold px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button onClick={handlePrint}
            className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
            style={{ background: NAVY }}>
            <Download className="w-4 h-4" /> Download / Print
          </button>
        </div>
      </div>

      {/* Report HTML */}
      <div className="py-6 px-4 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {html ? (
            <div dangerouslySetInnerHTML={{ __html: html }}
              className="report-content" />
          ) : (
            <div className="p-16 text-center text-slate-400">
              <FlaskConical className="w-12 h-12 mx-auto mb-4 text-slate-200" />
              <p className="font-semibold text-slate-500">Report content not available</p>
              <p className="text-sm mt-1">Please contact your lab for your report.</p>
            </div>
          )}
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .report-content { padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
