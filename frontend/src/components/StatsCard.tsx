import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'blue' | 'green' | 'orange' | 'purple';
}

const colorClasses = {
  primary: 'bg-primary-50 text-primary-600',
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  orange: 'bg-orange-50 text-orange-600',
  purple: 'bg-purple-50 text-purple-600',
};

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'primary',
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-6 shadow-sm card-hover">
      <div className="flex items-start sm:items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-gray-500 mb-0.5 sm:mb-1 truncate">{title}</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-800 truncate">{value}</p>
          {trend && (
            <p
              className={`text-xs sm:text-sm mt-0.5 sm:mt-1 ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-lg shrink-0 ${colorClasses[color]}`}>
          <Icon size={18} className="sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  );
}
