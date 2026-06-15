import { useNavigate } from 'react-router-dom';
import { ChevronRight, PackageOpen, Check, Copy, Trash2, Layers, Pencil, Clock, AlertTriangle } from 'lucide-react';
import { usePackageStore, useChildPackages } from '@/store/usePackageStore';
import { useReturnSettingsStore } from '@/store/useReturnSettingsStore';
import type { Package } from '@/types';
import StatusBadge from './StatusBadge';
import { getPlatformIcon } from '@/utils/platformUtils';
import { formatDate, getArrivalText, canMarkAsOpened } from '@/utils/statusUtils';
import { formatTrackingNumber } from '@/utils/carrierUtils';
import { getReturnDeadlineInfo, getReturnDeadlineText, formatReturnDeadline } from '@/utils/returnUtils';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import Modal from './Modal';
import EditPackageForm from './EditPackageForm';

interface PackageCardProps {
  pkg: Package;
  index: number;
}

export default function PackageCard({ pkg, index }: PackageCardProps) {
  const navigate = useNavigate();
  const { batchMode, selectedIds, toggleSelection, markAsOpened, deletePackage } = usePackageStore();
  const { getReturnDaysForPlatform } = useReturnSettingsStore();
  const childPackages = useChildPackages(pkg.id);
  const [showChildren, setShowChildren] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const isSelected = selectedIds.includes(pkg.id);
  const PlatformIcon = getPlatformIcon(pkg.platform);
  const hasChildren = pkg.childIds.length > 0;

  const returnDeadlineInfo = useMemo(() => {
    const returnDays = getReturnDaysForPlatform(pkg.platform);
    return getReturnDeadlineInfo(pkg, returnDays);
  }, [pkg, getReturnDaysForPlatform]);

  const handleCopyTracking = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pkg.trackingNumber) {
      navigator.clipboard.writeText(pkg.trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleMarkOpened = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAsOpened(pkg.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个包裹吗？')) {
      deletePackage(pkg.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditModal(true);
  };

  const handleCardClick = () => {
    if (batchMode) {
      toggleSelection(pkg.id);
    } else {
      navigate(`/package/${pkg.id}`);
    }
  };

  const statusBorderColor = {
    pending: 'border-l-slate-500',
    shipped: 'border-l-amber-500',
    in_transit: 'border-l-blue-500',
    out_for_delivery: 'border-l-violet-500',
    delivered: 'border-l-emerald-500',
    opened: 'border-l-emerald-600',
  };

  return (
    <div className="space-y-2">
      <div
        onClick={handleCardClick}
        className={cn(
          'glass-card p-4 cursor-pointer transition-all duration-300',
          'hover:bg-white/10 hover:scale-[1.02] hover:shadow-xl',
          'border-l-4',
          statusBorderColor[pkg.status],
          isSelected && 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-950',
          batchMode && 'select-none'
        )}
        style={{
          animation: `slideUp 0.5s ease-out ${index * 0.05}s both`,
        }}
      >
        <div className="flex items-start gap-4">
          {batchMode && (
            <div className={cn(
              'w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all',
              isSelected 
                ? 'bg-blue-500 border-blue-500' 
                : 'border-white/20 hover:border-white/40'
            )}>
              {isSelected && <Check className="w-4 h-4 text-white" />}
            </div>
          )}
          
          <div className={cn(
            'p-3 rounded-xl bg-white/5',
            hasChildren && 'ring-2 ring-amber-500/50'
          )}>
            <PlatformIcon className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-white truncate font-display">
                  {pkg.productName}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                  <span>{pkg.platform}</span>
                  {pkg.carrier && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-slate-600" />
                      <span>{pkg.carrier}</span>
                    </>
                  )}
                </div>
              </div>
              <StatusBadge status={pkg.status} size="sm" />
            </div>
            
            {pkg.trackingNumber && (
              <div className="flex items-center gap-2 mt-3">
                <code className="text-xs font-mono bg-white/5 px-2 py-1 rounded text-slate-300">
                  {formatTrackingNumber(pkg.trackingNumber)}
                </code>
                <button
                  onClick={handleCopyTracking}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  title="复制单号"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-3">
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-slate-400">
                    {getArrivalText(pkg.estimatedArrival, pkg.status)}
                  </span>
                  {pkg.estimatedArrival && pkg.status !== 'delivered' && pkg.status !== 'opened' && (
                    <span className="ml-2 text-slate-500">
                      ({formatDate(pkg.estimatedArrival)})
                    </span>
                  )}
                  {pkg.openedDate && (
                    <span className="ml-2 text-emerald-400">
                      拆包于 {formatDate(pkg.openedDate)}
                    </span>
                  )}
                </div>
                {returnDeadlineInfo && (
                  <div className={cn(
                    'flex items-center gap-1.5 text-xs',
                    returnDeadlineInfo.isExpired ? 'text-slate-500' :
                    returnDeadlineInfo.reminderLevel === 'critical' ? 'text-red-400' :
                    returnDeadlineInfo.reminderLevel === 'warning' ? 'text-amber-400' :
                    'text-slate-500'
                  )}>
                    {returnDeadlineInfo.isExpired ? (
                      <Clock className="w-3.5 h-3.5" />
                    ) : returnDeadlineInfo.isUrgent ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {getReturnDeadlineText(returnDeadlineInfo)}
                    </span>
                    <span className="text-slate-600">
                      · 截止 {formatReturnDeadline(returnDeadlineInfo.deadlineDate)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                {hasChildren && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowChildren(!showChildren);
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{pkg.childIds.length}个子包裹</span>
                    <ChevronRight className={cn(
                      'w-3.5 h-3.5 transition-transform',
                      showChildren && 'rotate-90'
                    )} />
                  </button>
                )}
                
                {!batchMode && (
                  <>
                    {canMarkAsOpened(pkg.status) && (
                      <button
                        onClick={handleMarkOpened}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
                      >
                        <PackageOpen className="w-4 h-4" />
                        <span>标记已拆包</span>
                      </button>
                    )}
                    
                    <button
                      onClick={handleEdit}
                      className="p-2 rounded-lg hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors"
                      title="编辑"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={handleDelete}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {hasChildren && showChildren && (
        <div className="ml-8 space-y-2">
          {childPackages.map((childPkg, childIndex) => (
            <div
              key={childPkg.id}
              onClick={() => navigate(`/package/${childPkg.id}`)}
              className="glass-card p-3 cursor-pointer transition-all duration-200 hover:bg-white/10 border-l-2 border-l-amber-500/50"
              style={{
                animation: `slideUp 0.3s ease-out ${childIndex * 0.05}s both`,
              }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/5">
                  <PlatformIcon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white truncate">
                    {childPkg.productName}
                  </h4>
                  {childPkg.trackingNumber && (
                    <code className="text-xs font-mono text-slate-400">
                      {formatTrackingNumber(childPkg.trackingNumber)}
                    </code>
                  )}
                </div>
                <StatusBadge status={childPkg.status} size="sm" showIcon={false} />
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            </div>
          ))}
        </div>
      )}
      
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="编辑包裹"
        size="md"
      >
        <EditPackageForm
          pkg={pkg}
          onSuccess={() => setShowEditModal(false)}
        />
      </Modal>
    </div>
  );
}
