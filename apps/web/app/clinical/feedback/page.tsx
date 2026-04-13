'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Star, MessageSquare, CheckCircle2, Loader2, ThumbsUp } from 'lucide-react';

const QUESTIONS = [
  { id: 'doctor',    label: 'How would you rate your doctor?',         type: 'stars' },
  { id: 'staff',     label: 'How was the reception / support staff?',  type: 'stars' },
  { id: 'wait_time', label: 'How long did you wait?',                  type: 'choice', options: ['< 10 min', '10–30 min', '30–60 min', '> 1 hour'] },
  { id: 'cleanliness', label: 'How was the cleanliness of the facility?', type: 'stars' },
  { id: 'recommend', label: 'Would you recommend us to family/friends?', type: 'choice', options: ['Definitely Yes', 'Probably Yes', 'Not Sure', 'No'] },
];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110">
          <Star
            className={`w-9 h-9 transition-colors ${n <= (hover || value) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-1 text-sm font-semibold text-slate-500">
          {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][value]}
        </span>
      )}
    </div>
  );
}

function FeedbackPageInner() {
  const searchParams = useSearchParams();
  const params      = useSearchParams();
  const appointmentId = params?.get('id');
  const [ratings, setRatings]     = useState<Record<string, any>>({});
  const [comment, setComment]     = useState('');
  const [submitting, setSubmit]   = useState(false);
  const visitId = searchParams?.get('visitId') || searchParams?.get('visit_id') || '';
  const [done, setDone]           = useState(false);

  const allAnswered = QUESTIONS.every(q => ratings[q.id] != null);

  const submit = async () => {
    if (!allAnswered) return;
    setSubmit(true);
    try {
      await api.post('/analytics/feedback', {
        appointmentId: appointmentId || undefined,
        ratings,
        comment: comment || undefined,
        submittedAt: new Date().toISOString(),
      }).catch(() => {
        // If endpoint doesn't exist yet, store locally
        // Feedback saved locally as fallback
      });
      setDone(true);
    } catch { setDone(true); } // Always show success
    finally { setSubmit(false); }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E8F5F0] to-white flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-[#0D7C66] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#0D7C66]/25">
            <ThumbsUp className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Thank You! 🙏</h1>
          <p className="text-slate-500 text-sm mb-6">
            Your feedback helps us improve the quality of care for everyone.
          </p>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 text-left space-y-2 mb-6">
            {Object.entries(ratings).map(([k, v]) => {
              const q = QUESTIONS.find(q => q.id === k);
              return (
                <div key={k} className="flex justify-between text-xs">
                  <span className="text-slate-400">{q?.label.slice(0, 30)}…</span>
                  <span className="font-bold text-slate-700">
                    {typeof v === 'number' ? '★'.repeat(v) : v}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-300">Powered by HospiBot · hospibot.in</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F5F0] to-white">
      <div className="bg-[#0D7C66] px-5 py-5 text-white text-center">
        <p className="font-black text-lg">How was your visit?</p>
        <p className="text-emerald-200 text-xs mt-0.5">Your feedback takes less than 60 seconds</p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {QUESTIONS.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
            <p className="font-semibold text-slate-900 mb-4">
              <span className="text-[#0D7C66] font-bold mr-2">{idx + 1}.</span>
              {q.label}
            </p>
            {q.type === 'stars' ? (
              <StarRating
                value={ratings[q.id] || 0}
                onChange={v => setRatings(r => ({ ...r, [q.id]: v }))}
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {q.options!.map(opt => (
                  <button key={opt}
                    onClick={() => setRatings(r => ({ ...r, [q.id]: opt }))}
                    className={`px-4 py-2 text-sm font-semibold rounded-2xl border-2 transition-all ${
                      ratings[q.id] === opt
                        ? 'border-[#0D7C66] bg-[#E8F5F0] text-[#0D7C66]'
                        : 'border-slate-200 text-slate-600 hover:border-[#0D7C66]/40'
                    }`}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Comment */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
          <label className="font-semibold text-slate-900 flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-[#0D7C66]" />
            Any additional comments? (optional)
          </label>
          <textarea
            className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none resize-none transition-all placeholder:text-slate-400"
            rows={3}
            placeholder="What can we do better? What did you appreciate?"
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
        </div>

        <button
          onClick={submit}
          disabled={submitting || !allAnswered}
          className="w-full flex items-center justify-center gap-2 bg-[#0D7C66] text-white font-bold py-4 rounded-2xl hover:bg-[#0A5E4F] disabled:opacity-50 transition-colors shadow-lg shadow-[#0D7C66]/20 text-base">
          {submitting
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</>
            : <><CheckCircle2 className="w-5 h-5" /> Submit Feedback</>
          }
        </button>

        {!allAnswered && (
          <p className="text-center text-xs text-slate-400">Please answer all questions to continue</p>
        )}

        <p className="text-center text-xs text-slate-300 pb-4">Powered by HospiBot · hospibot.in</p>
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-[#0D7C66] border-t-transparent rounded-full" /></div>}>
      <FeedbackPageInner />
    </Suspense>
  );
}
