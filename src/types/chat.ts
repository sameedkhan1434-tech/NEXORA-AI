export type UILanguage = 'en' | 'ur' | 'hi';
export type ModelTier = 'fast' | 'thinking' | 'code';
export type ThemeMode = 'light' | 'dark';
export type FeedbackState = 'up' | 'down' | null;

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  data: string;
  previewUrl?: string;
  kind: 'image' | 'text' | 'pdf';
}

export interface SourceLink {
  title: string;
  uri: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
  sources?: SourceLink[];
  feedback?: FeedbackState;
  createdAt: number;
  isError?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  modelTier: ModelTier;
}

export interface CustomInstructionsData {
  aboutUser: string;
  responseStyle: string;
  enabled: boolean;
}
