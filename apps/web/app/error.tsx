'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('HospiBot error:', error);
  }, [error]);

  return (
    <html>
      <body className="bg-[#F8FAFC]">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">Something went wrong</h1>
            <p className="text-slate-500 text-sm leading-relaxed mb-2">
              An unexpected error occurred. Our team has been notified.
            </p>
            {error?.digest && (
              <p className="text-xs text-slate-400 font-mono bg-slate-100 px-3 py-1.5 rounded-lg inline-block mb-6">
                Error ID: {error.digest}
              </p>
            )}
            <div className="flex items-center justify-center gap-3 mt-6">
              <button onClick={reset}
                className="bg-[#0D7C66] text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-[#0A5E4F] transition-colors text-sm">
                Try Again
              </button>
              <a href="/clinical/dashboard"
                className="border border-slate-200 text-slate-600 font-semibold px-6 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm">
                Dashboard
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
