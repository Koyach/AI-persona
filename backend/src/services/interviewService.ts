import { db } from '../lib/firebase/admin';
import { generateResponse } from '../lib/gemini';
import { PersonaService } from './personaService';
import { ChatMessage, ConversationData, InterviewRequest } from '../types/interview';
import admin from 'firebase-admin';

export class InterviewService {
  private static collection = db.collection('conversations');

  static async processMessage(
    userId: string, 
    request: InterviewRequest
  ): Promise<{ message: string; conversationId?: string }> {
    const { personaId, message, history = [] } = request;

    try {
      // ペルソナの存在と所有者確認
      const persona = await PersonaService.getPersonaById(personaId);
      if (!persona) {
        throw new Error('Persona not found');
      }

      if (persona.userId !== userId) {
        throw new Error('Access denied');
      }

      // AI応答を生成
      console.log(`🤖 Processing message for persona: ${persona.name} (${personaId})`);
      const aiResponse = await generateResponse(persona, history, message);

      // 会話履歴を保存
      let conversationId: string | undefined;
      try {
        conversationId = await this.saveConversation(userId, personaId, message, aiResponse);
        console.log(`✅ Conversation saved with ID: ${conversationId}`);
      } catch (saveError: any) {
        console.error('⚠️  Failed to save conversation:', saveError);
        console.error('Save error details:', {
          message: saveError.message,
          code: saveError.code,
          stack: saveError.stack
        });
        // 保存失敗は応答を妨げない
      }

      return {
        message: aiResponse,
        conversationId
      };
    } catch (error: any) {
      console.error('❌ Error in processMessage:', error);
      console.error('Process error details:', {
        personaId,
        userId,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      // エラーをそのまま投げる（詳細なエラーメッセージを保持）
      throw error;
    }
  }

  static async saveConversation(
    userId: string,
    personaId: string,
    userMessage: string,
    aiResponse: string
  ): Promise<string> {
    const conversationData: Omit<ConversationData, 'id'> = {
      userId,
      personaId,
      messages: [
        {
          role: 'user',
          content: userMessage,
          timestamp: admin.firestore.FieldValue.serverTimestamp() as any
        },
        {
          role: 'assistant',
          content: aiResponse,
          timestamp: admin.firestore.FieldValue.serverTimestamp() as any
        }
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp() as any,
      updatedAt: admin.firestore.FieldValue.serverTimestamp() as any
    };

    const docRef = await this.collection.add(conversationData);
    return docRef.id;
  }

  static async getConversations(
    userId: string,
    personaId: string,
    limit: number = 50
  ): Promise<ConversationData[]> {
    try {
      console.log('🔍 InterviewService.getConversations started');
      console.log('  - userId:', userId);
      console.log('  - personaId:', personaId);
      console.log('  - limit:', limit);

      const snapshot = await this.collection
        .where('userId', '==', userId)
        .where('personaId', '==', personaId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      console.log('  - snapshot size:', snapshot.size);
      console.log('  - snapshot empty:', snapshot.empty);

      const conversations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ConversationData[];

      console.log('  - returning conversations:', conversations.length);
      return conversations;
    } catch (error: any) {
      console.error('❌ Error in getConversations:', error);
      
      // Firestoreインデックスエラーの特別処理
      if (error.code === 9 || error.message?.includes('requires an index')) {
        console.error('🚨 Firestore index missing for conversations collection');
        console.error('   Required fields: userId, personaId, createdAt');
        console.error('   Please wait for index creation to complete or check Firebase Console');
        throw new Error('Database index is being created. Please try again in a few minutes.');
      }
      
      throw error;
    }
  }
} 