import { useState } from 'react';
import { Layers, Check, X, AlertCircle, ArrowRight } from 'lucide-react';
import { usePackageStore } from '@/store/usePackageStore';
import { getPlatformIcon } from '@/utils/platformUtils';
import StatusBadge from './StatusBadge';
import { cn } from '@/lib/utils';

interface MergePanelProps {
  onSuccess?: () => void;
}

export default function MergePanel({ onSuccess }: MergePanelProps) {
  const { packages, selectedIds, mergePackages, clearSelection } = usePackageStore();
  const [parentId, setParentId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const selectedPackages = packages.filter(p => selectedIds.includes(p.id));

  const handleMerge = () => {
    if (selectedPackages.length < 2) {
      setError('请至少选择2个包裹进行合并');
      return;
    }

    if (!parentId) {
      setError('请选择主包裹');
      return;
    }

    const childIds = selectedIds.filter(id => id !== parentId);
    
    if (childIds.length === 0) {
      setError('请选择至少一个子包裹');
      return;
    }

    mergePackages(parentId, childIds);
    clearSelection();
    setParentId(null);
    onSuccess?.();
  };

  if (selectedPackages.length === 0) {
    return (
      <div className="text-center py-12">
        <Layers className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">请先在列表中选择要合并的包裹</p>
        <p className="text-sm text-slate-500 mt-2">点击"批量管理"按钮进入选择模式</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-300 font-medium">已选择 {selectedPackages.length} 个包裹</p>
            <p className="text-sm text-blue-400/80 mt-1">
              请选择一个作为主包裹，其他包裹将作为子包裹合并到主包裹下
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-300">选择主包裹</p>
        <div className="max-h-80 overflow-y-auto space-y-2 scrollbar-hide">
          {selectedPackages.map((pkg) => {
            const isSelected = parentId === pkg.id;
            const PlatformIcon = getPlatformIcon(pkg.platform);
            
            return (
              <button
                key={pkg.id}
                onClick={() => setParentId(pkg.id)}
                className={cn(
                  'w-full p-3 rounded-xl text-left transition-all flex items-center gap-3',
                  isSelected
                    ? 'bg-blue-500/20 border-2 border-blue-500/50'
                    : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                )}
              >
                <div className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                  isSelected
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-white/20'
                )}>
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
                
                <div className="p-2 rounded-lg bg-white/5 flex-shrink-0">
                  <PlatformIcon className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{pkg.productName}</p>
                  {pkg.trackingNumber && (
                    <code className="text-xs font-mono text-slate-400">
                      {pkg.trackingNumber}
                    </code>
                  )}
                </div>
                
                <StatusBadge status={pkg.status} size="sm" showIcon={false} />
              </button>
            );
          })}
        </div>
      </div>

      {parentId && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <p className="text-amber-300 text-sm flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span>将有 {selectedPackages.length - 1} 个包裹合并到主包裹</span>
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => {
            clearSelection();
            setParentId(null);
            setError('');
          }}
          className="flex-1 btn-secondary"
        >
          <X className="w-4 h-4 inline mr-2" />
          取消
        </button>
        <button
          onClick={handleMerge}
          disabled={!parentId || selectedPackages.length < 2}
          className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Layers className="w-5 h-5" />
          <span>合并包裹</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
