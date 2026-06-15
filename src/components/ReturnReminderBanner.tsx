import { useMemo, useState } from 'react';
import { AlertTriangle, Clock, ChevronDown, ChevronUp, Package as PackageIcon } from 'lucide-react';
import { usePackageStore } from '@/store/usePackageStore';
import { useReturnSettingsStore } from '@/store/useReturnSettingsStore';
import { getReturnDeadlineInfo, getReturnDeadlineText, formatReturnDeadline } from '@/utils/returnUtils';
import { getPlatformIcon, getPlatformColor } from '@/utils/platformUtils';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export default function ReturnReminderBanner() {
  const navigate = useNavigate();
  const { packages } = usePackageStore();
  const { remindersEnabled, getReturnDaysForPlatform } = useReturnSettingsStore();
  const [expanded, setExpanded] = useState(false);

  const urgentPackages = useMemo(() => {
    if (!remindersEnabled) return [];
    
    return packages
      .filter(pkg => {
        const returnDays = getReturnDaysForPlatform(pkg.platform);
        const info = getReturnDeadlineInfo(pkg, returnDays);
        return info && !info.isExpired && info.isUrgent;
      })
      .sort((a, b) => {
        const infoA = getReturnDeadlineInfo(a, getReturnDaysForPlatform(a.platform));
        const infoB = getReturnDeadlineInfo(b, getReturnDaysForPlatform(b.platform));
        return (infoA?.remainingDays ?? 0) - (infoB?.remainingDays ?? 0);
      });
  }, [packages, remindersEnabled, getReturnDaysForPlatform]);

  const expiredCount = useMemo(() => {
    return packages.filter(pkg => {
      const returnDays = getReturnDaysForPlatform(pkg.platform);
      const info = getReturnDeadlineInfo(pkg, returnDays);
      return info && info.isExpired;
    }).length;
  }, [packages, getReturnDaysForPlatform]);

  if (!remindersEnabled || urgentPackages.length === 0) {
    return null;
  }

  const criticalCount = urgentPackages.filter(pkg => {
    const returnDays = getReturnDaysForPlatform(pkg.platform);
    const info = getReturnDeadlineInfo(pkg, returnDays);
    return info?.reminderLevel === 'critical';
  }).length;

  return (
    <div className="glass-card overflow-hidden animate-slide-up">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-xl',
            criticalCount > 0 ? 'bg-red-500/20' : 'bg-amber-500/20'
          )}>
            <AlertTriangle className={cn(
              'w-5 h-5',
              criticalCount > 0 ? 'text-red-400' : 'text-amber-400'
            )} />
          </div>
          <div className="text-left">
            <h3 className={cn(
              'font-semibold',
              criticalCount > 0 ? 'text-red-400' : 'text-amber-400'
            )}>
              退货提醒
            </h3>
            <p className="text-sm text-slate-400">
              {urgentPackages.length} 个包裹即将超过退货期限
              {expiredCount > 0 && `，${expiredCount} 个已超期`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            'px-2.5 py-1 rounded-full text-xs font-medium',
            criticalCount > 0 
              ? 'bg-red-500/20 text-red-400' 
              : 'bg-amber-500/20 text-amber-400'
          )}>
            {urgentPackages.length} 个待处理
          </span>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/5 p-3 space-y-2">
          {urgentPackages.map((pkg) => {
            const returnDays = getReturnDaysForPlatform(pkg.platform);
            const info = getReturnDeadlineInfo(pkg, returnDays);
            const PlatformIcon = getPlatformIcon(pkg.platform);
            const platformColor = getPlatformColor(pkg.platform);
            
            if (!info) return null;

            return (
              <button
                key={pkg.id}
                onClick={() => navigate(`/package/${pkg.id}`)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left',
                  'hover:bg-white/5',
                  info.reminderLevel === 'critical' && 'bg-red-500/5'
                )}
              >
                <div
                  className="p-2 rounded-lg bg-white/5"
                  style={{ color: platformColor }}
                >
                  <PlatformIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {pkg.productName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {pkg.platform}
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    'text-sm font-medium',
                    info.reminderLevel === 'critical' ? 'text-red-400' : 'text-amber-400'
                  )}>
                    {getReturnDeadlineText(info)}
                  </p>
                  <p className="text-xs text-slate-500">
                    截止 {formatReturnDeadline(info.deadlineDate)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
