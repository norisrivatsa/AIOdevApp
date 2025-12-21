import { QueryClient } from '@tanstack/react-query';

// Create a query client with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds
      cacheTime: 300000, // 5 minutes
    },
    mutations: {
      retry: 0,
    },
  },
});

// Query keys for consistency
export const queryKeys = {
  courses: {
    all: ['courses'],
    byId: (id) => ['courses', id],
    byStatus: (status) => ['courses', { status }],
  },
  projects: {
    all: ['projects'],
    byId: (id) => ['projects', id],
    byStatus: (status) => ['projects', { status }],
  },
  sessions: {
    all: ['sessions'],
    byId: (id) => ['sessions', id],
    active: ['sessions', 'active'],
    stats: ['sessions', 'stats'],
  },
  boards: {
    all: ['boards'],
    byId: (id) => ['boards', id],
  },
  settings: ['settings'],
  analytics: {
    timeSummary: (period) => ['analytics', 'time-summary', period],
    distribution: (days) => ['analytics', 'distribution', days],
    streaks: ['analytics', 'streaks'],
    progress: ['analytics', 'progress'],
    dailyActivity: (days) => ['analytics', 'daily-activity', days],
  },
  uiCustomization: {
    all: ['ui-customization'],
    byBoard: (boardId) => ['ui-customization', 'board', boardId],
  },
};
