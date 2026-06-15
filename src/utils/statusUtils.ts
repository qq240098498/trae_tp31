import type { PackageStatus } from '@/types';
import { Clock, Package, Truck, MapPin, CheckCircle, PackageOpen } from 'lucide-react';

export const statusConfig: Record<PackageStatus, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: typeof Package;
  order: number;
}> = {
  pending: {
    label: '待发货',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/20',
    borderColor: 'border-slate-500/30',
    icon: Clock,
    order: 0,
  },
  shipped: {
    label: '已发货',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
    icon: Package,
    order: 1,
  },
  in_transit: {
    label: '运输中',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    icon: Truck,
    order: 2,
  },
  out_for_delivery: {
    label: '派送中',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/20',
    borderColor: 'border-violet-500/30',
    icon: MapPin,
    order: 3,
  },
  delivered: {
    label: '已签收',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    icon: CheckCircle,
    order: 4,
  },
  opened: {
    label: '已拆包',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-600/20',
    borderColor: 'border-emerald-600/30',
    icon: PackageOpen,
    order: 5,
  },
};

export const statusList: PackageStatus[] = ['pending', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'opened'];

export function getNextStatus(current: PackageStatus): PackageStatus | null {
  const currentIndex = statusList.indexOf(current);
  if (currentIndex < statusList.length - 2) {
    return statusList[currentIndex + 1];
  }
  return null;
}

export function getStatusProgress(status: PackageStatus): number {
  const currentIndex = statusList.indexOf(status);
  return Math.round((currentIndex / (statusList.length - 1)) * 100);
}

export function canMarkAsOpened(status: PackageStatus): boolean {
  return status === 'delivered';
}

export function canTransitionTo(current: PackageStatus, target: PackageStatus): boolean {
  const currentIndex = statusList.indexOf(current);
  const targetIndex = statusList.indexOf(target);
  
  if (targetIndex <= currentIndex) {
    return false;
  }
  
  if (targetIndex !== currentIndex + 1 && target !== 'opened') {
    return false;
  }
  
  return true;
}

export function getValidTransitions(current: PackageStatus): PackageStatus[] {
  const valid: PackageStatus[] = [];
  const next = getNextStatus(current);
  if (next) {
    valid.push(next);
  }
  if (canMarkAsOpened(current)) {
    valid.push('opened');
  }
  return valid;
}

export function formatDate(date: Date | null | string): string {
  if (!date) return '-';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(date: Date | null | string): string {
  if (!date) return '-';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getDaysUntilArrival(estimatedArrival: Date | null): number | null {
  if (!estimatedArrival) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const arrival = new Date(estimatedArrival);
  arrival.setHours(0, 0, 0, 0);
  
  const diffTime = arrival.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

export function getArrivalText(estimatedArrival: Date | null, status: PackageStatus): string {
  if (status === 'delivered' || status === 'opened') {
    return '已送达';
  }
  
  const days = getDaysUntilArrival(estimatedArrival);
  if (days === null) return '预计到达时间待定';
  
  if (days < 0) return '已超过预计送达时间';
  if (days === 0) return '今天预计送达';
  if (days === 1) return '明天预计送达';
  return `预计 ${days} 天后送达`;
}
