#!/bin/bash

# Secret Manager 機密情報登録スクリプト
# 使用方法: ./setup-secrets.sh [PROJECT_ID]

set -e

# デフォルト設定
PROJECT_ID=${1:-"ai-persona-917ff"}

echo "🔑 Secret Manager での機密情報登録を開始します..."
echo "📋 プロジェクトID: $PROJECT_ID"

# 1. プロジェクトの設定
echo "🔧 Google Cloud プロジェクトを設定中..."
gcloud config set project $PROJECT_ID

# 2. Secret Manager APIの有効化
echo "🛠️ Secret Manager APIを有効化中..."
gcloud services enable secretmanager.googleapis.com

# 3. Gemini APIキーの登録
echo ""
echo "🤖 Gemini APIキーを登録します..."
if gcloud secrets describe GEMINI_API_KEY > /dev/null 2>&1; then
    echo "⚠️ GEMINI_API_KEY は既に存在します"
    read -p "新しいバージョンを追加しますか？ (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "💡 Gemini APIキーを入力してください（入力は非表示になります）:"
        read -s GEMINI_API_KEY
        echo -n "$GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-
        echo "✅ GEMINI_API_KEY の新しいバージョンを追加しました"
    fi
else
    echo "📝 新しいシークレット GEMINI_API_KEY を作成します..."
    gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
    echo "💡 Gemini APIキーを入力してください（入力は非表示になります）:"
    read -s GEMINI_API_KEY
    echo -n "$GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-
    echo "✅ GEMINI_API_KEY を作成・登録しました"
fi

# 4. Firebaseサービスアカウントキーの登録（オプション）
echo ""
echo "🔥 Firebaseサービスアカウントキーの設定..."
echo "注意: Cloud Run環境では Application Default Credentials (ADC) の使用を推奨します"
echo "サービスアカウントキーファイルを使用する場合のみ以下を実行してください"

read -p "Firebaseサービスアカウントキーファイルを登録しますか？ (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # サービスアカウントキーファイルのパスを取得
    echo "📂 Firebaseサービスアカウントキーファイルのパスを入力してください:"
    echo "例: ~/Downloads/firebase-service-account.json"
    read -r SERVICE_ACCOUNT_PATH
    
    if [[ -f "$SERVICE_ACCOUNT_PATH" ]]; then
        if gcloud secrets describe FIREBASE_SERVICE_ACCOUNT > /dev/null 2>&1; then
            echo "⚠️ FIREBASE_SERVICE_ACCOUNT は既に存在します"
            read -p "新しいバージョンを追加しますか？ (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                gcloud secrets versions add FIREBASE_SERVICE_ACCOUNT --data-file="$SERVICE_ACCOUNT_PATH"
                echo "✅ FIREBASE_SERVICE_ACCOUNT の新しいバージョンを追加しました"
            fi
        else
            echo "📝 新しいシークレット FIREBASE_SERVICE_ACCOUNT を作成します..."
            gcloud secrets create FIREBASE_SERVICE_ACCOUNT --replication-policy="automatic"
            gcloud secrets versions add FIREBASE_SERVICE_ACCOUNT --data-file="$SERVICE_ACCOUNT_PATH"
            echo "✅ FIREBASE_SERVICE_ACCOUNT を作成・登録しました"
        fi
    else
        echo "❌ ファイルが見つかりません: $SERVICE_ACCOUNT_PATH"
        echo "💡 後で以下のコマンドで登録できます:"
        echo "gcloud secrets create FIREBASE_SERVICE_ACCOUNT --replication-policy=\"automatic\""
        echo "gcloud secrets versions add FIREBASE_SERVICE_ACCOUNT --data-file=\"path/to/your/firebase-service-account.json\""
    fi
else
    echo "⏭️ Firebaseサービスアカウントキーの登録をスキップしました"
    echo "💡 Cloud Runでは Application Default Credentials (ADC) を使用します"
fi

# 5. 権限の設定
echo ""
echo "🔐 Cloud Run サービスアカウントに Secret Manager 権限を付与..."

# Cloud Run のデフォルトサービスアカウント
COMPUTE_SA="${PROJECT_ID}-compute@developer.gserviceaccount.com"

# Secret Manager Secret Accessor 権限を付与
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$COMPUTE_SA" \
    --role="roles/secretmanager.secretAccessor"

echo "✅ $COMPUTE_SA に secretmanager.secretAccessor 権限を付与しました"

# 6. 登録されたシークレットの確認
echo ""
echo "📋 登録されたシークレットの一覧:"
gcloud secrets list --filter="name~(GEMINI_API_KEY|FIREBASE_SERVICE_ACCOUNT)"

echo ""
echo "✅ Secret Manager の設定が完了しました！"
echo ""
echo "📝 次のステップ:"
echo "1. デプロイスクリプトを実行: ./deploy.sh"
echo "2. または手動でCloud Runをデプロイ"
echo ""
echo "🔍 シークレットの確認コマンド:"
echo "gcloud secrets list"
echo "gcloud secrets describe GEMINI_API_KEY"
echo "gcloud secrets versions list GEMINI_API_KEY" 