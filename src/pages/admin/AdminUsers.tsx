import { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Shield,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUserStore } from '../../stores/userStore';
import { formatDate } from '../../lib/constants';
import { User, UserRole, CreateUserRequest, UpdateUserRequest } from '../../../shared/types';

const roleLabels: Record<UserRole, string> = {
  [UserRole.USER]: '普通用户',
  [UserRole.OPERATOR]: '操作员',
  [UserRole.DISPATCHER]: '调度员',
  [UserRole.ADMIN]: '管理员',
};

const roleColors: Record<UserRole, string> = {
  [UserRole.USER]: 'bg-dark-700 text-dark-300',
  [UserRole.OPERATOR]: 'bg-primary-500/20 text-primary-400',
  [UserRole.DISPATCHER]: 'bg-success/20 text-success',
  [UserRole.ADMIN]: 'bg-warning/20 text-warning',
};

export default function AdminUsers() {
  const { user } = useAuthStore();
  const {
    users,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    isLoading,
  } = useUserStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserRequest>({
    username: '',
    password: '',
    role: UserRole.USER,
    email: '',
    phone: '',
    fullName: '',
  });

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleOpenModal = (u?: User) => {
    if (u) {
      setEditingUser(u);
      setFormData({
        username: u.username,
        password: '',
        role: u.role,
        email: u.email || '',
        phone: u.phone || '',
        fullName: u.fullName || '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        role: UserRole.USER,
        email: '',
        phone: '',
        fullName: '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const updateData: UpdateUserRequest = {
        role: formData.role,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        fullName: formData.fullName || undefined,
      };
      if (formData.password) {
        (updateData as any).password = formData.password;
      }
      await updateUser(editingUser.id, updateData);
    } else {
      await createUser(formData);
    }
    setShowModal(false);
    await fetchUsers();
  };

  const handleDelete = async (userId: string) => {
    if (confirm('确定要删除该用户吗？')) {
      await deleteUser(userId);
      await fetchUsers();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">
            用户管理
          </h1>
          <p className="text-dark-400 mt-1">
            管理系统所有用户账号和权限
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增用户
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              placeholder="搜索用户名、邮箱、姓名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
            className="input w-40"
          >
            <option value="all">全部角色</option>
            <option value={UserRole.USER}>普通用户</option>
            <option value={UserRole.OPERATOR}>操作员</option>
            <option value={UserRole.DISPATCHER}>调度员</option>
            <option value={UserRole.ADMIN}>管理员</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-dark-400 mt-2">加载中...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-dark-400">
            <Users className="w-16 h-16 mx-auto mb-4 text-dark-600" />
            <p>暂无用户</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left p-4 text-dark-400 text-sm font-medium">
                    用户信息
                  </th>
                  <th className="text-left p-4 text-dark-400 text-sm font-medium">
                    角色
                  </th>
                  <th className="text-left p-4 text-dark-400 text-sm font-medium">
                    联系方式
                  </th>
                  <th className="text-left p-4 text-dark-400 text-sm font-medium">
                    状态
                  </th>
                  <th className="text-left p-4 text-dark-400 text-sm font-medium">
                    注册时间
                  </th>
                  <th className="text-right p-4 text-dark-400 text-sm font-medium">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-dark-700/50 hover:bg-dark-800/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {u.username}
                          </p>
                          {u.fullName && (
                            <p className="text-sm text-dark-400">
                              {u.fullName}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[u.role]}`}
                      >
                        {roleLabels[u.role]}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        {u.email && (
                          <p className="text-dark-300">{u.email}</p>
                        )}
                        {u.phone && (
                          <p className="text-dark-400">{u.phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {u.isActive ? (
                        <span className="flex items-center gap-1 text-success text-sm">
                          <CheckCircle className="w-4 h-4" />
                          正常
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-danger text-sm">
                          <XCircle className="w-4 h-4" />
                          已禁用
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-dark-400">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(u)}
                          className="p-2 text-dark-400 hover:text-primary-400 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {u.id !== user?.id && (
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="p-2 text-dark-400 hover:text-danger transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg animate-fade-in">
            <div className="p-6 border-b border-dark-700">
              <h2 className="text-lg font-semibold text-white">
                {editingUser ? '编辑用户' : '新增用户'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">用户名 *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">
                    密码 {!editingUser && '*'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="input"
                    placeholder={editingUser ? '不修改请留空' : ''}
                    required={!editingUser}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">角色 *</label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as UserRole,
                      })
                    }
                    className="input"
                    required
                  >
                    <option value={UserRole.USER}>普通用户</option>
                    <option value={UserRole.OPERATOR}>操作员</option>
                    <option value={UserRole.DISPATCHER}>调度员</option>
                    <option value={UserRole.ADMIN}>管理员</option>
                  </select>
                </div>
                <div>
                  <label className="label">姓名</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">邮箱</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">手机号</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="input"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  取消
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingUser ? '保存修改' : '创建用户'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
