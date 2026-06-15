import type { PackageStatus } from '@/types';
import { statusConfig } from '@/utils/statusUtils';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: PackageStatus;
  size?: 'sm' | 'md';
  className?: string;
  showIcon?: boolean;
}

export default function StatusBadge({ 
  status, size = 'md', className, showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        'border backdrop-blur-sm',
        config.bgColor,
        config.borderColor,
        config.color,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{config.label}</span>
    </span>
  );
}
