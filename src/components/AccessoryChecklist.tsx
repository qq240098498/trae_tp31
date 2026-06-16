import { useState } from 'react';
import { Check, Plus, X, MessageSquare, Trash2, AlertTriangle } from 'lucide-react';
import type { AccessoryChecklist as AccessoryChecklistType, AccessoryItem } from '@/types';
import { cn } from '@/lib/utils';

interface AccessoryChecklistProps {
  checklist: AccessoryChecklistType;
  onChange: (checklist: AccessoryChecklistType) => void;
  readOnly?: boolean;
  compact?: boolean;
}

function generateItemId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export default function AccessoryChecklist({
  checklist,
  onChange,
  readOnly = false,
  compact = false,
}: AccessoryChecklistProps) {
  const [newItemName, setNewItemName] = useState('');
  const [expandedRemarkId, setExpandedRemarkId] = useState<string | null>(null);

  const checkedCount = checklist.items.filter((item) => item.checked).length;
  const totalCount = checklist.items.length;
  const missingCount = checklist.items.filter((item) => !item.checked).length;
  const hasRemarks = checklist.items.some((item) => item.remark?.trim());

  const toggleItem = (itemId: string) => {
    if (readOnly) return;
    const updatedItems = checklist.items.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    onChange({
      ...checklist,
      items: updatedItems,
    });
  };

  const updateRemark = (itemId: string, remark: string) => {
    if (readOnly) return;
    const updatedItems = checklist.items.map((item) =>
      item.id === itemId ? { ...item, remark } : item
    );
    onChange({
      ...checklist,
      items: updatedItems,
    });
  };

  const addItem = () => {
    if (!newItemName.trim() || readOnly) return;
    const newItem: AccessoryItem = {
      id: generateItemId(),
      name: newItemName.trim(),
      checked: false,
      remark: '',
    };
    onChange({
      ...checklist,
      items: [...checklist.items, newItem],
    });
    setNewItemName('');
  };

  const removeItem = (itemId: string) => {
    if (readOnly) return;
    onChange({
      ...checklist,
      items: checklist.items.filter((item) => item.id !== itemId),
    });
    if (expandedRemarkId === itemId) {
      setExpandedRemarkId(null);
    }
  };

  if (totalCount === 0 && readOnly) {
    return (
      <div className="text-center py-6 text-slate-500 text-sm">
        暂无配件核对清单
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!compact && totalCount > 0 && (
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-slate-400">核对进度：</span>
              <span className={cn(
                'font-semibold ml-1',
                missingCount === 0 ? 'text-emerald-400' : 'text-amber-400'
              )}>
                {checkedCount}/{totalCount}
              </span>
            </div>
            {missingCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{missingCount} 项待确认</span>
              </div>
            )}
            {missingCount === 0 && totalCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>全部核对完成</span>
              </div>
            )}
            {hasRemarks && (
              <div className="flex items-center gap-1 text-xs text-blue-400">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>有备注</span>
              </div>
            )}
          </div>
          {!readOnly && (
            <div className="text-xs text-slate-500">
              点击勾选确认
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        {checklist.items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'group p-3 rounded-xl border transition-all',
              item.checked
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : 'bg-white/5 border-white/10 hover:border-white/20'
            )}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                disabled={readOnly}
                className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
                  item.checked
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-white/30 hover:border-white/50',
                  readOnly && 'cursor-default'
                )}
              >
                {item.checked && <Check className="w-3.5 h-3.5 text-white" />}
              </button>

              <span className={cn(
                'flex-1 text-sm transition-all',
                item.checked ? 'text-slate-400 line-through' : 'text-white'
              )}>
                {item.name}
              </span>

              {!readOnly && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => setExpandedRemarkId(expandedRemarkId === item.id ? null : item.id)}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      item.remark?.trim()
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'hover:bg-white/10 text-slate-400 hover:text-white'
                    )}
                    title="添加备注"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                    title="删除此项"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {readOnly && item.remark?.trim() && (
                <button
                  type="button"
                  onClick={() => setExpandedRemarkId(expandedRemarkId === item.id ? null : item.id)}
                  className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400"
                  title="查看备注"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              )}
            </div>

            {expandedRemarkId === item.id && (
              <div className="mt-3 pl-8">
                {readOnly ? (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-xs text-blue-400 mb-1">备注</p>
                    <p className="text-sm text-slate-300">{item.remark}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={item.remark || ''}
                      onChange={(e) => updateRemark(item.id, e.target.value)}
                      placeholder="添加备注，例如：联系客服补发"
                      rows={2}
                      className="input-field text-sm resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateRemark(item.id, '联系客服补发')}
                        className="text-xs px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                      >
                        快捷：联系客服补发
                      </button>
                      <button
                        type="button"
                        onClick={() => updateRemark(item.id, '商家漏发')}
                        className="text-xs px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors"
                      >
                        快捷：商家漏发
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedRemarkId(null)}
                        className="text-xs px-3 py-1.5 bg-white/5 text-slate-400 rounded-lg hover:bg-white/10 transition-colors ml-auto"
                      >
                        收起
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {!readOnly && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addItem();
              }
            }}
            placeholder="添加配件项，如：充电器、保修卡..."
            className="flex-1 input-field text-sm"
          />
          <button
            type="button"
            onClick={addItem}
            disabled={!newItemName.trim()}
            className="px-4 py-2.5 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>添加</span>
          </button>
        </div>
      )}
    </div>
  );
}
