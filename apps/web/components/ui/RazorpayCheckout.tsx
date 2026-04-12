'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import { CreditCard, Loader2, CheckCircle2, X } from 'lucide-react';

interface RazorpayCheckoutProps {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;  // in paise
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  onSuccess: () => void;
  onClose?: () => void;
}

export function RazorpayCheckout({
  invoiceId, invoiceNumber, amount, patientName, patientPhone, patientEmail, onSuccess, onClose,
}: RazorpayCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [paid, setPaid]       = useState(false);

  const loadRazorpay = useCallback((): Promise<boolean> => {
    return new Promise(resolve => {
      if ((window as any).Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload  = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const pay = async () => {
    setLoading(true);
    try {
      const sdkLoaded = await loadRazorpay();
      if (!sdkLoaded) {
        toast.error('Failed to load Razorpay SDK. Check internet connection.');
        return;
      }

      const orderData = await api.post(`/billing/invoices/${invoiceId}/checkout-order`);
      const { orderId, keyId, currency } = orderData.data;

      const options = {
        key: keyId,
        amount: amount,
        currency: currency || 'INR',
        name: 'HospiBot Healthcare',
        description: `Invoice ${invoiceNumber}`,
        order_id: orderId,
        prefill: {
          name: patientName,
          contact: patientPhone?.replace(/\D/g, '').slice(-10) || '',
          email: patientEmail || '',
        },
        theme: { color: '#0D7C66' },
        modal: {
          ondismiss: () => { setLoading(false); onClose?.(); },
        },
        handler: async (response: any) => {
          try {
            await api.post('/billing/verify-payment', {
              orderId:    response.razorpay_order_id,
              paymentId:  response.razorpay_payment_id,
              signature:  response.razorpay_signature,
              invoiceId,
            });
            setPaid(true);
            toast.success(`Payment of ${formatINR(amount)} received!`);
            onSuccess();
          } catch {
            toast.error('Payment verification failed. Contact support.');
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
    } finally {
      setLoading(false);
    }
  };

  if (paid) {
    return (
      <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl">
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-sm font-semibold">Payment received — {formatINR(amount)}</span>
      </div>
    );
  }

  return (
    <button
      onClick={pay}
      disabled={loading}
      className="flex items-center gap-2 bg-[#0D7C66] hover:bg-[#0A5E4F] text-white text-sm font-bold px-5 py-2.5 rounded-xl disabled:opacity-60 transition-colors shadow-sm"
    >
      {loading
        ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
        : <><CreditCard className="w-4 h-4" /> Pay {formatINR(amount)} Now</>
      }
    </button>
  );
}
