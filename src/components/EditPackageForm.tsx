import { useState, useEffect } from 'react';
import { Search, Package as PackageIcon, ShoppingBag, Calendar, FileText, Loader2, Check } from 'lucide-react';
import { usePackageStore } from '@/store/usePackageStore';
import { detectCarrier, validateTrackingNumber } from '@/utils/carrierUtils';
import { platforms } from '@/utils/platformUtils';
import { formatDate } from '@/utils/statusUtils';
import type { Package } from '@/types';
import { cn } from '@/lib/utils';

interface EditPackageFormProps {
  pkg: Package;
  onSuccess?: () => void;
}

export default function EditPackageForm({ pkg, onSuccess }: EditPackageFormProps) {
  const { updatePackage } = usePackageStore();
  const [trackingNumber, setTrackingNumber] = useState(pkg.trackingNumber);
  const [platform, setPlatform] = useState(pkg.platform);
  const [productName, setProductName] = useState(pkg.productName);
  const [estimatedDate, setEstimatedDate] = useState(pkg.estimatedArrival 
    ? new Date(pkg.estimatedArrival).toISOString().split('T')[0] 
    : '');
  const [notes, setNotes] = useState(pkg.notes);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const detectedCarrier = trackingNumber ? detectCarrier(trackingNumber) : '';
  const isValidTracking = trackingNumber ? validateTrackingNumber(trackingNumber) : true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!productName.trim()) {
        setError('请输入商品名称');
        setIsSubmitting(false);
        return;
      }

      if (trackingNumber.trim() && !validateTrackingNumber(trackingNumber)) {
        setError('快递单号格式不正确');
        setIsSubmitting(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      updatePackage(pkg.id, {
        trackingNumber: trackingNumber.trim(),
        carrier: trackingNumber.trim() ? detectCarrier(trackingNumber) : '',
        platform,
        productName: productName.trim(),
        estimatedArrival: estimatedDate ? new Date(estimatedDate) : null,
        notes: notes.trim(),
      });

      onSuccess?.();
    } catch {
      setError('保存失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="p-4 bg-slate-500/10 rounded-xl border border-slate-500/20">
        <p className="text-xs text-slate-400">创建时间：{formatDate(pkg.createdAt)}</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Search className="w-4 h-4" />
          快递单号
          <span className="text-slate-500 font-normal">(可选)</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="输入快递单号，支持顺丰、京东、圆通等"
            className={cn(
              'input-field font-mono',
              trackingNumber && !isValidTracking && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
            )}
          />
          {trackingNumber && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              {detectedCarrier}
            </div>
          )}
        </div>
        {trackingNumber && !isValidTracking && (
          <p className="text-xs text-red-400">单号格式不正确，请检查</p>
        )}
        {trackingNumber && isValidTracking && detectedCarrier && (
          <p className="text-xs text-emerald-400 flex items-center gap-1">
            <PackageIcon className="w-3 h-3" />
            识别为：{detectedCarrier}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" />
          购买平台
        </label>
        <div className="grid grid-cols-4 gap-2">
          {platforms.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => setPlatform(p.name)}
              className={cn(
                'py-2 px-3 rounded-lg text-xs font-medium transition-all truncate',
                platform === p.name
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10 hover:text-white'
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <PackageIcon className="w-4 h-4" />
          商品名称
        </label>
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="例如：iPhone 15 Pro"
          className="input-field"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          预计到货日期
          <span className="text-slate-500 font-normal">(可选)</span>
        </label>
        <input
          type="date"
          value={estimatedDate}
          onChange={(e) => setEstimatedDate(e.target.value)}
          className="input-field"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          备注
          <span className="text-slate-500 font-normal">(可选)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="添加备注信息..."
          rows={2}
          className="input-field resize-none"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>保存中...</span>
          </>
        ) : (
          <>
            <Check className="w-5 h-5" />
            <span>保存修改</span>
          </>
        )}
      </button>
    </form>
  );
}
