import { userRepository } from '../repositories/UserRepository';
import { User, UserRole, CreateUserRequest, UpdateUserRequest } from '../../shared/types';

export class UserService {
  getAll(): User[] {
    return userRepository.findAll();
  }

  getById(id: string): User | null {
    return userRepository.findById(id);
  }

  getByRole(role: UserRole): User[] {
    return userRepository.findByRole(role);
  }

  create(request: CreateUserRequest): User {
    if (userRepository.findByUsername(request.username)) {
      throw new Error('用户名已存在');
    }
    if (userRepository.findByEmail(request.email)) {
      throw new Error('邮箱已存在');
    }
    return userRepository.create(request);
  }

  update(id: string, request: UpdateUserRequest): User | null {
    const existing = userRepository.findById(id);
    if (!existing) return null;

    if (request.username && request.username !== existing.username) {
      if (userRepository.findByUsername(request.username)) {
        throw new Error('用户名已存在');
      }
    }
    if (request.email && request.email !== existing.email) {
      if (userRepository.findByEmail(request.email)) {
        throw new Error('邮箱已存在');
      }
    }

    return userRepository.update(id, request);
  }

  delete(id: string): boolean {
    return userRepository.delete(id);
  }

  search(keyword: string): User[] {
    return userRepository.search(keyword);
  }

  getOperators(): User[] {
    return userRepository.findByRole(UserRole.OPERATOR);
  }
}

export const userService = new UserService();
