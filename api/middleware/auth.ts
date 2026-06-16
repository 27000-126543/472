import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../../shared/types';

const JWT_SECRET = process.env.JWT_SECRET || 'drone-delivery-secret-key-2024';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: UserRole;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ success: false, error: '未提供认证令牌' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string; role: UserRole };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ success: false, error: '无效的认证令牌' });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: '未登录' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: '权限不足' });
      return;
    }

    next();
  };
}

export function generateToken(id: string, username: string, role: UserRole): string {
  return jwt.sign(
    { id, username, role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}
