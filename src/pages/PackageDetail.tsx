import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Trash2, PackageOpen, Calendar, Truck, ShoppingBag, Building, FileText, Layers, Unlink, Pencil } from 'lucide-react';
import { useState } from 'react';
import { usePackageStore, usePackageById, useChildPackages } from '@/store/usePackageStore';
import StatusBadge from '@/components/StatusBadge';
import LogisticsTimeline from '@/components/LogisticsTimeline';
import { getPlatformIcon } from '@/utils/platformUtils';
import { formatDate, formatDateTime, getArrivalText, canMarkAsOpened, getNextStatus } from '@/utils/statusUtils';
import { formatTrackingNumber } from '@/utils/carrierUtils';
import { statusConfig } from '@/utils/statusUtils';
import { cn } from '@/lib/utils';
import Modal from '@/components/Modal';
import EditPackageForm from '@/components/EditPackageForm';

export default function PackageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const pkg = usePackageById(id);
  const childPackages = useChildPackages(id || '');
  const { markAsOpened, updateStatus, deletePackage, unmergePackage } = usePackageStore();
  const [copied, setCopied] = useState(false);
  const [showChildren, setShowChildren] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  if (!pkg) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-red-500/20 flex items-center justify-center">
            <FileText className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">包裹不存在</h2>
          <p className="text-slate-400 mb-6">该包裹可能已被删除</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回列表</span>
          </button>
        </div>
      </div>
    );
  }

  const handleCopyTracking = () => {
    if (pkg.trackingNumber) {
      navigator.clipboard.writeText(pkg.trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = () => {
    if (confirm('确定要删除这个包裹吗？此操作不可恢复。')) {
      deletePackage(pkg.id);
      navigate('/');
    }
  };

  const handleMarkOpened = () => {
    markAsOpened(pkg.id);
  };

  const handleUpdateStatus = () => {
    const nextStatus = getNextStatus(pkg.status);
    if (nextStatus) {
      updateStatus(pkg.id, nextStatus);
    }
  };

  const handleUnmerge = () => {
    if (confirm('确定要解除此包裹的合并关系吗？')) {
      unmergePackage(pkg.id);
    }
  };

  const PlatformIcon = getPlatformIcon(pkg.platform);
  const nextStatus = getNextStatus(pkg.status);
  const hasChildren = pkg.childIds.length > 0;
  const hasParent = pkg.parentId !== null;

  const infoItems = [
    {
      icon: ShoppingBag,
      label: '购买平台',
      value: pkg.platform,
    },
    {
      icon: Building,
      label: '快递公司',
      value: pkg.carrier || '-',
    },
    {
      icon: Calendar,
      label: '发货日期',
      value: formatDate(pkg.shippedDate),
    },
    {
      icon: Calendar,
      label: '预计到货',
      value: formatDate(pkg.estimatedArrival),
      extra: getArrivalText(pkg.estimatedArrival, pkg.status),
    },
    {
      icon: Calendar,
      label: '签收日期',
      value: formatDate(pkg.deliveredDate),
    },
    {
      icon: Calendar,
      label: '拆包日期',
      value: formatDate(pkg.openedDate),
    },
  ];

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
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-2 rounded-lg hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors"
                  title="编辑"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="pb-16 px-4">
          <div className="container max-w-4xl py-8">
            <div className="glass-card p-6 mb-6 animate-slide-up">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'p-4 rounded-2xl bg-white/5',
                    hasChildren && 'ring-2 ring-amber-500/50'
                  )}>
                    <PlatformIcon className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white font-display mb-1">
                      {pkg.productName}
                    </h1>
                    <StatusBadge status={pkg.status} />
                  </div>
                </div>
              </div>

              {pkg.trackingNumber && (
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl mb-6">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">快递单号</p>
                    <code className="font-mono text-lg text-white">
                      {formatTrackingNumber(pkg.trackingNumber)}
                    </code>
                  </div>
                  <button
                    onClick={handleCopyTracking}
                    className="ml-auto p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Copy className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                </div>
              )}

              {(hasChildren || hasParent) && (
                <div className="mb-6">
                  {hasParent && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-300">
                          <Layers className="w-5 h-5" />
                          <span>此包裹已合并到其他包裹</span>
                        </div>
                        <button
                          onClick={handleUnmerge}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors"
                        >
                          <Unlink className="w-4 h-4" />
                          <span>解除合并</span>
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {hasChildren && (
                    <div>
                      <button
                        onClick={() => setShowChildren(!showChildren)}
                        className="w-full p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between hover:bg-amber-500/15 transition-colors"
                      >
                        <div className="flex items-center gap-2 text-amber-300">
                          <Layers className="w-5 h-5" />
                          <span>包含 {pkg.childIds.length} 个子包裹</span>
                        </div>
                        <div className="flex items-center gap-2 text-amber-400 text-sm">
                          <span>{showChildren ? '收起' : '展开'}</span>
                        </div>
                      </button>
                      
                      {showChildren && (
                        <div className="mt-3 space-y-2">
                          {childPackages.map((childPkg) => (
                            <div
                              key={childPkg.id}
                              onClick={() => navigate(`/package/${childPkg.id}`)}
                              className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors"
                            >
                              <div className="p-2 rounded-lg bg-white/5">
                                <PlatformIcon className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                  {childPkg.productName}
                                </p>
                                {childPkg.trackingNumber && (
                                  <code className="text-xs font-mono text-slate-400">
                                    {formatTrackingNumber(childPkg.trackingNumber)}
                                  </code>
                                )}
                              </div>
                              <StatusBadge status={childPkg.status} size="sm" showIcon={false} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {infoItems.map((item, index) => (
                  <div key={index} className="p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                      <item.icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </div>
                    <p className="text-white font-medium">{item.value}</p>
                    {item.extra && (
                      <p className="text-xs text-slate-500 mt-1">{item.extra}</p>
                    )}
                  </div>
                ))}
              </div>

              {pkg.notes && (
                <div className="mt-4 p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
                    <FileText className="w-3.5 h-3.5" />
                    <span>备注</span>
                  </div>
                  <p className="text-slate-300">{pkg.notes}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-white/10">
                {canMarkAsOpened(pkg.status) && (
                  <button
                    onClick={handleMarkOpened}
                    className="flex-1 min-w-[140px] btn-primary flex items-center justify-center gap-2"
                  >
                    <PackageOpen className="w-5 h-5" />
                    <span>标记已拆包</span>
                  </button>
                )}
                
                {nextStatus && (
                  <button
                    onClick={handleUpdateStatus}
                    className="flex-1 min-w-[140px] btn-secondary flex items-center justify-center gap-2"
                  >
                    <Truck className="w-5 h-5" />
                    <span>更新为 {statusConfig[nextStatus].label}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-xl font-semibold text-white font-display mb-6 flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-400" />
                物流轨迹
              </h2>
              
              {pkg.logisticsEvents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                    <Truck className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-slate-400">暂无物流信息</p>
                </div>
              ) : (
                <LogisticsTimeline 
                  events={pkg.logisticsEvents} 
                  currentStatus={pkg.status} 
                />
              )}
            </div>

            <div className="mt-6 text-center text-xs text-slate-600">
              <p>创建于 {formatDateTime(pkg.createdAt)} · 最后更新于 {formatDateTime(pkg.updatedAt)}</p>
            </div>
          </div>
        </main>
      </div>
      
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
