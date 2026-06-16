import type { Package, ReturnDeadlineInfo, ReturnStatus } from '@/types';
import { useReturnSettingsStore } from '@/store/useReturnSettingsStore';
import { getPlatformDefaultReturnDays, getPlatformReturnPolicyLabel } from './platformUtils';

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
  
  const returnPolicyLabel = getPlatformReturnPolicyLabel(pkg.platform);
  
  return {
    remainingDays,
    deadlineDate,
    isExpired,
    isUrgent,
    needsReminder,
    reminderLevel,
    returnPolicyLabel,
    returnDays: days,
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
    return `${info.returnPolicyLabel}已过期（超期 ${Math.abs(info.remainingDays)} 天）`;
  }
  
  if (info.remainingDays === 0) {
    return `${info.returnPolicyLabel}·今天是最后期限！`;
  }
  
  if (info.remainingDays === 1) {
    return `${info.returnPolicyLabel}·还剩1天`;
  }
  
  return `${info.returnPolicyLabel}·还剩${info.remainingDays}天`;
}

export function canRequestReturn(pkg: Package): boolean {
  if (pkg.returnStatus !== 'none') return false;
  if (pkg.status !== 'delivered' && pkg.status !== 'opened') return false;
  if (!pkg.deliveredDate) return false;
  
  const returnDays = useReturnSettingsStore.getState().getReturnDaysForPlatform(pkg.platform);
  const deadline = getReturnDeadline(pkg.deliveredDate, returnDays);
  if (!deadline) return false;
  
  const remaining = getRemainingDays(deadline);
  return remaining !== null && remaining >= 0;
}

export function getReturnStatusConfig(status: ReturnStatus): {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
} {
  const config: Record<ReturnStatus, { label: string; color: string; bgColor: string; icon: string }> = {
    none: { label: '未退货', color: 'text-slate-400', bgColor: 'bg-slate-500/20', icon: 'none' },
    return_pending: { label: '退货中', color: 'text-amber-400', bgColor: 'bg-amber-500/20', icon: 'pending' },
    return_shipped: { label: '退货物流中', color: 'text-blue-400', bgColor: 'bg-blue-500/20', icon: 'shipped' },
    returned: { label: '已退货', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', icon: 'done' },
  };
  return config[status];
}

export function getReturnGuideSteps(platform: string): { step: number; title: string; description: string }[] {
  const commonSteps = [
    { step: 1, title: '申请退货', description: `打开${platform}APP → 我的订单 → 申请退货` },
    { step: 2, title: '选择退货原因', description: '选择退货原因，如"七天无理由退货"' },
    { step: 3, title: '等待审核', description: '商家审核退货申请（通常1-2个工作日）' },
    { step: 4, title: '寄回商品', description: '审核通过后，按提供的地址寄回商品' },
    { step: 5, title: '确认退款', description: '商家确认收货后，退款将原路返回' },
  ];
  return commonSteps;
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
