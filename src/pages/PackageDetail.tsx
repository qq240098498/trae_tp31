import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Trash2, PackageOpen, Calendar, Truck, ShoppingBag, Building, FileText, Layers, Unlink, Pencil, Clock, AlertTriangle, RotateCcw, ChevronRight, ListChecks, Edit3 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { usePackageStore, usePackageById, useChildPackages } from '@/store/usePackageStore';
import { useReturnSettingsStore } from '@/store/useReturnSettingsStore';
import StatusBadge from '@/components/StatusBadge';
import LogisticsTimeline from '@/components/LogisticsTimeline';
import { getPlatformIcon } from '@/utils/platformUtils';
import { formatDate, formatDateTime, getArrivalText, canMarkAsOpened, getNextStatus } from '@/utils/statusUtils';
import { formatTrackingNumber } from '@/utils/carrierUtils';
import { statusConfig } from '@/utils/statusUtils';
import { getReturnDeadlineInfo, getReturnDeadlineText, formatReturnDeadline, canRequestReturn, getReturnStatusConfig, getReturnGuideSteps } from '@/utils/returnUtils';
import { cn } from '@/lib/utils';
import Modal from '@/components/Modal';
import EditPackageForm from '@/components/EditPackageForm';
import UnpackChecklistModal from '@/components/UnpackChecklistModal';
import AccessoryChecklist from '@/components/AccessoryChecklist';
import AccessoryTemplateManager from '@/components/AccessoryTemplateManager';
import type { AccessoryChecklist as AccessoryChecklistType } from '@/types';

export default function PackageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const pkg = usePackageById(id);
  const childPackages = useChildPackages(id || '');
  const { markAsOpened, updateStatus, deletePackage, unmergePackage, updateReturnStatus, updateAccessoryChecklist } = usePackageStore();
  const { getReturnDaysForPlatform } = useReturnSettingsStore();
  const [copied, setCopied] = useState(false);
  const [showChildren, setShowChildren] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReturnGuide, setShowReturnGuide] = useState(false);
  const [showUnpackModal, setShowUnpackModal] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [isEditingChecklist, setIsEditingChecklist] = useState(false);

  const returnDeadlineInfo = useMemo(() => {
    if (!pkg) return null;
    const returnDays = getReturnDaysForPlatform(pkg.platform);
    return getReturnDeadlineInfo(pkg, returnDays);
  }, [pkg, getReturnDaysForPlatform]);

  const showReturnButton = useMemo(() => pkg ? canRequestReturn(pkg) : false, [pkg]);
  const returnStatusConfig = pkg ? getReturnStatusConfig(pkg.returnStatus) : null;

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
    setShowUnpackModal(true);
  };

  const handleUnpackConfirm = (checklist: AccessoryChecklistType) => {
    if (pkg) {
      markAsOpened(pkg.id);
      updateAccessoryChecklist(pkg.id, checklist);
    }
  };

  const handleChecklistChange = (checklist: AccessoryChecklistType) => {
    if (pkg) {
      updateAccessoryChecklist(pkg.id, checklist);
    }
  };

  const handleNoAccessories = () => {
    if (pkg) {
      const emptyChecklist: AccessoryChecklistType = {
        items: [],
        templateId: null,
        completed: true,
        completedAt: new Date(),
      };
      markAsOpened(pkg.id);
      updateAccessoryChecklist(pkg.id, emptyChecklist);
      setShowUnpackModal(false);
    }
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

  const handleRequestReturn = () => {
    if (confirm('确定要申请退货吗？\n退货后请及时在对应平台完成退货流程。')) {
      updateReturnStatus(pkg.id, 'return_pending');
      setShowReturnGuide(true);
    }
  };

  const handleUpdateReturnStatus = (status: 'return_shipped' | 'returned') => {
    const labels: Record<string, string> = {
      return_shipped: '已寄回商品',
      returned: '已完成退货',
    };
    if (confirm(`确定要将退货状态更新为"${labels[status]}"吗？`)) {
      updateReturnStatus(pkg.id, status);
    }
  };

  const PlatformIcon = getPlatformIcon(pkg.platform);
  const nextStatus = getNextStatus(pkg.status);
  const hasChildren = pkg.childIds.length > 0;
  const hasParent = pkg.parentId !== null;
  const returnGuideSteps = getReturnGuideSteps(pkg.platform);

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
                    <div className="flex items-center gap-2">
                      <StatusBadge status={pkg.status} />
                      {returnDeadlineInfo && !returnDeadlineInfo.isExpired && (
                        <span className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium',
                          returnDeadlineInfo.reminderLevel === 'critical' ? 'bg-red-500/20 text-red-400' :
                          returnDeadlineInfo.reminderLevel === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-blue-500/20 text-blue-400'
                        )}>
                          {returnDeadlineInfo.returnPolicyLabel}
                        </span>
                      )}
                      {returnDeadlineInfo?.isExpired && pkg.returnStatus === 'none' && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-500/20 text-slate-500">
                          退货期已过
                        </span>
                      )}
                      {pkg.returnStatus !== 'none' && returnStatusConfig && (
                        <span className={cn('px-2 py-0.5 rounded text-xs font-medium', returnStatusConfig.bgColor, returnStatusConfig.color)}>
                          {returnStatusConfig.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {returnDeadlineInfo && (
                <div className={cn(
                  'p-4 rounded-xl mb-6',
                  returnDeadlineInfo.isExpired ? 'bg-slate-500/10 border border-slate-500/20' :
                  returnDeadlineInfo.reminderLevel === 'critical' ? 'bg-red-500/10 border border-red-500/20' :
                  returnDeadlineInfo.reminderLevel === 'warning' ? 'bg-amber-500/10 border border-amber-500/20' :
                  'bg-blue-500/10 border border-blue-500/20'
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-2 rounded-xl',
                        returnDeadlineInfo.isExpired ? 'bg-slate-500/20' :
                        returnDeadlineInfo.reminderLevel === 'critical' ? 'bg-red-500/20' :
                        returnDeadlineInfo.reminderLevel === 'warning' ? 'bg-amber-500/20' :
                        'bg-blue-500/20'
                      )}>
                        {returnDeadlineInfo.isExpired ? (
                          <Clock className={cn(
                            'w-5 h-5',
                            returnDeadlineInfo.isExpired ? 'text-slate-400' :
                            returnDeadlineInfo.reminderLevel === 'critical' ? 'text-red-400' :
                            returnDeadlineInfo.reminderLevel === 'warning' ? 'text-amber-400' :
                            'text-blue-400'
                          )} />
                        ) : returnDeadlineInfo.isUrgent ? (
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                        ) : (
                          <Clock className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                      <div>
                        <p className={cn(
                          'font-medium',
                          returnDeadlineInfo.isExpired ? 'text-slate-400' :
                          returnDeadlineInfo.reminderLevel === 'critical' ? 'text-red-400' :
                          returnDeadlineInfo.reminderLevel === 'warning' ? 'text-amber-400' :
                          'text-blue-400'
                        )}>
                          {getReturnDeadlineText(returnDeadlineInfo)}
                        </p>
                        <p className="text-sm text-slate-500">
                          签收日期 {formatDate(pkg.deliveredDate)} · 截止 {formatReturnDeadline(returnDeadlineInfo.deadlineDate)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        'text-3xl font-bold font-display',
                        returnDeadlineInfo.isExpired ? 'text-slate-500' :
                        returnDeadlineInfo.remainingDays <= 1 ? 'text-red-400' :
                        returnDeadlineInfo.remainingDays <= 2 ? 'text-amber-400' :
                        'text-blue-400'
                      )}>
                        {returnDeadlineInfo.isExpired ? '已过期' : `${returnDeadlineInfo.remainingDays}`}
                      </div>
                      {!returnDeadlineInfo.isExpired && (
                        <p className="text-xs text-slate-500">天</p>
                      )}
                    </div>
                  </div>
                  
                  {!returnDeadlineInfo.isExpired && returnDeadlineInfo.remainingDays > 0 && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            returnDeadlineInfo.remainingDays <= 1 ? 'bg-red-500' :
                            returnDeadlineInfo.remainingDays <= 2 ? 'bg-amber-500' :
                            'bg-blue-500'
                          )}
                          style={{ 
                            width: `${Math.min(100, ((returnDeadlineInfo.returnDays - returnDeadlineInfo.remainingDays) / returnDeadlineInfo.returnDays) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

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

              {pkg.isOpened && (
                <div className="mt-4 p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-white">赠品/配件核对清单</span>
                      {pkg.accessoryChecklist?.completed && pkg.accessoryChecklist.completedAt && (
                        <span className="text-xs text-slate-500">
                          · 于 {formatDate(pkg.accessoryChecklist.completedAt)} 完成核对
                        </span>
                      )}
                      {pkg.accessoryChecklist?.items.length === 0 && pkg.accessoryChecklist?.completed && (
                        <span className="text-xs text-slate-500 ml-1">
                          (无配件赠品)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowTemplateManager(true)}
                        className="text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        模板管理
                      </button>
                      <button
                        onClick={() => setIsEditingChecklist(!isEditingChecklist)}
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        {isEditingChecklist ? '完成编辑' : '编辑'}
                      </button>
                    </div>
                  </div>
                  {pkg.accessoryChecklist && pkg.accessoryChecklist.items.length > 0 ? (
                    <AccessoryChecklist
                      checklist={pkg.accessoryChecklist}
                      onChange={handleChecklistChange}
                      readOnly={!isEditingChecklist}
                    />
                  ) : (
                    <div className="space-y-3">
                      <div className="text-center py-4 text-slate-500 text-sm">
                        {pkg.accessoryChecklist?.completed 
                          ? '当前标记为无配件赠品，点击编辑可添加配件项'
                          : '拆包时可录入配件核对清单'}
                      </div>
                      {isEditingChecklist && (
                        <AccessoryChecklist
                          checklist={pkg.accessoryChecklist || { items: [], templateId: null, completed: false, completedAt: null }}
                          onChange={handleChecklistChange}
                          readOnly={false}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-white/10">
                {showReturnButton && (
                  <button
                    onClick={handleRequestReturn}
                    className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 bg-amber-500/20 text-amber-400 rounded-xl hover:bg-amber-500/30 transition-colors font-medium"
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span>申请退货</span>
                  </button>
                )}
                
                {pkg.returnStatus === 'return_pending' && (
                  <button
                    onClick={() => handleUpdateReturnStatus('return_shipped')}
                    className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-colors font-medium"
                  >
                    <Truck className="w-5 h-5" />
                    <span>已寄回商品</span>
                  </button>
                )}

                {pkg.returnStatus === 'return_shipped' && (
                  <button
                    onClick={() => handleUpdateReturnStatus('returned')}
                    className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-colors font-medium"
                  >
                    <Check className="w-5 h-5" />
                    <span>确认退货完成</span>
                  </button>
                )}

                {canMarkAsOpened(pkg.status) && pkg.returnStatus === 'none' && (
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

            {showReturnGuide && pkg.returnStatus !== 'none' && (
              <div className="glass-card p-6 mb-6 animate-slide-up" style={{ animationDelay: '0.05s' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white font-display flex items-center gap-2">
                    <RotateCcw className="w-5 h-5 text-amber-400" />
                    退货流程指引
                  </h2>
                  <button
                    onClick={() => setShowReturnGuide(false)}
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    收起
                  </button>
                </div>
                <div className="space-y-3">
                  {returnGuideSteps.map((step, idx) => (
                    <div key={step.step} className="flex gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold',
                        idx < (
                          pkg.returnStatus === 'returned' ? 5 :
                          pkg.returnStatus === 'return_shipped' ? 4 :
                          1
                        ) ? 'bg-emerald-500/20 text-emerald-400' :
                        idx === (
                          pkg.returnStatus === 'returned' ? 4 :
                          pkg.returnStatus === 'return_shipped' ? 3 :
                          0
                        ) ? 'bg-amber-500/20 text-amber-400' :
                        'bg-white/5 text-slate-500'
                      )}>
                        {idx < (
                          pkg.returnStatus === 'returned' ? 5 :
                          pkg.returnStatus === 'return_shipped' ? 4 :
                          1
                        ) ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          step.step
                        )}
                      </div>
                      <div>
                        <p className={cn(
                          'font-medium',
                          idx <= (
                            pkg.returnStatus === 'returned' ? 4 :
                            pkg.returnStatus === 'return_shipped' ? 3 :
                            0
                          ) ? 'text-white' : 'text-slate-500'
                        )}>
                          {step.title}
                        </p>
                        <p className="text-sm text-slate-400">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!showReturnGuide && pkg.returnStatus !== 'none' && (
              <button
                onClick={() => setShowReturnGuide(true)}
                className="w-full glass-card p-4 mb-6 flex items-center justify-between hover:bg-white/5 transition-colors animate-slide-up"
              >
                <div className="flex items-center gap-2 text-amber-400">
                  <RotateCcw className="w-5 h-5" />
                  <span className="font-medium">查看退货流程指引</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>
            )}

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

      {pkg && (
        <UnpackChecklistModal
          isOpen={showUnpackModal}
          onClose={() => setShowUnpackModal(false)}
          pkg={pkg}
          onConfirm={handleUnpackConfirm}
          onNoAccessories={handleNoAccessories}
        />
      )}

      <AccessoryTemplateManager
        isOpen={showTemplateManager}
        onClose={() => setShowTemplateManager(false)}
      />
    </div>
  );
}
