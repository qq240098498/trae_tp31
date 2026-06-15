import { usePackageStore, useStatusCounts } from '@/store/usePackageStore';
import type { FilterStatus, PackageStatus } from '@/types';
import { statusConfig } from '@/utils/statusUtils';
import { Search, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

const filterOptions: { status: FilterStatus; label: string }[] = [
  { status: 'all', label: '全部' },
  { status: 'shipped', label: '已发货' },
  { status: 'in_transit', label: '运输中' },
  { status: 'out_for_delivery', label: '派送中' },
  { status: 'delivered', label: '已签收' },
  { status: 'opened', label: '已拆包' },
];

export default function FilterBar() {
  const { filterStatus, setFilterStatus, searchQuery, setSearchQuery } = usePackageStore();
  const counts = useStatusCounts();

  const getCount = (status: FilterStatus) => {
    if (status === 'all') return counts.total;
    return counts[status as PackageStatus];
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="搜索商品名称、快递单号、快递公司..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field pl-12"
        />
      </div>
      
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => {
          const isActive = filterStatus === option.status;
          const count = getCount(option.status);
          
          return (
            <button
              key={option.status}
              onClick={() => setFilterStatus(option.status)}
              className={cn(
                'pill-button flex items-center gap-2',
                isActive ? 'pill-button-active' : 'pill-button-inactive'
              )}
            >
              {option.status !== 'all' && (
                <Layers className="w-4 h-4" />
              )}
              <span>{option.label}</span>
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs',
                isActive 
                  ? 'bg-white/20 text-white' 
                  : 'bg-white/10 text-slate-400'
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
