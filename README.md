# AI-Persona アプリケーション

このプロジェクトは、AI によるインタビューを通じてユーザーのペルソナを構築するアプリケーションです。

## 技術スタック

- **フロントエンド**: Next.js (TypeScript) + Material-UI
- **バックエンド**: Node.js/Express (TypeScript)
- **データベース**: Firebase Firestore
- **認証**: Firebase Authentication
- **分析**: Firebase Analytics
- **AI**: Google Gemini API
- **デプロイ**: Vercel (frontend) + Cloud Run (backend)

## プロジェクト構成

```
AI-persona/
├── frontend/          # Next.js フロントエンドアプリケーション
├── backend/           # Node.js/Express バックエンドAPI
├── firebase.json      # Firebase設定ファイル
├── firestore.rules    # Firestoreセキュリティルール
├── firestore.indexes.json # Firestoreインデックス設定
└── README.md
```

## Firebase設定

### プロジェクト情報
- **プロジェクトID**: `ai-persona-917ff`
- **アプリID**: `1:724840376313:web:ff47c35cf93597497bbf28`
- **測定ID**: `G-F8T4RZNZKS`

### 設定ファイル
- **フロントエンド**: `frontend/src/lib/firebase/client.ts`
- **バックエンド**: `backend/src/lib/firebase/admin.ts`
- **Analytics**: `frontend/src/lib/firebase/analytics.ts`
- **エラーハンドリング**: `frontend/src/lib/firebase/errorHandler.ts`
- **セキュリティ**: `frontend/src/lib/firebase/security.ts`

### 環境変数設定

#### フロントエンド (`frontend/.env.local`) 


#### バックエンド (`backend/.env`)


## セットアップ手順

### 1. Javaのインストール（Firebase Emulator用）

Firebase Emulatorを使用するには、Java 8以上が必要です。

#### macOS (Homebrew)
```bash
# HomebrewでJavaをインストール
brew install openjdk@17

# パスを設定
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# インストール確認
java -version
```

#### macOS (手動インストール)
1. [Oracle Java](https://www.oracle.com/java/technologies/downloads/) からJava 17をダウンロード
2. インストーラーを実行
3. パスを設定

#### Windows
1. [Oracle Java](https://www.oracle.com/java/technologies/downloads/) からJava 17をダウンロード
2. インストーラーを実行
3. 環境変数PATHにJavaのbinディレクトリを追加

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install openjdk-17-jdk
```

### 2. 依存関係のインストール

```bash
# フロントエンド
cd frontend
npm install

# バックエンド
cd ../backend
npm install
```

### 3. 環境変数の設定

上記の環境変数を適切なファイルに設定してください。

## ステップ1: 基盤構築完了 ✅

以下の基盤構築が完了しました：

### フロントエンド (Next.js)
- ✅ Next.js プロジェクト作成 (TypeScript, App Router)
- ✅ Material-UI の導入
- ✅ Firebase SDK の導入
- ✅ Firebase クライアント設定ファイル作成
- ✅ Firebase Analytics の設定
- ✅ エラーハンドリングシステムの実装
- ✅ セキュリティ設定の追加

### バックエンド (Node.js/Express)
- ✅ Express プロジェクト初期化
- ✅ 必要ライブラリのインストール
- ✅ TypeScript 設定
- ✅ Firebase Admin SDK 設定
- ✅ Express サーバー雛形作成
- ✅ エラーハンドリングミドルウェアの強化

### Firebase設定
- ✅ Firebase設定ファイル (`firebase.json`) 作成
- ✅ Firestoreインデックス設定 (`firestore.indexes.json`) 作成
- ✅ Analytics設定とユーティリティ作成
- ✅ 認証・ログアウト時のAnalyticsイベント送信

## ステップ2: ユーザー認証機能実装完了 ✅

以下の認証機能が完了しました：

### 認証基盤
- ✅ 認証状態管理のReact Context作成 (`src/contexts/AuthContext.tsx`)
- ✅ アプリケーション全体でAuthProviderを設定
- ✅ Analyticsイベントの統合
- ✅ エラーハンドリングの統合

### 認証ページ
- ✅ サインアップページの作成 (`src/app/signup/page.tsx`)
  - Material-UIを使用したレスポンシブフォーム
  - バリデーション機能
  - Firebase Authentication統合
  - エラーハンドリング機能
- ✅ ログインページの作成 (`src/app/login/page.tsx`)
  - Material-UIを使用したレスポンシブフォーム
  - エラーハンドリング
  - Firebase Authentication統合

### ナビゲーション
- ✅ ヘッダーコンポーネントの作成 (`src/components/Header.tsx`)
  - 認証状態に応じた表示切り替え
  - ユーザーメニュー機能
  - ログアウト機能

### ホームページ
- ✅ Material-UIを使用したランディングページ更新
- ✅ 認証状態に応じたコンテンツ表示

### Analytics機能
- ✅ AnalyticsProviderコンポーネント作成
- ✅ ページビューの自動追跡
- ✅ ユーザーアクション（ログイン・ログアウト）の追跡
- ✅ カスタムイベント送信機能

### エラーハンドリング機能
- ✅ Firebaseエラーハンドリングユーティリティ (`errorHandler.ts`)
- ✅ エラー表示コンポーネント (`ErrorDisplay.tsx`)
- ✅ 認証エラーの適切な処理
- ✅ ユーザーフレンドリーなエラーメッセージ
- ✅ エラーログ機能

### セキュリティ機能
- ✅ セキュリティ設定ユーティリティ (`security.ts`)
- ✅ 機密情報のマスキング
- ✅ 環境変数の検証
- ✅ CSP (Content Security Policy) 設定

## 開発サーバーの起動

### フロントエンド
```bash
cd frontend
npm run dev
```

### バックエンド
```bash
cd backend
npm run dev
```

### Firebase Emulator
```bash
cd frontend
npm run firebase:emulators
```

## 現在利用可能な機能

### 🔐 認証機能
- **サインアップ**: `/signup` - 新規アカウント作成
- **ログイン**: `/login` - 既存アカウントでログイン
- **ログアウト**: ヘッダーメニューからログアウト
- **認証状態管理**: 自動的にログイン状態を保持・管理
- **エラーハンドリング**: 適切なエラーメッセージ表示

### 📊 Analytics機能
- **ページビュー追跡**: 自動的にページ遷移を追跡
- **ユーザーアクション追跡**: ログイン・ログアウトイベントを追跡
- **カスタムイベント**: アプリケーション固有のイベントを送信可能

### 🛡️ セキュリティ機能
- **エラーハンドリング**: 包括的なエラー処理システム
- **機密情報保護**: ログ出力時の機密情報マスキング
- **環境変数検証**: 必須設定の自動検証
- **セキュリティヘッダー**: 適切なセキュリティヘッダー設定

### 🖥️ ユーザーインターフェース
- **レスポンシブ対応**: モバイルとデスクトップに対応
- **Material-UI**: 一貫したデザイン体験
- **日本語対応**: すべてのUI要素が日本語化済み
- **エラー表示**: ユーザーフレンドリーなエラーメッセージ

## トラブルシューティング

### Firebase Emulatorが起動しない
- Javaがインストールされているか確認: `java -version`
- Java 8以上が必要です
- 上記のJavaインストール手順を参照してください

### エラーが発生する場合
- 環境変数が正しく設定されているか確認
- ブラウザのコンソールでエラーログを確認
- ネットワーク接続を確認

## 次のステップ

ステップ2が完了したら、次はステップ3「ペルソナ管理機能」の実装に進みます：

- Firestoreのデータベース設計とセキュリティルール設定
- ペルソナCRUD操作のためのバックエンドAPI実装
- ペルソナ一覧（ダッシュボード）ページのUI作成
- ペルソナ作成フォームと一覧表示コンポーネントの実装 

## 環境設定

### 重要: Firebase プロジェクトの設定

フロントエンドとバックエンドで**同じFirebaseプロジェクト**を使用する必要があります。異なるプロジェクトを使用すると、「Firebase ID token has invalid signature」エラーが発生します。

### バックエンド環境変数 (`/backend/.env.local`)

```bash
# Firebase設定（必須）
FIREBASE_PROJECT_ID=your-firebase-project-id  # フロントエンドと同じプロジェクトIDを使用

# Gemini API設定（必須）
GEMINI_API_KEY=your-gemini-api-key

# サーバー設定（オプション）
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### フロントエンド環境変数 (`/frontend/.env.local`)

```bash
# Firebase設定（すべて必須）
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id  # バックエンドと同じプロジェクトIDを使用
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX  # オプション

# API設定（必須）
NEXT_PUBLIC_API_URL=http://localhost:3001

# 開発設定（オプション）
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
```

### Firebase サービスアカウントキー

バックエンドでFirebase Admin SDKを使用するため、サービスアカウントキーが必要です：

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. プロジェクト設定 → サービスアカウント → 新しい秘密鍵を生成
3. ダウンロードしたJSONファイルを`/backend/firebase-service-account.json`として保存

## トラブルシューティング

### "Firebase ID token has invalid signature" エラー

このエラーは通常、以下の原因で発生します：

1. **プロジェクトIDの不一致**: フロントエンドとバックエンドで異なるFirebaseプロジェクトを使用している
   - 解決方法: 両方の環境変数で同じ`FIREBASE_PROJECT_ID`を設定する

2. **サービスアカウントキーの問題**: 古いまたは異なるプロジェクトのキーを使用している
   - 解決方法: 正しいプロジェクトから新しいサービスアカウントキーを生成する

3. **環境変数の未設定**: 必要な環境変数が設定されていない
   - 解決方法: 上記の環境変数をすべて正しく設定する

### デバッグ方法

開発環境では、認証エラーの詳細情報がレスポンスに含まれます。ブラウザの開発者ツールでネットワークタブを確認し、エラーレスポンスの`details`フィールドを確認してください。 