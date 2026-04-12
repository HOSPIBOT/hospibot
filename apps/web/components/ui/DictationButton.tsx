'use client';

import { useState, useCallback } from 'react';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { Mic, MicOff, AlertCircle, Loader2 } from 'lucide-react';

interface DictationButtonProps {
  value: string;
  onChange: (text: string) => void;
  language?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function DictationButton({
  value, onChange, language = 'en-IN', className = '', size = 'md',
}: DictationButtonProps) {
  const [showError, setShowError] = useState(false);

  const handleTranscript = useCallback((text: string) => {
    onChange(text);
  }, [onChange]);

  const { isListening, interim, error, isSupported, start, stop } = useSpeechToText({
    language, continuous: true, onTranscript: handleTranscript,
  });

  const toggle = () => {
    if (!isSupported) { setShowError(true); setTimeout(() => setShowError(false), 3000); return; }
    if (isListening) { stop(); }
    else { start(value); }
  };

  const btnSize = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={toggle}
        title={!isSupported ? 'Not supported in this browser' : isListening ? 'Stop dictation (click to stop)' : 'Dictate (click to speak)'}
        className={`${btnSize} rounded-xl flex items-center justify-center transition-all relative ${
          isListening
            ? 'bg-red-500 text-white shadow-lg shadow-red-200 animate-pulse'
            : isSupported
            ? 'bg-slate-100 text-slate-500 hover:bg-[#0D7C66] hover:text-white hover:shadow-md'
            : 'bg-slate-50 text-slate-300 cursor-not-allowed'
        }`}>
        {isListening
          ? <MicOff className={iconSize} />
          : <Mic className={iconSize} />}
      </button>

      {/* Interim transcript indicator */}
      {isListening && interim && (
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap max-w-48 truncate z-10">
          {interim}
        </div>
      )}

      {/* Error tooltip */}
      {(showError || error) && (
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-red-600 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap max-w-56 z-10 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {error || 'Not supported in this browser. Use Chrome.'}
        </div>
      )}
    </div>
  );
}

// Textarea with integrated dictation button
interface DictationTextareaProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  label?: string;
  language?: string;
}

export function DictationTextarea({
  value, onChange, placeholder, rows = 3, className = '', label, language = 'en-IN',
}: DictationTextareaProps) {
  const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:border-[#0D7C66] focus:ring-2 focus:ring-[#0D7C66]/10 outline-none transition-all placeholder:text-slate-400 resize-none';

  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400">Dictate:</span>
            <DictationButton value={value} onChange={onChange} language={language} size="sm" />
          </div>
        </div>
      )}
      <div className="relative">
        <textarea
          className={`${inputCls} ${className} pr-10`}
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
        {!label && (
          <div className="absolute right-2 top-2">
            <DictationButton value={value} onChange={onChange} language={language} size="sm" />
          </div>
        )}
      </div>
    </div>
  );
}
