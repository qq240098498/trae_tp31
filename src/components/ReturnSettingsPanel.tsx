import { useState } from 'react';
import { Settings, RotateCcw, Bell, BellOff, Clock, Check, X } from 'lucide-react';
import { useReturnSettingsStore } from '@/store/useReturnSettingsStore';
import { platforms } from '@/utils/platformUtils';
import { cn } from '@/lib/utils';

interface ReturnSettingsPanelProps {
  onClose?: () => void;
}

export default function ReturnSettingsPanel({ onClose }: ReturnSettingsPanelProps) {
  const {
    platformReturnDays,
    remindersEnabled,
    reminderDaysBefore,
    setPlatformReturnDays,
    setRemindersEnabled,
    setReminderDaysBefore,
    resetToDefaults,
  } = useReturnSettingsStore();

  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleStartEdit = (platform: string) => {
    setEditingPlatform(platform);
    setEditValue(String(platformReturnDays[platform] || 7));
  };

  const handleSaveEdit = (platform: string) => {
    const days = parseInt(editValue, 10);
    if (!isNaN(days) && days >= 1 && days <= 365) {
      setPlatformReturnDays(platform, days);
    }
    setEditingPlatform(null);
  };

  const handleCancelEdit = () => {
    setEditingPlatform(null);
  };

  const toggleReminderDay = (day: number) => {
    const currentDays = [...reminderDaysBefore];
    const index = currentDays.indexOf(day);
    if (index > -1) {
      currentDays.splice(index, 1);
    } else {
      currentDays.push(day);
    }
    setReminderDaysBefore(currentDays);
  };

  const handleReset = () => {
    if (confirm('确定要恢复默认设置吗？')) {
      resetToDefaults();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/20">
            <Settings className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">退货倒计时设置</h3>
            <p className="text-sm text-slate-400">配置各平台的退货期限和提醒规则</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-500/20 text-slate-400 rounded-lg hover:bg-slate-500/30 hover:text-slate-300 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>恢复默认</span>
        </button>
      </div>

      <div className="glass-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-xl',
              remindersEnabled ? 'bg-emerald-500/20' : 'bg-slate-500/20'
            )}>
              {remindersEnabled ? (
                <Bell className="w-5 h-5 text-emerald-400" />
              ) : (
                <BellOff className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div>
              <h4 className="font-medium text-white">退货提醒</h4>
              <p className="text-sm text-slate-400">到期前推送提醒，避免错过退货期</p>
            </div>
          </div>
          <button
            onClick={() => setRemindersEnabled(!remindersEnabled)}
            className={cn(
              'relative w-12 h-6 rounded-full transition-colors',
              remindersEnabled ? 'bg-emerald-500' : 'bg-slate-600'
            )}
          >
            <div className={cn(
              'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
              remindersEnabled ? 'translate-x-7' : 'translate-x-1'
            )} />
          </button>
        </div>

        {remindersEnabled && (
          <div className="pl-14 space-y-2">
            <p className="text-sm text-slate-400">提醒时机（到期前）</p>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 5, 7].map((day) => (
                <button
                  key={day}
                  onClick={() => toggleReminderDay(day)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-lg transition-all',
                    reminderDaysBefore.includes(day)
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  )}
                >
                  {day}天前
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="glass-card p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h4 className="font-medium text-white">各平台退货期限</h4>
            <p className="text-sm text-slate-400">从签收日期开始计算</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {platforms.map((platform) => (
            <div
              key={platform.name}
              className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: platform.color }}
                />
                <span className="text-sm text-white">{platform.name}</span>
              </div>
              
              {editingPlatform === platform.name ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(platform.name);
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    className="w-16 px-2 py-1 text-sm bg-white/10 border border-white/20 rounded-lg text-white text-center focus:outline-none focus:border-blue-500"
                    min={1}
                    max={365}
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveEdit(platform.name)}
                    className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleStartEdit(platform.name)}
                  className="flex items-center gap-1 px-2 py-1 text-sm bg-white/5 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <span>{platformReturnDays[platform.name] || platform.defaultReturnDays || 7}</span>
                  <span className="text-slate-500">天</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="w-full btn-secondary"
        >
          关闭
        </button>
      )}
    </div>
  );
}
