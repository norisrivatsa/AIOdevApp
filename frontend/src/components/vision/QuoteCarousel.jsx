import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Settings, X } from 'lucide-react';
import { useVisionQuotes } from '../../hooks/useVisionBoard';
import Button from '../ui/Button';

const QuoteCarousel = ({ onManageQuotes, isEditMode, onRemove }) => {
  const { data: quotes = [], isLoading } = useVisionQuotes();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseTimer, setPauseTimer] = useState(null);

  // Get the current quote
  const currentQuote = quotes[currentIndex] || null;

  // Calculate font size based on quote length
  const getFontSize = (text) => {
    if (!text) return '1.25rem';
    const length = text.length;
    if (length < 50) return '1.5rem';
    if (length < 100) return '1.25rem';
    if (length < 150) return '1.1rem';
    if (length < 200) return '1rem';
    return '0.9rem';
  };

  // Auto-advance carousel
  const goToNext = useCallback(() => {
    if (quotes.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % quotes.length);
    }
  }, [quotes.length]);

  const goToPrevious = () => {
    if (quotes.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + quotes.length) % quotes.length);
    }
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const handleManualNavigation = (action) => {
    // Pause auto-rotation for 30 seconds on manual navigation
    setIsPaused(true);
    action();

    // Clear existing pause timer
    if (pauseTimer) {
      clearTimeout(pauseTimer);
    }

    // Set new pause timer
    const timer = setTimeout(() => {
      setIsPaused(false);
      setPauseTimer(null);
    }, 30000);

    setPauseTimer(timer);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    if (pauseTimer) {
      clearTimeout(pauseTimer);
      setPauseTimer(null);
    }
  };

  // Auto-rotation effect
  useEffect(() => {
    if (isPaused || quotes.length <= 1) return;

    const interval = setInterval(goToNext, 5000);

    return () => clearInterval(interval);
  }, [isPaused, quotes.length, goToNext]);

  // Cleanup pause timer on unmount
  useEffect(() => {
    return () => {
      if (pauseTimer) {
        clearTimeout(pauseTimer);
      }
    };
  }, [pauseTimer]);

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 animate-pulse">
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!quotes || quotes.length === 0) {
    return (
      <div className="w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No quotes yet. Add some inspirational quotes to get started!
          </p>
          {onManageQuotes && (
            <Button size="sm" variant="primary" onClick={onManageQuotes}>
              <Settings size={16} />
              Add Quotes
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative group">
      {/* Main Quote Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 relative overflow-hidden min-h-[200px] flex flex-col justify-center">
        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex gap-2">
          {/* Remove Button (only in edit mode) */}
          {isEditMode && onRemove && (
            <button
              onClick={onRemove}
              className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors bg-white dark:bg-gray-900 rounded-full shadow-md"
              title="Remove quotes card"
            >
              <X size={16} />
            </button>
          )}

          {/* Settings Button */}
          {onManageQuotes && (
            <button
              onClick={onManageQuotes}
              className={`p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ${
                isEditMode ? 'opacity-100 bg-white dark:bg-gray-900 rounded-full shadow-md' : 'opacity-0 group-hover:opacity-100'
              }`}
              title="Manage quotes"
            >
              <Settings size={16} />
            </button>
          )}
        </div>

        {/* Quote Text */}
        <div className="text-center animate-fade-in">
          <p
            className="italic text-gray-800 dark:text-gray-200 leading-relaxed mb-4"
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: getFontSize(currentQuote?.quoteText),
            }}
          >
            "{currentQuote?.quoteText}"
          </p>

          {/* Author */}
          {currentQuote?.author && (
            <p className="text-sm text-gray-600 dark:text-gray-400 text-right">
              — {currentQuote.author}
            </p>
          )}
        </div>

        {/* Dot Indicators */}
        {quotes.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {quotes.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  handleManualNavigation(() => goToSlide(index));
                }}
                style={{
                  background: index === currentIndex
                    ? 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)'
                    : undefined
                }}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-6'
                    : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
                title={`Go to quote ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Navigation Controls (visible on hover) */}
      {quotes.length > 1 && (
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <button
            onClick={() => handleManualNavigation(goToPrevious)}
            className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors pointer-events-auto"
            title="Previous quote"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            onClick={() => handleManualNavigation(goToNext)}
            className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors pointer-events-auto"
            title="Next quote"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Pause/Play Button (visible on hover) */}
      {quotes.length > 1 && (
        <button
          onClick={togglePause}
          className="absolute bottom-3 left-3 p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all opacity-0 group-hover:opacity-100"
          title={isPaused ? 'Resume auto-rotation' : 'Pause auto-rotation'}
        >
          {isPaused ? <Play size={14} /> : <Pause size={14} />}
        </button>
      )}

    </div>
  );
};

export default QuoteCarousel;
