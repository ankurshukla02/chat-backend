import * as bcrypt from 'bcrypt';
import { UniqueConstraintError } from 'sequelize';
import { User } from '../users/user.entity';
import { buildSuccessResponse, ApiResponse } from '../common/response.util';
import { AppError, throwHttpError } from '../common/error.util';
import { LoginDto, RegisterDto } from './auth.dto';

const createAuthService = (
  users: typeof User,
  jwt: { signAsync: (payload: unknown) => Promise<string> },
) => {
  const sign = async (user: User) => jwt.signAsync({ sub: user.id, email: user.email });

  const register = async (
    dto: RegisterDto,
  ): Promise<
    ApiResponse<{ user: { id: string; name: string; email: string }; accessToken: string }>
  > => {
    try {
      const email = dto.email.toLowerCase().trim();
      if (await users.findOne({ where: { email } })) {
        throw new AppError('Email is already registered', 409);
      }
      console.log('Registering user:', dto.name, email);
      const saved = await users.create({
        name: dto.name.trim(),
        email,
        passwordHash: await bcrypt.hash(dto.password, 12),
      });
      console.log('User registered:', saved.id);
      const payload = {
        user: { id: saved.id, name: saved.name, email: saved.email },
        accessToken: await sign(saved),
      };

      console.log('Login successful for user:', saved.id);
      return buildSuccessResponse(payload, 'User registered successfully', 201);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new AppError('Email is already registered', 409);
      }

      if (error instanceof AppError) {
        throw error;
      }

      throwHttpError(error, 'Unable to register user');
      return Promise.reject(error);
    }
  };

  const login = async (
    dto: LoginDto,
  ): Promise<
    ApiResponse<{ user: { id: string; name: string; email: string }; accessToken: string }>
  > => {
    try {
      const user = await users.findOne({
        where: { email: dto.email.toLowerCase().trim() },
      });

      if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
        throw new AppError('Invalid email or password', 401);
      }

      const payload = {
        user: { id: user.id, name: user.name, email: user.email },
        accessToken: await sign(user),
      };

      return buildSuccessResponse(payload, 'Login successful');
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throwHttpError(error, 'Unable to login');
      return Promise.reject(error);
    }
  };

  return { register, login };
};

type AuthService = ReturnType<typeof createAuthService>;

export { createAuthService, type AuthService };
