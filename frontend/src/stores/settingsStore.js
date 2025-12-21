import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { THEME } from '../utils/constants';

const useSettingsStore = create(
  persist(
    (set) => ({
      // Theme
      theme: THEME.DARK,

      // Settings
      idleThreshold: 5,
      autoSaveInterval: 30,
      defaultBoard: null,

      // Actions
      setTheme: (theme) => {
        set({ theme });
        // Update document class for Tailwind dark mode
        if (theme === THEME.DARK) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === THEME.DARK ? THEME.LIGHT : THEME.DARK;
          if (newTheme === THEME.DARK) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { theme: newTheme };
        }),

      setIdleThreshold: (threshold) => set({ idleThreshold: threshold }),
      setAutoSaveInterval: (interval) => set({ autoSaveInterval: interval }),
      setDefaultBoard: (boardId) => set({ defaultBoard: boardId }),

      updateSettings: (settings) => set(settings),
    }),
    {
      name: 'settings-storage',
      onRehydrateStorage: () => (state) => {
        // Apply theme on initial load
        if (state?.theme === THEME.DARK) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
    }
  )
);

export default useSettingsStore;
