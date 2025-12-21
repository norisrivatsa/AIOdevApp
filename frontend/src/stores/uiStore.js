import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUIStore = create(
  persist(
    (set, get) => ({
      // Current board index
      currentBoardIndex: 0,
      boards: [],

      // Modals
      isCommandPaletteOpen: false,
      isSettingsOpen: false,
      isCourseModalOpen: false,
      isProjectModalOpen: false,
      isSessionModalOpen: false,

      // Edit Mode for customization
      isEditMode: false,

      // Sidebar
      isSidebarCollapsed: false,

      // Selected items for editing
      selectedCourseId: null,
      selectedProjectId: null,
      selectedSessionId: null,

      // Actions
      setCurrentBoardIndex: (index) => set({ currentBoardIndex: index }),

      nextBoard: () =>
        set((state) => ({
          currentBoardIndex:
            state.currentBoardIndex < state.boards.length - 1
              ? state.currentBoardIndex + 1
              : state.currentBoardIndex,
        })),

      prevBoard: () =>
        set((state) => ({
          currentBoardIndex:
            state.currentBoardIndex > 0
              ? state.currentBoardIndex - 1
              : state.currentBoardIndex,
        })),

      jumpToBoard: (index) =>
        set((state) => ({
          currentBoardIndex:
            index >= 0 && index < state.boards.length ? index : state.currentBoardIndex,
        })),

      setBoards: (boards) => set({ boards }),

      // Modal actions
      openCommandPalette: () => set({ isCommandPaletteOpen: true }),
      closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
      toggleCommandPalette: () =>
        set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),

      openSettings: () => set({ isSettingsOpen: true }),
      closeSettings: () => set({ isSettingsOpen: false }),

      toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
      enableEditMode: () => set({ isEditMode: true }),
      disableEditMode: () => set({ isEditMode: false }),

      openCourseModal: (courseId = null) =>
        set({ isCourseModalOpen: true, selectedCourseId: courseId }),
      closeCourseModal: () =>
        set({ isCourseModalOpen: false, selectedCourseId: null }),

      openProjectModal: (projectId = null) =>
        set({ isProjectModalOpen: true, selectedProjectId: projectId }),
      closeProjectModal: () =>
        set({ isProjectModalOpen: false, selectedProjectId: null }),

      openSessionModal: (sessionId = null) =>
        set({ isSessionModalOpen: true, selectedSessionId: sessionId }),
      closeSessionModal: () =>
        set({ isSessionModalOpen: false, selectedSessionId: null }),

      // Sidebar
      toggleSidebar: () =>
        set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        currentBoardIndex: state.currentBoardIndex,
        isSidebarCollapsed: state.isSidebarCollapsed,
        isEditMode: state.isEditMode,
      }),
    }
  )
);

export default useUIStore;
