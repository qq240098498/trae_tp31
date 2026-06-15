import { useStatusCounts } from '@/store/usePackageStore';
import { statusConfig } from '@/utils/statusUtils';
import { Package, Truck, MapPin, CheckCircle, PackageOpen, Inbox } from 'lucide-react';

const statusIcons = {
  shipped: Package,
  in_transit: Truck,
  out_for_delivery: MapPin,
  delivered: CheckCircle,
  opened: PackageOpen,
};

export default function StatisticsBar() {
  const counts = useStatusCounts();

  const items = [
    { key: 'shipped', count: counts.shipped },
    { key: 'in_transit', count: counts.in_transit },
    { key: 'out_for_delivery', count: counts.out_for_delivery },
    { key: 'delivered', count: counts.delivered },
    { key: 'opened', count: counts.opened },
  ] as const;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {items.map(({ key, count }) => {
        const config = statusConfig[key];
        const Icon = statusIcons[key];
        
        return (
          <div
            key={key}
            className="glass-card p-4 hover:bg-white/10 transition-all duration-300 cursor-default"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-xl',
                config.bgColor
              )}>
                <Icon className={cn('w-5 h-5', config.color)} />
              </div>
              <div>
                <div className="text-2xl font-bold font-display">{count}</div>
                <div className="text-xs text-slate-400">{config.label}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
