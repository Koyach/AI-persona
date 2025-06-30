import { Router, Request, Response } from 'express';
import { verifyIdToken } from '../middlewares/authMiddleware';
import { InterviewService } from '../services/interviewService';
import { ResponseHelper } from '../utils/response';
import { validate, schemas } from '../utils/validation';
import { AuthenticatedRequest } from '../types/common';

const router = Router();

// すべてのルートに認証ミドルウェアを適用
router.use(verifyIdToken);

/**
 * POST /api/interviews/message
 * AIとの会話を処理するAPI
 */
router.post('/message', validate(schemas.interviewMessage), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const result = await InterviewService.processMessage(authReq.user.uid, req.body);
    ResponseHelper.success(res, result);
  } catch (error: any) {
    console.error('❌ Error in interview chat:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      userId: (req as AuthenticatedRequest).user?.uid,
      requestBody: req.body
    });
    
    if (error.message === 'Persona not found') {
      ResponseHelper.notFound(res, 'Persona');
    } else if (error.message === 'Access denied') {
      ResponseHelper.forbidden(res, 'You can only chat with your own personas');
    } else if (error.message?.includes('Gemini API')) {
      // Gemini API関連のエラーをより詳細に返す
      ResponseHelper.serverError(res, error.message);
    } else {
      ResponseHelper.serverError(res, error.message || 'Internal server error occurred');
    }
  }
});

/**
 * GET /api/interviews/conversations/:personaId
 * 特定のペルソナとの会話履歴を取得するAPI
 */
router.get('/conversations/:personaId', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { personaId } = req.params;
    
    console.log(`📖 Fetching conversations for persona ${personaId} by user ${authReq.user.uid}`);
    
    const conversations = await InterviewService.getConversations(authReq.user.uid, personaId);
    ResponseHelper.success(res, { conversations });
  } catch (error: any) {
    console.error('❌ Error fetching conversations:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      userId: (req as AuthenticatedRequest).user?.uid,
      personaId: req.params.personaId
    });
    
    // Firestoreインデックスエラーの特別処理
    if (error.message?.includes('Database index is being created')) {
      ResponseHelper.serverError(res, error.message);
    } else {
      ResponseHelper.serverError(res, error.message || 'Failed to fetch conversations');
    }
  }
});

export default router; 