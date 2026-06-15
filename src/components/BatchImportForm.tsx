import { useState } from 'react';
import { Upload, FileText, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { usePackageStore } from '@/store/usePackageStore';
import { detectCarrier, validateTrackingNumber } from '@/utils/carrierUtils';
import { platforms } from '@/utils/platformUtils';
import type { PackageStatus } from '@/types';
import { cn } from '@/lib/utils';

interface BatchImportFormProps {
  onSuccess?: () => void;
}

interface ParsedTracking {
  trackingNumber: string;
  carrier: string;
  isValid: boolean;
  error?: string;
}

export default function BatchImportForm({ onSuccess }: BatchImportFormProps) {
  const { batchAddPackages } = usePackageStore();
  const [input, setInput] = useState('');
  const [platform, setPlatform] = useState('淘宝');
  const [parsed, setParsed] = useState<ParsedTracking[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [error, setError] = useState('');

  const parseInput = () => {
    setError('');
    
    if (!input.trim()) {
      setError('请输入快递单号');
      return;
    }

    const lines = input
      .split(/[\n,;，；]+/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      setError('未找到有效的快递单号');
      return;
    }

    const parsedTrackings: ParsedTracking[] = lines.map(line => {
      const trackingNumber = line.replace(/\s/g, '');
      const isValid = validateTrackingNumber(trackingNumber);
      
      return {
        trackingNumber,
        carrier: detectCarrier(trackingNumber),
        isValid,
        error: isValid ? undefined : '单号格式不正确',
      };
    });

    setParsed(parsedTrackings);
  };

  const handleImport = async () => {
    const validTrackings = parsed.filter(p => p.isValid);
    
    if (validTrackings.length === 0) {
      setError('没有可导入的有效单号');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const packagesToAdd = validTrackings.map((item, index) => ({
        trackingNumber: item.trackingNumber,
        carrier: item.carrier,
        platform,
        productName: `包裹 ${index + 1}`,
        status: 'shipped' as PackageStatus,
        estimatedArrival: null,
        shippedDate: new Date(),
        deliveredDate: null,
        openedDate: null,
        isOpened: false,
        notes: '',
        parentId: null,
        childIds: [],
      }));

      for (let i = 0; i < packagesToAdd.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setImportProgress(Math.round(((i + 1) / packagesToAdd.length) * 100));
      }

      batchAddPackages(packagesToAdd);
      
      setInput('');
      setParsed([]);
      onSuccess?.();
    } catch {
      setError('导入失败，请重试');
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const validCount = parsed.filter(p => p.isValid).length;
  const invalidCount = parsed.filter(p => !p.isValid).length;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          快递单号列表
        </label>
        <p className="text-xs text-slate-500">
          支持换行、逗号、分号分隔多个单号。例如：
          <br />
          SF1234567890123
          <br />
          JD1234567890123, JT1234567890123
        </p>
        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (parsed.length > 0) setParsed([]);
          }}
          placeholder="粘贴多个快递单号..."
          rows={8}
          className="input-field resize-none font-mono text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">
          统一设置购买平台
        </label>
        <div className="grid grid-cols-4 gap-2">
          {platforms.slice(0, 8).map((p) => (
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

      <button
        onClick={parseInput}
        disabled={!input.trim() || isImporting}
        className="w-full btn-secondary flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Upload className="w-5 h-5" />
        <span>解析单号</span>
      </button>

      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {parsed.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-300">
              共解析到 <span className="text-white font-semibold">{parsed.length}</span> 个单号
              {validCount > 0 && (
                <span className="ml-2 text-emerald-400">
                  <Check className="w-3 h-3 inline mr-1" />
                  {validCount} 个有效
                </span>
              )}
              {invalidCount > 0 && (
                <span className="ml-2 text-red-400">
                  <X className="w-3 h-3 inline mr-1" />
                  {invalidCount} 个无效
                </span>
              )}
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 scrollbar-hide">
            {parsed.map((item, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg',
                  item.isValid ? 'bg-white/5' : 'bg-red-500/10 border border-red-500/20'
                )}
              >
                <div className="flex items-center gap-3">
                  {item.isValid ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <X className="w-4 h-4 text-red-400" />
                  )}
                  <code className="font-mono text-sm text-slate-300">
                    {item.trackingNumber}
                  </code>
                </div>
                <div className="text-sm">
                  {item.isValid ? (
                    <span className="text-slate-400">{item.carrier}</span>
                  ) : (
                    <span className="text-red-400">{item.error}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isImporting && (
            <div className="space-y-2">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              <p className="text-center text-sm text-slate-400">
                正在导入... {importProgress}%
              </p>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={validCount === 0 || isImporting}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>导入中...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>批量导入 {validCount} 个包裹</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
