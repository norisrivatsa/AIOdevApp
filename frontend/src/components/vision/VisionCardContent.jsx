import { useState } from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { useVisionGoals } from '../../hooks/useVisionBoard';
import CompleteGoalModal from './CompleteGoalModal';

const VisionCardContent = ({ card }) => {
  const { data: goals = [], isLoading } = useVisionGoals(card.cardId);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  const handleCompleteClick = (goal) => {
    setSelectedGoal(goal);
    setIsCompleteModalOpen(true);
  };

  const handleCloseCompleteModal = () => {
    setIsCompleteModalOpen(false);
    setSelectedGoal(null);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No goals yet. Use the Add button to create goals!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Goals List */}
        <div className="space-y-2">
          {goals.map((goal) => {
            const isCompleted = goal.status === 'completed';

            return (
              <div
                key={goal.goalId}
                className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
              >
                {/* Status Icon */}
                <button
                  onClick={() => handleCompleteClick(goal)}
                  className="mt-0.5 flex-shrink-0"
                  title={isCompleted ? 'Completed' : 'Mark as complete'}
                >
                  {isCompleted ? (
                    <CheckCircle
                      size={18}
                      className="text-green-600 dark:text-green-400"
                    />
                  ) : (
                    <Circle
                      size={18}
                      className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                    />
                  )}
                </button>

                {/* Goal Content */}
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm ${
                      isCompleted
                        ? 'line-through text-gray-500 dark:text-gray-400'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {goal.name}
                  </div>
                  {goal.description && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {goal.description}
                    </div>
                  )}
                  {goal.priority && goal.priority !== 'medium' && (
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        goal.priority === 'high'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {goal.priority}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Goal Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
          <span>
            {goals.filter(g => g.status === 'completed').length} of {goals.length} completed
          </span>
          {goals.length > 0 && (
            <span>
              {Math.round((goals.filter(g => g.status === 'completed').length / goals.length) * 100)}% done
            </span>
          )}
        </div>
      </div>

      {/* Complete Goal Modal */}
      <CompleteGoalModal
        isOpen={isCompleteModalOpen}
        onClose={handleCloseCompleteModal}
        goal={selectedGoal}
        cardType={card.type}
      />
    </>
  );
};

export default VisionCardContent;
