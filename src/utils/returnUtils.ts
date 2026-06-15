import type { Package, ReturnDeadlineInfo } from '@/types';
import { useReturnSettingsStore } from '@/store/useReturnSettingsStore';
import { getPlatformDefaultReturnDays } from './platformUtils';

export function getReturnDeadline(
  deliveredDate: Date | null,
  returnDays: number
): Date | null {
  if (!deliveredDate || returnDays <= 0) return null;
  
  const deadline = new Date(deliveredDate);
  deadline.setDate(deadline.getDate() + returnDays);
  deadline.setHours(23, 59, 59, 999);
  return deadline;
}

export function getRemainingDays(deadlineDate: Date | null): number | null {
  if (!deadlineDate) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const deadline = new Date(deadlineDate);
  deadline.setHours(0, 0, 0, 0);
  
  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

export function getReturnDeadlineInfo(
  pkg: Package,
  returnDays?: number
): ReturnDeadlineInfo | null {
  if (pkg.status !== 'delivered' && pkg.status !== 'opened') {
    return null;
  }
  
  if (!pkg.deliveredDate) {
    return null;
  }
  
  const days = returnDays ?? getPlatformDefaultReturnDays(pkg.platform);
  const deadlineDate = getReturnDeadline(pkg.deliveredDate, days);
  
  if (!deadlineDate) {
    return null;
  }
  
  const remainingDays = getRemainingDays(deadlineDate) ?? 0;
  const isExpired = remainingDays < 0;
  const isUrgent = remainingDays >= 0 && remainingDays <= 2;
  
  const { remindersEnabled, reminderDaysBefore } = useReturnSettingsStore.getState();
  const needsReminder = remindersEnabled && 
    !isExpired && 
    reminderDaysBefore.some(d => d === remainingDays);
  
  let reminderLevel: 'none' | 'warning' | 'critical' = 'none';
  if (!isExpired) {
    if (remainingDays <= 1) {
      reminderLevel = 'critical';
    } else if (remainingDays <= 2) {
      reminderLevel = 'warning';
    }
  }
  
  return {
    remainingDays,
    deadlineDate,
    isExpired,
    isUrgent,
    needsReminder,
    reminderLevel,
  };
}

export function formatReturnDeadline(deadlineDate: Date): string {
  return deadlineDate.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function getReturnDeadlineText(info: ReturnDeadlineInfo): string {
  if (info.isExpired) {
    return `已过退货期（超期 ${Math.abs(info.remainingDays)} 天）`;
  }
  
  if (info.remainingDays === 0) {
    return '今天是最后退货期限';
  }
  
  if (info.remainingDays === 1) {
    return '还剩 1 天退货期限';
  }
  
  return `还剩 ${info.remainingDays} 天退货期限`;
}

export function getPackagesWithReturnDeadline(packages: Package[]): Package[] {
  return packages.filter(pkg => 
    (pkg.status === 'delivered' || pkg.status === 'opened') && 
    pkg.deliveredDate
  );
}

export function getUrgentReturnPackages(packages: Package[]): Package[] {
  return packages.filter(pkg => {
    const info = getReturnDeadlineInfo(pkg);
    return info && !info.isExpired && info.isUrgent;
  });
}

export function getExpiredReturnPackages(packages: Package[]): Package[] {
  return packages.filter(pkg => {
    const info = getReturnDeadlineInfo(pkg);
    return info && info.isExpired;
  });
}
