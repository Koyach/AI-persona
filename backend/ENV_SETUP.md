# 環境変数設定ガイド

## 📋 概要
AI Persona バックエンドAPIで使用する環境変数の設定方法を説明します。

## 🔧 必要な環境変数

### 必須環境変数

| 変数名 | 説明 | 例 | 用途 |
|--------|------|-----|------|
| `PORT` | サーバーポート | `8080` | Cloud Run用 |
| `NODE_ENV` | 実行環境 | `production` | 本番/開発の切り替え |
| `FIREBASE_PROJECT_ID` | FirebaseプロジェクトID | `ai-persona-917ff` | Firebase接続 |

### オプション環境変数

| 変数名 | 説明 | 例 | デフォルト値 |
|--------|------|-----|-------------|
| `GEMINI_API_KEY` | Gemini API キー | `AIza...` | - |
| `CORS_ORIGINS` | 許可するオリジン | `http://localhost:3000,https://app.vercel.app` | `http://localhost:3000` |
| `CORS_ORIGIN` | 単一オリジン（後方互換） | `https://app.vercel.app` | `http://localhost:3000` |
| `GEMINI_MODEL` | 使用するGeminiモデル | `gemini-2.0-flash` | `gemini-2.0-flash` |
| `GEMINI_MAX_TOKENS` | 最大トークン数 | `2000` | `1000` |
| `LOG_LEVEL` | ログレベル | `debug` | `info` |

## 🏠 ローカル開発環境

### .envファイルの作成
```bash
cd backend
cp .env.example .env
```

### .envファイルの内容例
```env
# サーバー設定
PORT=8080
NODE_ENV=development

# Firebase設定
FIREBASE_PROJECT_ID=ai-persona-917ff

# Gemini API設定
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash
GEMINI_MAX_TOKENS=1000

# CORS設定
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# ログ設定
LOG_LEVEL=debug
```

### 開発サーバーの起動
```bash
# デフォルトポート（3001）で起動
npm run dev

# Cloud Runと同じポート（8080）で起動
npm run dev:8080

# または環境変数を指定
PORT=8080 npm run dev
```

## ☁️ Cloud Run本番環境

### 環境変数の設定方法

#### デプロイ時に設定
```bash
gcloud run deploy ai-persona-backend \
    --set-env-vars="NODE_ENV=production,FIREBASE_PROJECT_ID=ai-persona-917ff,CORS_ORIGINS=https://your-app.vercel.app"
```

#### デプロイ後に更新
```bash
gcloud run services update ai-persona-backend \
    --region=asia-northeast1 \
    --set-env-vars="CORS_ORIGINS=http://localhost:3000,https://your-app.vercel.app"
```

#### 現在の設定を確認
```bash
gcloud run services describe ai-persona-backend \
    --region=asia-northeast1 \
    --format="export" | grep -A 20 "env:"
```

### Secret Managerとの連携

機密情報はSecret Managerで管理します：

```bash
# シークレットの設定
--set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

## 🌐 CORS設定の詳細

### 単一オリジンの設定
```bash
# 環境変数
CORS_ORIGIN=https://your-app.vercel.app
```

### 複数オリジンの設定
```bash
# カンマ区切りで複数指定
CORS_ORIGINS=http://localhost:3000,https://your-app.vercel.app,https://staging.vercel.app
```

### 動的な設定例
```bash
# 本番環境
CORS_ORIGINS=https://ai-persona.vercel.app

# 開発環境
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# ステージング環境
CORS_ORIGINS=http://localhost:3000,https://staging-ai-persona.vercel.app,https://ai-persona.vercel.app
```

## 🔄 環境別設定例

### 開発環境（.env）
```env
PORT=8080
NODE_ENV=development
FIREBASE_PROJECT_ID=ai-persona-dev
GEMINI_API_KEY=dev_api_key
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
LOG_LEVEL=debug
```

### ステージング環境（Cloud Run）
```bash
NODE_ENV=staging
FIREBASE_PROJECT_ID=ai-persona-staging
CORS_ORIGINS=http://localhost:3000,https://staging-app.vercel.app
```

### 本番環境（Cloud Run）
```bash
NODE_ENV=production
FIREBASE_PROJECT_ID=ai-persona-917ff
CORS_ORIGINS=https://your-app.vercel.app
```

## 🧪 設定の確認

### ローカルでの確認
```bash
# サーバー起動時にログで確認
npm run dev:8080
```

ログ出力例：
```
🚀 ===== AI Persona Backend API Started =====
📍 Server URL: http://localhost:8080
📖 Environment: development
🤖 Gemini API: Active
🔥 Firebase Project: ai-persona-917ff
🌐 CORS Allowed Origins:
   - http://localhost:3000
   - http://localhost:3001
```

### Cloud Runでの確認
```bash
# ヘルスチェック
curl https://your-service-url.run.app/health

# 環境変数の確認
gcloud run services describe ai-persona-backend --region=asia-northeast1
```

## 🐛 トラブルシューティング

### CORS エラー
```
Access to fetch at 'https://api.run.app/api/test' from origin 'https://app.vercel.app' has been blocked by CORS policy
```

**解決策：**
```bash
# オリジンを追加
gcloud run services update ai-persona-backend \
    --region=asia-northeast1 \
    --set-env-vars="CORS_ORIGINS=http://localhost:3000,https://app.vercel.app"
```

### ポートエラー
```
Error: listen EADDRINUSE: address already in use :::8080
```

**解決策：**
```bash
# 別のポートを使用
PORT=3001 npm run dev

# または既存プロセスを終了
lsof -ti:8080 | xargs kill -9
```

### Firebase 接続エラー
```
Error: Failed to initialize Firebase Admin SDK
```

**解決策：**
```bash
# プロジェクトIDを確認
echo $FIREBASE_PROJECT_ID

# 正しい値を設定
export FIREBASE_PROJECT_ID=ai-persona-917ff
```

## 📚 参考資料

- [Cloud Run 環境変数](https://cloud.google.com/run/docs/configuring/environment-variables)
- [Express CORS設定](https://expressjs.com/en/resources/middleware/cors.html)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) 