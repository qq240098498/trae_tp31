import { useState, useMemo } from 'react';
import { PackageOpen, Save, Sparkles, Check, FolderKanban, ChevronDown, ChevronUp } from 'lucide-react';
import type { Package, AccessoryChecklist as AccessoryChecklistType, AccessoryTemplate } from '@/types';
import { useAccessoryTemplateStore } from '@/store/useAccessoryTemplateStore';
import { createChecklistFromItems } from '@/store/usePackageStore';
import AccessoryChecklist from './AccessoryChecklist';
import AccessoryTemplateManager from './AccessoryTemplateManager';
import { cn } from '@/lib/utils';

interface UnpackChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: Package;
  onConfirm: (checklist: AccessoryChecklistType) => void;
}

export default function UnpackChecklistModal({
  isOpen,
  onClose,
  pkg,
  onConfirm,
}: UnpackChecklistModalProps) {
  const { templates, getSuggestedTemplates, addTemplate, incrementUsage } = useAccessoryTemplateStore();
  const [checklist, setChecklist] = useState<AccessoryChecklistType>(() => {
    if (pkg.accessoryChecklist && pkg.accessoryChecklist.items.length > 0) {
      return pkg.accessoryChecklist;
    }
    return {
      items: [],
      templateId: null,
      completed: false,
      completedAt: null,
    };
  });
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('其他');
  const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false);

  const suggestedTemplates = useMemo(() => {
    return getSuggestedTemplates(pkg.productName);
  }, [pkg.productName, getSuggestedTemplates]);

  const otherTemplates = useMemo(() => {
    const suggestedIds = new Set(suggestedTemplates.map((t) => t.id));
    return templates.filter((t) => !suggestedIds.has(t.id));
  }, [templates, suggestedTemplates]);

  const applyTemplate = (template: AccessoryTemplate) => {
    const newChecklist = createChecklistFromItems(template.items, template.id);
    setChecklist(newChecklist);
    incrementUsage(template.id);
  };

  const handleSaveAsTemplate = () => {
    if (!newTemplateName.trim() || checklist.items.length === 0) return;
    const itemNames = checklist.items.map((item) => item.name);
    addTemplate({
      name: newTemplateName.trim(),
      category: newTemplateCategory,
      items: itemNames,
    });
    setNewTemplateName('');
    setShowSaveAsTemplate(false);
    setShowAllTemplates(true);
  };

  const handleConfirm = () => {
    const completedChecklist: AccessoryChecklistType = {
      ...checklist,
      completed: true,
      completedAt: new Date(),
    };
    onConfirm(completedChecklist);
    onClose();
  };

  if (!isOpen) return null;

  const categories = ['电子产品', '出版物', '服饰', '家居', '美妆护肤', '食品零食', '其他'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden glass-card flex flex-col animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-500/20">
              <PackageOpen className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white font-display">赠品/配件核对清单</h2>
              <p className="text-sm text-slate-400">{pkg.productName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <FolderKanban className="w-4 h-4" />
                选择核对模板
                <span className="text-slate-500 font-normal">(可选，快速复用)</span>
              </label>
              <button
                onClick={() => setShowTemplateManager(true)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                管理模板
              </button>
            </div>

            {suggestedTemplates.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  智能推荐（基于商品名称）
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => applyTemplate(template)}
                      className={cn(
                        'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                        checklist.templateId === template.id
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                      )}
                    >
                      {template.name}
                      <span className="ml-1.5 text-xs opacity-70">({template.items.length}项)</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(otherTemplates.length > 0 || showAllTemplates) && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowAllTemplates(!showAllTemplates)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  {showAllTemplates ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      收起全部模板
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      展开全部模板 ({otherTemplates.length})
                    </>
                  )}
                </button>
                {showAllTemplates && otherTemplates.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {otherTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => applyTemplate(template)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                          checklist.templateId === template.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white'
                        )}
                      >
                        {template.name}
                        <span className="ml-1 opacity-60">({template.items.length})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Check className="w-4 h-4" />
                核对清单
              </label>
              {checklist.items.length > 0 && (
                <button
                  onClick={() => setShowSaveAsTemplate(!showSaveAsTemplate)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  保存为模板
                </button>
              )}
            </div>

            {showSaveAsTemplate && checklist.items.length > 0 && (
              <div className="mb-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-3">
                <p className="text-xs text-emerald-400">将当前 {checklist.items.length} 个配件项保存为新模板，以便下次复用</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="模板名称，如：智能手表"
                    className="flex-1 input-field text-sm"
                  />
                  <select
                    value={newTemplateCategory}
                    onChange={(e) => setNewTemplateCategory(e.target.value)}
                    className="input-field text-sm w-32 bg-slate-900"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleSaveAsTemplate}
                    disabled={!newTemplateName.trim()}
                    className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    保存
                  </button>
                </div>
              </div>
            )}

            <AccessoryChecklist checklist={checklist} onChange={setChecklist} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white/5 text-slate-300 rounded-xl hover:bg-white/10 transition-colors font-medium"
          >
            跳过核对
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2.5 btn-primary flex items-center gap-2 font-medium"
          >
            <PackageOpen className="w-5 h-5" />
            完成拆包
          </button>
        </div>
      </div>

      {showTemplateManager && (
        <AccessoryTemplateManager
          isOpen={showTemplateManager}
          onClose={() => setShowTemplateManager(false)}
        />
      )}
    </div>
  );
}
