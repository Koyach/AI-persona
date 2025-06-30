# AI Persona Backend

AI Personaプロジェクトのバックエンドサーバーです。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成し、以下の環境変数を設定してください：

```env
# サーバー設定
PORT=3001
NODE_ENV=development

# Firebase設定
FIREBASE_PROJECT_ID=ai-persona-917ff
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Gemini API設定（必須）
# Google AI Studioから取得したAPIキーを設定してください
# https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
GEMINI_MAX_TOKENS=1000

# Google Cloud設定（本番環境用）
GCP_PROJECT_ID=ai-persona-917ff
SECRET_MANAGER_KEY_NAME=GEMINI_API_KEY

# アプリケーション設定
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
```

### 3. Gemini APIキーの取得

1. [Google AI Studio](https://aistudio.google.com/app/apikey) にアクセス
2. 「Create API Key」をクリック
3. 生成されたAPIキーをコピー
4. `.env` ファイルの `GEMINI_API_KEY` に貼り付け

### 4. サーバーの起動

```bash
# 開発モード
npm run dev

# 本番モード
npm run build
npm start
```

## トラブルシューティング

### "Failed to generate AI response" エラーが発生する場合

1. `.env` ファイルに `GEMINI_API_KEY` が正しく設定されているか確認
2. APIキーが有効であることを確認
3. サーバーログでより詳細なエラー情報を確認

### "Database index is being created" エラーが発生する場合

Firestoreのインデックスが作成中です。以下のコマンドでインデックスをデプロイできます：

```bash
firebase deploy --only firestore:indexes
```

### ログの確認

サーバーのコンソールに詳細なログが出力されます。エラーが発生した場合は、以下のような記号でログレベルが表示されます：

- 🔄 初期化中
- ✅ 成功
- ⚠️ 警告
- ❌ エラー
- 🤖 AI処理

## API エンドポイント

- `GET /health` - ヘルスチェック
- `POST /api/interviews/message` - AIとの会話
- `GET /api/interviews/conversations/:personaId` - 会話履歴の取得
- `GET /api/personas` - ペルソナ一覧の取得
- `POST /api/personas` - 新規ペルソナの作成
- `GET /api/personas/:id` - 特定のペルソナの取得
- `PUT /api/personas/:id` - ペルソナの更新
- `DELETE /api/personas/:id` - ペルソナの削除 