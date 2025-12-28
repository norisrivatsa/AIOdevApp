import { useState, useEffect } from 'react';
import { Plus, X, Search, Check } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import { useProjects, useCreateProject } from '../../hooks/useProjects';
import { useSubjects, useCreateSubject } from '../../hooks/useSubjects';

const CARD_TYPES = [
  { id: 'custom', name: 'Custom Goals', description: 'Track any goals with a customizable checklist' },
  { id: 'inspiration', name: 'Inspirational Quotes', description: 'Display rotating motivational quotes' },
  { id: 'subject_goals', name: 'Learning Goals', description: 'Track goals for all your subjects' },
  { id: 'project_goals', name: 'Project Goals', description: 'Track goals for all your projects' },
  { id: 'financial_goals', name: 'Financial Goals', description: 'Track monetary targets and progress' },
  { id: 'career_goals', name: 'Career Goals', description: 'Track professional milestones' },
  { id: 'achievements', name: 'Achievements', description: 'Showcase your completed milestones' },
];

const AddCardModal = ({ isOpen, onClose, onSubmit, onAddGoal, existingCards = [], preSelectedCard = null }) => {
  const [mode, setMode] = useState(null);
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardTitle, setCardTitle] = useState('');

  // Handle preSelectedCard - when opening from "Add Goal" button in a card
  useEffect(() => {
    if (isOpen && preSelectedCard) {
      setMode('add_goal');
      setSelectedCard(preSelectedCard);
      setStep(3);
    }
  }, [isOpen, preSelectedCard]);

  // Initial goals for custom cards
  const [initialGoals, setInitialGoals] = useState([{ text: '', completed: false }]);

  // Goal data (for adding to existing card)
  const [goalName, setGoalName] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [linkMode, setLinkMode] = useState('existing');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [newItemData, setNewItemData] = useState({ name: '', description: '' });

  const { data: projects = [] } = useProjects();
  const { data: subjects = [] } = useSubjects();
  const createProject = useCreateProject();
  const createSubject = useCreateSubject();

  const activeProjects = projects.filter(p => p.status === 'active');
  const activeSubjects = subjects.filter(s => s.status === 'active' || s.status === 'in_progress');

  const filteredProjects = activeProjects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredSubjects = activeSubjects.filter(s =>
    (s.name || s.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    setStep(2);
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setCardTitle(type.name);
    setStep(3);
  };

  const handleCardSelect = (card) => {
    setSelectedCard(card);
    setStep(3);
  };

  const handleCreateLinkedItem = async () => {
    if (!newItemData.name.trim()) return null;

    try {
      if (selectedCard?.type === 'project_goals') {
        const result = await createProject.mutateAsync({
          name: newItemData.name,
          description: newItemData.description,
          status: 'active',
          priority: 'medium',
        });
        return result.projectId;
      } else if (selectedCard?.type === 'subject_goals') {
        const result = await createSubject.mutateAsync({
          name: newItemData.name,
          description: newItemData.description,
          status: 'active',
          priority: 'medium',
        });
        return result.subjectId;
      }
    } catch (error) {
      console.error('Error creating linked item:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (mode === 'new_card') {
      // Create new card
      if (!cardTitle.trim()) return;

      const cardData = {
        title: cardTitle,
        type: selectedType.id,
        size: 'medium',
        colorCode: '#3B82F6',
        position: { x: 0, y: 0 },
      };

      // Include initial goals for custom cards
      if (selectedType.id === 'custom') {
        cardData.initialGoals = initialGoals.filter(g => g.text.trim());
      }

      onSubmit(cardData);
    } else {
      // Add goal to existing card
      if (!goalName.trim()) return;

      let linkedId = null;

      // Handle linked items for subject/project cards
      if (selectedCard.type === 'subject_goals' || selectedCard.type === 'project_goals') {
        if (linkMode === 'create') {
          linkedId = await handleCreateLinkedItem();
        } else {
          linkedId = selectedItemId;
        }
      }

      const goalData = {
        cardId: selectedCard.cardId,
        name: goalName,
        description: goalDescription,
        status: 'not_started',
        priority: 'medium',
      };

      if (linkedId) {
        if (selectedCard.type === 'subject_goals') {
          goalData.linkedSubjectId = linkedId;
        } else if (selectedCard.type === 'project_goals') {
          goalData.linkedProjectId = linkedId;
        }
      }

      onAddGoal(goalData);
    }

    handleClose();
  };

  const handleClose = () => {
    setMode(null);
    setStep(1);
    setSelectedType(null);
    setSelectedCard(null);
    setCardTitle('');
    setInitialGoals([{ text: '', completed: false }]);
    setGoalName('');
    setGoalDescription('');
    setLinkMode('existing');
    setSearchQuery('');
    setSelectedItemId(null);
    setNewItemData({ name: '', description: '' });
    onClose();
  };

  const handleAddInitialGoal = () => {
    setInitialGoals([...initialGoals, { text: '', completed: false }]);
  };

  const handleRemoveInitialGoal = (index) => {
    setInitialGoals(initialGoals.filter((_, i) => i !== index));
  };

  const handleInitialGoalChange = (index, value) => {
    const newGoals = [...initialGoals];
    newGoals[index].text = value;
    setInitialGoals(newGoals);
  };

  const handleBack = () => {
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
    else handleClose();
  };

  const canSubmit = () => {
    if (mode === 'new_card') {
      if (!cardTitle.trim()) return false;

      // For custom cards, require at least one goal
      if (selectedType?.id === 'custom') {
        return initialGoals.some(g => g.text.trim());
      }

      return true;
    } else {
      if (!goalName.trim()) return false;

      if (selectedCard?.type === 'subject_goals' || selectedCard?.type === 'project_goals') {
        if (linkMode === 'existing') {
          return selectedItemId !== null;
        } else {
          return newItemData.name.trim();
        }
      }

      return true;
    }
  };

  const getTitle = () => {
    if (step === 1) return 'Add to Vision Board';
    if (step === 2) {
      if (mode === 'new_card') return 'Choose Card Type';
      return 'Select Card';
    }
    if (mode === 'new_card') return `Create ${selectedType?.name} Card`;
    return `Add Goal to ${selectedCard?.title}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={getTitle()}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="secondary" onClick={handleBack}>
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          {step === 3 && (
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!canSubmit()}
            >
              {mode === 'new_card' ? 'Create Card' : 'Add Goal'}
            </Button>
          )}
        </div>
      }
    >
      {step === 1 && (
        /* Step 1: Choose Mode */
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleModeSelect('new_card')}
            className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 transition-colors text-center"
          >
            <Plus size={32} className="mx-auto mb-3 text-primary-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Create New Card
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Add a new card to your vision board
            </p>
          </button>

          <button
            onClick={() => handleModeSelect('add_goal')}
            className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 transition-colors text-center"
            disabled={existingCards.length === 0}
          >
            <Plus size={32} className="mx-auto mb-3 text-primary-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Add Goal to Card
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Add a goal to an existing card
            </p>
          </button>
        </div>
      )}

      {step === 2 && mode === 'new_card' && (
        /* Step 2a: Select Card Type */
        <div className="grid grid-cols-2 gap-4">
          {CARD_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => handleTypeSelect(type)}
              className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 transition-colors text-left"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {type.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {type.description}
              </p>
            </button>
          ))}
        </div>
      )}

      {step === 2 && mode === 'add_goal' && (
        /* Step 2b: Select Existing Card */
        <div className="space-y-3">
          {existingCards.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No cards yet. Create a card first.
            </div>
          ) : (
            existingCards
              .filter(card => card.type !== 'inspiration') // Can't add goals to inspiration card
              .map((card) => (
                <button
                  key={card.cardId}
                  onClick={() => handleCardSelect(card)}
                  className="w-full p-4 text-left rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-colors"
                >
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {card.title}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {card.type.replace('_', ' ')}
                  </div>
                </button>
              ))
          )}
        </div>
      )}

      {step === 3 && mode === 'new_card' && (
        /* Step 3a: Configure New Card */
        <div className="space-y-4">
          <Input
            label="Card Title"
            value={cardTitle}
            onChange={(e) => setCardTitle(e.target.value)}
            placeholder="e.g., Fitness Goals, 2025 Targets"
            autoFocus
          />

          {selectedType?.id === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Initial Goals
              </label>
              <div className="space-y-2">
                {initialGoals.map((goal, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={goal.text}
                      onChange={(e) => handleInitialGoalChange(index, e.target.value)}
                      placeholder={`Goal ${index + 1}`}
                      className="flex-1"
                    />
                    {initialGoals.length > 1 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRemoveInitialGoal(index)}
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddInitialGoal}
                className="mt-2"
              >
                <Plus size={16} />
                Add Goal
              </Button>
            </div>
          )}

          {selectedType?.id === 'inspiration' && (
            <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                This will add an inspirational quotes carousel to your board. You can manage
                your quotes after creating the card.
              </p>
            </div>
          )}
        </div>
      )}

      {step === 3 && mode === 'add_goal' && (
        /* Step 3b: Add Goal to Card */
        <div className="space-y-4">
          <Input
            label="Goal Name"
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
            placeholder="e.g., Complete React course, Lose 10kg"
            autoFocus
          />

          <Textarea
            label="Description (Optional)"
            value={goalDescription}
            onChange={(e) => setGoalDescription(e.target.value)}
            placeholder="Additional details about this goal..."
            rows={3}
          />

          {/* Subject/Project Linking */}
          {(selectedCard?.type === 'subject_goals' || selectedCard?.type === 'project_goals') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Link to {selectedCard.type === 'subject_goals' ? 'Subject' : 'Project'}
              </label>

              <div className="flex gap-2 mb-4">
                <Button
                  variant={linkMode === 'existing' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setLinkMode('existing')}
                >
                  Link Existing
                </Button>
                <Button
                  variant={linkMode === 'create' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setLinkMode('create')}
                >
                  Create New
                </Button>
              </div>

              {linkMode === 'existing' ? (
                <div>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={`Search ${selectedCard.type === 'subject_goals' ? 'subjects' : 'projects'}...`}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                    {(selectedCard.type === 'subject_goals' ? filteredSubjects : filteredProjects).length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                        No {selectedCard.type === 'subject_goals' ? 'subjects' : 'projects'} found
                      </div>
                    ) : (
                      (selectedCard.type === 'subject_goals' ? filteredSubjects : filteredProjects).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedItemId(item.id)}
                          className={`w-full p-3 text-left rounded-lg border-2 transition-colors ${
                            selectedItemId === item.id
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {item.name || item.title}
                            </div>
                            {selectedItemId === item.id && (
                              <Check size={20} className="text-primary-600" />
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Input
                    label={`${selectedCard.type === 'subject_goals' ? 'Subject' : 'Project'} Name`}
                    value={newItemData.name}
                    onChange={(e) => setNewItemData({ ...newItemData, name: e.target.value })}
                    placeholder="Name..."
                  />
                  <Textarea
                    label="Description (Optional)"
                    value={newItemData.description}
                    onChange={(e) => setNewItemData({ ...newItemData, description: e.target.value })}
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default AddCardModal;
