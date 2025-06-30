import { GoogleGenAI } from '@google/genai';
import { ChatMessage } from '../types/interview';
import { checkGeminiApiKeySetup } from './secretManager';

let ai: GoogleGenAI;

// Gemini APIの初期化
export async function initializeGemini(): Promise<void> {
  try {
    // 環境変数の設定を確認
    checkGeminiApiKeySetup();
    
    // 新しいAPIは環境変数GEMINI_API_KEYから自動的にAPIキーを取得
    ai = new GoogleGenAI({});
    console.log('✅ Gemini API initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Gemini API:', error);
    throw error;
  }
}

// プロンプト生成関数
function generatePrompt(
  personaSettings: any,
  history: ChatMessage[],
  newMessage: string
): string {
  // characteristicsの処理を改善
  const characteristics = Array.isArray(personaSettings.characteristics) 
    ? personaSettings.characteristics.join(', ')
    : (personaSettings.characteristics || '');

  const personaDescription = `あなたは${personaSettings.name}です。
特徴: ${personaSettings.description}
性格・特徴: ${characteristics}`;

  const historyText = history.length > 0 
    ? history.map(msg => `${msg.role === 'user' ? 'ユーザー' : 'アシスタント'}: ${msg.content}`).join('\n')
    : '（会話履歴なし）';

  const prompt = `${personaDescription}

これまでの会話履歴:
${historyText}

ユーザーからの新しいメッセージ: "${newMessage}"

上記のペルソナ設定に従って、自然で一貫性のある返答をしてください。会話の流れを意識し、ペルソナの特徴を活かした回答をお願いします。`;

  // プロンプトの詳細ログを追加
  console.log('📝 Generated prompt:', {
    personaName: personaSettings.name,
    personaDescription: personaSettings.description,
    characteristics: personaSettings.characteristics,
    historyLength: history.length,
    newMessage: newMessage,
    promptLength: prompt.length
  });

  return prompt;
}

// Gemini APIとの会話実行
export async function generateResponse(
  personaSettings: any,
  history: ChatMessage[],
  newMessage: string
): Promise<string> {
  try {
    if (!ai) {
      console.error('❌ Gemini API is not initialized. Please check if initializeGemini() was called.');
      throw new Error('Gemini API is not initialized. Please check server logs.');
    }

    const prompt = generatePrompt(personaSettings, history, newMessage);

    console.log('🤖 Generating AI response for persona:', personaSettings.name);
    console.log('🔍 Prompt length:', prompt.length);
    
    // 新しいAPIを使用してコンテンツを生成
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingBudget: 0, // thinking機能を無効化
        },
      },
    });
    
    console.log('📥 Gemini API response received');
    
    const text = response.text;
    console.log('✨ Generated text:', {
      hasText: !!text,
      textLength: text?.length || 0,
      textPreview: text ? text.substring(0, 100) + '...' : 'No text'
    });

    if (!text) {
      console.error('❌ Empty response from Gemini API');
      throw new Error('Empty response from Gemini API');
    }

    console.log('✅ AI response generated successfully');
    return text;
  } catch (error: any) {
    console.error('❌ Error generating response with Gemini:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      stack: error.stack
    });
    
    // より具体的なエラーメッセージを提供
    if (error.message?.includes('API key')) {
      throw new Error('Gemini API key is invalid or missing. Please check GEMINI_API_KEY environment variable.');
    } else if (error.message?.includes('quota')) {
      throw new Error('Gemini API quota exceeded');
    } else if (error.message?.includes('not found') || error.message?.includes('not supported')) {
      throw new Error('Gemini model not available. Please check if the model name is correct.');
    } else if (error.message?.includes('not initialized')) {
      throw error; // 既存のエラーメッセージをそのまま使用
    } else {
      throw new Error(`Failed to generate AI response: ${error.message || 'Unknown error'}`);
    }
  }
} 