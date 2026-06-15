import type { LogisticsEvent, PackageStatus } from '@/types';
import { statusConfig, statusList } from '@/utils/statusUtils';
import { formatDateTime } from '@/utils/statusUtils';
import { Clock, Package, Truck, MapPin, CheckCircle, PackageOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogisticsTimelineProps {
  events: LogisticsEvent[];
  currentStatus: PackageStatus;
}

const statusOrder: PackageStatus[] = statusList;

export default function LogisticsTimeline({ events, currentStatus }: LogisticsTimelineProps) {
  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const getStatusIcon = (status: PackageStatus, isLatest: boolean) => {
    const iconMap = {
      pending: Clock,
      shipped: Package,
      in_transit: Truck,
      out_for_delivery: MapPin,
      delivered: CheckCircle,
      opened: PackageOpen,
    };
    
    const Icon = iconMap[status];
    const config = statusConfig[status];
    
    return (
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center border-4 border-slate-950',
        config.bgColor,
        config.borderColor,
        isLatest && 'ring-4 ring-offset-2 ring-offset-slate-950 animate-pulse-slow',
        isLatest && status === 'pending' && 'ring-slate-500/30',
        isLatest && status === 'delivered' && 'ring-emerald-500/30',
        isLatest && status === 'in_transit' && 'ring-blue-500/30',
        isLatest && status === 'out_for_delivery' && 'ring-violet-500/30',
        isLatest && status === 'shipped' && 'ring-amber-500/30',
        isLatest && status === 'opened' && 'ring-emerald-600/30'
      )}>
        <Icon className={cn('w-5 h-5', config.color)} />
      </div>
    );
  };

  const getStatusProgress = (status: PackageStatus) => {
    return statusOrder.indexOf(status);
  };

  const currentProgress = getStatusProgress(currentStatus);

  return (
    <div className="relative">
      <div className="absolute left-5 top-10 bottom-10 w-0.5 bg-gradient-to-b from-slate-700 via-slate-700 to-transparent" />
      
      <div className="space-y-0">
        {sortedEvents.map((event, index) => {
          const isLatest = index === 0;
          const eventProgress = getStatusProgress(event.status);
          const isCompleted = eventProgress <= currentProgress;
          
          return (
            <div 
              key={event.id}
              className="relative flex gap-4 pb-8 last:pb-0"
              style={{
                animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`,
              }}
            >
              <div className="relative z-10 flex-shrink-0">
                {getStatusIcon(event.status, isLatest)}
              </div>
              
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between gap-4">
                  <h4 className={cn(
                    'font-medium font-display',
                    isLatest ? 'text-white text-lg' : 'text-slate-300'
                  )}>
                    {statusConfig[event.status].label}
                  </h4>
                  <span className={cn(
                    'text-sm whitespace-nowrap',
                    isLatest ? 'text-white' : 'text-slate-500'
                  )}>
                    {formatDateTime(event.timestamp)}
                  </span>
                </div>
                
                <p className={cn(
                  'mt-1 text-sm',
                  isLatest ? 'text-slate-300' : 'text-slate-400'
                )}>
                  {event.description}
                </p>
                
                {event.location && (
                  <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {event.location}
                  </p>
                )}
                
                {isLatest && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium" style={{
                    backgroundColor: `${statusConfig[currentStatus].bgColor.replace('/20', '/30')}`,
                    color: statusConfig[currentStatus].color.replace('text-', 'rgb(var(--')
                  }}>
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{
                      backgroundColor: statusConfig[currentStatus].color.includes('slate') ? '#64748B' :
                        statusConfig[currentStatus].color.includes('amber') ? '#F59E0B' :
                        statusConfig[currentStatus].color.includes('blue') ? '#3B82F6' :
                        statusConfig[currentStatus].color.includes('violet') ? '#8B5CF6' :
                        statusConfig[currentStatus].color.includes('emerald') ? '#10B981' : '#10B981'
                    }} />
                    当前状态
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
