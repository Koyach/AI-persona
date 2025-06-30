import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes';
import personaRoutes from './routes/personaRoutes';
import interviewRoutes from './routes/interviewRoutes';
import { initializeGemini } from './lib/gemini';
import { config, validateConfig } from './config';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

// ↓↓↓ このブロックをコメントアウト ↓↓↓
// Firebase Emulator設定（開発環境のみ）
// if (process.env.NODE_ENV !== 'production') {
//   process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
//   process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
//   console.log('🔥 Firebase Emulator configured for development');
// }
// ↑↑↑ ここまで ↑↑↑

// 設定の検証
try {
  validateConfig();
} catch (error) {
  console.error('Configuration error:', error);
  process.exit(1);
}

const app = express();

// Gemini APIの初期化（サーバー起動前に完了させる）
let geminiInitialized = false;

async function initializeServices() {
  try {
    console.log('🔄 Initializing Gemini API...');
    await initializeGemini();
    geminiInitialized = true;
    console.log('✅ All services initialized successfully');
  } catch (error: any) {
    console.error('❌ Failed to initialize Gemini API:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    console.warn('⚠️  Interview features will be disabled.');
  }
}

// ミドルウェア - CORS設定
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // リクエストにoriginがない場合（例：同一オリジン、Postmanなど）は許可
    if (!origin) {
      return callback(null, true);
    }
    
    // 許可されたオリジンのリスト
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      ...(config.app.corsOrigins || [])
    ];
    
    // 環境変数CORS_ORIGINが設定されている場合は追加
    if (config.app.corsOrigin && !allowedOrigins.includes(config.app.corsOrigin)) {
      allowedOrigins.push(config.app.corsOrigin);
    }
    
    // オリジンが許可リストに含まれているかチェック
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked origin: ${origin}`);
      console.log(`✅ Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200, // IE11対応
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ルートエンドポイント
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'AI Persona Backend API', 
    version: '1.0.0',
    endpoints: {
      health: '/health',
      test: '/api/test',
      users: '/api/users',
      personas: '/api/personas',
      interviews: '/api/interviews'
    }
  });
});

// ヘルスチェック用エンドポイント
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    services: {
      gemini: geminiInitialized ? 'active' : 'disabled'
    }
  });
});

// API ルート
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// 認証が必要なユーザールート
app.use('/api/users', userRoutes);

// 認証が必要なペルソナルート
app.use('/api/personas', personaRoutes);

// 認証が必要なインタビュールート
app.use('/api/interviews', interviewRoutes);

// エラーハンドリングミドルウェア
app.use(notFoundHandler);
app.use(errorHandler);

// サーバー起動
async function startServer() {
  // サービスの初期化
  await initializeServices();
  
  // サーバーを起動（Cloud Run用に0.0.0.0でリッスン）
  const host = config.nodeEnv === 'production' ? '0.0.0.0' : 'localhost';
  app.listen(config.port, host, () => {
    console.log('');
    console.log('🚀 ===== AI Persona Backend API Started =====');
    console.log(`📍 Server URL: http://${host}:${config.port}`);
    console.log(`📖 Environment: ${config.nodeEnv}`);
    console.log(`🤖 Gemini API: ${geminiInitialized ? 'Active' : 'Disabled'}`);
    console.log(`🔥 Firebase Project: ${config.firebase.projectId}`);
    
    // CORS設定の表示
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      ...(config.app.corsOrigins || [])
    ];
    if (config.app.corsOrigin && !allowedOrigins.includes(config.app.corsOrigin)) {
      allowedOrigins.push(config.app.corsOrigin);
    }
    console.log(`🌐 CORS Allowed Origins:`);
    allowedOrigins.forEach(origin => console.log(`   - ${origin}`));
    
    console.log('');
    console.log('📚 Available Endpoints:');
    console.log(`   🏠 Root: http://${host}:${config.port}/`);
    console.log(`   ❤️  Health: http://${host}:${config.port}/health`);
    console.log(`   🧪 Test: http://${host}:${config.port}/api/test`);
    console.log(`   👤 Users: http://${host}:${config.port}/api/users`);
    console.log(`   🎭 Personas: http://${host}:${config.port}/api/personas`);
    console.log(`   💬 Interviews: http://${host}:${config.port}/api/interviews`);
    console.log('==============================================');
    console.log('');
  });
}

// サーバーを起動
startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}); 