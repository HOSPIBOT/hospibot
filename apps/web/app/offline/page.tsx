export default function OfflinePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', background: '#E8F5F0', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📡</div>
      <h1 style={{ color: '#0D7C66', fontSize: '2rem', marginBottom: '0.5rem' }}>You&apos;re Offline</h1>
      <p style={{ color: '#1E293B', fontSize: '1.1rem', textAlign: 'center', maxWidth: '400px', marginBottom: '1.5rem' }}>
        HospiBot needs an internet connection. Your recent data is cached and any changes you made will sync automatically when you&apos;re back online.
      </p>
      <button onClick={() => window.location.reload()} style={{ background: '#0D7C66', color: 'white', border: 'none', padding: '12px 32px', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer' }}>
        Try Again
      </button>
    </div>
  );
}
