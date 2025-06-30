import { Timestamp } from 'firebase-admin/firestore';

// ペルソナデータ型
export interface PersonaData {
  id?: string;
  name: string;
  description: string;
  characteristics: string[];
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ペルソナ作成リクエスト型
export interface CreatePersonaRequest {
  name: string;
  description: string;
  characteristics?: string[];
}

// ペルソナ更新リクエスト型
export interface UpdatePersonaRequest {
  name?: string;
  description?: string;
  characteristics?: string[];
} 