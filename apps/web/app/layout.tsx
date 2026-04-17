import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import '@/styles/globals.css';
import { Toaster } from 'react-hot-toast';
import GlobalHeader from '@/components/layout/GlobalHeader';
import GlobalFooter from '@/components/layout/GlobalFooter';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400','500','600','700','800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'HospiBot - Healthcare Operating System',
  description: 'WhatsApp-driven healthcare management platform for hospitals, clinics, and doctors.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={poppins.className} style={{ margin:0, padding:0 }}>
        <GlobalHeader />
        <main style={{ minHeight: 'calc(100vh - 64px)' }}>
          {children}
        </main>
        <GlobalFooter />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              background: '#1E293B',
              color: '#fff',
              fontSize: '14px',
              fontFamily: "'Poppins', sans-serif",
            },
          }}
        />
      </body>
    </html>
  );
}
