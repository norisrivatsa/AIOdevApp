import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useCompleteVisionGoal } from '../../hooks/useVisionBoard';
import { useProjects } from '../../hooks/useProjects';
import { useSubjects } from '../../hooks/useSubjects';

const CompleteGoalModal = ({ isOpen, onClose, goal, cardType }) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const completeGoal = useCompleteVisionGoal();
  const { data: projects = [] } = useProjects();
  const { data: subjects = [] } = useSubjects();

  // Find linked project or subject
  const linkedProject = goal?.linkedProjectId
    ? projects.find(p => p.projectId === goal.linkedProjectId)
    : null;
  const linkedSubject = goal?.linkedSubjectId
    ? subjects.find(s => s.subjectId === goal.linkedSubjectId)
    : null;

  // Check if goal can be auto-completed based on linked item status
  const canAutoComplete =
    (linkedProject && linkedProject.status === 'completed') ||
    (linkedSubject && linkedSubject.status === 'completed');

  const isAlreadyCompleted = goal?.status === 'completed';

  useEffect(() => {
    // Reset state when modal opens
    if (isOpen) {
      setIsCompleting(false);
    }
  }, [isOpen]);

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await completeGoal.mutateAsync({ id: goal.goalId });
      onClose();
    } catch (error) {
      console.error('Failed to complete goal:', error);
      setIsCompleting(false);
    }
  };

  if (!goal) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Goal"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleComplete}
            disabled={isCompleting || isAlreadyCompleted}
          >
            <CheckCircle size={16} />
            {isAlreadyCompleted ? 'Already Completed' : 'Mark as Complete'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Goal Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {goal.name}
          </h3>
          {goal.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {goal.description}
            </p>
          )}
        </div>

        {/* Current Status */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Current Status
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              goal.status === 'completed'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                : goal.status === 'in_progress'
                ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {goal.status === 'not_started' ? 'Not Started' :
               goal.status === 'in_progress' ? 'In Progress' : 'Completed'}
            </span>
          </div>
        </div>

        {/* Linked Project/Subject Info */}
        {(linkedProject || linkedSubject) && (
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Linked {linkedProject ? 'Project' : 'Subject'}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {linkedProject?.name || linkedSubject?.name || linkedSubject?.title}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Status: <span className="capitalize">
                    {linkedProject?.status || linkedSubject?.status}
                  </span>
                </div>
              </div>
            </div>

            {canAutoComplete && !isAlreadyCompleted && (
              <div className="mt-3 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 p-2 rounded">
                The linked {linkedProject ? 'project' : 'subject'} is completed.
                You can mark this goal as complete!
              </div>
            )}
          </div>
        )}

        {/* Completion Confirmation */}
        {!isAlreadyCompleted && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Are you sure you want to mark this goal as complete?
              This action will update the goal status and it will appear crossed off in your vision board.
            </p>
          </div>
        )}

        {isAlreadyCompleted && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
              <CheckCircle size={16} />
              This goal has already been marked as complete!
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CompleteGoalModal;
