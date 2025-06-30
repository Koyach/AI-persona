import { Request, Response, NextFunction } from 'express';

// カスタムエラークラス
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Firebaseエラーの型定義
interface FirebaseErrorType {
  code: string;
  message: string;
}

// Firebaseエラーのマッピング
const FIREBASE_ERROR_STATUS_MAP: Record<string, number> = {
  'auth/user-not-found': 404,
  'auth/invalid-uid': 400,
  'auth/invalid-email': 400,
  'auth/email-already-exists': 409,
  'auth/phone-number-already-exists': 409,
  'auth/uid-already-exists': 409,
  'auth/insufficient-permission': 403,
  'auth/internal-error': 500,
  'auth/invalid-argument': 400,
  'auth/invalid-claims': 400,
  'auth/invalid-creation-time': 400,
  'auth/invalid-credential': 400,
  'auth/invalid-disabled-field': 400,
  'auth/invalid-display-name': 400,
  'auth/invalid-email-verified': 400,
  'auth/invalid-hash-algorithm': 400,
  'auth/invalid-hash-block-size': 400,
  'auth/invalid-hash-derived-key-length': 400,
  'auth/invalid-hash-key': 400,
  'auth/invalid-hash-memory-cost': 400,
  'auth/invalid-hash-parallelization': 400,
  'auth/invalid-hash-rounds': 400,
  'auth/invalid-hash-salt-separator': 400,
  'auth/invalid-last-sign-in-time': 400,
  'auth/invalid-page-token': 400,
  'auth/invalid-password': 400,
  'auth/invalid-password-hash': 400,
  'auth/invalid-password-salt': 400,
  'auth/invalid-phone-number': 400,
  'auth/invalid-photo-url': 400,
  'auth/invalid-provider-data': 400,
  'auth/invalid-provider-id': 400,
  'auth/invalid-session-cookie-duration': 400,
  'auth/invalid-user-import': 400,
  'auth/maximum-user-count-exceeded': 429,
  'auth/missing-hash-algorithm': 400,
  'auth/missing-uid': 400,
  'auth/operation-not-allowed': 403,
  'auth/project-not-found': 404,
  'auth/reserved-claims': 400,
  'auth/session-cookie-expired': 401,
  'auth/session-cookie-revoked': 401,
  'auth/unauthorized-continue-uri': 400,
  'auth/too-many-requests': 429,
};

// エラーログを記録する関数
const logError = (error: Error, req?: Request): void => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    url: req?.url,
    method: req?.method,
    ip: req?.ip,
    userAgent: req?.get('User-Agent'),
  };

  console.error('Error:', errorInfo);

  // 本番環境では外部のエラー追跡サービスに送信
  if (process.env.NODE_ENV === 'production') {
    // TODO: Sentryなどのエラー追跡サービスに送信
    // captureException(error);
  }
};

// エラーレスポンスを生成する関数
const createErrorResponse = (error: Error, statusCode: number = 500) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    success: false,
    error: {
      message: error.message,
      ...(isDevelopment && { stack: error.stack }),
    },
    timestamp: new Date().toISOString(),
  };
};

// Firebaseエラーメッセージを取得する関数
const getFirebaseErrorMessage = (error: FirebaseErrorType): string => {
  const errorMessages: Record<string, string> = {
    'auth/user-not-found': 'ユーザーが見つかりません',
    'auth/invalid-email': '無効なメールアドレスです',
    'auth/email-already-exists': 'このメールアドレスは既に使用されています',
    'auth/insufficient-permission': 'アクセス権限がありません',
    'auth/too-many-requests': 'リクエストが多すぎます',
    'auth/session-cookie-expired': 'セッションが期限切れです',
    'auth/session-cookie-revoked': 'セッションが無効化されました',
  };

  return errorMessages[error.code] || error.message || '認証エラーが発生しました';
};

// メインのエラーハンドラーミドルウェア
export const errorHandler = (
  error: Error | AppError | FirebaseErrorType,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  // エラーログを記録
  logError(error as Error, req);

  // AppErrorの場合
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }
  // FirebaseErrorの場合
  else if ('code' in error && error.code.startsWith('auth/')) {
    statusCode = FIREBASE_ERROR_STATUS_MAP[error.code] || 500;
    message = getFirebaseErrorMessage(error as FirebaseErrorType);
  }
  // その他のエラーの場合
  else {
    // 一般的なエラーパターンの判定
    if (error.message.includes('validation')) {
      statusCode = 400;
      message = 'Validation Error';
    } else if (error.message.includes('not found')) {
      statusCode = 404;
      message = 'Resource Not Found';
    } else if (error.message.includes('unauthorized')) {
      statusCode = 401;
      message = 'Unauthorized';
    } else if (error.message.includes('forbidden')) {
      statusCode = 403;
      message = 'Forbidden';
    }
  }

  // レスポンスを送信
  res.status(statusCode).json(createErrorResponse(error as Error, statusCode));
};

// 404エラーハンドラー
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

// 非同期関数用のエラーハンドリングラッパー
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 