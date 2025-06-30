import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

// 新しい@google/genaiパッケージ用のAPI設定確認
export function checkGeminiApiKeySetup(): void {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set. Please set it in your environment variables.');
  }
  console.log('✅ GEMINI_API_KEY environment variable is properly configured');
}

// 既存のSecret Manager関数（必要に応じて保持）
export async function getGeminiApiKey(): Promise<string> {
  try {
    // 開発環境では環境変数から取得
    if (process.env.NODE_ENV !== 'production') {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not set');
      }
      return apiKey;
    }

    // 本番環境ではSecret Managerから取得
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const secretName = 'GEMINI_API_KEY';
    const versionName = `projects/${projectId}/secrets/${secretName}/versions/latest`;

    const [version] = await client.accessSecretVersion({
      name: versionName,
    });

    const apiKey = version.payload?.data?.toString();
    if (!apiKey) {
      throw new Error('Failed to retrieve Gemini API key from Secret Manager');
    }

    return apiKey;
  } catch (error) {
    console.error('Error getting Gemini API key:', error);
    throw error;
  }
} 