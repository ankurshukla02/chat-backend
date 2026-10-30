import { NextFunction, Request, Response } from 'express';
import jwt, { Secret } from 'jsonwebtoken';
import { sendUnauthorizedResponse } from '../common/response.util';

type AuthenticatedRequest = Request & {
  user?: { sub: string; email: string };
};

const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authorization = req.headers.authorization ?? '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return sendUnauthorizedResponse(res, 'Bearer token is required');
  }

  try {
    const secret = (process.env.JWT_SECRET ?? 'development-secret-key-1234567890') as Secret;
    req.user = jwt.verify(token, secret) as { sub: string; email: string };
    return next();
  } catch {
    return sendUnauthorizedResponse(res, 'Invalid or expired access token');
  }
};

export { authMiddleware, type AuthenticatedRequest };
