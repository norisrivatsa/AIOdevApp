import { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, Edit2, Settings, Moon, Sun, Edit, Check, X, Plus, Trash2, ChevronDown, ChevronRight, Award, Target, Code2, Clock, ExternalLink } from 'lucide-react';
import { useSubjects, useUpdateSubject, usePartialUpdateSubject, useToggleSubtopicCompletion, useSubjectProgress } from '../hooks/useSubjects';
import { useSessions } from '../hooks/useSessions';
import { usePracticeSessions, useCreatePracticeSession, useDeletePracticeSession, usePracticeSessionStats } from '../hooks/usePracticeSessions';
import useUIStore from '../stores/uiStore';
import useSettingsStore from '../stores/settingsStore';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import EditableGridLayout from '../components/layout/EditableGridLayout';
import SubjectModal from '../components/subjects/SubjectModal';
import SubtopicModal from '../components/subjects/SubtopicModal';
import PracticeSessionModal from '../components/subjects/PracticeSessionModal';

const SubjectPage = ({ subjectId }) => {
  const { data: subjects } = useSubjects();
  const { data: sessions } = useSessions({ type: 'subject', referenceId: subjectId });
  const { data: progressData } = useSubjectProgress(subjectId);
  const { data: practiceSessions = [] } = usePracticeSessions(subjectId);
  const { data: practiceStats } = usePracticeSessionStats(subjectId);
  const { closeSubjectPage, isEditMode, toggleEditMode } = useUIStore();
  const { theme, toggleTheme } = useSettingsStore();
  const { mutate: updateSubject } = useUpdateSubject();
  const { mutate: partialUpdateSubject } = usePartialUpdateSubject();
  const { mutate: toggleSubtopicCompletion } = useToggleSubtopicCompletion();
  const { mutate: createPracticeSession } = useCreatePracticeSession();
  const { mutate: deletePracticeSession } = useDeletePracticeSession();
  const [subject, setSubject] = useState(null);
  const [timeFilterType, setTimeFilterType] = useState('all');
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [expandedSubtopics, setExpandedSubtopics] = useState({});
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isSubtopicModalOpen, setIsSubtopicModalOpen] = useState(false);
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
  const [editingSubtopic, setEditingSubtopic] = useState(null);
  const [parentSubtopic, setParentSubtopic] = useState(null);

  useEffect(() => {
    if (subjects && subjectId) {
      const found = subjects.find(s => s.id === subjectId);
      setSubject(found);
    }
  }, [subjects, subjectId]);

  // Calculate time statistics from sessions with filtering
  const timeStats = useMemo(() => {
    const hasNoData = (!sessions || sessions.length === 0) && (!practiceSessions || practiceSessions.length === 0);

    if (hasNoData || !subject) {
      return {
        total: { hours: 0, minutes: 0 },
        filtered: { hours: 0, minutes: 0 },
        availableWeeks: 0,
        availableMonths: 0,
        currentWeek: 0,
        currentMonth: 0,
        maxSession: { hours: 0, minutes: 0 },
        totalSessions: 0,
        practiceTime: { hours: 0, minutes: 0 },
        regularTime: { hours: 0, minutes: 0 },
      };
    }

    // Combine sessions and practice sessions for date range calculation
    const allDates = [
      ...sessions.map(s => new Date(s.startTime)),
      ...practiceSessions.map(ps => new Date(ps.createdAt))
    ];

    const subjectStart = subject.startDate ? new Date(subject.startDate) : new Date(Math.min(...allDates));
    const now = new Date();

    const timeDiff = now.getTime() - subjectStart.getTime();
    const availableWeeks = Math.max(1, Math.ceil(timeDiff / (7 * 24 * 60 * 60 * 1000)));
    const availableMonths = Math.max(1, Math.ceil(timeDiff / (30 * 24 * 60 * 60 * 1000)));

    const currentWeek = Math.max(0, availableWeeks - 1);
    const currentMonth = Math.max(0, availableMonths - 1);

    // Convert minutes to hours:minutes format for display
    const toHoursMinutes = (totalMinutes) => ({
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60,
    });

    // Calculate regular session time (duration is now in MINUTES)
    const regularMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);

    // Calculate practice session time (duration is in MINUTES)
    const practiceMinutes = practiceSessions.reduce((sum, ps) => sum + (ps.duration || 0), 0);

    // Total time includes both
    const totalMinutes = regularMinutes + practiceMinutes;

    const maxSessionMinutes = Math.max(
      ...sessions.map(s => s.duration || 0),
      ...practiceSessions.map(ps => ps.duration || 0),
      0
    );

    let filteredMinutes = totalMinutes;

    if (timeFilterType === 'week') {
      const weekIndex = selectedWeek !== null ? selectedWeek : currentWeek;
      const weekStart = new Date(subjectStart.getTime() + weekIndex * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      const filteredRegularMinutes = sessions
        .filter(s => {
          const sessionDate = new Date(s.startTime);
          return sessionDate >= weekStart && sessionDate < weekEnd;
        })
        .reduce((sum, s) => sum + (s.duration || 0), 0);

      const filteredPracticeMinutes = practiceSessions
        .filter(ps => {
          const sessionDate = new Date(ps.createdAt);
          return sessionDate >= weekStart && sessionDate < weekEnd;
        })
        .reduce((sum, ps) => sum + (ps.duration || 0), 0);

      filteredMinutes = filteredRegularMinutes + filteredPracticeMinutes;
    } else if (timeFilterType === 'month') {
      const monthIndex = selectedMonth !== null ? selectedMonth : currentMonth;
      const monthStart = new Date(subjectStart.getTime() + monthIndex * 30 * 24 * 60 * 60 * 1000);
      const monthEnd = new Date(monthStart.getTime() + 30 * 24 * 60 * 60 * 1000);

      const filteredRegularMinutes = sessions
        .filter(s => {
          const sessionDate = new Date(s.startTime);
          return sessionDate >= monthStart && sessionDate < monthEnd;
        })
        .reduce((sum, s) => sum + (s.duration || 0), 0);

      const filteredPracticeMinutes = practiceSessions
        .filter(ps => {
          const sessionDate = new Date(ps.createdAt);
          return sessionDate >= monthStart && sessionDate < monthEnd;
        })
        .reduce((sum, ps) => sum + (ps.duration || 0), 0);

      filteredMinutes = filteredRegularMinutes + filteredPracticeMinutes;
    }

    return {
      total: toHoursMinutes(totalMinutes),
      filtered: toHoursMinutes(filteredMinutes),
      availableWeeks,
      availableMonths,
      currentWeek,
      currentMonth,
      maxSession: toHoursMinutes(maxSessionMinutes),
      totalSessions: sessions.length + practiceSessions.length,
      practiceTime: toHoursMinutes(practiceMinutes),
      regularTime: toHoursMinutes(regularMinutes),
    };
  }, [sessions, practiceSessions, subject, timeFilterType, selectedWeek, selectedMonth]);

  if (!subject) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading subject...</p>
      </div>
    );
  }

  const handleEditSubject = () => {
    setIsSubjectModalOpen(true);
  };

  const handleUpdateSubject = (subjectData) => {
    updateSubject({
      id: subjectId,
      data: subjectData
    });
    setIsSubjectModalOpen(false);
  };

  const toggleSubtopic = (subtopicId) => {
    toggleSubtopicCompletion({
      subjectId,
      subtopicId
    });
  };

  const toggleExpanded = (subtopicId) => {
    setExpandedSubtopics(prev => ({
      ...prev,
      [subtopicId]: !prev[subtopicId]
    }));
  };

  const handleCreateSubtopic = (parent = null) => {
    setEditingSubtopic(null);
    setParentSubtopic(parent);
    setIsSubtopicModalOpen(true);
  };

  const handleEditSubtopic = (subtopic) => {
    setEditingSubtopic(subtopic);
    setParentSubtopic(null);
    setIsSubtopicModalOpen(true);
  };

  const findAndUpdateSubtopic = (subtopics, targetId, newData) => {
    return subtopics.map(st => {
      if (st.id === targetId) {
        return { ...st, ...newData };
      }
      if (st.subtopics && st.subtopics.length > 0) {
        return {
          ...st,
          subtopics: findAndUpdateSubtopic(st.subtopics, targetId, newData)
        };
      }
      return st;
    });
  };

  const findAndAddSubtopic = (subtopics, parentId, newSubtopic) => {
    if (!parentId) {
      // Add to root level
      return [...subtopics, newSubtopic];
    }

    return subtopics.map(st => {
      if (st.id === parentId) {
        return {
          ...st,
          subtopics: [...(st.subtopics || []), newSubtopic]
        };
      }
      if (st.subtopics && st.subtopics.length > 0) {
        return {
          ...st,
          subtopics: findAndAddSubtopic(st.subtopics, parentId, newSubtopic)
        };
      }
      return st;
    });
  };

  const handleSubtopicSubmit = (subtopicData) => {
    if (!subject) return;

    let updatedSubtopics = [...(subject.subtopics || [])];

    if (editingSubtopic) {
      // Editing existing subtopic
      updatedSubtopics = findAndUpdateSubtopic(updatedSubtopics, editingSubtopic.id, subtopicData);
    } else {
      // Creating new subtopic - generate ID
      const newSubtopic = {
        ...subtopicData,
        id: `st_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      // Add to parent or root level
      updatedSubtopics = findAndAddSubtopic(updatedSubtopics, parentSubtopic?.id, newSubtopic);
    }

    // Update the subject with new subtopics using partial update
    partialUpdateSubject({
      id: subjectId,
      updates: { subtopics: updatedSubtopics }
    });
  };

  const findAndDeleteSubtopic = (subtopics, targetId) => {
    return subtopics.filter(st => {
      if (st.id === targetId) {
        return false; // Remove this subtopic (and all nested ones automatically)
      }
      if (st.subtopics && st.subtopics.length > 0) {
        st.subtopics = findAndDeleteSubtopic(st.subtopics, targetId);
      }
      return true;
    });
  };

  const handleDeleteSubtopic = (subtopicId) => {
    if (!subject || !window.confirm('Are you sure you want to delete this subtopic and all its nested subtopics?')) return;

    const updatedSubtopics = findAndDeleteSubtopic(subject.subtopics || [], subtopicId);

    partialUpdateSubject({
      id: subjectId,
      updates: { subtopics: updatedSubtopics }
    });
  };

  // Practice Session Handlers
  const handleCreatePracticeSession = () => {
    setIsPracticeModalOpen(true);
  };

  const handlePracticeSessionSubmit = (practiceData) => {
    createPracticeSession(practiceData);
  };

  const handleDeletePracticeSession = (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this practice session?')) return;
    deletePracticeSession({ id: sessionId, subjectId });
  };

  const renderSubtopicTree = (subtopics, level = 0) => {
    if (!subtopics || subtopics.length === 0) return null;

    // Sort by order
    const sortedSubtopics = [...subtopics].sort((a, b) => (a.order || 0) - (b.order || 0));

    return sortedSubtopics.map(subtopic => {
      const hasChildren = subtopic.subtopics && subtopic.subtopics.length > 0;
      const isExpanded = expandedSubtopics[subtopic.id];
      const completion = subtopic.cachedCompletion || 0;
      const isCompleted = subtopic.status === 'completed';

      return (
        <div key={subtopic.id} className="mb-2" style={{ marginLeft: `${level * 24}px` }}>
          <div className="flex items-start gap-2 p-3 bg-white dark:bg-gray-900 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group">
            {hasChildren ? (
              <button
                onClick={() => toggleExpanded(subtopic.id)}
                className="mt-1 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              >
                {isExpanded ? <ChevronDown size={16} className="text-gray-600 dark:text-gray-400" /> : <ChevronRight size={16} className="text-gray-600 dark:text-gray-400" />}
              </button>
            ) : (
              <div className="w-6" />
            )}
            <input
              type="checkbox"
              checked={isCompleted}
              onChange={() => toggleSubtopic(subtopic.id)}
              className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer transition-transform group-hover:scale-110"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3 mb-1">
                <span
                  className={`text-sm font-medium transition-all ${
                    isCompleted ? 'line-through opacity-50 text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {subtopic.name}
                </span>
                <div className="flex items-center gap-2">
                  {hasChildren && (
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {completion.toFixed(0)}%
                    </span>
                  )}
                  {/* Action buttons - visible on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={() => handleCreateSubtopic(subtopic)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                      title="Add nested subtopic"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => handleEditSubtopic(subtopic)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Edit subtopic"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteSubtopic(subtopic.id)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete subtopic"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
              {hasChildren && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${completion}%`,
                      background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          {hasChildren && isExpanded && (
            <div className="mt-2">
              {renderSubtopicTree(subtopic.subtopics, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_progress':
        return 'border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'completed':
        return 'border-green-500 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'on_hold':
        return 'border-yellow-500 text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'reviewing':
        return 'border-purple-500 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20';
      default:
        return 'border-gray-500 text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'border-yellow-500 text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'border-green-500 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      default:
        return 'border-gray-500 text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      case 'intermediate':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400';
      case 'advanced':
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400';
      case 'expert':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400';
    }
  };

  // Default layout for the cards
  const defaultLayout = [
    { i: 'basic-info', x: 0, y: 0, w: 6, h: 5, minW: 4, minH: 4, cardType: 'info' },
    { i: 'time-spent', x: 6, y: 0, w: 6, h: 5, minW: 4, minH: 4, cardType: 'stat' },
    { i: 'subject-details', x: 0, y: 5, w: 6, h: 4, minW: 4, minH: 3, cardType: 'info' },
    { i: 'relationships', x: 6, y: 5, w: 6, h: 4, minW: 4, minH: 3, cardType: 'list' },
    { i: 'subtopics', x: 0, y: 9, w: 12, h: 6, minW: 6, minH: 5, cardType: 'list' },
    { i: 'practice-sessions', x: 0, y: 15, w: 12, h: 6, minW: 6, minH: 5, cardType: 'list' },
    { i: 'knowledge-base', x: 0, y: 21, w: 6, h: 5, minW: 4, minH: 4, cardType: 'list' },
    { i: 'resources', x: 6, y: 21, w: 6, h: 5, minW: 4, minH: 4, cardType: 'list' },
  ];

  // Card components
  const cards = [
    // Basic Info Card
    <Card key="basic-info" className="dark:!bg-black shadow-lg">
      <Card.Header>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Subject Information
          </h3>
          <Button size="sm" variant="secondary" onClick={handleEditSubject}>
            <Edit size={14} />
            Edit
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="space-y-6">
          {/* Subject Name with Icon */}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="text-3xl">{subject.icon?.value || '📚'}</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {subject.name}
              </h2>
              {subject.instructor && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  by {subject.instructor}
                </p>
              )}
            </div>
            <div
              className="w-8 h-8 rounded-full flex-shrink-0"
              style={{ backgroundColor: subject.colorCode || '#3B82F6' }}
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Status</label>
              <Badge className={`${getStatusColor(subject.status)}`}>
                {subject.status?.replace('_', ' ')}
              </Badge>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Priority</label>
              <Badge className={`${getPriorityColor(subject.priority)}`}>
                {subject.priority || 'medium'}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Description</label>
            <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
              {subject.description || 'No description provided'}
            </p>
          </div>
        </div>
      </Card.Body>
    </Card>,

    // Time Spent Card (same as project page)
    <Card key="time-spent" className="dark:!bg-black shadow-lg">
      <Card.Header>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Time Spent
          </h3>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="space-y-5 overflow-hidden">
          {/* Filter Controls */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between gap-4 min-h-[40px]">
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                  Filter By
                </label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={timeFilterType === 'all' ? 'primary' : 'secondary'}
                    onClick={() => {
                      setTimeFilterType('all');
                      setSelectedWeek(null);
                      setSelectedMonth(null);
                    }}
                  >
                    All Time
                  </Button>
                  <Button
                    size="sm"
                    variant={timeFilterType === 'week' ? 'primary' : 'secondary'}
                    onClick={() => {
                      setTimeFilterType('week');
                      setSelectedWeek(timeStats.currentWeek);
                    }}
                  >
                    Week
                  </Button>
                  <Button
                    size="sm"
                    variant={timeFilterType === 'month' ? 'primary' : 'secondary'}
                    onClick={() => {
                      setTimeFilterType('month');
                      setSelectedMonth(timeStats.currentMonth);
                    }}
                  >
                    Month
                  </Button>
                </div>
              </div>

              <div className="min-w-[200px]">
                {timeFilterType === 'week' && (
                  <select
                    value={selectedWeek !== null ? selectedWeek : timeStats.currentWeek}
                    onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    {Array.from({ length: timeStats.availableWeeks }, (_, i) => (
                      <option key={i} value={i}>
                        Week {i + 1} {i === timeStats.currentWeek && '(Current)'}
                      </option>
                    ))}
                  </select>
                )}

                {timeFilterType === 'month' && (
                  <select
                    value={selectedMonth !== null ? selectedMonth : timeStats.currentMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    {Array.from({ length: timeStats.availableMonths }, (_, i) => (
                      <option key={i} value={i}>
                        Month {i + 1} {i === timeStats.currentMonth && '(Current)'}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Displayed Time */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5">
            {timeFilterType === 'all' ? (
              <>
                <label className="text-xs font-medium text-blue-600 dark:text-blue-400 block mb-2 uppercase tracking-wide">
                  Total Time
                </label>
                <p className="text-4xl font-bold text-blue-700 dark:text-blue-300">
                  {timeStats.total.hours}h {timeStats.total.minutes}m
                </p>
              </>
            ) : (
              <div className="flex items-center justify-between gap-6">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide">
                    {timeFilterType === 'week'
                      ? `Week ${(selectedWeek !== null ? selectedWeek : timeStats.currentWeek) + 1}`
                      : `Month ${(selectedMonth !== null ? selectedMonth : timeStats.currentMonth) + 1}`
                    }
                  </span>
                  <span className="text-4xl font-bold text-blue-700 dark:text-blue-300">
                    {timeStats.filtered.hours}h {timeStats.filtered.minutes}m
                  </span>
                </div>

                <div className="flex flex-col text-right">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide">
                    Total
                  </span>
                  <span className="text-4xl font-bold text-blue-700 dark:text-blue-300">
                    {timeStats.total.hours}h {timeStats.total.minutes}m
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Session Statistics */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg p-3 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)' }}>
                <p className="text-xl font-bold text-white">
                  {timeStats.maxSession.hours}h {timeStats.maxSession.minutes}m
                </p>
                <p className="text-xs font-medium text-white uppercase tracking-wide">
                  Max Session
                </p>
              </div>

              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {timeStats.totalSessions}
                </p>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Total Sessions
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>,

    // Subject Details Card
    <Card key="subject-details" className="dark:!bg-black shadow-lg">
      <Card.Header>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Subject Details
        </h3>
      </Card.Header>
      <Card.Body>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Category</label>
              <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                {subject.category || 'N/A'}
              </p>
            </div>

            {/* Difficulty */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Difficulty</label>
              <Badge className={`${getDifficultyColor(subject.difficultyLevel)} capitalize`}>
                {subject.difficultyLevel || 'beginner'}
              </Badge>
            </div>

            {/* Platform */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Platform</label>
              <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                {subject.platform || 'N/A'}
              </p>
            </div>

            {/* Language */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Language</label>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {subject.language || 'English'}
              </p>
            </div>
          </div>

          {/* Course URL */}
          {subject.courseUrl && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <label className="text-xs font-medium text-blue-600 dark:text-blue-400 block mb-2">Course URL</label>
              <a
                href={subject.courseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
              >
                {subject.courseUrl}
              </a>
            </div>
          )}

          {/* Certification */}
          {subject.certification && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
              <label className="text-xs font-medium text-purple-600 dark:text-purple-400 block mb-2">Certification</label>
              <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                {subject.certification}
              </p>
            </div>
          )}

          {/* Cost */}
          {subject.cost && !subject.cost.isFree && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <label className="text-xs font-medium text-green-600 dark:text-green-400 block mb-2">Cost</label>
              <p className="text-sm font-bold text-green-900 dark:text-green-200">
                {subject.cost.currency} {subject.cost.amount}
              </p>
            </div>
          )}
          {subject.cost && subject.cost.isFree && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <label className="text-xs font-medium text-green-600 dark:text-green-400 block mb-2">Cost</label>
              <Badge className="bg-green-600 text-white">Free</Badge>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>,

    // Subtopics Card
    <Card key="subtopics" className="dark:!bg-black shadow-lg">
      <Card.Header>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Subtopics
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {subject.completedSubtopicsCount || subject.subtopics?.filter(st => st.completed).length || 0} / {subject.totalSubtopicsCount || subject.subtopics?.length || 0}
            </Badge>
            {(subject.completionPercentage || 0) > 0 && (
              <Badge variant="primary" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none">
                {(subject.completionPercentage || 0).toFixed(0)}%
              </Badge>
            )}
            <Button size="sm" variant="primary" onClick={handleCreateSubtopic}>
              <Plus size={16} />
              New
            </Button>
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        {subject.subtopics && subject.subtopics.length > 0 ? (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {renderSubtopicTree(subject.subtopics)}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg font-medium mb-2">No subtopics yet</p>
            <p className="text-sm">Add subtopics to track your learning progress</p>
          </div>
        )}
      </Card.Body>
    </Card>,

    // Knowledge Base Card
    <Card key="knowledge-base" className="dark:!bg-black shadow-lg">
      <Card.Header>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Knowledge Base
        </h3>
      </Card.Header>
      <Card.Body>
        {subject.knowledgeBaseLinks && subject.knowledgeBaseLinks.length > 0 ? (
          <div className="space-y-3">
            {subject.knowledgeBaseLinks.map((link, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {link.label}
                  </p>
                  <Badge variant="outline" className="text-xs mt-1">
                    {link.type}
                  </Badge>
                </div>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-3 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                >
                  Open →
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg font-medium mb-2">No knowledge base links</p>
            <p className="text-sm">Add documentation, articles, and reference materials</p>
          </div>
        )}
      </Card.Body>
    </Card>,

    // Resources Card
    <Card key="resources" className="dark:!bg-black shadow-lg">
      <Card.Header>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Main Resources
        </h3>
      </Card.Header>
      <Card.Body>
        {subject.resourceLinks && subject.resourceLinks.length > 0 ? (
          <div className="space-y-3">
            {subject.resourceLinks.map((link, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 min-w-0">
                  {link.label}
                </p>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-3 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                >
                  Open →
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg font-medium mb-2">No resource links</p>
            <p className="text-sm">Add course playlists, tutorials, and learning materials</p>
          </div>
        )}
      </Card.Body>
    </Card>,

    // Practice Sessions Card
    <Card key="practice-sessions" className="dark:!bg-black shadow-lg">
      <Card.Header>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 size={20} className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Practice Sessions
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {practiceStats && (
              <Badge variant="secondary">
                {practiceStats.totalSessions} sessions
              </Badge>
            )}
            <Button size="sm" variant="primary" onClick={handleCreatePracticeSession}>
              <Plus size={16} />
              New
            </Button>
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        {/* Practice Stats Summary */}
        {practiceStats && practiceStats.totalSessions > 0 && (
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Total Time</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                {Math.floor(practiceStats.totalDuration / 3600)}h {Math.floor((practiceStats.totalDuration % 3600) / 60)}m
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Problems</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-300">
                {practiceStats.totalProblemsSolved}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">Avg Duration</p>
              <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                {Math.floor(practiceStats.averageDuration / 60)}m
              </p>
            </div>
          </div>
        )}

        {/* Practice Sessions List */}
        {practiceSessions && practiceSessions.length > 0 ? (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {practiceSessions.map((session) => (
              <div
                key={session.id}
                className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      {session.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <Clock size={12} />
                      <span>
                        {Math.floor(session.duration / 3600)}h {Math.floor((session.duration % 3600) / 60)}m
                      </span>
                      <span className="text-gray-400 dark:text-gray-600">•</span>
                      <span className="capitalize">{session.practiceType.replace('_', ' ')}</span>
                      <span className="text-gray-400 dark:text-gray-600">•</span>
                      <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePracticeSession(session.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500 transition-all"
                    title="Delete session"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {session.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {session.description}
                  </p>
                )}

                {/* Metrics */}
                <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {session.problemsSolved > 0 && (
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                      {session.problemsSolved} problems
                    </span>
                  )}
                  {session.tasksCompleted > 0 && (
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                      {session.tasksCompleted} tasks
                    </span>
                  )}
                  {session.pagesRead > 0 && (
                    <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                      {session.pagesRead} pages
                    </span>
                  )}
                </div>

                {/* Resource Links */}
                {session.resourceLinks && session.resourceLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {session.resourceLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <ExternalLink size={12} />
                        {link.label || link.url}
                      </a>
                    ))}
                  </div>
                )}

                {/* Tags */}
                {session.tags && session.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {session.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Code2 size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No practice sessions yet</p>
            <p className="text-sm mb-4">Track your coding practice, problem solving, and hands-on learning</p>
            <Button size="sm" variant="primary" onClick={handleCreatePracticeSession}>
              <Plus size={16} />
              Create First Session
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>,

    // Relationships Card
    <Card key="relationships" className="dark:!bg-black shadow-lg">
      <Card.Header>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Relationships & Tags
        </h3>
      </Card.Header>
      <Card.Body>
        <div className="space-y-5">
          {/* Tags */}
          {subject.tags && subject.tags.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-3 uppercase tracking-wide">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {subject.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Prerequisites */}
          {subject.prerequisites && subject.prerequisites.length > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <label className="text-xs font-medium text-orange-600 dark:text-orange-400 block mb-3 uppercase tracking-wide">
                Prerequisites
              </label>
              <div className="flex flex-wrap gap-2">
                {subject.prerequisites.map((prereqId, idx) => {
                  const prereq = subjects?.find(s => s.id === prereqId);
                  return prereq ? (
                    <Badge key={idx} variant="secondary">
                      {prereq.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Related Subjects */}
          {subject.relatedSubjects && subject.relatedSubjects.length > 0 && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <label className="text-xs font-medium text-purple-600 dark:text-purple-400 block mb-3 uppercase tracking-wide">
                Related Subjects
              </label>
              <div className="flex flex-wrap gap-2">
                {subject.relatedSubjects.map((relId, idx) => {
                  const rel = subjects?.find(s => s.id === relId);
                  return rel ? (
                    <Badge key={idx} variant="secondary">
                      {rel.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          {subject.notes && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-3 uppercase tracking-wide">
                Notes
              </label>
              <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                {subject.notes}
              </p>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>,
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              size="sm"
              variant="secondary"
              onClick={closeSubjectPage}
              title="Back to Subjects"
            >
              <ArrowLeft size={18} />
            </Button>
            <div className="flex items-center gap-3">
              <div className="text-2xl">{subject.icon?.value || '📚'}</div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {subject.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isEditMode ? 'primary' : 'secondary'}
              onClick={toggleEditMode}
              title="Toggle grid layout edit mode"
            >
              <Edit2 size={16} />
              {isEditMode ? 'Done' : 'Edit Layout'}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Stats Banner */}
      {progressData && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-6 py-6">
            {/* Overall Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Award className="text-blue-600 dark:text-blue-400" size={24} />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Overall Progress</h3>
                </div>
                <div className="text-3xl font-bold text-gradient">
                  {progressData.overallProgress.toFixed(0)}%
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden mb-2">
                <div
                  className="h-3 rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${progressData.overallProgress}%`,
                    background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)'
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{progressData.completedCount} / {progressData.totalCount} completed</span>
                <span>{progressData.remainingCount} remaining</span>
              </div>
            </div>

            {/* Level Stats and Next Recommended */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Level Stats */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Progress by Level</h4>
                <div className="space-y-2">
                  {progressData.levelStats && progressData.levelStats.length > 0 ? (
                    progressData.levelStats.map((levelStat) => (
                      <div key={levelStat.level} className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Level {levelStat.level + 1}
                        </span>
                        <div className="flex items-center gap-2 flex-1 ml-3">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-2 rounded-full transition-all duration-500"
                              style={{
                                width: `${levelStat.percentage}%`,
                                background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)'
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 min-w-[60px] text-right">
                            {levelStat.completed}/{levelStat.total} ({levelStat.percentage.toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">No level stats available</p>
                  )}
                </div>
              </div>

              {/* Next Recommended Subtopic */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="text-green-600 dark:text-green-400" size={18} />
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Next Recommended</h4>
                </div>
                {progressData.nextRecommendedSubtopic ? (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {progressData.nextRecommendedSubtopic.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Level {progressData.nextRecommendedSubtopic.level + 1}
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">
                      🎉 All subtopics completed!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editable Grid Layout */}
      <div className="min-h-[calc(100vh-73px)] overflow-y-auto">
        <EditableGridLayout
          boardId={`subject-${subjectId}`}
          boardName={subject.name}
          defaultLayout={defaultLayout}
          isEditMode={isEditMode}
        >
          {cards}
        </EditableGridLayout>
      </div>

      {/* Subject Edit Modal */}
      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        onSubmit={handleUpdateSubject}
        subject={subject}
        subjects={subjects || []}
        projects={[]}
      />

      {/* Subtopic Create/Edit Modal */}
      <SubtopicModal
        isOpen={isSubtopicModalOpen}
        onClose={() => {
          setIsSubtopicModalOpen(false);
          setEditingSubtopic(null);
          setParentSubtopic(null);
        }}
        onSubmit={handleSubtopicSubmit}
        parentSubtopic={parentSubtopic}
        editingSubtopic={editingSubtopic}
        allSubtopics={subject?.subtopics || []}
      />

      {/* Practice Session Modal */}
      <PracticeSessionModal
        isOpen={isPracticeModalOpen}
        onClose={() => setIsPracticeModalOpen(false)}
        onSubmit={handlePracticeSessionSubmit}
        subjectId={subjectId}
      />
    </div>
  );
};

export default SubjectPage;
