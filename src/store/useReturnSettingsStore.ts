import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ReturnSettings } from '@/types';
import { platforms, getPlatformDefaultReturnDays } from '@/utils/platformUtils';

function getDefaultPlatformReturnDays(): Record<string, number> {
  const result: Record<string, number> = {};
  platforms.forEach((p) => {
    result[p.name] = p.defaultReturnDays || 7;
  });
  return result;
}

interface ReturnSettingsStore extends ReturnSettings {
  setPlatformReturnDays: (platform: string, days: number) => void;
  setRemindersEnabled: (enabled: boolean) => void;
  setReminderDaysBefore: (days: number[]) => void;
  getReturnDaysForPlatform: (platform: string) => number;
  resetToDefaults: () => void;
}

export const useReturnSettingsStore = create<ReturnSettingsStore>()(
  persist(
    (set, get) => ({
      platformReturnDays: getDefaultPlatformReturnDays(),
      remindersEnabled: true,
      reminderDaysBefore: [2, 1],

      setPlatformReturnDays: (platform, days) => {
        set((state) => ({
          platformReturnDays: {
            ...state.platformReturnDays,
            [platform]: Math.max(1, Math.min(365, days)),
          },
        }));
      },

      setRemindersEnabled: (enabled) => {
        set({ remindersEnabled: enabled });
      },

      setReminderDaysBefore: (days) => {
        set({ reminderDaysBefore: days.sort((a, b) => b - a) });
      },

      getReturnDaysForPlatform: (platform) => {
        const { platformReturnDays } = get();
        return platformReturnDays[platform] || getPlatformDefaultReturnDays(platform);
      },

      resetToDefaults: () => {
        set({
          platformReturnDays: getDefaultPlatformReturnDays(),
          remindersEnabled: true,
          reminderDaysBefore: [2, 1],
        });
      },
    }),
    {
      name: 'return-settings-storage',
    }
  )
);
