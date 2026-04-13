
export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-[#E8F5F0] rounded-3xl flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl">🏥</span>
        </div>
        <h1 className="text-6xl font-black text-[#0D7C66] mb-3">404</h1>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Page Not Found</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          The page you're looking for doesn't exist or has been moved.
          Please check the URL or navigate back to the dashboard.
        </p>
        <div className="flex items-center justify-center gap-3">
          <a href="/clinical/dashboard"
            className="bg-[#0D7C66] text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-[#0A5E4F] transition-colors text-sm">
            Go to Dashboard
          </a>
          <a href="/"
            className="border border-slate-200 text-slate-600 font-semibold px-6 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm">
            Home
          </a>
        </div>
      </div>
    </div>
  );
}
