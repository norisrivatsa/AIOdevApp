import { useState, useEffect } from 'react';
import useTimerStore from '../stores/timerStore';
import { useCourses } from '../hooks/useCourses';
import { useProjects } from '../hooks/useProjects';
import { useSessionStats } from '../hooks/useSessions';
import { useStreaks } from '../hooks/useAnalytics';
import { formatDurationHMS } from '../utils/date';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import Card from '../components/ui/Card';
import { Play, Pause, Square } from 'lucide-react';

const FocusBoard = () => {
  const {
    activeSession,
    isRunning,
    elapsedSeconds,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
  } = useTimerStore();

  const { data: courses } = useCourses();
  const { data: projects } = useProjects();
  const { data: stats } = useSessionStats();
  const { data: streaks } = useStreaks();

  const [selectedType, setSelectedType] = useState('course');
  const [selectedId, setSelectedId] = useState('');
  const [notes, setNotes] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  // Update notes when active session changes
  useEffect(() => {
    if (activeSession) {
      setNotes(activeSession.notes || '');
    }
  }, [activeSession]);

  // Get available items based on selected type
  const getAvailableItems = () => {
    if (selectedType === 'course') {
      return courses || [];
    } else {
      return projects || [];
    }
  };

  // Get current item name
  const getCurrentItemName = () => {
    if (!activeSession) return null;

    if (activeSession.referenceName) {
      return activeSession.referenceName;
    }

    if (activeSession.type === 'course') {
      const course = courses?.find(c => c.id === activeSession.referenceId);
      return course?.title || 'Unknown Course';
    } else {
      const project = projects?.find(p => p.id === activeSession.referenceId);
      return project?.name || 'Unknown Project';
    }
  };

  // Get select options
  const getSelectOptions = () => {
    const items = getAvailableItems();
    const options = [
      { value: '', label: `Select a ${selectedType}...` }
    ];

    items.forEach(item => {
      options.push({
        value: item.id,
        label: selectedType === 'course' ? item.title : item.name
      });
    });

    return options;
  };

  const handleStart = async () => {
    if (!selectedId) return;

    setIsStarting(true);
    try {
      const items = getAvailableItems();
      const selectedItem = items.find(item => item.id === selectedId);
      const itemName = selectedType === 'course' ? selectedItem?.title : selectedItem?.name;

      await startTimer(selectedType, selectedId, itemName);
      setNotes('');
    } catch (error) {
      console.error('Failed to start timer:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await stopTimer(notes);
      setNotes('');
    } catch (error) {
      console.error('Failed to stop timer:', error);
    } finally {
      setIsStopping(false);
    }
  };

  const handlePause = () => {
    pauseTimer();
  };

  const handleResume = () => {
    resumeTimer();
  };

  return (
    <div className="h-full flex items-center justify-center overflow-hidden p-8 bg-gray-50 dark:bg-black">
      <div className="w-full max-w-2xl">
        <Card>
          <Card.Body className="p-12">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Focus Session
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Stay focused and track your learning time
              </p>
            </div>

            {/* Timer Display */}
            <div className="text-center mb-12">
              <div className="text-8xl font-mono font-bold text-gradient mb-4">
                {formatDurationHMS(elapsedSeconds)}
              </div>
              {activeSession && (
                <div className="text-2xl font-medium text-gray-700 dark:text-gray-300">
                  {getCurrentItemName()}
                </div>
              )}
            </div>

            {/* Controls */}
            {!activeSession ? (
              <div className="space-y-6">
                {/* Type Selection */}
                <div className="flex gap-4 justify-center">
                  <button
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      selectedType === 'course'
                        ? 'btn-gradient text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => {
                      setSelectedType('course');
                      setSelectedId('');
                    }}
                  >
                    Course
                  </button>
                  <button
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      selectedType === 'project'
                        ? 'btn-gradient text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => {
                      setSelectedType('project');
                      setSelectedId('');
                    }}
                  >
                    Project
                  </button>
                </div>

                {/* Item Selection */}
                <Select
                  options={getSelectOptions()}
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                />

                {/* Start Button */}
                <button
                  className="btn-gradient w-full px-6 py-4 rounded-lg font-medium text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleStart}
                  disabled={!selectedId || isStarting}
                >
                  <Play size={24} />
                  {isStarting ? 'Starting...' : 'Start Session'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Timer Controls */}
                <div className="flex gap-4">
                  {isRunning ? (
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={handlePause}
                      className="flex-1"
                    >
                      <Pause size={24} className="mr-2" />
                      Pause
                    </Button>
                  ) : (
                    <button
                      className="btn-gradient flex-1 px-6 py-4 rounded-lg font-medium text-lg flex items-center justify-center gap-2"
                      onClick={handleResume}
                    >
                      <Play size={24} />
                      Resume
                    </button>
                  )}
                  <Button
                    variant="danger"
                    size="lg"
                    onClick={handleStop}
                    disabled={isStopping}
                    loading={isStopping}
                    className="flex-1"
                  >
                    <Square size={24} className="mr-2" />
                    Stop
                  </Button>
                </div>

                {/* Notes */}
                <Textarea
                  label="Session Notes"
                  placeholder="Add notes about your session..."
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            )}

            {/* Quick Stats */}
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Time Today
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatDurationHMS(stats?.today || 0)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Current Streak
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {streaks?.currentStreak || 0} days
                  </div>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default FocusBoard;
