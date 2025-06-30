# Build stage
FROM node:18-alpine AS builder

# 作業ディレクトリの設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係のインストール
RUN npm ci --only=production

# TypeScript依存関係のインストール（ビルド用）
RUN npm install typescript ts-node

# ソースコードをコピー
COPY . .

# TypeScriptをJavaScriptにコンパイル
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# 作業ディレクトリの設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 本番環境の依存関係のみをインストール
RUN npm ci --only=production && npm cache clean --force

# ビルドされたJavaScriptファイルをコピー
COPY --from=builder /app/dist ./dist

# Firebaseサービスアカウントファイル用のディレクトリを作成
RUN mkdir -p /app/service-account

# 非rootユーザーでの実行
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