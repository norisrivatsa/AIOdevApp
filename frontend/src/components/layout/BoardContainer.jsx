import { useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useUIStore from '../../stores/uiStore';

const BoardContainer = ({ children, boards }) => {
  const { currentBoardIndex, nextBoard, prevBoard, setBoards } = useUIStore();

  useEffect(() => {
    if (boards && boards.length > 0) {
      setBoards(boards);
    }
  }, [boards, setBoards]);

  return (
    <div className="relative w-screen overflow-hidden bg-gray-50 dark:bg-black" style={{ height: '95vh' }}>
      {/* Board Content */}
      <div className="w-full overflow-hidden" style={{ height: '90vh' }}>
        {children}
      </div>

      {/* Navigation Footer - Simple arrows only */}
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800" style={{ height: '5vh' }}>
        <div className="flex items-center justify-center gap-32 px-8 h-full">
          {/* Previous Arrow */}
          <button
            onClick={prevBoard}
            disabled={currentBoardIndex === 0}
            className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous board"
          >
            <ChevronLeft size={24} className="text-gray-700 dark:text-white" />
          </button>

          {/* Board indicator dots */}
          <div className="flex items-center gap-2">
            {boards.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentBoardIndex
                    ? 'w-6 bg-gradient-to-r'
                    : 'w-2 bg-gray-300 dark:bg-gray-700'
                }`}
                style={
                  index === currentBoardIndex
                    ? {
                        backgroundImage: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
                      }
                    : {}
                }
              />
            ))}
          </div>

          {/* Next Arrow */}
          <button
            onClick={nextBoard}
            disabled={currentBoardIndex === boards.length - 1}
            className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next board"
          >
            <ChevronRight size={24} className="text-gray-700 dark:text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BoardContainer;
