import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // サーバー設定
  port: parseInt(process.env.PORT || '8080', 10), // Cloud Run用にデフォルトを8080に変更
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Firebase設定
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || 'ai-persona-917ff',
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
  },
  
  // Gemini API設定
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '1000', 10),
  },
  
  // Google Cloud設定
  gcp: {
    projectId: process.env.GCP_PROJECT_ID,
    secretManagerKeyName: process.env.SECRET_MANAGER_KEY_NAME || 'GEMINI_API_KEY',
  },
  
  // アプリケーション設定
  app: {
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    corsOrigins: process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()) : 
      ['http://localhost:3000'],
    logLevel: process.env.LOG_LEVEL || 'info',
  }
};

// 必須環境変数のチェック
export const validateConfig = () => {
  // 開発環境ではGemini APIキーは必須
  if (config.nodeEnv === 'development') {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️  GEMINI_API_KEY is not set. Interview features will be disabled.');
    }
  }
}; 