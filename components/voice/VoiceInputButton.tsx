"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { analyzeSpeech, type SpeechMetrics } from "@/lib/fillerWordAnalysis";

interface MinimalSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}
interface SpeechRecognitionResultEvent {
  resultIndex: number;
  results: { [i: number]: { isFinal: boolean; 0: { transcript: string } }; length: number };
}

export function VoiceInputButton({
  onTranscript,
  onAnalysis,
}: {
  onTranscript: (text: string) => void;
  onAnalysis?: (metrics: SpeechMetrics) => void;
}) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null);
  const finalTextRef = useRef("");
  const startedAtRef = useRef(0);
  const lastFinalAtRef = useRef(0);
  const gapsRef = useRef<number[]>([]);

  useEffect(() => {
    type WindowWithSpeech = typeof window & {
      SpeechRecognition?: new () => MinimalSpeechRecognition;
      webkitSpeechRecognition?: new () => MinimalSpeechRecognition;
    };
    const w = window as WindowWithSpeech;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSupported(false);
      return;
    }
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let finalChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalChunk += r[0].transcript;
      }
      if (finalChunk) {
        const now = Date.now();
        if (lastFinalAtRef.current) {
          gapsRef.current.push((now - lastFinalAtRef.current) / 1000);
        }
        lastFinalAtRef.current = now;
        finalTextRef.current += finalChunk + " ";
      }
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => {
      setListening(false);
      const text = finalTextRef.current.trim();
      const durationSeconds = startedAtRef.current ? (Date.now() - startedAtRef.current) / 1000 : 0;
      if (text) {
        onAnalysis?.(analyzeSpeech({ text, durationSeconds, phraseGapsSeconds: gapsRef.current }));
        onTranscript(text);
      }
      finalTextRef.current = "";
      gapsRef.current = [];
      lastFinalAtRef.current = 0;
    };
    recognitionRef.current = recognition;
    return () => {
      recognition.stop();
    };
  }, [onTranscript, onAnalysis]);

  if (!supported) return null;

  function toggle() {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
    } else {
      finalTextRef.current = "";
      gapsRef.current = [];
      lastFinalAtRef.current = 0;
      startedAtRef.current = Date.now();
      recognitionRef.current.start();
      setListening(true);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? "Stop and send" : "Speak your contribution"}
      className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center border transition-colors ${
        listening ? "bg-danger/10 border-danger text-danger" : "border-border text-muted hover:text-foreground"
      }`}
      aria-label="Voice input"
    >
      {listening ? <MicOff size={16} /> : <Mic size={16} />}
    </button>
  );
}
