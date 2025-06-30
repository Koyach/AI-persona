import { Timestamp } from 'firebase-admin/firestore';

// 会話メッセージの型定義
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Timestamp;
}

// インタビューリクエストの型定義
export interface InterviewRequest {
  personaId: string;
  message: string;
  history?: ChatMessage[];
}

// インタビューレスポンスの型定義
export interface InterviewResponse {
  success: boolean;
  message: string;
  conversationId?: string;
}

// 会話データ型
export interface ConversationData {
  id?: string;
  userId: string;
  personaId: string;
  messages: ChatMessage[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
} 