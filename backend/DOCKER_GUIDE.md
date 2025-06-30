# Docker ガイド

## 📋 概要
AI Persona バックエンドAPIのDockerコンテナ化について説明します。

## 🐳 Dockerのインストール

### macOS
```bash
# Homebrew経由でインストール
brew install --cask docker

# または、Docker Desktopの公式サイトからダウンロード
# https://www.docker.com/products/docker-desktop/
```

### Windows
1. [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) をダウンロード
2. インストーラーを実行
3. WSL 2が必要な場合は指示に従ってインストール

### Linux (Ubuntu)
```bash
# Docker公式リポジトリを追加
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Dockerをインストール
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# ユーザーをdockerグループに追加
sudo usermod -aG docker $USER
```

## 🚀 Dockerfileの詳細解説

### 現在のDockerfile構成
```dockerfile
# ===== Build Stage =====
FROM node:18-alpine AS builder

# 作業ディレクトリの設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 本番依存関係のインストール
RUN npm ci --only=production

# TypeScript依存関係のインストール（ビルド用）
RUN npm install typescript ts-node

# ソースコードをコピー
COPY . .

# TypeScriptをJavaScriptにコンパイル
RUN npm run build

# ===== Production Stage =====
FROM node:18-alpine AS production

# 作業ディレクトリの設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 本番環境の依存関係のみをインストール
RUN npm ci --only=production && npm cache clean --force

# ビルドされたJavaScriptファイルをコピー
COPY --from=builder /app/dist ./dist

# セキュリティ: 非rootユーザーでの実行
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# ポートを公開
EXPOSE 8080

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:$PORT/health || exit 1

# 起動コマンド
CMD ["npm", "start"]
```

### 多段階ビルドの利点

#### 1. **イメージサイズの最適化**
```bash
# 従来の単一ステージビルド: ~800MB
# 多段階ビルド: ~200MB (約75%削減)
```

#### 2. **セキュリティの向上**
- ビルド依存関係を本番環境から除外
- 非rootユーザーでの実行
- 最小限のパッケージのみ含める

#### 3. **ビルド効率化**
- Docker layer cachingの最適化
- 依存関係の変更時のみ再インストール

## 🛠️ ローカルでのDocker使用方法

### 1. イメージのビルド
```bash
cd backend

# 開発用ビルド
docker build -t ai-persona-backend:dev .

# 本番用ビルド（キャッシュなし）
docker build -t ai-persona-backend:latest . --no-cache

# 特定のターゲットステージのみビルド
docker build --target builder -t ai-persona-backend:builder .
```

### 2. コンテナの実行
```bash
# 基本実行
docker run -p 8080:8080 ai-persona-backend:latest

# 環境変数を指定して実行
docker run -p 8080:8080 \
  -e NODE_ENV=development \
  -e FIREBASE_PROJECT_ID=ai-persona-917ff \
  -e GEMINI_API_KEY=your_api_key \
  -e CORS_ORIGINS=http://localhost:3000 \
  ai-persona-backend:latest

# バックグラウンドで実行
docker run -d -p 8080:8080 --name ai-persona-api ai-persona-backend:latest

# ログの確認
docker logs ai-persona-api

# コンテナの停止
docker stop ai-persona-api

# コンテナの削除
docker rm ai-persona-api
```

### 3. 開発時の便利コマンド
```bash
# 実行中のコンテナに接続
docker exec -it ai-persona-api sh

# イメージの詳細確認
docker inspect ai-persona-backend:latest

# イメージサイズの確認
docker images ai-persona-backend

# 不要なイメージの削除
docker rmi ai-persona-backend:dev
```

## 🐳 Docker Composeの使用

### docker-compose.yml の作成
```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=development
      - FIREBASE_PROJECT_ID=ai-persona-917ff
      - CORS_ORIGINS=http://localhost:3000
    volumes:
      - ./src:/app/src:ro  # 開発時のホットリロード用
    restart: unless-stopped

  # 開発時用のFirestore Emulator
  firestore:
    image: gcr.io/google.com/cloudsdktool/cloud-sdk:alpine
    ports:
      - "8080:8080"
      - "9099:9099"
    command: >
      sh -c "
        gcloud emulators firestore start --host-port=0.0.0.0:8080 &
        gcloud emulators firestore start --host-port=0.0.0.0:9099
      "
```

### Docker Composeの使用方法
```bash
# サービスの起動
docker-compose up

# バックグラウンドで起動
docker-compose up -d

# ログの確認
docker-compose logs backend

# サービスの停止
docker-compose down

# ビルドからやり直し
docker-compose up --build
```

## 🔧 最適化のポイント

### 1. .dockerignoreの活用
```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.env.local
coverage
.nyc_output
dist
*.log
```

### 2. Layer Cachingの最適化
```dockerfile
# Good: package.jsonを先にコピー
COPY package*.json ./
RUN npm ci --only=production

# ソースコードは後でコピー
COPY . .
```

### 3. セキュリティのベストプラクティス
- 非rootユーザーでの実行
- 最小限のベースイメージ使用
- 不要なパッケージの除外
- ヘルスチェックの実装

## 🚀 Cloud Runでのデプロイ

### 1. Google Cloud Artifact Registryにプッシュ
```bash
# イメージのタグ付け
docker tag ai-persona-backend:latest asia-northeast1-docker.pkg.dev/PROJECT_ID/ai-persona-repo/ai-persona-backend:latest

# プッシュ
docker push asia-northeast1-docker.pkg.dev/PROJECT_ID/ai-persona-repo/ai-persona-backend:latest
```

### 2. Cloud Runにデプロイ
```bash
gcloud run deploy ai-persona-backend \
    --image=asia-northeast1-docker.pkg.dev/PROJECT_ID/ai-persona-repo/ai-persona-backend:latest \
    --region=asia-northeast1 \
    --platform=managed
```

## 🐛 トラブルシューティング

### よくある問題

#### 1. Docker Daemon起動エラー
```bash
# macOS
open /Applications/Docker.app

# Linux
sudo systemctl start docker
```

#### 2. Permission Denied
```bash
# ユーザーをdockerグループに追加（Linux）
sudo usermod -aG docker $USER
newgrp docker
```

#### 3. ポート競合
```bash
# 使用中のポートを確認
lsof -i :8080

# 別のポートを使用
docker run -p 3001:8080 ai-persona-backend:latest
```

#### 4. メモリ不足
```bash
# Dockerのメモリ制限を増加（Docker Desktop設定）
# または軽量なbaseイメージを使用
FROM node:18-alpine  # より軽量
```

## 📚 参考資料

- [Docker公式ドキュメント](https://docs.docker.com/)
- [Node.js Docker ベストプラクティス](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Multi-stage builds](https://docs.docker.com/develop/dev-best-practices/)
- [Docker Compose](https://docs.docker.com/compose/) 