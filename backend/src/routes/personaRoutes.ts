import { Router, Request, Response } from 'express';
import { verifyIdToken } from '../middlewares/authMiddleware';
import { PersonaService } from '../services/personaService';
import { ResponseHelper } from '../utils/response';
import { validate, schemas } from '../utils/validation';
import { AuthenticatedRequest } from '../types/common';

const router = Router();

// すべてのルートに認証ミドルウェアを適用
router.use(verifyIdToken);

/**
 * POST /api/personas
 * ペルソナを作成するAPI
 */
router.post('/', validate(schemas.createPersona), async (req: Request, res: Response) => {
  try {
    console.log('📬 POST /api/personas endpoint hit');
    console.log('  - request body:', JSON.stringify(req.body, null, 2));
    
    const authReq = req as AuthenticatedRequest;
    console.log('  - authenticated user ID:', authReq.user.uid);
    
    const persona = await PersonaService.createPersona(authReq.user.uid, req.body);
    console.log('  - persona created successfully:', JSON.stringify(persona, null, 2));
    
    ResponseHelper.created(res, persona, 'Persona created successfully');
    console.log('  - response sent');
  } catch (error: any) {
    console.error('❌ Error creating persona:', error);
    ResponseHelper.serverError(res, error.message);
  }
});

/**
 * GET /api/personas
 * ログインユーザーが作成したペルソナの一覧を取得するAPI
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('📬 GET /api/personas endpoint hit');
    const authReq = req as AuthenticatedRequest;
    console.log('  - authenticated user ID:', authReq.user.uid);
    
    const personas = await PersonaService.getUserPersonas(authReq.user.uid);
    console.log('  - personas retrieved:', JSON.stringify(personas, null, 2));
    
    const result = { personas, count: personas.length };
    console.log('  - sending response:', JSON.stringify(result, null, 2));
    
    ResponseHelper.success(res, result);
  } catch (error: any) {
    console.error('❌ Error fetching personas:', error);
    ResponseHelper.serverError(res, error.message);
  }
});

/**
 * GET /api/personas/:id
 * 特定のペルソナを取得するAPI
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    
    const persona = await PersonaService.getPersonaById(id);
    if (!persona) {
      ResponseHelper.notFound(res, 'Persona');
      return;
    }

    if (persona.userId !== authReq.user.uid) {
      ResponseHelper.forbidden(res, 'You can only access your own personas');
      return;
    }

    ResponseHelper.success(res, persona);
  } catch (error: any) {
    console.error('Error fetching persona:', error);
    ResponseHelper.serverError(res, error.message);
  }
});

/**
 * DELETE /api/personas/:id
 * 指定されたIDのペルソナを削除するAPI
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    await PersonaService.deletePersona(id, authReq.user.uid);
    ResponseHelper.success(res, { deletedId: id }, 'Persona deleted successfully');
  } catch (error: any) {
    console.error('Error deleting persona:', error);
    
    if (error.message === 'Persona not found') {
      ResponseHelper.notFound(res, 'Persona');
    } else if (error.message === 'Access denied') {
      ResponseHelper.forbidden(res, 'You can only delete your own personas');
    } else {
      ResponseHelper.serverError(res, error.message);
    }
  }
});

export default router; 