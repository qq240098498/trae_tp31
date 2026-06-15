import type { PlatformInfo } from '@/types';
import { ShoppingBag, ShoppingCart, Store, Gift, Package, Globe } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const platforms: PlatformInfo[] = [
  { name: '淘宝', icon: 'ShoppingBag', color: '#FF5000', defaultReturnDays: 7 },
  { name: '天猫', icon: 'ShoppingCart', color: '#FF0036', defaultReturnDays: 7 },
  { name: '京东', icon: 'Store', color: '#E4393C', defaultReturnDays: 7 },
  { name: '拼多多', icon: 'Gift', color: '#E02E24', defaultReturnDays: 7 },
  { name: '抖音', icon: 'Package', color: '#000000', defaultReturnDays: 7 },
  { name: '快手', icon: 'Package', color: '#FF4906', defaultReturnDays: 7 },
  { name: '唯品会', icon: 'ShoppingBag', color: '#F25D8E', defaultReturnDays: 7 },
  { name: '苏宁', icon: 'Store', color: '#FCD800', defaultReturnDays: 7 },
  { name: '小米商城', icon: 'Package', color: '#FF6900', defaultReturnDays: 7 },
  { name: '华为商城', icon: 'Package', color: '#C8102E', defaultReturnDays: 7 },
  { name: '其他', icon: 'Globe', color: '#6B7280', defaultReturnDays: 7 },
];

export const DEFAULT_RETURN_DAYS = 7;

export const platformIconMap: Record<string, LucideIcon> = {
  ShoppingBag,
  ShoppingCart,
  Store,
  Gift,
  Package,
  Globe,
};

export function getPlatformInfo(platformName: string): PlatformInfo {
  const platform = platforms.find(p => p.name === platformName);
  return platform || platforms[platforms.length - 1];
}

export function getPlatformIcon(platformName: string): LucideIcon {
  const info = getPlatformInfo(platformName);
  return platformIconMap[info.icon] || Package;
}

export function getPlatformColor(platformName: string): string {
  return getPlatformInfo(platformName).color;
}

export function getPlatformDefaultReturnDays(platformName: string): number {
  const info = getPlatformInfo(platformName);
  return info.defaultReturnDays || DEFAULT_RETURN_DAYS;
}
