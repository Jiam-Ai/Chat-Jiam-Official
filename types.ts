export interface User {
  username: string;
  role: 'guest' | 'user' | 'admin' | 'super';
  displayName?: string;
  avatar?: string;
}

export interface ImageContent {
  blobUrl: string;
  apiUrl: string;
  apiName: string;
}

export interface LyricsContent {
  title: string;
  artist: string;
  lyrics: string;
}

export interface VideoContent {
    state: 'loading' | 'done' | 'error';
    prompt: string;
    videoUrl?: string;
    downloadUrl?: string;
    operationName?: string;
    error?: string;
}

export interface MultimodalUserContent {
  imageUrl: string;
  text: string;
}

export interface UserFileContent {
  file: { name: string };
  text: string;
}

export interface ImageLoadingContent {
    prompt: string;
}

export type MessageContent = string | { images: ImageContent[] } | LyricsContent | MultimodalUserContent | UserFileContent | VideoContent | ImageLoadingContent;

export interface ChatMessage {
  id: string;
  type: 'text' | 'image' | 'lyrics' | 'system' | 'broadcast' | 'multimodal-user' | 'file-user' | 'live-user' | 'live-ai' | 'video' | 'image-loading';
  sender: 'user' | 'jiam';
  content: MessageContent;
  timestamp: number;
  isPinned?: boolean;
  isArchived?: boolean;
  groundingMetadata?: {
    uri: string;
    title: string;
  }[];
}

export enum CallState {
    IDLE = 'IDLE',
    OUTGOING = 'OUTGOING',
    INCOMING = 'INCOMING',
    CONNECTED = 'CONNECTED',
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export interface VoiceSettings {
  isWakeWordEnabled: boolean;
  wakeWordSensitivity: number; // Stored as 0-100
  isTtsEnabled: boolean;
}