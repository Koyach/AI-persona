import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/firebase/admin';
import { DecodedIdToken } from 'firebase-admin/auth';
import { config } from '../config';

// Express Request にユーザー情報を追加する型定義
declare global {
  namespace Express {
    interface Request {
      user?: DecodedIdToken;
    }
  }
}

interface AuthenticatedRequest extends Request {
  user: DecodedIdToken;
}

/**
 * Firebase ID トークンを検証するミドルウェア
 * Authorization: Bearer <ID_TOKEN> ヘッダーから ID トークンを取得し、
 * Firebase Admin SDK で検証する
 */
export const verifyIdToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    // Authorization ヘッダーの存在チェック
    if (!authHeader) {
      // CORSヘッダーを設定してからエラーレスポンスを返す
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.status(401).json({
        error: 'Authorization header is missing',
        code: 'auth/missing-auth-header',
      });
      return;
    }

    // Bearer トークンの形式チェック
    const token = authHeader.split(' ')[1];
    if (!token || !authHeader.startsWith('Bearer ')) {
      // CORSヘッダーを設定してからエラーレスポンスを返す
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.status(401).json({
        error: 'Invalid authorization header format. Expected: Bearer <token>',
        code: 'auth/invalid-auth-header',
      });
      return;
    }

    // Firebase Admin SDK でトークンを検証
    const decodedToken = await auth.verifyIdToken(token);

    // プロジェクトIDの検証
    if (decodedToken.aud !== config.firebase.projectId) {
      console.error('Project ID mismatch:', {
        expected: config.firebase.projectId,
        received: decodedToken.aud,
      });
      // CORSヘッダーを設定してからエラーレスポンスを返す
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.status(401).json({
        error: 'Firebase project ID mismatch. Make sure both frontend and backend are using the same Firebase project.',
        code: 'auth/project-id-mismatch',
        details: process.env.NODE_ENV === 'development' ? {
          expected: config.firebase.projectId,
          received: decodedToken.aud,
        } : undefined,
      });
      return;
    }

    // 検証済みのユーザー情報を req.user に格納
    req.user = decodedToken;

    // 次のミドルウェアに進む
    next();
  } catch (error: any) {
    console.error('Token verification failed:', error);

    // Firebase Auth エラーの詳細を判定
    let errorMessage = 'Token verification failed';
    let errorCode = 'auth/invalid-token';
    let details: any = undefined;

    if (error.code) {
      errorCode = error.code;
      switch (error.code) {
        case 'auth/id-token-expired':
          errorMessage = 'Token has expired';
          break;
        case 'auth/id-token-revoked':
          errorMessage = 'Token has been revoked';
          break;
        case 'auth/invalid-id-token':
          errorMessage = 'Invalid token format';
          break;
        case 'auth/user-disabled':
          errorMessage = 'User account has been disabled';
          break;
        case 'auth/argument-error':
          if (error.message.includes('Firebase ID token has invalid signature')) {
            errorMessage = 'Firebase ID token has invalid signature. This usually means the frontend and backend are using different Firebase projects.';
            details = process.env.NODE_ENV === 'development' ? {
              backendProjectId: config.firebase.projectId,
              hint: 'Check that FIREBASE_PROJECT_ID in backend/.env.local matches NEXT_PUBLIC_FIREBASE_PROJECT_ID in frontend/.env.local',
            } : undefined;
          } else {
            errorMessage = error.message || errorMessage;
          }
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
    }

    // CORSヘッダーを設定してからエラーレスポンスを返す
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(401).json({
      error: errorMessage,
      code: errorCode,
      details,
    });
  }
};

/**
 * 認証必須のルートで使用するヘルパー関数
 * TypeScript の型安全性を向上させる
 */
export const requireAuth = (
  handler: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Promise<void>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await verifyIdToken(req, res, () => {
      if (req.user) {
        handler(req as AuthenticatedRequest, res, next);
      }
    });
  };
}; 