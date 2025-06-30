# Secret Manager 機密情報登録ガイド

## 📋 概要
Google Cloud Secret Managerを使用して、AI PersonaアプリケーションのAPIキーやサービスアカウントキーなどの機密情報を安全に管理します。

## 🔑 必要なシークレット

### 1. GEMINI_API_KEY（必須）
- **説明**: Google Gemini APIのアクセスキー
- **用途**: AI面接機能での質問生成・評価
- **取得方法**: [Google AI Studio](https://makersuite.google.com/app/apikey) でAPIキーを生成

### 2. FIREBASE_SERVICE_ACCOUNT（オプション）
- **説明**: Firebase Admin SDK用のサービスアカウントキー
- **用途**: Firestore、Authentication の認証
- **推奨**: Cloud Run環境では Application Default Credentials (ADC) を使用

## 🚀 自動セットアップ（推奨）

### 一括セットアップスクリプトの実行
```bash
cd backend
./setup-secrets.sh [プロジェクトID]

# 例
./setup-secrets.sh ai-persona-917ff
```

このスクリプトが以下を自動実行します：
1. Secret Manager APIの有効化
2. シークレットの作成と登録
3. 権限の設定
4. 設定の確認

## 🔧 手動セットアップ

### 1. 事前準備
```bash
# プロジェクトの設定
gcloud config set project YOUR_PROJECT_ID

# Secret Manager APIの有効化
gcloud services enable secretmanager.googleapis.com
```

### 2. Gemini APIキーの登録
```bash
# シークレットを作成
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# APIキーを登録（対話的）
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# または環境変数から登録
echo -n "$GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-
```

**Gemini APIキーの取得方法：**
1. [Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス
2. "Create API Key" をクリック
3. プロジェクトを選択
4. 生成されたAPIキーをコピー

### 3. Firebaseサービスアカウントキーの登録（オプション）

#### オプション A: サービスアカウントキーファイルを使用
```bash
# シークレットを作成
gcloud secrets create FIREBASE_SERVICE_ACCOUNT --replication-policy="automatic"

# サービスアカウントキーファイルを登録
gcloud secrets versions add FIREBASE_SERVICE_ACCOUNT --data-file="path/to/firebase-service-account.json"
```

**サービスアカウントキーの取得方法：**
1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクトを選択
3. 設定 > プロジェクトの設定 > サービスアカウント
4. "新しい秘密鍵の生成" をクリック
5. JSONファイルをダウンロード

#### オプション B: Application Default Credentials を使用（推奨）
Cloud Run環境では、サービスアカウントキーファイルを使わずにADCを使用することを推奨します。
```bash
# 特別な設定は不要
# Cloud Runが自動的にCompute Engine デフォルトサービスアカウントを使用
```

### 4. 権限の設定
```bash
# Cloud Run サービスアカウントにSecret Manager読み取り権限を付与
PROJECT_ID="YOUR_PROJECT_ID"
COMPUTE_SA="${PROJECT_ID}-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$COMPUTE_SA" \
    --role="roles/secretmanager.secretAccessor"
```

## 🧪 設定の確認

### 検証スクリプトの実行
```bash
cd backend
./verify-secrets.sh [プロジェクトID]
```

### 手動確認コマンド
```bash
# シークレット一覧の確認
gcloud secrets list

# 特定のシークレットの詳細
gcloud secrets describe GEMINI_API_KEY
gcloud secrets describe FIREBASE_SERVICE_ACCOUNT

# シークレットのバージョン確認
gcloud secrets versions list GEMINI_API_KEY

# アクセステスト（値の先頭のみ表示）
gcloud secrets versions access latest --secret="GEMINI_API_KEY" | head -c 20
```

## 🔄 シークレットの更新

### 新しいバージョンの追加
```bash
# Gemini APIキーの更新
echo -n "NEW_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Firebaseサービスアカウントキーの更新
gcloud secrets versions add FIREBASE_SERVICE_ACCOUNT --data-file="new-firebase-service-account.json"
```

### 古いバージョンの無効化
```bash
# 特定のバージョンを無効化
gcloud secrets versions disable VERSION_ID --secret="GEMINI_API_KEY"

# 古いバージョンの削除
gcloud secrets versions destroy VERSION_ID --secret="GEMINI_API_KEY"
```

## 🔐 セキュリティのベストプラクティス

### 1. 最小権限の原則
- 必要最小限の権限のみを付与
- Secret Manager Secret Accessor権限のみを使用

### 2. 定期的なローテーション
- APIキーを定期的に更新
- 古いバージョンを適切に削除

### 3. アクセス監査
```bash
# シークレットアクセスログの確認
gcloud logging read "resource.type=gce_instance AND protoPayload.serviceName=secretmanager.googleapis.com" --limit=50 --format=json
```

### 4. 環境分離
- 開発・本番環境で異なるプロジェクトを使用
- 環境ごとに別々のシークレットを管理

## 🐛 トラブルシューティング

### よくある問題と解決策

#### 1. 権限エラー
```
Error: The caller does not have permission to access secrets
```
**解決策:**
```bash
# Service Accountに権限を追加
gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
    --role="roles/secretmanager.secretAccessor"
```

#### 2. シークレットが見つからない
```
Error: Secret [GEMINI_API_KEY] not found
```
**解決策:**
```bash
# プロジェクトIDを確認
gcloud config get-value project

# シークレットを作成
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
```

#### 3. 無効なJSON
```
Error: Invalid JSON in FIREBASE_SERVICE_ACCOUNT
```
**解決策:**
```bash
# JSONファイルの妥当性を確認
jq . firebase-service-account.json

# 再登録
gcloud secrets versions add FIREBASE_SERVICE_ACCOUNT --data-file="firebase-service-account.json"
```

## 💰 コスト管理

Secret Managerの料金：
- **アクティブシークレットバージョン**: $0.06/月（月10,000バージョンまで無料）
- **アクセス操作**: $0.03/10,000回（月10,000回まで無料）

コスト最適化：
- 不要な古いバージョンを削除
- シークレットの数を最小限に抑える

## 📚 参考資料

- [Google Cloud Secret Manager](https://cloud.google.com/secret-manager)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Google AI Studio](https://makersuite.google.com/)
- [Application Default Credentials](https://cloud.google.com/docs/authentication/application-default-credentials) 