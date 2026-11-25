import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, ThinkingLevel } from '@google/genai';
import type { Content, LiveServerMessage, Part } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const FAST_MODEL = 'gemini-3.1-flash-lite';
const STANDARD_MODEL = 'gemini-4-hydrogen';
const TRANSCRIBE_MODEL = 'gemini-3.5-transcribe';
const TTS_MODEL = 'gemini-3.8-flash-lite-tts';
const LIVE_MODEL = 'gemini-3.8-live';

interface IncomingAttachment {
  name: string;
  mimeType: string;
  data: string;
  kind: 'image' | 'text' | 'pdf';
}

interface IncomingMessage {
  role: 'user' | 'assistant';
  content: string;
  attachments?: IncomingAttachment[];
}

type ModelTier = 'fast' | 'thinking' | 'code';

interface CustomInstructionsPayload {
  aboutUser?: string;
  responseStyle?: string;
  enabled?: boolean;
}

interface SourceLink {
  title: string;
  uri: string;
}

function createGeminiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function buildSystemInstruction(
  modelTier: ModelTier,
  customInstructions?: CustomInstructionsPayload | string
): string {
  const parts = [
    'You are NEXORA AI, a thoughtful, highly capable, and articulate AI assistant.',
    'Communicate with clarity, intellectual honesty, and calm precision. Format responses cleanly with Markdown (headings, bullet lists, tables, and fenced code blocks with language tags) when structure aids readability.',
    'Never fabricate facts, citations, or tool outputs. If you are uncertain or cannot verify something, state that plainly.',
    'Always automatically detect and reply in the exact language and script the user uses in their latest message. You have native-level fluency in English, Urdu (both proper Urdu script اردو and Roman Urdu), Hindi (both Devanagari हिन्दी and Hinglish), and other world languages. Match the user’s language, script, and tone naturally unless they explicitly ask for a different language.',
    'Understand imperfect spelling, typos, phonetic writing, broken English, or informal Roman Urdu/Hinglish effortlessly. Never criticize, mock, or point out grammar or spelling mistakes unless the user asks for proofreading—simply understand their real intent and give a clear, helpful, respectful answer.',
  ];

  if (modelTier === 'code') {
    parts.push(
      'You are operating in Senior Coding Assistant mode. Write clean, production-ready, well-typed code with clear architectural reasoning, edge-case handling, and concise explanations. When the user asks for an interactive web widget, UI mockup, chart, or visual diagram, provide a self-contained ```html``` or ```svg``` fenced code block so it can be previewed live.'
    );
  }

  if (typeof customInstructions === 'string' && customInstructions.trim().length > 0) {
    parts.push(
      `User Custom Instructions:\n${customInstructions.trim().slice(0, 1500)}`
    );
  } else if (
    customInstructions &&
    typeof customInstructions === 'object' &&
    customInstructions.enabled !== false
  ) {
    const about = (customInstructions.aboutUser || '').trim().slice(0, 1000);
    const style = (customInstructions.responseStyle || '').trim().slice(0, 1000);
    if (about || style) {
      const lines: string[] = ['User Custom Instructions (follow unless conflicting with accuracy or safety):'];
      if (about) lines.push(`About the user: ${about}`);
      if (style) lines.push(`Preferred response style: ${style}`);
      parts.push(lines.join('\n'));
    }
  }

  return parts.join('\n\n');
}

function toGeminiContents(messages: IncomingMessage[]): {
  contents: Content[];
  hasMultimodalOrPdf: boolean;
} {
  const contents: Content[] = [];
  let hasMultimodalOrPdf = false;

  for (const msg of messages) {
    const parts: Part[] = [];

    if (Array.isArray(msg.attachments)) {
      for (const att of msg.attachments) {
        if (!att || typeof att.data !== 'string' || att.data.length === 0) continue;
        if (att.kind === 'image' && att.mimeType.startsWith('image/')) {
          hasMultimodalOrPdf = true;
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.data,
            },
          });
        } else if (att.kind === 'pdf' && att.mimeType === 'application/pdf') {
          hasMultimodalOrPdf = true;
          parts.push({
            inlineData: {
              mimeType: 'application/pdf',
              data: att.data,
            },
          });
        } else if (att.kind === 'text') {
          const safeName = (att.name || 'attachment.txt').slice(0, 120);
          parts.push({
            text: `[Attached file: ${safeName}]\n\`\`\`\n${att.data.slice(0, 60000)}\n\`\`\``,
          });
        }
      }
    }

    if (typeof msg.content === 'string' && msg.content.trim().length > 0) {
      parts.push({ text: msg.content });
    }

    if (parts.length > 0) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts,
      });
    }
  }

  return { contents, hasMultimodalOrPdf };
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  if (
    lower.includes('api_key_invalid') ||
    lower.includes('permission_denied') ||
    lower.includes('403') ||
    lower.includes('api key')
  ) {
    return {
      status: 403,
      message:
        'Authentication with the AI service failed. Please verify the API key in Settings > Secrets.',
    };
  }
  if (lower.includes('resource_exhausted') || lower.includes('429') || lower.includes('quota')) {
    return {
      status: 429,
      message: 'Rate limit or quota reached. Please wait a moment and try again.',
    };
  }
  if (
    lower.includes('503') ||
    lower.includes('unavailable') ||
    lower.includes('high demand') ||
    lower.includes('overloaded')
  ) {
    return {
      status: 503,
      message:
        'The AI service is temporarily experiencing high demand. Please click Retry in a few seconds.',
    };
  }
  if (lower.includes('not_found') || lower.includes('404')) {
    return {
      status: 404,
      message: 'The selected AI model is currently unavailable.',
    };
  }
  return {
    status: 500,
    message: 'Unable to complete the request right now. Please try again.',
  };
}

function stripMarkdownForSpeech(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' Code snippet omitted. ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~>-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2400);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'NEXORA AI' });
  });

  app.post('/api/chat', async (req: Request, res: Response) => {
    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({
        error: 'GEMINI_API_KEY is not configured. Please set it in the Settings > Secrets panel.',
      });
      return;
    }

    const body = req.body as {
      messages?: IncomingMessage[];
      modelTier?: ModelTier;
      webSearch?: boolean;
      customInstructions?: CustomInstructionsPayload | string;
    };

    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required and cannot be empty.' });
      return;
    }

    const validMessages = body.messages
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
      .slice(-18);

    const { contents, hasMultimodalOrPdf } = toGeminiContents(validMessages);
    if (contents.length === 0) {
      res.status(400).json({ error: 'At least one message with text or an attachment is required.' });
      return;
    }

    const modelTier: ModelTier =
      body.modelTier === 'thinking' || body.modelTier === 'code' ? body.modelTier : 'fast';
    const webSearch = Boolean(body.webSearch);

    const useStandardModel =
      webSearch || hasMultimodalOrPdf || modelTier === 'thinking' || modelTier === 'code';
    const model = useStandardModel ? STANDARD_MODEL : FAST_MODEL;
    const thinkingLevel =
      modelTier === 'thinking'
        ? ThinkingLevel.HIGH
        : modelTier === 'code'
          ? ThinkingLevel.MEDIUM
          : useStandardModel
            ? ThinkingLevel.LOW
            : ThinkingLevel.MINIMAL;

    let clientAborted = false;
    res.on('close', () => {
      if (!res.writableEnded) {
        clientAborted = true;
      }
    });

    res.socket?.setNoDelay(true);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const writeEvent = (payload: Record<string, unknown>) => {
      if (!clientAborted && !res.writableEnded) {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      }
    };

    try {
      const ai = createGeminiClient();
      const sourceMap = new Map<string, SourceLink>();

      const config: {
        systemInstruction: string;
        thinkingConfig: { thinkingLevel: ThinkingLevel };
        tools?: Array<{ googleSearch: Record<string, never> }>;
      } = {
        systemInstruction: buildSystemInstruction(modelTier, body.customInstructions),
        thinkingConfig: { thinkingLevel },
      };

      if (webSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      let streamResult: AsyncIterable<{
        text?: string;
        candidates?: Array<{
          groundingMetadata?: {
            groundingChunks?: Array<{
              web?: { uri?: string; title?: string };
            }>;
          };
        }>;
      }> | null = null;

      const fallbackModel = model === FAST_MODEL ? STANDARD_MODEL : FAST_MODEL;
      const attempts: Array<{ m: string; level: ThinkingLevel; delayMs: number }> = [
        { m: model, level: thinkingLevel, delayMs: 0 },
        {
          m: fallbackModel,
          level: fallbackModel === FAST_MODEL ? ThinkingLevel.MINIMAL : ThinkingLevel.LOW,
          delayMs: 400,
        },
      ];

      let lastErr: unknown = null;
      for (const step of attempts) {
        if (clientAborted) break;
        if (step.delayMs > 0) {
          await new Promise((r) => setTimeout(r, step.delayMs));
        }
        if (clientAborted) break;

        try {
          const attemptConfig = {
            ...config,
            thinkingConfig: { thinkingLevel: step.level },
          };
          streamResult = await ai.models.generateContentStream({
            model: step.m,
            contents,
            config: attemptConfig,
          });
          break;
        } catch (err) {
          lastErr = err;
          const formatted = formatGeminiError(err);
          if (formatted.status !== 429 && formatted.status !== 503) {
            throw err;
          }
        }
      }

      if (streamResult) {
        for await (const chunk of streamResult) {
          if (clientAborted) break;
          const text = chunk.text;
          if (typeof text === 'string' && text.length > 0) {
            writeEvent({ type: 'delta', text });
          }

          const chunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (Array.isArray(chunks)) {
            for (const gc of chunks) {
              const uri = gc.web?.uri;
              if (uri && !sourceMap.has(uri)) {
                sourceMap.set(uri, {
                  uri,
                  title: gc.web?.title || uri,
                });
              }
            }
          }
        }
      } else if (!clientAborted) {
        try {
          await new Promise((r) => setTimeout(r, 800));
          const unaryResponse = await ai.models.generateContent({
            model: STANDARD_MODEL,
            contents,
            config: {
              ...config,
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            },
          });
          const text = unaryResponse.text;
          if (typeof text === 'string' && text.length > 0) {
            writeEvent({ type: 'delta', text });
          } else {
            throw lastErr ?? new Error('Empty response from fallback call.');
          }
          const chunks = unaryResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (Array.isArray(chunks)) {
            for (const gc of chunks) {
              const uri = gc.web?.uri;
              if (uri && !sourceMap.has(uri)) {
                sourceMap.set(uri, {
                  uri,
                  title: gc.web?.title || uri,
                });
              }
            }
          }
        } catch (unaryErr) {
          throw unaryErr ?? lastErr ?? new Error('Failed to initialize response stream.');
        }
      }

      if (!clientAborted && sourceMap.size > 0) {
        writeEvent({ type: 'sources', sources: Array.from(sourceMap.values()) });
      }

      if (!clientAborted) {
        writeEvent({ type: 'done' });
      }
    } catch (err) {
      const { message } = formatGeminiError(err);
      writeEvent({ type: 'error', message });
    } finally {
      if (!res.writableEnded) {
        res.end();
      }
    }
  });

  app.post('/api/title', async (req: Request, res: Response) => {
    const body = req.body as { prompt?: string };
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required.' });
      return;
    }

    const fallbackTitle = prompt.split(/\s+/).slice(0, 6).join(' ').slice(0, 48);

    if (!process.env.GEMINI_API_KEY) {
      res.json({ title: fallbackTitle || 'New conversation' });
      return;
    }

    try {
      const ai = createGeminiClient();
      const response = await ai.models.generateContent({
        model: FAST_MODEL,
        contents: `Create a concise 3 to 5 word conversation title for this user message. Return ONLY the title text without quotes, punctuation at the end, or prefixes. Use the same language and script as the user's message.\n\nUser message: "${prompt.slice(0, 400)}"`,
        config: {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.MINIMAL,
          },
        },
      });

      const generated = (response.text ?? '').replace(/^["'«»]+|["'«»]+$/g, '').trim();
      res.json({
        title: generated ? generated.slice(0, 64) : fallbackTitle || 'New conversation',
      });
    } catch {
      res.json({ title: fallbackTitle || 'New conversation' });
    }
  });

  app.post('/api/transcribe', async (req: Request, res: Response) => {
    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
      return;
    }

    const body = req.body as { audioBase64?: string; mimeType?: string };
    if (!body?.audioBase64 || typeof body.audioBase64 !== 'string') {
      res.status(400).json({ error: 'Audio data is required.' });
      return;
    }

    const mimeType =
      typeof body.mimeType === 'string' && body.mimeType.startsWith('audio/')
        ? body.mimeType
        : 'audio/webm';

    try {
      const ai = createGeminiClient();
      const response = await ai.models.generateContent({
        model: TRANSCRIBE_MODEL,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: body.audioBase64,
              },
            },
            {
              text: 'Transcribe the spoken audio accurately in its original language and script (English, Urdu, Hindi, or any other language spoken). Return only the transcribed text without extra commentary.',
            },
          ],
        },
      });

      res.json({ text: (response.text ?? '').trim() });
    } catch (err) {
      const { status, message } = formatGeminiError(err);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/tts', async (req: Request, res: Response) => {
    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
      return;
    }

    const body = req.body as { text?: string };
    const cleanText = typeof body?.text === 'string' ? stripMarkdownForSpeech(body.text) : '';
    if (!cleanText) {
      res.status(400).json({ error: 'Text is required for speech playback.' });
      return;
    }

    try {
      const ai = createGeminiClient();
      const response = await ai.models.generateContent({
        model: TTS_MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanText,
                speechMetadata: {
                  style: 'Clear, natural, calm assistant voice',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        res.status(500).json({ error: 'No audio was generated.' });
        return;
      }

      res.json({ audioBase64: base64Audio, mimeType: 'audio/wav' });
    } catch (err) {
      const { status, message } = formatGeminiError(err);
      res.status(status).json({ error: message });
    }
  });

  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const vitePromise = import('vite').then(({ createServer: createViteServer }) =>
      createViteServer({
        server: {
          middlewareMode: true,
          hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
        },
        appType: 'spa',
      })
    );
    vitePromise.catch((err) => {
      console.error('Vite middleware initialization failed:', err);
    });

    app.use((req: Request, res: Response, next) => {
      vitePromise
        .then((vite) => {
          vite.middlewares(req, res, next);
        })
        .catch(next);
    });
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  // Real-time Voice Chat WebSocket bridge for Gemini Live API (gemini-3.8-live)
  const wss = new WebSocketServer({ server: httpServer, path: '/api/live' });
  wss.on('connection', async (clientWs: WebSocket) => {
    if (!process.env.GEMINI_API_KEY) {
      clientWs.send(
        JSON.stringify({ type: 'error', message: 'GEMINI_API_KEY is not configured.' })
      );
      clientWs.close();
      return;
    }

    let session: Awaited<ReturnType<GoogleGenAI['live']['connect']>> | null = null;
    let isClosed = false;

    const safeSend = (payload: Record<string, unknown>) => {
      if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify(payload));
      }
    };

    try {
      const ai = createGeminiClient();
      session = await ai.live.connect({
        model: LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction:
            'You are NEXORA AI in live voice conversation mode. Speak naturally, warmly, and concisely. Automatically match the user’s spoken language—English, Urdu, Hindi, or any language they speak.',
        },
        callbacks: {
          onopen: () => {
            safeSend({ type: 'ready' });
          },
          onmessage: (message: LiveServerMessage) => {
            const content = message.serverContent;
            if (content?.inputTranscription?.text) {
              safeSend({ type: 'inputTranscript', text: content.inputTranscription.text });
            }
            if (content?.outputTranscription?.text) {
              safeSend({ type: 'outputTranscript', text: content.outputTranscription.text });
            }
            for (const part of content?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                safeSend({ type: 'audio', data: part.inlineData.data });
              }
            }
            if (content?.interrupted) {
              safeSend({ type: 'interrupted' });
            }
            if (content?.turnComplete) {
              safeSend({ type: 'turnComplete' });
            }
          },
          onerror: () => {
            safeSend({ type: 'error', message: 'Live voice connection encountered an error.' });
          },
          onclose: () => {
            if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
              clientWs.close();
            }
          },
        },
      });
    } catch (err) {
      const { message } = formatGeminiError(err);
      safeSend({ type: 'error', message });
      clientWs.close();
      return;
    }

    clientWs.on('message', (raw) => {
      if (!session || isClosed) return;
      try {
        const parsed = JSON.parse(raw.toString()) as { type?: string; data?: string };
        if (parsed.type === 'audio' && typeof parsed.data === 'string' && parsed.data.length > 0) {
          session.sendRealtimeInput({
            audio: { data: parsed.data, mimeType: 'audio/pcm;rate=16000' },
          });
        }
      } catch {
        // ignore malformed frames
      }
    });

    clientWs.on('close', () => {
      isClosed = true;
      try {
        session?.close();
      } catch {
        // ignore
      }
    });
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`NEXORA AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start NEXORA AI server:', err);
  process.exit(1);
});
