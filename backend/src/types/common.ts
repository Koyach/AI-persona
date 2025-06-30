import { DecodedIdToken } from 'firebase-admin/auth';
import { Request } from 'express';

// 共通のレスポンス型
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: string;
  details?: string;
}

// 認証済みリクエスト型
export interface AuthenticatedRequest extends Request {
  user: DecodedIdToken;
}

// ページネーション型
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// エラーコード定数
export const ERROR_CODES = {
  // 認証関連
  AUTH_MISSING_HEADER: 'auth/missing-auth-header',
  AUTH_INVALID_HEADER: 'auth/invalid-auth-header',
  AUTH_INVALID_TOKEN: 'auth/invalid-token',
  AUTH_TOKEN_EXPIRED: 'auth/id-token-expired',
  AUTH_USER_NOT_FOUND: 'auth/user-not-found',
  AUTH_ACCESS_DENIED: 'auth/access-denied',

  // バリデーション関連
  VALIDATION_MISSING_FIELDS: 'validation/missing-fields',
  VALIDATION_INVALID_FORMAT: 'validation/invalid-format',

  // リソース関連
  RESOURCE_NOT_FOUND: 'resource/not-found',
  RESOURCE_ACCESS_DENIED: 'resource/access-denied',

  // サーバー関連
  SERVER_INTERNAL_ERROR: 'server/internal-error',
  SERVER_SERVICE_UNAVAILABLE: 'server/service-unavailable',
} as const; 