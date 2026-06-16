import { useState } from 'react';
import { FolderKanban, Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { useAccessoryTemplateStore } from '@/store/useAccessoryTemplateStore';
import type { AccessoryTemplate } from '@/types';
import { cn } from '@/lib/utils';

interface AccessoryTemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories = ['电子产品', '出版物', '服饰', '家居', '美妆护肤', '食品零食', '其他'];

export default function AccessoryTemplateManager({
  isOpen,
  onClose,
}: AccessoryTemplateManagerProps) {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useAccessoryTemplateStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: '其他',
    items: '',
  });

  const [editData, setEditData] = useState<{
    name: string;
    category: string;
    items: string;
  } | null>(null);

  const handleAdd = () => {
    if (!newTemplate.name.trim()) return;
    const itemList = newTemplate.items
      .split(/[\n,，、]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (itemList.length === 0) return;

    addTemplate({
      name: newTemplate.name.trim(),
      category: newTemplate.category,
      items: itemList,
    });

    setNewTemplate({ name: '', category: '其他', items: '' });
    setIsAdding(false);
  };

  const startEdit = (template: AccessoryTemplate) => {
    setEditingId(template.id);
    setEditData({
      name: template.name,
      category: template.category,
      items: template.items.join('\n'),
    });
  };

  const saveEdit = () => {
    if (!editingId || !editData) return;
    const itemList = editData.items
      .split(/[\n,，、]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (!editData.name.trim() || itemList.length === 0) return;

    updateTemplate(editingId, {
      name: editData.name.trim(),
      category: editData.category,
      items: itemList,
    });

    setEditingId(null);
    setEditData(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个模板吗？此操作不可恢复。')) {
      deleteTemplate(id);
      if (expandedId === id) setExpandedId(null);
      if (editingId === id) {
        setEditingId(null);
        setEditData(null);
      }
    }
  };

  if (!isOpen) return null;

  const groupedTemplates = templates.reduce<Record<string, AccessoryTemplate[]>>((acc, tpl) => {
    if (!acc[tpl.category]) acc[tpl.category] = [];
    acc[tpl.category].push(tpl);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[85vh] overflow-hidden glass-card flex flex-col animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-500/20">
              <FolderKanban className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white font-display">配件核对模板管理</h2>
              <p className="text-sm text-slate-400">共 {templates.length} 个模板</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full p-4 border-2 border-dashed border-white/20 rounded-xl text-slate-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>新建模板</span>
            </button>
          )}

          {isAdding && (
            <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-emerald-400">新建模板</h3>
                <button
                  onClick={() => setIsAdding(false)}
                  className="p-1 rounded hover:bg-white/10 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="模板名称，如：平板电脑"
                    className="flex-1 input-field text-sm"
                  />
                  <select
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                    className="input-field text-sm w-32 bg-slate-900"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">配件项（每行一个，或用逗号、顿号分隔）</label>
                  <textarea
                    value={newTemplate.items}
                    onChange={(e) => setNewTemplate({ ...newTemplate, items: e.target.value })}
                    placeholder={'例如：\n充电器\n数据线\n说明书\n保修卡'}
                    rows={4}
                    className="input-field text-sm resize-none font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 transition-colors text-sm"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={!newTemplate.name.trim() || !newTemplate.items.trim()}
                    className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    创建
                  </button>
                </div>
              </div>
            </div>
          )}

          {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider px-1">
                {category} ({categoryTemplates.length})
              </h3>
              <div className="space-y-2">
                {categoryTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={cn(
                      'rounded-xl border transition-all overflow-hidden',
                      editingId === template.id
                        ? 'bg-blue-500/5 border-blue-500/30'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    )}
                  >
                    {editingId === template.id && editData ? (
                      <div className="p-4 space-y-3">
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            placeholder="模板名称"
                            className="flex-1 input-field text-sm"
                          />
                          <select
                            value={editData.category}
                            onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                            className="input-field text-sm w-32 bg-slate-900"
                          >
                            {categories.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        <textarea
                          value={editData.items}
                          onChange={(e) => setEditData({ ...editData, items: e.target.value })}
                          placeholder="配件项（每行一个）"
                          rows={4}
                          className="input-field text-sm resize-none font-mono"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1.5 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 transition-colors text-xs"
                          >
                            取消
                          </button>
                          <button
                            onClick={saveEdit}
                            disabled={!editData.name.trim() || !editData.items.trim()}
                            className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            保存
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
                          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <GripVertical className="w-4 h-4 text-slate-600" />
                            <div>
                              <p className="text-sm font-medium text-white">{template.name}</p>
                              <p className="text-xs text-slate-500">
                                {template.items.length} 个配件项 · 使用 {template.usageCount} 次
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEdit(template);
                              }}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-blue-400 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(template.id);
                              }}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            {expandedId === template.id ? (
                              <ChevronUp className="w-4 h-4 text-slate-400 ml-1" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
                            )}
                          </div>
                        </button>
                        {expandedId === template.id && (
                          <div className="px-4 pb-4 pt-0">
                            <div className="p-3 bg-black/20 rounded-lg">
                              <div className="flex flex-wrap gap-2">
                                {template.items.map((item, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2.5 py-1 bg-white/5 text-slate-300 text-xs rounded-md"
                                  >
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {templates.length === 0 && !isAdding && (
            <div className="text-center py-12 text-slate-500">
              <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>暂无模板，点击上方按钮创建</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-6 py-2.5 btn-primary font-medium"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
}
