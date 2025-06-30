import admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import { config } from '../../config';

// 開発環境でFirebase Emulator環境変数を設定
// if (process.env.NODE_ENV !== 'production') {
//   process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
//   process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
//   console.log('🔥 Firebase Admin SDK configured for Emulator');
// }



// Firebase Admin SDK の初期化
let app: admin.app.App;

// Firebase Admin アプリのインスタンス
if (admin.apps.length === 0) {
  // 開発環境では同期初期化を試行
  if (config.nodeEnv === 'development') {
    try {
      const serviceAccount = require('../../../firebase-service-account.json') as ServiceAccount;
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: config.firebase.projectId,
      });
      console.log(`🔥 Firebase Admin SDK initialized with local service account file for project: ${config.firebase.projectId}`);
    } catch (error) {
      app = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: config.firebase.projectId,
      });
      console.log(`🔥 Firebase Admin SDK initialized with application default credentials for project: ${config.firebase.projectId}`);
    }
  } else {
    // 本番環境ではApplication Default Credentialsで初期化
    app = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: config.firebase.projectId,
    });
    console.log(`🔥 Firebase Admin SDK initialized with application default credentials for project: ${config.firebase.projectId}`);
  }
} else {
  app = admin.apps[0] as admin.app.App;
  console.log(`🔥 Firebase Admin SDK already initialized for project: ${config.firebase.projectId}`);
}

// Firestore と Auth のインスタンスをエクスポート
export const db = admin.firestore();
export const auth = admin.auth();

export default app; 