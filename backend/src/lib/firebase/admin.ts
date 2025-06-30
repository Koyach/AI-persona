import admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import { config } from '../../config';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// 開発環境でFirebase Emulator環境変数を設定
// if (process.env.NODE_ENV !== 'production') {
//   process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
//   process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
//   console.log('🔥 Firebase Admin SDK configured for Emulator');
// }

// Secret Managerからサービスアカウントキーを取得する関数
async function getServiceAccountFromSecretManager(): Promise<ServiceAccount | null> {
  try {
    const client = new SecretManagerServiceClient();
    const projectId = config.firebase.projectId;
    const secretName = 'FIREBASE_SERVICE_ACCOUNT';
    const versionName = `projects/${projectId}/secrets/${secretName}/versions/latest`;

    const [version] = await client.accessSecretVersion({
      name: versionName,
    });

    const serviceAccountData = version.payload?.data?.toString();
    if (!serviceAccountData) {
      console.log('No service account data found in Secret Manager');
      return null;
    }

    const serviceAccount = JSON.parse(serviceAccountData) as ServiceAccount;
    console.log('🔑 Retrieved Firebase service account from Secret Manager');
    return serviceAccount;
  } catch (error) {
    console.log('Failed to retrieve service account from Secret Manager:', error);
    return null;
  }
}

// Firebase Admin SDK の初期化
let app: admin.app.App;

async function initializeFirebaseAdmin(): Promise<admin.app.App> {
  if (admin.apps.length > 0) {
    return admin.apps[0] as admin.app.App;
  }

  let credential: admin.credential.Credential;
  let initMethod = '';

  try {
    if (config.nodeEnv === 'development') {
      // 開発環境: ローカルのサービスアカウントキーファイルを使用
      try {
        const serviceAccount = require('../../../firebase-service-account.json') as ServiceAccount;
        credential = admin.credential.cert(serviceAccount);
        initMethod = 'local service account file';
      } catch (localError) {
        // ローカルファイルがない場合はApplication Default Credentialsを使用
        credential = admin.credential.applicationDefault();
        initMethod = 'application default credentials (development)';
      }
    } else {
      // 本番環境: Secret Manager → Application Default Credentials の順で試行
      const serviceAccountFromSecret = await getServiceAccountFromSecretManager();
      
      if (serviceAccountFromSecret) {
        credential = admin.credential.cert(serviceAccountFromSecret);
        initMethod = 'Secret Manager service account';
      } else {
        // Secret Managerから取得できない場合はApplication Default Credentialsを使用
        credential = admin.credential.applicationDefault();
        initMethod = 'application default credentials (production)';
      }
    }

    app = admin.initializeApp({
      credential,
      projectId: config.firebase.projectId,
    });

    console.log(`🔥 Firebase Admin SDK initialized with ${initMethod} for project: ${config.firebase.projectId}`);
    return app;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}

// 初期化関数を実行（非同期）
const appPromise = initializeFirebaseAdmin();

// 同期的にアクセス可能なapp変数（後方互換性のため）
if (admin.apps.length === 0) {
  // 開発環境では同期初期化を試行
  if (config.nodeEnv === 'development') {
    try {
      const serviceAccount = require('../../../firebase-service-account.json') as ServiceAccount;
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: config.firebase.projectId,
      });
    } catch (error) {
      app = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: config.firebase.projectId,
      });
    }
  } else {
    // 本番環境では一時的にApplication Default Credentialsで初期化
    app = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: config.firebase.projectId,
    });
  }
} else {
  app = admin.apps[0] as admin.app.App;
}

// Firestore と Auth のインスタンスをエクスポート
export const db = admin.firestore();
export const auth = admin.auth();

export default app; 