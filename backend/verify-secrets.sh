#!/bin/bash

# Secret Manager 検証スクリプト
# 使用方法: ./verify-secrets.sh [PROJECT_ID]

set -e

# デフォルト設定
PROJECT_ID=${1:-"ai-persona-917ff"}

echo "🔍 Secret Manager の設定を検証します..."
echo "📋 プロジェクトID: $PROJECT_ID"

# 1. プロジェクトの設定
gcloud config set project $PROJECT_ID

# 2. シークレットの一覧表示
echo ""
echo "📋 登録されているシークレット:"
gcloud secrets list --filter="name~(GEMINI_API_KEY|FIREBASE_SERVICE_ACCOUNT)" --format="table(name,createTime,labels)"

# 3. 各シークレットの詳細確認
echo ""
echo "🔍 シークレットの詳細確認:"

# Gemini API Key
echo ""
echo "🤖 GEMINI_API_KEY:"
if gcloud secrets describe GEMINI_API_KEY > /dev/null 2>&1; then
    echo "✅ 存在します"
    echo "📊 バージョン情報:"
    gcloud secrets versions list GEMINI_API_KEY --limit=3 --format="table(name,state,createTime)"
    
    # 最新バージョンのアクセステスト
    echo "🔐 アクセステスト:"
    if SECRET_VALUE=$(gcloud secrets versions access latest --secret="GEMINI_API_KEY" 2>/dev/null); then
        if [ ${#SECRET_VALUE} -gt 10 ]; then
            echo "✅ アクセス成功 (${#SECRET_VALUE} 文字)"
        else
            echo "⚠️ アクセス成功だが値が短すぎます (${#SECRET_VALUE} 文字)"
        fi
    else
        echo "❌ アクセスに失敗しました"
    fi
else
    echo "❌ 存在しません"
fi

# Firebase Service Account
echo ""
echo "🔥 FIREBASE_SERVICE_ACCOUNT:"
if gcloud secrets describe FIREBASE_SERVICE_ACCOUNT > /dev/null 2>&1; then
    echo "✅ 存在します"
    echo "📊 バージョン情報:"
    gcloud secrets versions list FIREBASE_SERVICE_ACCOUNT --limit=3 --format="table(name,state,createTime)"
    
    # 最新バージョンのアクセステスト
    echo "🔐 アクセステスト:"
    if SECRET_VALUE=$(gcloud secrets versions access latest --secret="FIREBASE_SERVICE_ACCOUNT" 2>/dev/null); then
        # JSONの妥当性をチェック
        if echo "$SECRET_VALUE" | jq . >/dev/null 2>&1; then
            PROJECT_ID_IN_JSON=$(echo "$SECRET_VALUE" | jq -r '.project_id' 2>/dev/null)
            echo "✅ アクセス成功 - 有効なJSON"
            echo "📋 プロジェクトID: $PROJECT_ID_IN_JSON"
        else
            echo "⚠️ アクセス成功だがJSONが無効です"
        fi
    else
        echo "❌ アクセスに失敗しました"
    fi
else
    echo "⚠️ 存在しません（Application Default Credentialsを使用）"
fi

# 4. 権限の確認
echo ""
echo "🔐 Cloud Run サービスアカウントの権限確認:"
COMPUTE_SA="${PROJECT_ID}-compute@developer.gserviceaccount.com"

echo "📋 サービスアカウント: $COMPUTE_SA"

# Secret Manager Secret Accessor 権限の確認
echo "🔍 secretmanager.secretAccessor 権限:"
if gcloud projects get-iam-policy $PROJECT_ID --flatten="bindings[].members" --format="table(bindings.role)" --filter="bindings.members:$COMPUTE_SA AND bindings.role:roles/secretmanager.secretAccessor" | grep -q "secretmanager.secretAccessor"; then
    echo "✅ 権限が設定されています"
else
    echo "❌ 権限が設定されていません"
    echo "💡 以下のコマンドで権限を設定してください:"
    echo "gcloud projects add-iam-policy-binding $PROJECT_ID --member=\"serviceAccount:$COMPUTE_SA\" --role=\"roles/secretmanager.secretAccessor\""
fi

# 5. 推奨事項の表示
echo ""
echo "💡 推奨事項:"

if ! gcloud secrets describe GEMINI_API_KEY > /dev/null 2>&1; then
    echo "1. Gemini APIキーを設定してください:"
    echo "   gcloud secrets create GEMINI_API_KEY --replication-policy=\"automatic\""
    echo "   echo -n \"YOUR_GEMINI_API_KEY\" | gcloud secrets versions add GEMINI_API_KEY --data-file=-"
fi

if ! gcloud secrets describe FIREBASE_SERVICE_ACCOUNT > /dev/null 2>&1; then
    echo "2. Cloud Run環境では Application Default Credentials (ADC) の使用を推奨します"
    echo "   サービスアカウントキーが必要な場合は以下で設定:"
    echo "   gcloud secrets create FIREBASE_SERVICE_ACCOUNT --replication-policy=\"automatic\""
    echo "   gcloud secrets versions add FIREBASE_SERVICE_ACCOUNT --data-file=\"path/to/firebase-service-account.json\""
fi

echo ""
echo "✅ Secret Manager 検証が完了しました！" 