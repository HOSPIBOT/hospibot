'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface SpeechToTextOptions {
  language?: string;
  continuous?: boolean;
  onTranscript?: (text: string, isFinal: boolean) => void;
}

export function useSpeechToText(options: SpeechToTextOptions = {}) {
  const { language = 'en-IN', continuous = false, onTranscript } = options;
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript]   = useState('');
  const [interim, setInterim]         = useState('');
  const [error, setError]             = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsSupported(!!SpeechRecognition);
    }
  }, []);

  const start = useCallback((existingText = '') => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported. Use Chrome or Edge.');
      return;
    }

    // Stop any ongoing recognition
    recognitionRef.current?.stop();

    const recognition = new SpeechRecognition();
    recognition.lang           = language;
    recognition.continuous      = continuous;
    recognition.interimResults  = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => { setIsListening(true); setError(null); };
    recognition.onend   = () => { setIsListening(false); setInterim(''); };
    recognition.onerror = (e: any) => {
      setIsListening(false);
      if (e.error === 'not-allowed') setError('Microphone access denied. Allow microphone in browser settings.');
      else if (e.error !== 'no-speech' && e.error !== 'aborted') setError(`Mic error: ${e.error}`);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript   = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalTranscript += result[0].transcript + ' ';
        else interimTranscript += result[0].transcript;
      }

      if (finalTranscript) {
        const base = existingText ? existingText.trimEnd() + ' ' : '';
        const newText = (base + finalTranscript.trim()).trim();
        setTranscript(newText);
        onTranscript?.(newText, true);
        // Update existingText for next result
        existingText = newText;
      }
      setInterim(interimTranscript);
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch { /* already started */ }
  }, [language, continuous, onTranscript]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setInterim('');
    setError(null);
  }, []);

  return { isListening, transcript, interim, error, isSupported, start, stop, reset };
}
