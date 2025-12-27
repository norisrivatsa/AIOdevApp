import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './lib/queryClient';
import { boardsApi } from './lib/api';
import useUIStore from './stores/uiStore';
import useTimerStore from './stores/timerStore';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import useThemeColors from './hooks/useThemeColors';
import BoardContainer from './components/layout/BoardContainer';
import TopBar from './components/layout/TopBar';
import DashboardBoard from './boards/DashboardBoard';
import CalendarBoard from './boards/CalendarBoard';
import AnalyticsBoard from './boards/AnalyticsBoard';
import CreationBoard from './boards/CreationBoard';
import FocusBoard from './boards/FocusBoard';
import ProjectPage from './pages/ProjectPage';

function App() {
  const { currentBoardIndex, boards, setBoards, viewingProjectId } = useUIStore();
  const { loadActiveSession } = useTimerStore();

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Initialize theme colors from config
  useThemeColors();

  // Load boards and active session on mount
  useEffect(() => {
    const loadBoards = async () => {
      try {
        const response = await boardsApi.getAll();
        setBoards(response.data);
      } catch (error) {
        console.error('Failed to load boards:', error);
      }
    };

    loadBoards();
    loadActiveSession();
  }, [setBoards, loadActiveSession]);

  // Board components mapping
  const boardComponents = {
    'Dashboard': <DashboardBoard />,
    'Calendar': <CalendarBoard />,
    'Analytics': <AnalyticsBoard />,
    'Projects & Subjects': <CreationBoard />,
    'Focus': <FocusBoard />,
  };

  const currentBoard = boards[currentBoardIndex];

  // If viewing a specific project page, render that instead of boards
  if (viewingProjectId) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50 dark:bg-black">
          <ProjectPage projectId={viewingProjectId} />
        </div>
        <Toaster position="top-right" />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <TopBar currentBoardName={currentBoard?.name || 'Loading...'} />
        {boards.length > 0 ? (
          <BoardContainer boards={boards}>
            {currentBoard && boardComponents[currentBoard.name]}
          </BoardContainer>
        ) : (
          <div className="flex items-center justify-center h-screen">
            <div className="text-gray-500 dark:text-gray-400">Loading boards...</div>
          </div>
        )}
      </div>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

export default App;
