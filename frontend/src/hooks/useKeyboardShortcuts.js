import { useEffect } from 'react';
import useUIStore from '../stores/uiStore';

const useKeyboardShortcuts = () => {
  const {
    nextBoard,
    prevBoard,
    jumpToBoard,
    openCommandPalette,
    openSettings,
    toggleSidebar,
  } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if user is typing in an input/textarea
      const isTyping = ['INPUT', 'TEXTAREA'].includes(e.target.tagName);

      // Command/Ctrl + K - Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openCommandPalette();
        return;
      }

      // Command/Ctrl + , - Settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        openSettings();
        return;
      }

      // Command/Ctrl + B - Toggle Sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Don't handle other shortcuts if user is typing
      if (isTyping) return;

      // Arrow Right - Next Board
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextBoard();
        return;
      }

      // Arrow Left - Previous Board
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevBoard();
        return;
      }

      // Number keys 1-7 - Jump to board
      const num = parseInt(e.key);
      if (num >= 1 && num <= 7) {
        e.preventDefault();
        jumpToBoard(num - 1);
        return;
      }

      // Escape - Close modals (handled by individual components)
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [nextBoard, prevBoard, jumpToBoard, openCommandPalette, openSettings, toggleSidebar]);
};

export default useKeyboardShortcuts;
