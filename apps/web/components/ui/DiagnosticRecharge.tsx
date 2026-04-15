'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Zap, Loader2, CheckCircle2, CreditCard } from 'lucide-react';

interface DiagnosticRechargeProps {
  pack: {
    id: string;
    name: string;
    creditsOrUnits: number;
    priceInclGst: number;
    packType: string;
  };
  onSuccess?: () => void;
}

export function DiagnosticRecharge({ pack, onSuccess }: DiagnosticRechargeProps) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const loadRzp = useCallback((): Promise<boolean> => {
    return new Promise(resolve => {
      if ((window as any).Razorpay) { resolve(true); return; }
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });
  }, []);

  const recharge = async () => {
    setLoading(true);
    try {
      const sdkOk = await loadRzp();
      if (!sdkOk) {
        toast.error('Razorpay SDK failed to load. Check internet connection.');
        return;
      }

      // Create Razorpay order via our API
      const { data: order } = await api.post('/diagnostic/billing/recharge', { packId: pack.id });

      if (!order?.orderId) {
        toast.error('Failed to create payment order. Please try again.');
        return;
      }

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'HospiBot Wallet',
        description: pack.name,
        order_id: order.orderId,
        prefill: {
          name: order.tenantName || '',
          email: order.tenantEmail || '',
        },
        theme: { color: '#1E3A5F' },
        modal: {
          ondismiss: () => setLoading(false),
        },
        handler: async (response: any) => {
          try {
            await api.post('/diagnostic/billing/verify-payment', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            setDone(true);
            toast.success(`✅ ${pack.creditsOrUnits} ${pack.packType === 'WHATSAPP' ? 'WA credits' : pack.packType === 'SMS' ? 'SMS' : 'GB'} added to wallet!`);
            onSuccess?.();
          } catch {
            toast.error('Payment verification failed. Contact support@hospibot.in');
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (resp: any) => {
        toast.error(`Payment failed: ${resp.error.description}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl text-sm font-semibold">
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
        Wallet Credited — {pack.creditsOrUnits} {pack.packType === 'WHATSAPP' ? 'credits' : pack.packType === 'SMS' ? 'SMS' : 'GB'}
      </div>
    );
  }

  return (
    <button
      onClick={recharge}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-2.5 text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity"
      style={{ background: '#1E3A5F' }}
    >
      {loading
        ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
        : <><Zap className="w-4 h-4" /> Recharge · {formatINR(pack.priceInclGst)}</>
      }
    </button>
  );
}
