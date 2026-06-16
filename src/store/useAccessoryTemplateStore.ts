import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AccessoryTemplate, AccessoryTemplateStore } from '@/types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function reviveTemplate(tpl: AccessoryTemplate): AccessoryTemplate {
  return {
    ...tpl,
    createdAt: new Date(tpl.createdAt),
    updatedAt: new Date(tpl.updatedAt),
  };
}

const defaultTemplates: AccessoryTemplate[] = [
  {
    id: generateId(),
    name: '智能手机',
    category: '电子产品',
    items: ['手机本体', '充电器', '数据线', '保修卡', '说明书', '取卡针', '耳机（如有）'],
    createdAt: new Date(),
    updatedAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: '笔记本电脑',
    category: '电子产品',
    items: ['电脑本体', '电源适配器', '电源线', '保修卡', '说明书', '驱动光盘/U盘'],
    createdAt: new Date(),
    updatedAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: '耳机',
    category: '电子产品',
    items: ['耳机本体', '充电盒（如有）', '充电线', '备用耳塞', '保修卡', '说明书'],
    createdAt: new Date(),
    updatedAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: '图书',
    category: '出版物',
    items: ['书籍本体', '书签（如有）', '腰封/护封', '附赠光盘/配件'],
    createdAt: new Date(),
    updatedAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId(),
    name: '衣物',
    category: '服饰',
    items: ['商品本体', '吊牌', '备用纽扣', '洗涤说明'],
    createdAt: new Date(),
    updatedAt: new Date(),
    usageCount: 0,
  },
];

const categoryKeywords: Record<string, string[]> = {
  '电子产品': ['手机', '电脑', '笔记本', '平板', '耳机', '相机', '键盘', '鼠标', '手表', '手环', '充电器', '电源'],
  '出版物': ['书', '图书', '小说', '教材', '杂志', '画册'],
  '服饰': ['衣服', 'T恤', '裤子', '裙子', '外套', '鞋', '袜', '帽', '包'],
  '家居': ['收纳', '清洁', '厨房', '餐具', '床上', '灯具'],
  '美妆护肤': ['护肤', '化妆', '面膜', '精华', '口红', '香水'],
  '食品零食': ['零食', '食品', '饮料', '茶叶', '咖啡'],
};

export const useAccessoryTemplateStore = create<AccessoryTemplateStore>()(
  persist(
    (set, get) => ({
      templates: defaultTemplates,

      addTemplate: (templateData) => {
        const now = new Date();
        const newTemplate: AccessoryTemplate = {
          id: generateId(),
          ...templateData,
          createdAt: now,
          updatedAt: now,
          usageCount: 0,
        };
        set((state) => ({
          templates: [...state.templates, newTemplate],
        }));
        return newTemplate;
      },

      updateTemplate: (id, updates) => {
        set((state) => ({
          templates: state.templates.map((tpl) =>
            tpl.id === id ? { ...tpl, ...updates, updatedAt: new Date() } : tpl
          ),
        }));
      },

      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((tpl) => tpl.id !== id),
        }));
      },

      incrementUsage: (id) => {
        set((state) => ({
          templates: state.templates.map((tpl) =>
            tpl.id === id ? { ...tpl, usageCount: tpl.usageCount + 1, updatedAt: new Date() } : tpl
          ),
        }));
      },

      getSuggestedTemplates: (productName) => {
        const { templates } = get();
        const lowerName = productName.toLowerCase();

        const scored = templates.map((tpl) => {
          let score = 0;

          if (lowerName.includes(tpl.name.toLowerCase())) {
            score += 100;
          }

          const keywords = categoryKeywords[tpl.category] || [];
          keywords.forEach((keyword) => {
            if (lowerName.includes(keyword)) {
              score += 50;
            }
          });

          tpl.items.forEach((item) => {
            if (lowerName.includes(item.toLowerCase())) {
              score += 20;
            }
          });

          score += tpl.usageCount * 2;

          return { template: tpl, score };
        });

        return scored
          .filter((s) => s.score > 0)
          .sort((a, b) => b.score - a.score)
          .map((s) => s.template);
      },
    }),
    {
      name: 'accessory-template-storage',
      partialize: (state) => ({
        templates: state.templates,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.templates = state.templates.map(reviveTemplate);
        }
      },
    }
  )
);
