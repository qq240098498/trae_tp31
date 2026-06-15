import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Layers, CheckSquare } from 'lucide-react';
import BatchImportForm from '@/components/BatchImportForm';
import MergePanel from '@/components/MergePanel';
import { usePackageStore } from '@/store/usePackageStore';
import { cn } from '@/lib/utils';

type TabMode = 'import' | 'merge' | 'batch';

export default function BatchManagement() {
  const navigate = useNavigate();
  const { setBatchMode } = usePackageStore();
  const [activeTab, setActiveTab] = useState<TabMode>('import');

  const tabs = [
    { key: 'import', label: '批量导入', icon: Upload, description: '批量粘贴快递单号，快速添加多个包裹' },
    { key: 'merge', label: '包裹合并', icon: Layers, description: '将相关包裹合并管理，方便追踪' },
    { key: 'batch', label: '批量操作', icon: CheckSquare, description: '批量标记状态、删除包裹' },
  ];

  const handleTabChange = (tab: TabMode) => {
    setActiveTab(tab);
    if (tab === 'batch') {
      setBatchMode(true);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="absolute inset-0 bg-mesh pointer-events-none" />
      
      <div className="relative">
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-white/10">
          <div className="container max-w-4xl px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>返回列表</span>
              </button>
              <h1 className="text-lg font-semibold text-white font-display">批量管理</h1>
              <div className="w-20" />
            </div>
          </div>
        </header>

        <main className="pb-16 px-4">
          <div className="container max-w-4xl py-8">
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                
                return (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key as TabMode)}
                    className={cn(
                      'p-6 rounded-2xl text-left transition-all duration-300',
                      isActive
                        ? 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border-2 border-blue-500/50'
                        : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                    )}
                  >
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                      isActive ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-400'
                    )}>
                      <tab.icon className="w-6 h-6" />
                    </div>
                    <h3 className={cn(
                      'font-semibold mb-2',
                      isActive ? 'text-white' : 'text-slate-300'
                    )}>
                      {tab.label}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {tab.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="glass-card p-6 animate-slide-up">
              {activeTab === 'import' && (
                <BatchImportForm onSuccess={() => navigate('/')} />
              )}
              
              {activeTab === 'merge' && (
                <MergePanel onSuccess={() => navigate('/')} />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
