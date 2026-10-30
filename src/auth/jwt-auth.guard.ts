import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: { sub: string; email: string };
}

const createJwtAuthGuard = (jwt: { verifyAsync: <T>(token: string) => Promise<T> }) => {
  const canActivate = async (request: AuthenticatedRequest): Promise<boolean> => {
    const [scheme, token] = (request.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw Object.assign(new Error('Bearer token is required'), { status: 401 });
    }

    try {
      request.user = await jwt.verifyAsync<{ sub: string; email: string }>(token);
      return true;
    } catch {
      throw Object.assign(new Error('Invalid or expired access token'), { status: 401 });
    }
  };

  return { canActivate };
};

export { createJwtAuthGuard };
