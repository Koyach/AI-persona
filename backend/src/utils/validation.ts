import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ApiResponse, ERROR_CODES } from '../types/common';

// スキーマ定義
export const schemas = {
  createPersona: Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    description: Joi.string().trim().min(1).max(4000).required(),
    characteristics: Joi.array().items(Joi.string().trim().min(1).max(100)).optional(),
  }),

  interviewMessage: Joi.object({
    personaId: Joi.string().trim().required(),
    message: Joi.string().trim().min(1).max(1000).required(),
    history: Joi.array().items(
      Joi.object({
        role: Joi.string().valid('user', 'assistant').required(),
        content: Joi.string().required(),
        timestamp: Joi.any().optional(),
      })
    ).optional(),
  }),

  updateProfile: Joi.object({
    displayName: Joi.string().trim().min(1).max(100).optional(),
    bio: Joi.string().trim().max(500).optional(),
    location: Joi.string().trim().max(100).optional(),
    website: Joi.string().uri().optional(),
  }),
};

// バリデーションミドルウェア
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errorDetails = error.details.map(detail => detail.message);
      const response: ApiResponse = {
        success: false,
        error: 'Validation failed',
        code: ERROR_CODES.VALIDATION_INVALID_FORMAT,
        details: errorDetails.join(', ')
      };
      
      res.status(400).json(response);
      return;
    }

    next();
  };
}; 