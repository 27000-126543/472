import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PlaneTakeoff, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { getRoleHomePage } from '../lib/constants';
import { ROUTES } from '../lib/constants';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, user, error, clearError, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || null;

  useEffect(() => {
    if (isAuthenticated && user) {
      const homePage = from || getRoleHomePage(user.role);
      navigate(homePage, { replace: true });
    }
  }, [isAuthenticated, user, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setIsSubmitting(true);
    clearError();

    try {
      const success = await login(username, password);
      if (!success) {
        setIsSubmitting(false);
      }
    } catch (e) {
      setIsSubmitting(false);
    }
  };

  const testAccounts = [
    { role: '管理员', username: 'admin', password: 'admin123' },
    { role: '调度员', username: 'dispatcher', password: 'dispatcher123' },
    { role: '操作员', username: 'operator1', password: 'operator123' },
    { role: '普通用户', username: 'testuser', password: 'user123' },
  ];

  const fillCredentials = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 grid-pattern p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-transparent to-cyan-900/10" />

      <div className="relative w-full max-w-md">
        <div className="card p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow animate-float">
              <PlaneTakeoff className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-gradient mb-2">
              无人机配送调度平台
            </h1>
            <p className="text-dark-400 text-sm">智能 · 高效 · 安全</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                placeholder="请输入用户名"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="label">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-12"
                  placeholder="请输入密码"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!username || !password || isSubmitting}
              className="btn-primary w-full py-3 text-lg"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  登录中...
                </span>
              ) : (
                '登 录'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-dark-700">
            <p className="text-xs text-dark-500 text-center mb-4">测试账号（点击快速填充）：</p>
            <div className="grid grid-cols-2 gap-2">
              {testAccounts.map((acc) => (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => fillCredentials(acc.username, acc.password)}
                  className="px-3 py-2 text-xs bg-dark-800 hover:bg-dark-700 rounded-lg text-dark-300 transition-colors text-left"
                >
                  <span className="block font-medium text-primary-400">
                    {acc.role}
                  </span>
                  <span className="block text-dark-500">
                    {acc.username} / {acc.password}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-dark-500 text-xs mt-6">
          © 2024 无人机配送调度平台 · 智能物流解决方案
        </p>
      </div>
    </div>
  );
}
