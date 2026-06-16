import { userRepository } from '../repositories/UserRepository';
import { generateToken } from '../middleware/auth';
import { User, LoginRequest, LoginResponse } from '../../shared/types';

export class AuthService {
  async login(request: LoginRequest): Promise<LoginResponse | null> {
    const user = userRepository.verifyPassword(request.username, request.password);
    if (!user) return null;

    userRepository.updateLastLogin(user.id);
    const token = generateToken(user.id, user.username, user.role);

    return { token, user };
  }

  getCurrentUser(userId: string): User | null {
    return userRepository.findById(userId);
  }

  logout(userId: string): boolean {
    return true;
  }
}

export const authService = new AuthService();
