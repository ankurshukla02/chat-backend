import { Request, Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { type AuthService } from '../auth/auth.service';
import { LoginDto, RegisterDto } from '../auth/auth.dto';
import { sendErrorResponse } from '../common/response.util';

export const createAuthController = (authService: AuthService) => {
  const validateDto = async <T extends object>(dtoClass: new () => T, payload: unknown) => {
    const dto = plainToInstance(dtoClass, payload ?? {});
    await validateOrReject(dto as object);
    return dto;
  };

  const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
    if (error instanceof Error) {
      const status = 'status' in error ? Number((error as { status?: number }).status ?? 500) : 500;
      return sendErrorResponse(res, error.message || fallbackMessage, status);
    }

    return sendErrorResponse(res, fallbackMessage, 500);
  };

  const register = async (req: Request, res: Response) => {
    try {
      const dto = await validateDto(RegisterDto, req.body);
      const result = await authService.register(dto);
      return res.status(result.statusCode ?? 200).json(result);
    } catch (error) {
      console.error('Error registering user:', error);
      return handleError(res, error, 'Unable to register user');
    }
  };

  const login = async (req: Request, res: Response) => {
    try {
      const dto = await validateDto(LoginDto, req.body);
      const result = await authService.login(dto);
      return res.status(result.statusCode ?? 200).json(result);
    } catch (error) {
      console.error('Error logging in:', error);
      return handleError(res, error, 'Unable to login');
    }
  };

  return { register, login };
};
