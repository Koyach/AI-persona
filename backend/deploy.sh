#!/bin/bash

# Google Cloud Run デプロイスクリプト
# 使用方法: ./deploy.sh [PROJECT_ID]

set -e

# デフォルト設定
PROJECT_ID=${1:-"ai-persona-917ff"}
REGION="asia-northeast1"
SERVICE_NAME="ai-persona-backend"
REPOSITORY_NAME="ai-persona-repo"
IMAGE_NAME="ai-persona-backend"

echo "🚀 Google Cloud Run デプロイを開始します..."
echo "📋 設定:"
echo "  プロジェクトID: $PROJECT_ID"
echo "  リージョン: $REGION"
echo "  サービス名: $SERVICE_NAME"
echo "  リポジトリ: $REPOSITORY_NAME"

# 1. プロジェクトの設定
echo "🔧 Google Cloud プロジェクトを設定中..."
gcloud config set project $PROJECT_ID

# 2. 必要なAPIの有効化
echo "🛠️ 必要なAPIを有効化中..."
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# 3. Artifact Registryリポジトリの作成（存在しない場合）
echo "📦 Artifact Registryリポジトリを確認中..."
if ! gcloud artifacts repositories describe $REPOSITORY_NAME --location=$REGION > /dev/null 2>&1; then
    echo "📦 Artifact Registryリポジトリを作成中..."
    gcloud artifacts repositories create $REPOSITORY_NAME \
        --repository-format=docker \
        --location=$REGION \
        --description="AI Persona Backend Repository"
else
    echo "✅ Artifact Registryリポジトリは既に存在します"
fi

# 4. Docker認証の設定
echo "🔐 Docker認証を設定中..."
gcloud auth configure-docker $REGION-docker.pkg.dev

# 5. イメージのビルドとプッシュ
IMAGE_URI="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY_NAME/$IMAGE_NAME:latest"
echo "🏗️ Dockerイメージをビルド中..."
docker build -t $IMAGE_URI .

echo "📤 イメージをArtifact Registryにプッシュ中..."
docker push $IMAGE_URI

# 6. Secret Managerでの環境変数設定確認
echo "🔑 Secret Managerでの設定を確認中..."
if ! gcloud secrets describe GEMINI_API_KEY > /dev/null 2>&1; then
    echo "⚠️ GEMINI_API_KEY シークレットが見つかりません"
    echo "以下のコマンドで作成してください:"
    echo "gcloud secrets create GEMINI_API_KEY --data-file=-"
    echo "（その後、Gemini API キーを入力してCtrl+Dで終了）"
    read -p "Enterキーを押してシークレットの作成を待機..."
fi

# 7. Cloud Runサービスのデプロイ
echo "☁️ Cloud Runサービスをデプロイ中..."

# フロントエンドURLの入力（オプション）
echo ""
read -p "フロントエンドのURL（Vercel）を入力してください（Enterでスキップ）: " FRONTEND_URL
if [ -n "$FRONTEND_URL" ]; then
    CORS_ORIGINS="http://localhost:3000,https://${PROJECT_ID}.web.app,${FRONTEND_URL}"
    echo "🌐 CORS Origins: $CORS_ORIGINS"
else
    CORS_ORIGINS="http://localhost:3000,https://${PROJECT_ID}.web.app"
    echo "🌐 CORS Origins: $CORS_ORIGINS (デフォルト)"
fi

gcloud run deploy $SERVICE_NAME \
    --image=$IMAGE_URI \
    --region=$REGION \
    --platform=managed \
    --allow-unauthenticated \
    --set-env-vars="NODE_ENV=production,FIREBASE_PROJECT_ID=$PROJECT_ID,CORS_ORIGINS=$CORS_ORIGINS" \
    --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
    --port=8080 \
    --cpu=1 \
    --memory=2Gi \
    --min-instances=0 \
    --max-instances=10 \
    --timeout=300

# 8. サービスURLの取得
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

echo "✅ デプロイが完了しました！"
echo "🌐 サービスURL: $SERVICE_URL"
echo "🔗 ヘルスチェック: $SERVICE_URL/health"
echo "📊 API テスト: $SERVICE_URL/api/test"

echo ""
echo "📝 次のステップ:"
if [ -z "$FRONTEND_URL" ]; then
    echo "1. フロントエンドのCORSを後で更新:"
    echo "   gcloud run services update $SERVICE_NAME --region=$REGION --set-env-vars=\"CORS_ORIGINS=http://localhost:3000,https://your-frontend-url.vercel.app\""
fi
echo "2. フロントエンドの環境変数を設定:"
echo "   NEXT_PUBLIC_API_URL=$SERVICE_URL"
echo "3. カスタムドメインを設定（オプション）"
echo ""
echo "🔧 CORS設定の更新方法:"
echo "gcloud run services update $SERVICE_NAME --region=$REGION --set-env-vars=\"CORS_ORIGINS=origin1,origin2,origin3\"" 