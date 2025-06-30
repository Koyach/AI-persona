import { Response } from 'express';
import { ApiResponse, PaginatedResponse, ERROR_CODES } from '../types/common';

export class ResponseHelper {
  static success<T>(res: Response, data: T, message?: string): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message
    };
    res.status(200).json(response);
  }

  static created<T>(res: Response, data: T, message: string = 'Resource created successfully'): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message
    };
    res.status(201).json(response);
  }

  static error(res: Response, statusCode: number, error: string, code?: string, details?: string): void {
    const response: ApiResponse = {
      success: false,
      error,
      code,
      details
    };
    res.status(statusCode).json(response);
  }

  static notFound(res: Response, resource: string = 'Resource'): void {
    this.error(res, 404, `${resource} not found`, ERROR_CODES.RESOURCE_NOT_FOUND);
  }

  static unauthorized(res: Response, message: string = 'Unauthorized'): void {
    this.error(res, 401, message, ERROR_CODES.AUTH_ACCESS_DENIED);
  }

  static forbidden(res: Response, message: string = 'Access denied'): void {
    this.error(res, 403, message, ERROR_CODES.RESOURCE_ACCESS_DENIED);
  }

  static serverError(res: Response, details?: string): void {
    this.error(res, 500, 'Internal server error', ERROR_CODES.SERVER_INTERNAL_ERROR, details);
  }

  static paginated<T>(
    res: Response, 
    data: T[], 
    pagination: PaginatedResponse<T>['pagination'],
    message?: string
  ): void {
    const response: PaginatedResponse<T> = {
      success: true,
      data,
      message,
      pagination
    };
    res.status(200).json(response);
  }
} 