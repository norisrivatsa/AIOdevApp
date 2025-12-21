import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import CardSettingsPopover from '../ui/CardSettingsPopover';
import useUIStore from '../../stores/uiStore';
import { useUICustomization, useUpdateBoardCustomization } from '../../hooks/useUICustomization';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const EditableGridLayout = ({ boardId, boardName, children, defaultLayout = [], disableAutoSave = false }) => {
  const { isEditMode } = useUIStore();
  const { data: customization } = useUICustomization();
  const updateBoard = useUpdateBoardCustomization();

  // Local state for layout
  const [layout, setLayout] = useState([]);
  const [ratioLocks, setRatioLocks] = useState(new Map()); // cardId -> ratio
  const [lockedCards, setLockedCards] = useState(new Set()); // cardId set for locked in place
  const [cardTypes, setCardTypes] = useState(new Map()); // cardId -> cardType
  const [isInitialized, setIsInitialized] = useState(false); // Track if initial load is complete
  const isSavingRef = useRef(false); // Track if we're currently saving to prevent reload loops
  const lastSavedLayoutRef = useRef(null); // Store last saved layout to prevent duplicate saves

  // Load saved layout from customization
  useEffect(() => {
    // Skip loading if we're in the middle of saving to prevent infinite loops
    if (isSavingRef.current) {
      return;
    }

    if (customization?.boards) {
      const boardCustomization = customization.boards.find(b => b.boardId === boardId);
      if (boardCustomization?.cards) {
        const savedLayout = boardCustomization.cards.map(card => ({
          i: card.cardId,
          x: card.x,
          y: card.y,
          w: card.w,
          h: card.h,
          minW: card.minW || 2,
          minH: card.minH || 2,
          maxW: card.maxW,
          maxH: card.maxH,
          static: card.locked || false, // Set static flag for locked cards
        }));
        setLayout(savedLayout);

        // Restore ratio locks, locked cards, and card types
        const locks = new Map();
        const locked = new Set();
        const types = new Map();
        boardCustomization.cards.forEach(card => {
          if (card.aspectRatioLocked) {
            locks.set(card.cardId, card.w / card.h);
          }
          if (card.locked) {
            locked.add(card.cardId);
          }
          if (card.cardType) {
            types.set(card.cardId, card.cardType);
          }
        });
        setRatioLocks(locks);
        setLockedCards(locked);
        setCardTypes(types);
      } else {
        // Use default layout
        setLayout(defaultLayout);
        const types = new Map();
        defaultLayout.forEach(item => {
          if (item.cardType) {
            types.set(item.i, item.cardType);
          }
        });
        setCardTypes(types);
      }
    } else {
      // Use default layout
      setLayout(defaultLayout);
      const types = new Map();
      defaultLayout.forEach(item => {
        if (item.cardType) {
          types.set(item.i, item.cardType);
        }
      });
      setCardTypes(types);
    }

    // Mark as initialized after loading
    setIsInitialized(true);
  }, [customization, boardId, defaultLayout]);

  // Prepare children array
  const childrenArray = useMemo(() => {
    return Array.isArray(children) ? children : [children];
  }, [children]);

  // Handle layout change from drag/resize (only update state, don't save)
  const handleLayoutChange = useCallback((newLayout) => {
    setLayout(newLayout);
  }, []);

  // Save layout to backend
  const saveLayout = useCallback(() => {
    if (!isInitialized || disableAutoSave || layout.length === 0) return;

    const cards = layout.map(item => ({
      cardId: item.i,
      cardType: cardTypes.get(item.i) || 'generic',
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      locked: lockedCards.has(item.i),
      aspectRatioLocked: ratioLocks.has(item.i),
      minW: item.minW || 2,
      minH: item.minH || 2,
      maxW: item.maxW || null,
      maxH: item.maxH || null,
    }));

    const boardData = {
      boardId,
      boardName,
      gridCols: 12,
      gridRowHeight: 100,
      cards,
    };

    // Set saving flag to prevent reload loop
    isSavingRef.current = true;

    updateBoard.mutate({ boardId, data: boardData }, {
      onSettled: () => {
        setTimeout(() => {
          isSavingRef.current = false;
        }, 500);
      }
    });
  }, [isInitialized, disableAutoSave, layout, cardTypes, lockedCards, ratioLocks, boardId, boardName, updateBoard]);

  // Handle drag stop - save when drag completes
  const handleDragStop = useCallback(() => {
    if (isEditMode) {
      saveLayout();
    }
  }, [isEditMode, saveLayout]);

  // Handle resize stop - save when resize completes
  const handleResizeStop = useCallback(() => {
    if (isEditMode) {
      saveLayout();
    }
  }, [isEditMode, saveLayout]);

  // Handle resize with ratio lock
  const handleResize = useCallback((newLayout, oldItem, newItem) => {
    const ratio = ratioLocks.get(newItem.i);

    if (ratio) {
      // Ratio is locked - adjust dimensions proportionally
      const widthChanged = newItem.w !== oldItem.w;

      if (widthChanged) {
        // Width changed, adjust height
        newItem.h = Math.round(newItem.w / ratio);
      } else {
        // Height changed, adjust width
        newItem.w = Math.round(newItem.h * ratio);
      }
    }

    setLayout(newLayout);
  }, [ratioLocks]);

  // Handle manual size change from popover
  const handleManualSizeChange = useCallback((cardId, { w, h }) => {
    setLayout(prev =>
      prev.map(item =>
        item.i === cardId
          ? { ...item, w, h }
          : item
      )
    );
    // Save after manual size change
    setTimeout(() => saveLayout(), 100);
  }, [saveLayout]);

  // Handle ratio lock toggle from popover
  const handleRatioLockToggle = useCallback((cardId, isLocked, ratio) => {
    setRatioLocks(prev => {
      const newLocks = new Map(prev);
      if (isLocked) {
        newLocks.set(cardId, ratio);
      } else {
        newLocks.delete(cardId);
      }
      return newLocks;
    });
    // Save after ratio lock toggle
    setTimeout(() => saveLayout(), 100);
  }, [saveLayout]);

  // Handle lock in place toggle from popover
  const handleLockInPlaceToggle = useCallback((cardId, isLocked) => {
    setLockedCards(prev => {
      const newLocked = new Set(prev);
      if (isLocked) {
        newLocked.add(cardId);
      } else {
        newLocked.delete(cardId);
      }
      return newLocked;
    });

    // Update layout to set static flag
    setLayout(prev =>
      prev.map(item =>
        item.i === cardId
          ? { ...item, static: isLocked }
          : item
      )
    );

    // Save after lock in place toggle
    setTimeout(() => saveLayout(), 100);
  }, [saveLayout]);


  return (
    <div className="h-full overflow-hidden p-8">
      {/* Grid Layout - Editable only in edit mode */}
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        compactType="vertical"
        preventCollision={false}
        onLayoutChange={handleLayoutChange}
        onResize={handleResize}
        onDragStop={handleDragStop}
        onResizeStop={handleResizeStop}
      >
        {childrenArray.map((child, index) => {
          const cardId = layout[index]?.i || `card-${index}`;
          const cardLayout = layout.find(l => l.i === cardId) || {};

          return (
            <div key={cardId} className="relative">
              {/* Three-dots menu overlay - only visible in edit mode */}
              {isEditMode && (
                <div className="absolute top-2 right-2" style={{ zIndex: 999998 }}>
                  <CardSettingsPopover
                    cardId={cardId}
                    width={cardLayout.w || defaultLayout[index]?.w || 3}
                    height={cardLayout.h || defaultLayout[index]?.h || 2}
                    onSizeChange={({ w, h }) => handleManualSizeChange(cardId, { w, h })}
                    gridRowHeight={100}
                    isRatioLocked={ratioLocks.has(cardId)}
                    ratio={ratioLocks.get(cardId)}
                    onRatioLockToggle={(isLocked, ratio) =>
                      handleRatioLockToggle(cardId, isLocked, ratio)
                    }
                    isLockedInPlace={lockedCards.has(cardId)}
                    onLockInPlaceToggle={(isLocked) =>
                      handleLockInPlaceToggle(cardId, isLocked)
                    }
                  />
                </div>
              )}

              {/* Card Content */}
              <div className="h-full w-full overflow-auto">
                {child}
              </div>
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </div>
  );
};

export default EditableGridLayout;
