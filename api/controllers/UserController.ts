import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { userService } from '../services/UserService';
import { CreateUserRequest, UserRole } from '../../shared/types';

export class UserController {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const { role, search } = req.query;
      let users;

      if (role) {
        users = userService.getByRole(role as UserRole);
      } else if (search) {
        users = userService.search(search as string);
      } else {
        users = userService.getAll();
      }

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('[UserController] GetAll error:', error);
      res.status(500).json({
        success: false,
        message: '获取用户列表失败'
      });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const user = userService.getById(id);

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
      console.error('[UserController] GetById error:', error);
      res.status(500).json({
        success: false,
        message: '获取用户信息失败'
      });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const data = req.body as CreateUserRequest;

      if (!data.username || !data.password || !data.role) {
        return res.status(400).json({
          success: false,
          message: '用户名、密码和角色不能为空'
        });
      }

      const user = userService.create(data);

      res.status(201).json({
        success: true,
        data: user,
        message: '用户创建成功'
      });
    } catch (error: any) {
      console.error('[UserController] Create error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '创建用户失败'
      });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;

      const user = userService.update(id, data);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      res.json({
        success: true,
        data: user,
        message: '用户更新成功'
      });
    } catch (error: any) {
      console.error('[UserController] Update error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '更新用户失败'
      });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (req.user?.id === id) {
        return res.status(400).json({
          success: false,
          message: '不能删除当前登录用户'
        });
      }

      const success = userService.delete(id);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      res.json({
        success: true,
        message: '用户删除成功'
      });
    } catch (error) {
      console.error('[UserController] Delete error:', error);
      res.status(500).json({
        success: false,
        message: '删除用户失败'
      });
    }
  }
}

export const userController = new UserController();
