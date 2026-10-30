import { type AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './auth.dto';

const createAuthController = (auth: AuthService) => ({
  register: (dto: RegisterDto) => auth.register(dto),
  login: (dto: LoginDto) => auth.login(dto),
});

export { createAuthController };
