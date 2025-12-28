import { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import QuoteCarousel from '../components/vision/QuoteCarousel';
import QuoteManagementModal from '../components/vision/QuoteManagementModal';
import AddCardModal from '../components/vision/AddCardModal';
import VisionCardContent from '../components/vision/VisionCardContent';
import EditableGridLayout from '../components/layout/EditableGridLayout';
import Button from '../components/ui/Button';
import {
  useVisionCards,
  useCreateVisionCard,
  useCreateVisionGoal,
  useInitializeVisionBoard,
} from '../hooks/useVisionBoard';

const VisionBoard = () => {
  const { data: cards = [], isLoading } = useVisionCards();
  const initializeBoard = useInitializeVisionBoard();
  const createCard = useCreateVisionCard();
  const createGoal = useCreateVisionGoal();
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [selectedCardForGoal, setSelectedCardForGoal] = useState(null);

  // Convert card size to grid dimensions (w, h)
  const getSizeConfig = (size) => {
    switch (size) {
      case 'small': return { w: 3, h: 2 };
      case 'medium': return { w: 4, h: 3 };
      case 'large': return { w: 6, h: 4 };
      case 'wide': return { w: 8, h: 3 };
      default: return { w: 4, h: 3 };
    }
  };

  // Generate default layout from cards for EditableGridLayout (memoized)
  // Only recalculates when cards array changes (add/remove cards)
  const defaultLayout = useMemo(() => {
    return cards.map((card, index) => {
      const { w, h } = getSizeConfig(card.size);
      return {
        i: `vision-card-${card.cardId}`,
        x: (index * 4) % 12,
        y: Math.floor((index * 4) / 12) * 3,
        w: card.type === 'inspiration' ? 12 : w, // Quotes card spans full width
        h: card.type === 'inspiration' ? 2 : h,
        minW: 3,
        minH: 2,
        cardType: 'vision-card',
      };
    });
  }, [cards]);

  // Auto-initialize the vision board on first load
  useEffect(() => {
    const initialize = async () => {
      if (!isLoading) {
        try {
          await initializeBoard.mutateAsync();
        } catch (error) {
          // Silently fail if already initialized
          console.log('Board initialization skipped or already done');
        }
      }
    };

    initialize();
  }, []); // Only run once on mount

  const handleCreateCard = async (cardData) => {
    // Extract initialGoals before sending to backend (not part of API schema)
    const { initialGoals, ...cardDataForApi } = cardData;

    // Step 1: Create the card first (only send valid API fields)
    const newCard = await createCard.mutateAsync(cardDataForApi);

    // Step 2: If there are initial goals (for custom cards), create them
    if (initialGoals && initialGoals.length > 0) {
      for (const goal of initialGoals) {
        await createGoal.mutateAsync({
          cardId: newCard.cardId,
          name: goal.text,
          description: '',
          status: 'not_started',
          priority: 'medium',
        });
      }
    }
  };

  const handleAddGoal = async (goalData) => {
    await createGoal.mutateAsync(goalData);
  };

  const handleOpenAddGoalModal = (card) => {
    setSelectedCardForGoal(card);
    setIsAddCardModalOpen(true);
  };

  const handleCloseAddCardModal = () => {
    setIsAddCardModalOpen(false);
    setSelectedCardForGoal(null);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-black">
      {/* Top Actions Bar */}
      <div className="flex items-center justify-end p-6 pb-0">
        <Button variant="primary" size="md" onClick={() => setIsAddCardModalOpen(true)}>
          <Plus size={20} />
          Add
        </Button>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">Loading vision board...</div>
        </div>
      ) : cards.length === 0 ? (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] opacity-20 flex items-center justify-center mb-6">
            <Plus size={48} className="text-gradient" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Start Your Vision Board
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
            Create your first goal card to start tracking your learning goals,
            projects, career milestones, and more.
          </p>
          <Button variant="primary" size="lg" onClick={() => setIsAddCardModalOpen(true)}>
            <Plus size={20} />
            Create Your First Card
          </Button>
        </div>
      ) : (
        /* Vision Cards with Editable Grid Layout */
        <EditableGridLayout
          boardId="vision-board"
          boardName="Vision Board"
          defaultLayout={defaultLayout}
        >
          {cards.map((card) => {
            // Render inspiration/quotes card
            if (card.type === 'inspiration') {
              return (
                <div key={`vision-card-${card.cardId}`} className="h-full w-full">
                  <QuoteCarousel onManageQuotes={() => setIsQuoteModalOpen(true)} />
                </div>
              );
            }

            // Render regular cards
            return (
              <div
                key={`vision-card-${card.cardId}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col h-full"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {card.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {card.type.replace('_', ' ')}
                  </p>
                </div>

                {/* Card Content */}
                <div className="flex-1 overflow-auto">
                  <VisionCardContent card={card} />
                </div>
              </div>
            );
          })}
        </EditableGridLayout>
      )}

      {/* Modals */}
      <AddCardModal
        isOpen={isAddCardModalOpen}
        onClose={handleCloseAddCardModal}
        onSubmit={handleCreateCard}
        onAddGoal={handleAddGoal}
        existingCards={cards}
        preSelectedCard={selectedCardForGoal}
      />

      <QuoteManagementModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
      />
    </div>
  );
};

export default VisionBoard;
