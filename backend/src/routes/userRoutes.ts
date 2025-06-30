import { Router, Request, Response } from 'express';
import { verifyIdToken, requireAuth } from '../middlewares/authMiddleware';
import { db } from '../lib/firebase/admin';

const router = Router();

/**
 * GET /api/me
 * 認証されたユーザーの基本情報を返す
 */
router.get('/me', verifyIdToken, (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'User not authenticated',
      code: 'auth/user-not-found',
    });
    return;
  }

  // デコードされたトークンからユーザー情報を取得
  const userInfo = {
    uid: req.user.uid,
    email: req.user.email,
    emailVerified: req.user.email_verified,
    name: req.user.name,
    picture: req.user.picture,
    issuer: req.user.iss,
    audience: req.user.aud,
    authTime: new Date(req.user.auth_time * 1000),
    issuedAt: new Date(req.user.iat * 1000),
    expiresAt: new Date(req.user.exp * 1000),
  };

  res.json({
    message: 'User authenticated successfully',
    user: userInfo,
  });
});

/**
 * GET /api/profile
 * 認証されたユーザーの詳細プロフィール情報を返す
 * Firestoreからユーザーデータを取得する例
 */
router.get('/profile', requireAuth(async (req, res): Promise<void> => {
  try {
    const uid = req.user.uid;

    // Firestoreからユーザードキュメントを取得
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      res.status(404).json({
        error: 'User profile not found',
        code: 'profile/not-found',
      });
      return;
    }

    const profileData = userDoc.data();

    res.json({
      message: 'Profile retrieved successfully',
      profile: {
        uid: req.user.uid,
        email: req.user.email,
        ...profileData,
        lastLoginAt: new Date(req.user.auth_time * 1000),
      },
    });
  } catch (error) {
    console.error('Profile retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve profile',
      code: 'profile/retrieval-failed',
    });
  }
}));

/**
 * PUT /api/profile
 * 認証されたユーザーのプロフィール情報を更新する
 */
router.put('/profile', requireAuth(async (req, res) => {
  try {
    const uid = req.user.uid;
    const updateData = req.body;

    // 更新可能なフィールドのみを許可
    const allowedFields = ['displayName', 'bio', 'location', 'website'];
    const filteredData = Object.keys(updateData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});

    // タイムスタンプを追加
    filteredData.updatedAt = new Date().toISOString();

    // Firestoreのユーザードキュメントを更新
    await db.collection('users').doc(uid).set(filteredData, { merge: true });

    res.json({
      message: 'Profile updated successfully',
      updatedFields: Object.keys(filteredData),
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      code: 'profile/update-failed',
    });
  }
}));

/**
 * DELETE /api/account
 * 認証されたユーザーのアカウントを削除する
 */
router.delete('/account', requireAuth(async (req, res) => {
  try {
    const uid = req.user.uid;

    // Firestoreからユーザーデータを削除
    await db.collection('users').doc(uid).delete();

    // Note: Firebase Authからのユーザー削除は、このAPIでは行わない
    // クライアント側でuser.delete()を呼ぶか、別の管理者APIで行う

    res.json({
      message: 'User data deleted successfully',
      uid: uid,
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({
      error: 'Failed to delete account data',
      code: 'account/deletion-failed',
    });
  }
}));

export default router; 