import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  delay?: number;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = 'primary',
  delay = 0,
}: StatCardProps) {
  const colorClasses = {
    primary: 'from-primary-500 to-primary-600',
    success: 'from-success to-emerald-600',
    warning: 'from-warning to-yellow-600',
    danger: 'from-danger to-red-600',
  };

  return (
    <div
      className="card p-6 hover:shadow-glow-sm animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-dark-400 text-sm">{title}</p>
          <p className="text-3xl font-bold text-white mt-2 font-display">
            {value}
          </p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trend >= 0 ? (
                <TrendingUp className="w-4 h-4 text-success" />
              ) : (
                <TrendingDown className="w-4 h-4 text-danger" />
              )}
              <span
                className={cn(
                  'text-sm',
                  trend >= 0 ? 'text-success' : 'text-danger'
                )}
              >
                {trend >= 0 ? '+' : ''}
                {trend}%
              </span>
              {trendLabel && (
                <span className="text-dark-500 text-sm">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        <div
          className={cn(
            'w-12 h-12 bg-gradient-to-br rounded-xl flex items-center justify-center shadow-lg',
            colorClasses[color]
          )}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
