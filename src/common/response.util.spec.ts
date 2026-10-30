import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { MessageQueryDto } from '../chats/chat.dto';
import {
  buildErrorResponse,
  buildSuccessResponse,
  sendErrorResponse,
  sendForbiddenResponse,
  sendUnauthorizedResponse,
} from './response.util';
import { throwHttpError } from './error.util';

describe('response util', () => {
  it('creates a success payload', () => {
    expect(buildSuccessResponse({ id: '1' }, 'User registered')).toEqual({
      success: true,
      message: 'User registered',
      data: { id: '1' },
      statusCode: 200,
    });
  });

  it('creates an error payload', () => {
    expect(buildErrorResponse('Email already exists', 409)).toEqual({
      success: false,
      message: 'Email already exists',
      data: null,
      statusCode: 409,
    });
  });

  it('creates shared error and forbidden responses', () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;

    sendErrorResponse(res, 'Something failed', 422);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Something failed',
      data: null,
      statusCode: 422,
    });

    sendForbiddenResponse(res, 'Authenticated user must match userId');
    expect(res.status).toHaveBeenLastCalledWith(403);
    expect(res.json).toHaveBeenLastCalledWith({
      success: false,
      message: 'Authenticated user must match userId',
      data: null,
      statusCode: 403,
    });

    sendUnauthorizedResponse(res, 'Bearer token is required');
    expect(res.status).toHaveBeenLastCalledWith(401);
    expect(res.json).toHaveBeenLastCalledWith({
      success: false,
      message: 'Bearer token is required',
      data: null,
      statusCode: 401,
    });
  });

  it('converts a string query limit to a number before validation', async () => {
    const dto = plainToInstance(MessageQueryDto, { limit: '20' });
    await expect(validateOrReject(dto)).resolves.toBeUndefined();
    expect(dto.limit).toBe(20);
  });

  it('preserves the original error detail when wrapping an unknown error', () => {
    try {
      throwHttpError(new Error('duplicate key value violates unique constraint'), 'Unable to register user');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('Unable to register user: duplicate key value violates unique constraint');
    }
  });
});
