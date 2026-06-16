import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { authService } from '../services/AuthService';
import { LoginRequest } from '../../shared/types';

export class AuthController {
  async login(req: AuthRequest, res: Response) {
    try {
      const { username, password } = req.body as LoginRequest;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: '用户名和密码不能为空'
        });
      }

      const result = await authService.login({ username, password });

      if (!result) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }

      res.json({
        success: true,
        data: result,
        message: '登录成功'
      });
    } catch (error) {
      console.error('[AuthController] Login error:', error);
      res.status(500).json({
        success: false,
        message: '登录失败'
      });
    }
  }

  async getCurrentUser(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未登录'
        });
      }

      const user = authService.getCurrentUser(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('[AuthController] GetCurrentUser error:', error);
      res.status(500).json({
        success: false,
        message: '获取用户信息失败'
      });
    }
  }

  async logout(req: AuthRequest, res: Response) {
    try {
      authService.logout(req.user?.id || '');
      res.json({
        success: true,
        message: '登出成功'
      });
    } catch (error) {
      console.error('[AuthController] Logout error:', error);
      res.status(500).json({
        success: false,
        message: '登出失败'
      });
    }
  }
}

export const authController = new AuthController();
