import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Lock, Unlock } from 'lucide-react';

const CardSettingsPopover = ({
  cardId,
  width,
  height,
  onSizeChange,
  gridRowHeight = 100,
  isRatioLocked = false,
  ratio: propRatio,
  onRatioLockToggle,
  isLockedInPlace = false,
  onLockInPlaceToggle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localWidth, setLocalWidth] = useState(width);
  const [localHeight, setLocalHeight] = useState(height);
  const [ratio, setRatio] = useState(propRatio || width / height);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);

  // Update local values when props change (from drag-resize)
  useEffect(() => {
    setLocalWidth(width);
    setLocalHeight(height);
    if (!isRatioLocked) {
      setRatio(width / height);
    }
  }, [width, height, isRatioLocked]);

  // Update popover position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popoverWidth = 256; // w-64 = 16rem = 256px
      const viewportWidth = window.innerWidth;

      // Calculate position
      let left = rect.right - popoverWidth;
      const top = rect.bottom + 8; // mt-2 = 8px

      // Adjust if popover would go off-screen
      if (left < 8) {
        left = 8;
      } else if (left + popoverWidth > viewportWidth - 8) {
        left = viewportWidth - popoverWidth - 8;
      }

      setPosition({ top, left });
    }
  }, [isOpen]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleWidthChange = (newWidth) => {
    const widthNum = parseInt(newWidth) || 1;
    setLocalWidth(widthNum);

    if (isRatioLocked) {
      // Adjust height based on ratio
      const newHeight = Math.round(widthNum / ratio);
      setLocalHeight(newHeight);
      onSizeChange({ w: widthNum, h: newHeight });
    } else {
      setRatio(widthNum / localHeight);
      onSizeChange({ w: widthNum, h: localHeight });
    }
  };

  const handleHeightChange = (newHeight) => {
    const heightNum = parseInt(newHeight) || 1;
    setLocalHeight(heightNum);

    if (isRatioLocked) {
      // Adjust width based on ratio
      const newWidth = Math.round(heightNum * ratio);
      setLocalWidth(newWidth);
      onSizeChange({ w: newWidth, h: heightNum });
    } else {
      setRatio(localWidth / heightNum);
      onSizeChange({ w: localWidth, h: heightNum });
    }
  };

  const toggleRatioLock = () => {
    const newRatio = localWidth / localHeight;
    if (!isRatioLocked) {
      // Lock the current ratio
      setRatio(newRatio);
      onRatioLockToggle && onRatioLockToggle(true, newRatio);
    } else {
      onRatioLockToggle && onRatioLockToggle(false, newRatio);
    }
  };

  // Convert grid units to pixels for display
  const widthPx = localWidth * 100; // Approximate, assuming column width ~100px
  const heightPx = localHeight * gridRowHeight;

  return (
    <>
      {/* Three-dots button */}
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-2 bg-white dark:bg-gray-800 rounded-md shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Card settings"
      >
        <MoreVertical size={16} className="text-gray-600 dark:text-gray-400" />
      </button>

      {/* Popover - rendered via portal */}
      {isOpen && createPortal(
        <div
          ref={popoverRef}
          className="fixed w-64 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4"
          style={{
            zIndex: 999999,
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Card Dimensions
          </h4>

          {/* Width Field */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Width (grid units)
            </label>
            <input
              type="number"
              min="1"
              value={localWidth}
              onChange={(e) => handleWidthChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              ≈ {widthPx}px
            </p>
          </div>

          {/* Height Field */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Height (grid units)
            </label>
            <input
              type="number"
              min="1"
              value={localHeight}
              onChange={(e) => handleHeightChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              ≈ {heightPx}px
            </p>
          </div>

          {/* Ratio Field */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Aspect Ratio
              </label>
              <button
                onClick={toggleRatioLock}
                className={`p-1 rounded transition-colors ${
                  isRatioLocked
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
                title={isRatioLocked ? 'Unlock ratio' : 'Lock ratio'}
              >
                {isRatioLocked ? <Lock size={14} /> : <Unlock size={14} />}
              </button>
            </div>
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-700 dark:text-gray-300">
              {ratio.toFixed(2)} : 1
            </div>
            {isRatioLocked && (
              <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                Ratio locked - dimensions will scale proportionally
              </p>
            )}
          </div>

          {/* Lock in Place */}
          <div className="mb-3">
            <button
              onClick={() => onLockInPlaceToggle && onLockInPlaceToggle(!isLockedInPlace)}
              className={`w-full px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-between ${
                isLockedInPlace
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
              }`}
            >
              <span>{isLockedInPlace ? 'Card Locked in Place' : 'Lock Card in Place'}</span>
              {isLockedInPlace ? <Lock size={16} /> : <Unlock size={16} />}
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {isLockedInPlace
                ? 'Card cannot be moved or resized. Other cards will not push this card.'
                : 'Lock to prevent movement when adjusting other cards.'
              }
            </p>
          </div>

          {/* Info */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Drag from corner to resize, or enter values manually.
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default CardSettingsPopover;
