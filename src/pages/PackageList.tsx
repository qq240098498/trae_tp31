import { useState } from 'react';
import { Plus, Layers, Download, Upload, CheckSquare, X, Package as PackageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePackageStore, useTopLevelPackages, useStatusCounts } from '@/store/usePackageStore';
import StatisticsBar from '@/components/StatisticsBar';
import FilterBar from '@/components/FilterBar';
import PackageCard from '@/components/PackageCard';
import PackageForm from '@/components/PackageForm';
import Modal from '@/components/Modal';
import BatchImportForm from '@/components/BatchImportForm';
import MergePanel from '@/components/MergePanel';
import type { PackageStatus } from '@/types';
import { cn } from '@/lib/utils';

type TabMode = 'import' | 'merge' | 'batch';

export default function PackageList() {
  const navigate = useNavigate();
  const packages = useTopLevelPackages();
  const counts = useStatusCounts();
  const { 
    batchMode, 
    selectedIds, 
    setBatchMode, 
    clearSelection,
    selectAll,
    batchUpdateStatus,
    batchDelete,
    exportData,
    importData
  } = usePackageStore();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchTab, setBatchTab] = useState<TabMode>('import');

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `package-tracker-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const content = event.target?.result as string;
            const success = importData(content);
            if (success) {
              alert('导入成功！');
            } else {
              alert('导入失败，请检查文件格式');
            }
          } catch {
            alert('导入失败，请检查文件格式');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleBatchStatus = (status: PackageStatus) => {
    if (selectedIds.length === 0) return;
    const statusLabels: Record<PackageStatus, string> = {
      pending: '待发货',
      shipped: '已发货',
      in_transit: '运输中',
      out_for_delivery: '派送中',
      delivered: '已签收',
      opened: '已拆包',
    };
    if (confirm(`确定要将 ${selectedIds.length} 个包裹标记为"${statusLabels[status]}"吗？\n注意：只有符合状态流转条件的包裹会被更新。`)) {
      batchUpdateStatus(selectedIds, status);
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`确定要删除选中的 ${selectedIds.length} 个包裹吗？此操作不可恢复。`)) {
      batchDelete(selectedIds);
    }
  };

  const filteredTopLevel = packages;

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="absolute inset-0 bg-mesh pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-96 bg-gradient-radial pointer-events-none" />
      
      <div className="relative">
        <header className="pt-8 pb-6 px-4">
          <div className="container max-w-5xl">
            <div className="flex items-start justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                    <PackageIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold font-display text-gradient">
                      快递追踪
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                      一站式管理您的所有包裹
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!batchMode ? (
                  <>
                    <button
                      onClick={handleExport}
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                      title="导出数据"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleImportClick}
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                      title="导入数据"
                    >
                      <Upload className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setShowBatchModal(true)}
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                      title="批量管理"
                    >
                      <Layers className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      <span>添加包裹</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={selectAll}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <CheckSquare className="w-4 h-4" />
                      <span>全选</span>
                    </button>
                    <button
                      onClick={() => {
                        setBatchMode(false);
                        clearSelection();
                      }}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      <span>取消</span>
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {batchMode && selectedIds.length > 0 && (
              <div className="glass-card p-4 mb-6 animate-slide-up">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="text-slate-300">
                    已选择 <span className="text-white font-semibold">{selectedIds.length}</span> 个包裹
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleBatchStatus('shipped')}
                      className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors text-sm"
                    >
                      标记已发货
                    </button>
                    <button
                      onClick={() => handleBatchStatus('in_transit')}
                      className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                    >
                      标记运输中
                    </button>
                    <button
                      onClick={() => handleBatchStatus('out_for_delivery')}
                      className="px-4 py-2 bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 transition-colors text-sm"
                    >
                      标记派送中
                    </button>
                    <button
                      onClick={() => handleBatchStatus('delivered')}
                      className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm"
                    >
                      标记已签收
                    </button>
                    <button
                      onClick={handleBatchDelete}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                    >
                      批量删除
                    </button>
                  </div>
                </div>
              </div>
            )}

            <StatisticsBar />
          </div>
        </header>

        <main className="pb-24 px-4">
          <div className="container max-w-5xl">
            <div className="mb-6">
              <FilterBar />
            </div>

            {filteredTopLevel.length === 0 ? (
              <div className="text-center py-16 animate-fade-in">
                <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                  <PackageIcon className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">暂无包裹</h3>
                <p className="text-slate-400 mb-6">
                  {counts.total > 0 
                    ? '当前筛选条件下没有包裹，试试其他筛选条件' 
                    : '点击右上角"添加包裹"按钮开始追踪您的快递'}
                </p>
                {counts.total === 0 && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>添加第一个包裹</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTopLevel.map((pkg, index) => (
                  <PackageCard key={pkg.id} pkg={pkg} index={index} />
                ))}
              </div>
            )}
          </div>
        </main>

        {!batchMode && (
          <button
            onClick={() => setShowAddModal(true)}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 md:hidden"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="添加包裹"
        size="lg"
      >
        <PackageForm onSuccess={() => setShowAddModal(false)} />
      </Modal>

      <Modal
        isOpen={showBatchModal}
        onClose={() => {
          setShowBatchModal(false);
          setBatchTab('import');
        }}
        title="批量管理"
        size="xl"
      >
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl mb-6">
          {[
            { key: 'import', label: '批量导入', icon: Upload },
            { key: 'merge', label: '包裹合并', icon: Layers },
            { key: 'batch', label: '批量操作', icon: CheckSquare },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setBatchTab(tab.key as TabMode);
                if (tab.key === 'batch') {
                  setBatchMode(true);
                  setShowBatchModal(false);
                }
              }}
              className={cn(
                'flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
                batchTab === tab.key
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {batchTab === 'import' && (
          <BatchImportForm onSuccess={() => setShowBatchModal(false)} />
        )}
        
        {batchTab === 'merge' && (
          <MergePanel onSuccess={() => setShowBatchModal(false)} />
        )}
      </Modal>
    </div>
  );
}
