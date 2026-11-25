import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, Square } from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import type { CustomInstructionsData, ModelTier, UILanguage } from '../types/chat';
import { getScriptClass, getTextDir } from '../utils/bidi';

interface VoiceChatModalProps {
  isOpen: boolean;
  uiLang: UILanguage;
  customInstructions: CustomInstructionsData;
  modelTier: ModelTier;
  webSearch: boolean;
  onClose: () => void;
  onAppendVoiceTurn: (userText: string, assistantText: string) => void;
}

type VoiceStatus = 'connecting' | 'listening' | 'speaking' | 'processing' | 'muted' | 'error';

function float32ToInt16Base64(float32: Float32Array): string {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64Int16ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768;
  }
  return float32;
}

export const VoiceChatModal: React.FC<VoiceChatModalProps> = ({
  isOpen,
  uiLang,
  customInstructions,
  modelTier,
  webSearch,
  onClose,
  onAppendVoiceTurn,
}) => {
  const t = TRANSLATIONS[uiLang];
  const [status, setStatus] = useState<VoiceStatus>('connecting');
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFallbackRecording, setIsFallbackRecording] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [assistantTranscript, setAssistantTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isMutedRef = useRef(false);
  const wsRef = useRef<WebSocket | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const fallbackRecorderRef = useRef<MediaRecorder | null>(null);
  const fallbackChunksRef = useRef<Blob[]>([]);
  const fallbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentUserTurnRef = useRef('');
  const currentAsstTurnRef = useRef('');
  const closedByUserRef = useRef(false);

  const stopLivePlayback = useCallback(() => {
    for (const src of activeSourcesRef.current) {
      try {
        src.stop();
      } catch {
        // ignore
      }
    }
    activeSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, []);

  const stopAllResources = useCallback(() => {
    closedByUserRef.current = true;
    stopLivePlayback();

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    }

    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {
        // ignore
      }
      processorRef.current = null;
    }

    if (inputCtxRef.current) {
      void inputCtxRef.current.close().catch(() => {});
      inputCtxRef.current = null;
    }

    if (outputCtxRef.current) {
      void outputCtxRef.current.close().catch(() => {});
      outputCtxRef.current = null;
    }

    if (fallbackRecorderRef.current && fallbackRecorderRef.current.state !== 'inactive') {
      try {
        fallbackRecorderRef.current.stop();
      } catch {
        // ignore
      }
      fallbackRecorderRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    if (fallbackAudioRef.current) {
      fallbackAudioRef.current.pause();
      fallbackAudioRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, [stopLivePlayback]);

  const flushTurnToHistory = useCallback(() => {
    const u = currentUserTurnRef.current.trim();
    const a = currentAsstTurnRef.current.trim();
    if (u || a) {
      onAppendVoiceTurn(u, a);
      currentUserTurnRef.current = '';
      currentAsstTurnRef.current = '';
    }
  }, [onAppendVoiceTurn]);

  const schedulePcmAudio = useCallback((base64: string) => {
    const ctx = outputCtxRef.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const float32 = base64Int16ToFloat32(base64);
    const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const startTime = Math.max(ctx.currentTime + 0.02, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + audioBuffer.duration;
    activeSourcesRef.current.add(source);

    setStatus('speaking');
    source.onended = () => {
      activeSourcesRef.current.delete(source);
      if (activeSourcesRef.current.size === 0 && !closedByUserRef.current) {
        setStatus(isMutedRef.current ? 'muted' : 'listening');
      }
    };
  }, []);

  const activateFallbackMode = useCallback(() => {
    if (closedByUserRef.current) return;
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    }
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {
        // ignore
      }
      processorRef.current = null;
    }
    if (inputCtxRef.current) {
      void inputCtxRef.current.close().catch(() => {});
      inputCtxRef.current = null;
    }
    setIsFallbackMode(true);
    setStatus('listening');
    setErrorMsg(null);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopAllResources();
      return;
    }

    closedByUserRef.current = false;
    isMutedRef.current = false;
    setIsMuted(false);
    setIsFallbackMode(false);
    setIsFallbackRecording(false);
    setStatus('connecting');
    setUserTranscript('');
    setAssistantTranscript('');
    setErrorMsg(null);
    currentUserTurnRef.current = '';
    currentAsstTurnRef.current = '';

    let cancelled = false;

    const startLiveSession = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setErrorMsg(t.micError);
        setStatus('error');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        micStreamRef.current = stream;

        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const inputCtx = new AudioCtx({ sampleRate: 16000 });
        const outputCtx = new AudioCtx({ sampleRate: 24000 });
        inputCtxRef.current = inputCtx;
        outputCtxRef.current = outputCtx;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${protocol}//${window.location.host}/api/live`);
        wsRef.current = ws;

        let wasReady = false;

        const connectTimeout = window.setTimeout(() => {
          if (!wasReady && !cancelled && !closedByUserRef.current) {
            activateFallbackMode();
          }
        }, 6500);

        ws.onmessage = (event) => {
          if (cancelled || closedByUserRef.current) return;
          try {
            const msg = JSON.parse(String(event.data)) as {
              type?: string;
              data?: string;
              text?: string;
              message?: string;
            };
            if (msg.type === 'ready') {
              wasReady = true;
              window.clearTimeout(connectTimeout);
              setStatus(isMutedRef.current ? 'muted' : 'listening');

              const source = inputCtx.createMediaStreamSource(stream);
              const processor = inputCtx.createScriptProcessor(4096, 1, 1);
              const silentGain = inputCtx.createGain();
              silentGain.gain.value = 0;

              processor.onaudioprocess = (e) => {
                if (
                  closedByUserRef.current ||
                  isMutedRef.current ||
                  ws.readyState !== WebSocket.OPEN
                ) {
                  return;
                }
                const inputData = e.inputBuffer.getChannelData(0);
                const base64 = float32ToInt16Base64(inputData);
                ws.send(JSON.stringify({ type: 'audio', data: base64 }));
              };

              source.connect(processor);
              processor.connect(silentGain);
              silentGain.connect(inputCtx.destination);
              processorRef.current = processor;
            } else if (msg.type === 'inputTranscript' && msg.text) {
              currentUserTurnRef.current += msg.text;
              setUserTranscript(currentUserTurnRef.current.trim());
            } else if (msg.type === 'outputTranscript' && msg.text) {
              currentAsstTurnRef.current += msg.text;
              setAssistantTranscript(currentAsstTurnRef.current.trim());
            } else if (msg.type === 'audio' && msg.data) {
              schedulePcmAudio(msg.data);
            } else if (msg.type === 'interrupted') {
              stopLivePlayback();
              setStatus(isMutedRef.current ? 'muted' : 'listening');
            } else if (msg.type === 'turnComplete') {
              flushTurnToHistory();
              if (activeSourcesRef.current.size === 0) {
                setStatus(isMutedRef.current ? 'muted' : 'listening');
              }
            } else if (msg.type === 'error') {
              window.clearTimeout(connectTimeout);
              activateFallbackMode();
            }
          } catch {
            // ignore malformed websocket message
          }
        };

        ws.onerror = () => {
          window.clearTimeout(connectTimeout);
          if (!cancelled && !closedByUserRef.current) {
            activateFallbackMode();
          }
        };

        ws.onclose = () => {
          window.clearTimeout(connectTimeout);
          if (!wasReady && !cancelled && !closedByUserRef.current) {
            activateFallbackMode();
          }
        };
      } catch {
        setErrorMsg(t.micError);
        setStatus('error');
      }
    };

    void startLiveSession();

    return () => {
      cancelled = true;
      stopAllResources();
    };
  }, [
    isOpen,
    activateFallbackMode,
    flushTurnToHistory,
    schedulePcmAudio,
    stopAllResources,
    stopLivePlayback,
    t.micError,
  ]);

  const handleToggleMute = () => {
    const next = !isMutedRef.current;
    isMutedRef.current = next;
    setIsMuted(next);
    if (status !== 'speaking' && status !== 'connecting' && status !== 'error') {
      setStatus(next ? 'muted' : 'listening');
    }
  };

  const processFallbackAudioTurn = async (blob: Blob, mimeType: string) => {
    setStatus('processing');
    setErrorMsg(null);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = String(reader.result || '');
          resolve(res.split(',')[1] || '');
        };
        reader.onerror = () => reject(new Error('Failed to encode audio'));
        reader.readAsDataURL(blob);
      });

      const transcribeRes = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64: base64, mimeType }),
        signal: controller.signal,
      });
      const transcribeData = (await transcribeRes.json()) as { text?: string; error?: string };
      const spokenText = (transcribeData.text || '').trim();
      if (!transcribeRes.ok || !spokenText) {
        setStatus('listening');
        if (transcribeData.error) setErrorMsg(transcribeData.error);
        return;
      }

      setUserTranscript(spokenText);
      setAssistantTranscript('');

      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: spokenText }],
          modelTier,
          webSearch,
          customInstructions,
        }),
        signal: controller.signal,
      });

      if (!chatRes.ok || !chatRes.body) {
        setStatus('listening');
        return;
      }

      const reader = chatRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let replyText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';
        for (const evt of events) {
          for (const line of evt.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            try {
              const parsed = JSON.parse(line.slice(6).trim()) as {
                type?: string;
                text?: string;
                message?: string;
              };
              if (parsed.type === 'delta' && parsed.text) {
                replyText += parsed.text;
                setAssistantTranscript(replyText);
              } else if (parsed.type === 'error' && parsed.message) {
                setErrorMsg(parsed.message);
              }
            } catch {
              // ignore
            }
          }
        }
      }

      if (!replyText.trim()) {
        setStatus('listening');
        return;
      }

      onAppendVoiceTurn(spokenText, replyText.trim());

      const ttsRes = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyText }),
        signal: controller.signal,
      });
      const ttsData = (await ttsRes.json()) as { audioBase64?: string; mimeType?: string };
      if (ttsRes.ok && ttsData.audioBase64 && !closedByUserRef.current) {
        const audio = new Audio(`data:${ttsData.mimeType || 'audio/wav'};base64,${ttsData.audioBase64}`);
        fallbackAudioRef.current = audio;
        setStatus('speaking');
        audio.onended = () => {
          fallbackAudioRef.current = null;
          if (!closedByUserRef.current) setStatus('listening');
        };
        audio.onerror = () => {
          fallbackAudioRef.current = null;
          if (!closedByUserRef.current) setStatus('listening');
        };
        await audio.play();
      } else {
        setStatus('listening');
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setStatus('listening');
      }
    }
  };

  const handleToggleFallbackRecord = () => {
    if (fallbackAudioRef.current) {
      fallbackAudioRef.current.pause();
      fallbackAudioRef.current = null;
    }

    if (isFallbackRecording && fallbackRecorderRef.current) {
      fallbackRecorderRef.current.stop();
      setIsFallbackRecording(false);
      return;
    }

    const stream = micStreamRef.current;
    if (!stream || typeof MediaRecorder === 'undefined') {
      setErrorMsg(t.micError);
      return;
    }

    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
    const recorder = new MediaRecorder(stream, { mimeType });
    fallbackChunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) fallbackChunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(fallbackChunksRef.current, { type: mimeType });
      if (blob.size > 0 && !closedByUserRef.current) {
        void processFallbackAudioTurn(blob, mimeType);
      }
    };
    fallbackRecorderRef.current = recorder;
    recorder.start();
    setIsFallbackRecording(true);
    setStatus('listening');
  };

  const handleEndCall = () => {
    flushTurnToHistory();
    stopAllResources();
    onClose();
  };

  if (!isOpen) return null;

  const statusText =
    status === 'connecting'
      ? t.voiceConnecting
      : status === 'speaking'
        ? t.voiceSpeaking
        : status === 'processing'
          ? t.voiceProcessing
          : status === 'muted'
            ? t.voiceMuted
            : status === 'error'
              ? errorMsg || t.micError
              : t.voiceListening;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-white dark:bg-[#141517] px-6 py-8"
      role="dialog"
      aria-modal="true"
      aria-label={t.voiceChat}
    >
      {/* Top Bar */}
      <div className="w-full max-w-2xl flex items-center justify-between">
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {t.brandName} · {t.voiceChat}
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{statusText}</span>
      </div>

      {/* Center Minimal Orb & Live Transcript */}
      <div className="flex-1 w-full max-w-xl flex flex-col items-center justify-center gap-8 my-6">
        <div className="relative flex items-center justify-center">
          <div
            className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full border-2 transition-transform duration-300 flex items-center justify-center ${
              status === 'speaking'
                ? 'scale-105 border-zinc-900 dark:border-zinc-100 bg-zinc-900/5 dark:bg-zinc-100/10'
                : status === 'listening' && (!isFallbackMode || isFallbackRecording)
                  ? 'scale-100 border-zinc-400 dark:border-zinc-500 bg-zinc-100 dark:bg-zinc-800/70'
                  : status === 'processing' || status === 'connecting'
                    ? 'scale-95 border-zinc-300 dark:border-zinc-700 bg-zinc-100/70 dark:bg-zinc-800/40'
                    : 'scale-95 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900'
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full transition-all duration-300 ${
                status === 'speaking'
                  ? 'bg-zinc-900 dark:bg-zinc-100 scale-110'
                  : status === 'muted' || status === 'error'
                    ? 'bg-zinc-300 dark:bg-zinc-700 scale-90'
                    : 'bg-zinc-700 dark:bg-zinc-300 scale-100'
              }`}
            />
          </div>
        </div>

        {/* Transcripts */}
        <div className="w-full space-y-3 min-h-[96px] text-center">
          {userTranscript && (
            <p
              dir={getTextDir(userTranscript)}
              className={`text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-3 ${getScriptClass(userTranscript)}`}
            >
              {userTranscript}
            </p>
          )}
          {assistantTranscript ? (
            <p
              dir={getTextDir(assistantTranscript)}
              className={`text-base font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed line-clamp-5 ${getScriptClass(assistantTranscript)}`}
            >
              {assistantTranscript}
            </p>
          ) : (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {isFallbackMode ? t.voiceFallbackHint : t.voiceHoldHint}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center gap-5">
        {isFallbackMode ? (
          <button
            type="button"
            onClick={handleToggleFallbackRecord}
            disabled={status === 'processing'}
            aria-label={isFallbackRecording ? t.stopRecording : t.voiceInput}
            title={isFallbackRecording ? t.stopRecording : t.voiceInput}
            className={`h-14 w-14 rounded-full inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 ${
              isFallbackRecording
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {isFallbackRecording ? (
              <Square className="w-5 h-5 fill-current" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleToggleMute}
            aria-label={isMuted ? t.voiceUnmute : t.voiceMute}
            title={isMuted ? t.voiceUnmute : t.voiceMute}
            className={`h-14 w-14 rounded-full inline-flex items-center justify-center transition-colors cursor-pointer ${
              isMuted
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
        )}

        <button
          type="button"
          onClick={handleEndCall}
          aria-label={t.voiceEnd}
          title={t.voiceEnd}
          className="h-14 w-14 rounded-full inline-flex items-center justify-center bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
