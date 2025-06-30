# Google Cloud Run バックエンドデプロイガイド

## 📋 デプロイ概要
このガイドでは、AI PersonaのバックエンドAPIをGoogle Cloud Runにデプロイする手順を説明します。

## 🔧 事前準備

### 1. Google Cloud SDK (gcloud) のインストール
```bash
# macOS (Homebrew)
brew install --cask google-cloud-sdk

# その他のOSは公式ドキュメントを参照
# https://cloud.google.com/sdk/docs/install
```

### 2. Google Cloudへの認証
```bash
# GCPにログイン
gcloud auth login

# プロジェクトIDを設定
gcloud config set project YOUR_GCP_PROJECT_ID
```

### 3. 必要なAPIの有効化
```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 4. Dockerのインストール
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) をインストール
- Dockerが起動していることを確認

## 🔑 環境変数の設定

### 1. Gemini API キーの設定
Secret Managerを使用してAPIキーを安全に管理します：

```bash
# シークレットを作成（対話的にAPIキーを入力）
echo "YOUR_GEMINI_API_KEY" | gcloud secrets create GEMINI_API_KEY --data-file=-

# または、ファイルから作成
echo "YOUR_GEMINI_API_KEY" > temp_key.txt
gcloud secrets create GEMINI_API_KEY --data-file=temp_key.txt
rm temp_key.txt
```

## 🚀 デプロイ方法

### オプション1: 自動スクリプトを使用（推奨）
```bash
cd backend
./deploy.sh [プロジェクトID]

# 例
./deploy.sh ai-persona-917ff
```

### オプション2: 手動デプロイ
```bash
cd backend

# 1. Artifact Registryリポジトリの作成
gcloud artifacts repositories create ai-persona-repo \
    --repository-format=docker \
    --location=asia-northeast1 \
    --description="AI Persona Backend Repository"

# 2. Docker認証
gcloud auth configure-docker asia-northeast1-docker.pkg.dev

# 3. イメージのビルドとプッシュ
IMAGE_URI="asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/ai-persona-repo/ai-persona-backend:latest"
docker build -t $IMAGE_URI .
docker push $IMAGE_URI

# 4. Cloud Runにデプロイ
gcloud run deploy ai-persona-backend \
    --image=$IMAGE_URI \
    --region=asia-northeast1 \
    --platform=managed \
    --allow-unauthenticated \
    --set-env-vars="NODE_ENV=production,FIREBASE_PROJECT_ID=YOUR_PROJECT_ID" \
    --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
    --port=8080 \
    --cpu=1 \
    --memory=2Gi \
    --min-instances=0 \
    --max-instances=10 \
    --timeout=300
```

### オプション3: CI/CDパイプライン（Cloud Build）
```bash
# Cloud Buildを使用してデプロイ
gcloud builds submit --config=cloudbuild.yaml \
    --substitutions=_FRONTEND_URL=https://your-frontend-url.vercel.app
```

## 🔧 デプロイ後の設定

### 1. CORS設定の更新
フロントエンドのURLが決まったら、CORS設定を更新：

```bash
gcloud run services update ai-persona-backend \
    --region=asia-northeast1 \
    --set-env-vars="CORS_ORIGIN=https://your-frontend-url.vercel.app"
```

### 2. サービスアカウントの権限設定（必要に応じて）
```bash
# Firestore読み書き権限
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:ai-persona-backend@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/datastore.user"

# Secret Manager読み取り権限
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:ai-persona-backend@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

## 🧪 デプロイの確認

### 1. ヘルスチェック
```bash
curl https://YOUR_SERVICE_URL/health
```

期待されるレスポンス：
```json
{
  "status": "OK",
  "message": "Server is running",
  "services": {
    "gemini": "active"
  }
}
```

### 2. API テスト
```bash
curl https://YOUR_SERVICE_URL/api/test
```

期待されるレスポンス：
```json
{
  "message": "API is working!"
}
```

## 🔄 更新とロールバック

### アプリケーションの更新
```bash
# コードを変更後、再デプロイ
./deploy.sh

# または手動で
docker build -t $IMAGE_URI .
docker push $IMAGE_URI
gcloud run deploy ai-persona-backend --image=$IMAGE_URI --region=asia-northeast1
```

### ロールバック
```bash
# 以前のリビジョンを確認
gcloud run revisions list --service=ai-persona-backend --region=asia-northeast1

# 特定のリビジョンにロールバック
gcloud run services update-traffic ai-persona-backend \
    --to-revisions=REVISION_NAME=100 \
    --region=asia-northeast1
```

## 🐛 トラブルシューティング

### よくある問題

1. **権限エラー**
   ```bash
   # Google Cloud権限を確認
   gcloud auth list
   gcloud config get-value project
   ```

2. **Docker認証エラー**
   ```bash
   # Docker認証を再設定
   gcloud auth configure-docker asia-northeast1-docker.pkg.dev
   ```

3. **メモリ不足エラー**
   ```bash
   # メモリを増加
   gcloud run services update ai-persona-backend \
       --memory=4Gi \
       --region=asia-northeast1
   ```

4. **シークレットアクセスエラー**
   ```bash
   # Secret Managerの権限を確認
   gcloud secrets get-iam-policy GEMINI_API_KEY
   ```

### ログの確認
```bash
# リアルタイムログ
gcloud run services logs tail ai-persona-backend --region=asia-northeast1

# 過去のログ
gcloud run services logs read ai-persona-backend --region=asia-northeast1 --limit=100
```

## 📊 監視とメトリクス

Google Cloud Consoleで以下を監視できます：
- リクエスト数
- レスポンス時間
- エラー率
- CPU/メモリ使用率

アラート設定も可能です。

## 💰 コスト最適化

- **最小インスタンス数**: 0に設定（コールドスタート許容）
- **最大インスタンス数**: トラフィックに応じて調整
- **CPU配分**: 必要最小限に設定
- **リクエストタイムアウト**: 適切に設定 