import { Response } from 'express';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  statusCode: number;
}

const buildSuccessResponse = <T>(
  data: T,
  message = 'Success',
  statusCode = 200,
): ApiResponse<T> => ({
  success: true,
  message,
  data,
  statusCode,
});

const buildErrorResponse = (
  message: string,
  statusCode = 500,
  data: null = null,
): ApiResponse<null> => ({
  success: false,
  message,
  data,
  statusCode,
});

const sendErrorResponse = (
  res: Response,
  message: string,
  statusCode = 500,
  data: null = null,
) => {
  const payload = buildErrorResponse(message, statusCode, data);
  return res.status(statusCode).json(payload);
};

const sendForbiddenResponse = (
  res: Response,
  message = 'Authenticated user must match userId',
) => sendErrorResponse(res, message, 403);

const sendUnauthorizedResponse = (
  res: Response,
  message = 'Bearer token is required',
) => sendErrorResponse(res, message, 401);

export {
  buildSuccessResponse,
  buildErrorResponse,
  sendErrorResponse,
  sendForbiddenResponse,
  sendUnauthorizedResponse,
};
