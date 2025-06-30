# 🚀 Cloud Run デプロイ チェックリスト

## 📋 事前準備

### ✅ 1. Google Cloud SDK のインストール
```bash
# macOS (Homebrew)
brew install --cask google-cloud-sdk

# インストール確認
gcloud version
```

### ✅ 2. Google Cloud 認証とプロジェクト設定
```bash
# Google Cloudにログイン
gcloud auth login

# プロジェクトIDを設定
gcloud config set project YOUR_PROJECT_ID

# 現在の設定確認
gcloud config list
```

### ✅ 3. 必要なAPIの有効化
```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### ✅ 4. Gemini API キーの取得
- [Google AI Studio](https://makersuite.google.com/app/apikey) でAPIキーを生成

## 🔑 Secret Manager の設定

### オプション1: 自動スクリプト（推奨）
```bash
cd backend
./setup-secrets.sh [プロジェクトID]
```

### オプション2: 手動設定
```bash
# Gemini APIキーの登録
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Firebaseサービスアカウントキーの登録（オプション）
gcloud secrets create FIREBASE_SERVICE_ACCOUNT --replication-policy="automatic"
gcloud secrets versions add FIREBASE_SERVICE_ACCOUNT --data-file="path/to/firebase-service-account.json"
```

## 🚀 デプロイ方法の選択

### 方法1: 簡単ソースベースデプロイ（推奨初回）
```bash
# プロジェクトルートで実行
gcloud run deploy ai-persona-backend \
  --source ./backend \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,FIREBASE_PROJECT_ID=YOUR_PROJECT_ID" \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --port=8080 \
  --cpu=1 \
  --memory=2Gi \
  --min-instances=0 \
  --max-instances=10
```

### 方法2: 包括的デプロイスクリプト（推奨本格運用）
```bash
cd backend
./deploy.sh [プロジェクトID]
```

### 方法3: Docker経由デプロイ
```bash
# Dockerが必要
cd backend
docker build -t ai-persona-backend .

# Artifact Registryにプッシュしてからデプロイ
# （詳細は deploy.sh 参照）
```

## 📝 デプロイ後の設定

### 1. CORS設定の更新
```bash
# フロントエンドURLが決まったら
gcloud run services update ai-persona-backend \
    --region=asia-northeast1 \
    --set-env-vars="CORS_ORIGINS=http://localhost:3000,https://your-app.vercel.app"
```

### 2. カスタムドメイン設定（オプション）
```bash
gcloud run domain-mappings create \
    --service=ai-persona-backend \
    --domain=api.yourdomain.com \
    --region=asia-northeast1
```

## 🧪 デプロイの確認

### 1. サービスの確認
```bash
# サービス一覧
gcloud run services list

# サービスの詳細
gcloud run services describe ai-persona-backend --region=asia-northeast1
```

### 2. ヘルスチェック
```bash
# サービスURLを取得
SERVICE_URL=$(gcloud run services describe ai-persona-backend --region=asia-northeast1 --format="value(status.url)")

# ヘルスチェック
curl $SERVICE_URL/health

# APIテスト
curl $SERVICE_URL/api/test
```

### 3. ログの確認
```bash
# リアルタイムログ
gcloud run services logs tail ai-persona-backend --region=asia-northeast1

# 過去のログ
gcloud run services logs read ai-persona-backend --region=asia-northeast1 --limit=50
```

## 🐛 トラブルシューティング

### よくあるエラー

#### 1. 認証エラー
```bash
# 再認証
gcloud auth login
gcloud auth application-default login
```

#### 2. プロジェクトIDエラー
```bash
# プロジェクト確認
gcloud projects list
gcloud config set project YOUR_CORRECT_PROJECT_ID
```

#### 3. API有効化エラー
```bash
# 必要なAPIを有効化
gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com
```

#### 4. Secret Manager アクセスエラー
```bash
# 権限確認
gcloud secrets list
gcloud secrets describe GEMINI_API_KEY

# 権限設定
gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:PROJECT_ID-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

## 📚 参考コマンド

### サービスの管理
```bash
# サービスの停止（トラフィック0%）
gcloud run services update-traffic ai-persona-backend --to-revisions=LATEST=0

# サービスの再開
gcloud run services update-traffic ai-persona-backend --to-revisions=LATEST=100

# サービスの削除
gcloud run services delete ai-persona-backend --region=asia-northeast1
```

### 環境変数の更新
```bash
# 環境変数の追加/更新
gcloud run services update ai-persona-backend \
    --region=asia-northeast1 \
    --set-env-vars="NEW_VAR=value"

# 環境変数の削除
gcloud run services update ai-persona-backend \
    --region=asia-northeast1 \
    --remove-env-vars="OLD_VAR"
``` 