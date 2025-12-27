import { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, Edit2, Settings, Moon, Sun, Edit, ChevronLeft, ChevronRight, Eye, X, Plus } from 'lucide-react';
import { useProjects, usePartialUpdateProject } from '../hooks/useProjects';
import { useSessions } from '../hooks/useSessions';
import useUIStore from '../stores/uiStore';
import useSettingsStore from '../stores/settingsStore';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import EditableGridLayout from '../components/layout/EditableGridLayout';
import CardEditModal from '../components/projects/CardEditModal';

const ProjectPage = ({ projectId }) => {
  const { data: projects } = useProjects();
  const { data: sessions } = useSessions({ type: 'project', referenceId: projectId });
  const { closeProjectPage, openProjectModal, openSettings, isEditMode, toggleEditMode } = useUIStore();
  const { theme, toggleTheme } = useSettingsStore();
  const { mutate: partialUpdateProject } = usePartialUpdateProject();
  const [project, setProject] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [isCardEditModalOpen, setIsCardEditModalOpen] = useState(false);
  const [timeFilterType, setTimeFilterType] = useState('all'); // 'all', 'week', 'month'
  const [selectedWeek, setSelectedWeek] = useState(null); // Will be set to current week
  const [selectedMonth, setSelectedMonth] = useState(null); // Will be set to current month

  // Documentation page navigation
  const [docCurrentPage, setDocCurrentPage] = useState(0); // 0 = README, 1+ = notes
  const [isFullScreenEditorOpen, setIsFullScreenEditorOpen] = useState(false);
  const [isFullScreenViewOpen, setIsFullScreenViewOpen] = useState(false);
  const [fullScreenContent, setFullScreenContent] = useState({ title: '', content: '', field: '' });
  const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');

  useEffect(() => {
    if (projects && projectId) {
      const found = projects.find(p => p.id === projectId);
      setProject(found);
    }
  }, [projects, projectId]);

  // Calculate time statistics from sessions with filtering
  const timeStats = useMemo(() => {
    if (!sessions || sessions.length === 0 || !project) {
      return {
        total: { hours: 0, minutes: 0 },
        filtered: { hours: 0, minutes: 0 },
        availableWeeks: 0,
        availableMonths: 0,
        currentWeek: 0,
        currentMonth: 0,
        maxSession: { hours: 0, minutes: 0 },
        totalSessions: 0,
      };
    }

    const projectStart = project.startDate ? new Date(project.startDate) : new Date(Math.min(...sessions.map(s => new Date(s.startTime))));
    const now = new Date();

    // Calculate available weeks and months
    const timeDiff = now.getTime() - projectStart.getTime();
    const availableWeeks = Math.max(1, Math.ceil(timeDiff / (7 * 24 * 60 * 60 * 1000)));
    const availableMonths = Math.max(1, Math.ceil(timeDiff / (30 * 24 * 60 * 60 * 1000)));

    // Calculate current week and month (0-indexed)
    const currentWeek = Math.max(0, availableWeeks - 1);
    const currentMonth = Math.max(0, availableMonths - 1);

    const toHoursMinutes = (seconds) => ({
      hours: Math.floor(seconds / 3600),
      minutes: Math.floor((seconds % 3600) / 60),
    });

    // Total time
    const totalSeconds = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);

    // Max session duration
    const maxSessionSeconds = Math.max(...sessions.map(s => s.duration || 0));

    // Filtered time based on selection
    let filteredSeconds = totalSeconds;

    if (timeFilterType === 'week') {
      const weekIndex = selectedWeek !== null ? selectedWeek : currentWeek;
      const weekStart = new Date(projectStart.getTime() + weekIndex * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      filteredSeconds = sessions
        .filter(s => {
          const sessionDate = new Date(s.startTime);
          return sessionDate >= weekStart && sessionDate < weekEnd;
        })
        .reduce((sum, s) => sum + (s.duration || 0), 0);
    } else if (timeFilterType === 'month') {
      const monthIndex = selectedMonth !== null ? selectedMonth : currentMonth;
      const monthStart = new Date(projectStart.getTime() + monthIndex * 30 * 24 * 60 * 60 * 1000);
      const monthEnd = new Date(monthStart.getTime() + 30 * 24 * 60 * 60 * 1000);
      filteredSeconds = sessions
        .filter(s => {
          const sessionDate = new Date(s.startTime);
          return sessionDate >= monthStart && sessionDate < monthEnd;
        })
        .reduce((sum, s) => sum + (s.duration || 0), 0);
    }

    return {
      total: toHoursMinutes(totalSeconds),
      filtered: toHoursMinutes(filteredSeconds),
      availableWeeks,
      availableMonths,
      currentWeek,
      currentMonth,
      maxSession: toHoursMinutes(maxSessionSeconds),
      totalSessions: sessions.length,
    };
  }, [sessions, project, timeFilterType, selectedWeek, selectedMonth]);

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading project...</p>
      </div>
    );
  }

  const handleEditProject = () => {
    openProjectModal(projectId);
  };

  const handleCardEdit = (cardId) => {
    setEditingCard(cardId);
    setIsCardEditModalOpen(true);
  };

  const handleSaveCardEdit = (updates) => {
    partialUpdateProject({
      id: projectId,
      updates: updates
    });
    setIsCardEditModalOpen(false);
    setEditingCard(null);
  };

  // Documentation page handlers
  const handleOpenEditor = (title, content, field) => {
    setFullScreenContent({ title, content, field });
    setIsFullScreenEditorOpen(true);
  };

  const handleOpenViewer = (title, content) => {
    setFullScreenContent({ title, content, field: '' });
    setIsFullScreenViewOpen(true);
  };

  const handleSaveEditor = (newContent) => {
    if (fullScreenContent.field === 'notes') {
      // Update specific note
      const updatedNotes = [...(project.notes || [])];
      updatedNotes[fullScreenContent.noteIndex] = {
        ...updatedNotes[fullScreenContent.noteIndex],
        content: newContent,
        updatedAt: new Date().toISOString()
      };
      partialUpdateProject({
        id: projectId,
        updates: { notes: updatedNotes }
      });
    } else {
      // Update other fields (readme, technicalNotes, motivation, learningGoals)
      partialUpdateProject({
        id: projectId,
        updates: { [fullScreenContent.field]: newContent }
      });
    }
    setIsFullScreenEditorOpen(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'completed':
        return 'border-green-500 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'hibernation':
        return 'border-purple-500 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20';
      case 'archived':
        return 'border-gray-500 text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
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

  // Default layout for the cards
  const defaultLayout = [
    { i: 'basic-info', x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3, cardType: 'info' },
    { i: 'time-spent', x: 6, y: 0, w: 6, h: 4, minW: 4, minH: 3, cardType: 'stat' },
    { i: 'github-kanban', x: 0, y: 4, w: 12, h: 6, minW: 6, minH: 4, cardType: 'kanban' },
    { i: 'tech-stack', x: 0, y: 10, w: 6, h: 4, minW: 4, minH: 3, cardType: 'list' },
    { i: 'completion', x: 6, y: 10, w: 6, h: 4, minW: 4, minH: 3, cardType: 'stat' },
    { i: 'documentation', x: 0, y: 14, w: 12, h: 5, minW: 6, minH: 4, cardType: 'text' },
    { i: 'resources', x: 0, y: 19, w: 6, h: 4, minW: 4, minH: 3, cardType: 'list' },
    { i: 'success-criteria', x: 6, y: 19, w: 6, h: 4, minW: 4, minH: 3, cardType: 'list' },
    { i: 'relationships', x: 0, y: 23, w: 12, h: 5, minW: 6, minH: 4, cardType: 'list' },
  ];

  // Card components
  const cards = [
    // Basic Info Card
    <Card key="basic-info" className="dark:!bg-black shadow-lg">
      <Card.Header>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Project Information
          </h3>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleCardEdit('basic-info')}
            title="Edit card content"
          >
            <Edit size={14} />
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="space-y-6">
          {/* Project Name */}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div
              className="w-8 h-8 rounded-full flex-shrink-0"
              style={{ backgroundColor: project.colorCode || '#3B82F6' }}
            />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {project.name}
            </h2>
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Status</label>
              <Badge className={`${getStatusColor(project.status)}`}>
                {project.status}
              </Badge>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Priority</label>
              <Badge className={`${getPriorityColor(project.priority)}`}>
                {project.priority || 'medium'}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Description</label>
            <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
              {project.description || 'No description provided'}
            </p>
          </div>
        </div>
      </Card.Body>
    </Card>,

    // Time Spent Card
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
          {/* Filter Controls - Single Row */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between gap-4 min-h-[40px]">
              {/* Left side - Label and Filter Buttons */}
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

              {/* Right side - Dropdown Selector (always reserves space) */}
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
              /* All Time - Single Display */
              <>
                <label className="text-xs font-medium text-blue-600 dark:text-blue-400 block mb-2 uppercase tracking-wide">
                  Total Time
                </label>
                <p className="text-4xl font-bold text-blue-700 dark:text-blue-300">
                  {timeStats.total.hours}h {timeStats.total.minutes}m
                </p>
              </>
            ) : (
              /* Week/Month - Split Display */
              <div className="flex items-center justify-between gap-6">
                {/* Left Side - Filtered Time */}
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

                {/* Right Side - Total Time */}
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
              {/* Max Session Time - Accent Background */}
              <div className="rounded-lg p-3 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)' }}>
                <p className="text-xl font-bold text-white">
                  {timeStats.maxSession.hours}h {timeStats.maxSession.minutes}m
                </p>
                <p className="text-xs font-medium text-white uppercase tracking-wide">
                  Max Session
                </p>
              </div>

              {/* Total Sessions */}
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

    // GitHub Kanban Card
    <Card key="github-kanban" className="dark:!bg-black shadow-lg">
      <Card.Header>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            GitHub Issues
          </h3>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleCardEdit('github-kanban')}
            title="Edit card content"
          >
            <Edit size={14} />
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {project.githubRepoUrl ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <a
                href={project.githubRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 truncate"
              >
                {project.githubRepoUrl}
              </a>
              <Badge variant="secondary">Coming Soon</Badge>
            </div>

            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="mb-2">GitHub integration coming soon</p>
              <p className="text-sm">We'll fetch and display issues here</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg font-medium mb-2">GitHub repo not linked</p>
            <p className="text-sm">Add a GitHub repository URL to enable issue tracking</p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleCardEdit('github-kanban')}
              className="mt-4"
            >
              Link Repository
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>,

    // Tech Stack Card
    <Card key="tech-stack" className="dark:!bg-black shadow-lg">
      <Card.Header>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tech Stack
          </h3>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleCardEdit('tech-stack')}
            title="Edit card content"
          >
            <Edit size={14} />
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="space-y-5 h-full flex flex-col">
          {/* Two Column Layout: Technologies and Project Type */}
          <div className="grid grid-cols-2 gap-4 flex-1">
            {/* Technologies - Left Column */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex flex-col h-full">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 block uppercase tracking-wide">
                Technologies
              </label>
              <div className="flex flex-wrap gap-2 flex-1">
                {project.techStack && project.techStack.length > 0 ? (
                  project.techStack.map((tech, idx) => (
                    <span key={idx} className="text-sm font-semibold text-gradient">
                      {tech}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No tech stack specified</p>
                )}
              </div>
            </div>

            {/* Project Type and Tags - Right Column */}
            <div className="flex flex-col gap-4 h-full">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex-1 flex flex-col">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 block uppercase tracking-wide">
                  Project Type
                </label>
                <div className="flex flex-wrap gap-2 flex-1 content-start">
                  {project.projectType && project.projectType.length > 0 ? (
                    project.projectType.map((type, idx) => (
                      <span key={idx} className="text-sm font-semibold text-gradient">
                        {type}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No project type specified</p>
                  )}
                </div>
              </div>

              {/* Tags - Under Project Type */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex-1 flex flex-col">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 block uppercase tracking-wide">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 flex-1 content-start">
                  {project.tags && project.tags.length > 0 ? (
                    project.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No tags specified</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>,

    // Completion Card
    <Card key="completion" className="dark:!bg-black shadow-lg">
      <Card.Header>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Completion
          </h3>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleCardEdit('completion')}
            title="Edit card content"
          >
            <Edit size={14} />
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="space-y-6">
          {/* Percentage Display */}
          <div className="text-center rounded-lg p-6" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)' }}>
            <div className="text-5xl font-bold mb-2 text-gradient">
              {project.completionPercentage || 0}%
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Complete</p>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full transition-all"
                style={{
                  width: `${project.completionPercentage || 0}%`,
                  background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)'
                }}
              />
            </div>
          </div>

          {/* Dates */}
          {(project.startDate || project.targetDate) && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {project.startDate && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex flex-col justify-center">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Start Date</label>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {new Date(project.startDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {project.targetDate && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex flex-col justify-center">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Target Date</label>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {new Date(project.targetDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card.Body>
    </Card>,

    // Documentation & Notes Card
    <Card key="documentation" className="dark:!bg-black shadow-lg" style={{ height: 'calc(100vh - 100px)' }}>
      <Card.Header>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Documentation & Notes
          </h3>
        </div>
      </Card.Header>
      <Card.Body className="flex flex-col p-0" style={{ height: 'calc(100% - 60px)' }}>
        <div className="flex h-full">
          {/* Left Sidebar - 20% width */}
          <div className="w-1/5 flex flex-col gap-4 p-4 border-r border-gray-200 dark:border-gray-700">
            {/* Motivation - 50% height */}
            <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Motivation
                </label>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenViewer('Motivation', project.motivation || 'No motivation added yet')}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    title="View"
                  >
                    <Eye size={14} className="text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleOpenEditor('Motivation', project.motivation || '', 'motivation')}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    title="Edit"
                  >
                    <Edit size={14} className="text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                  {project.motivation || 'No motivation added yet'}
                </p>
              </div>
            </div>

            {/* Learning Goals - 50% height */}
            <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Learning Goals
                </label>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenViewer('Learning Goals', project.learningGoals || 'No learning goals added yet')}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    title="View"
                  >
                    <Eye size={14} className="text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleOpenEditor('Learning Goals', project.learningGoals || '', 'learningGoals')}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    title="Edit"
                  >
                    <Edit size={14} className="text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                  {project.learningGoals || 'No learning goals added yet'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Content Area - 80% width */}
          <div className="w-4/5 flex flex-col">
            {/* Page Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {(() => {
                const notes = project.notes || [];
                const totalPages = 2 + notes.length + 1; // README + Technical Notes + Notes + Add New

                if (docCurrentPage === 0) {
                  /* Page 0: README */
                  return (
                    <div className="h-full flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white">README</h4>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenViewer('README', project.readme || 'No README added yet')}
                          >
                            <Eye size={16} />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleOpenEditor('README', project.readme || '', 'readme')}
                          >
                            <Edit size={16} />
                            Edit
                          </Button>
                        </div>
                      </div>
                      <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 overflow-y-auto">
                        <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                          {project.readme || 'No README content yet. Click Edit to add content.'}
                        </p>
                      </div>
                    </div>
                  );
                } else if (docCurrentPage === 1) {
                  /* Page 1: Technical Notes */
                  return (
                    <div className="h-full flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white">Technical Notes</h4>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenViewer('Technical Notes', project.technicalNotes || 'No notes added yet')}
                          >
                            <Eye size={16} />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleOpenEditor('Technical Notes', project.technicalNotes || '', 'technicalNotes')}
                          >
                            <Edit size={16} />
                            Edit
                          </Button>
                        </div>
                      </div>
                      <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 overflow-y-auto">
                        <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                          {project.technicalNotes || 'No technical notes yet. Click Edit to add content.'}
                        </p>
                      </div>
                    </div>
                  );
                } else if (docCurrentPage >= 2 && docCurrentPage < 2 + notes.length) {
                  /* Pages 2+: Individual Notes */
                  const noteIndex = docCurrentPage - 2;
                  const note = notes[noteIndex];
                  return (
                    <div className="h-full flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{note.title}</h4>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenViewer(note.title, note.content || 'No content yet')}
                          >
                            <Eye size={16} />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              const updatedNotes = [...notes];
                              setFullScreenContent({
                                title: note.title,
                                content: note.content,
                                field: 'notes',
                                noteIndex: noteIndex
                              });
                              setIsFullScreenEditorOpen(true);
                            }}
                          >
                            <Edit size={16} />
                            Edit
                          </Button>
                        </div>
                      </div>
                      <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 overflow-y-auto">
                        <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                          {note.content || 'No content yet. Click Edit to add content.'}
                        </p>
                      </div>
                    </div>
                  );
                } else {
                  /* Last Page: Add New Note */
                  return (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <Plus size={64} className="mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                        <h4 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Create New Note</h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Add a new note page to your documentation</p>
                        <Button
                          variant="primary"
                          onClick={() => {
                            setNewNoteTitle('');
                            setIsCreateNoteModalOpen(true);
                          }}
                        >
                          <Plus size={16} />
                          Create New Note
                        </Button>
                      </div>
                    </div>
                  );
                }
              })()}
            </div>

            {/* Footer - Page Navigation */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setDocCurrentPage(Math.max(0, docCurrentPage - 1))}
                disabled={docCurrentPage === 0}
              >
                <ChevronLeft size={16} />
                Previous
              </Button>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                Page {docCurrentPage + 1} of {2 + (project.notes?.length || 0) + 1}
              </div>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => setDocCurrentPage(docCurrentPage + 1)}
                disabled={docCurrentPage >= 2 + (project.notes?.length || 0)}
              >
                Next
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>,

    // Resources Card
    <Card key="resources" className="dark:!bg-black shadow-lg">
      <Card.Header>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Resources
          </h3>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleCardEdit('resources')}
            title="Edit card content"
          >
            <Edit size={14} />
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="space-y-5">
          {/* Quick Links */}
          {project.quickLinks && project.quickLinks.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-3 uppercase tracking-wide">
                Quick Links
              </label>
              <div className="space-y-2">
                {project.quickLinks.map((link, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{link.label}</span>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 truncate ml-3"
                    >
                      {link.url}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Design File Links */}
          {project.designFileLinks && project.designFileLinks.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-3 uppercase tracking-wide">
                Design Files
              </label>
              <div className="space-y-2">
                {project.designFileLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 truncate"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* External Issue Tracker */}
          {project.externalIssueTracker && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-3 uppercase tracking-wide">
                Issue Tracker
              </label>
              <a
                href={project.externalIssueTracker}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 truncate"
              >
                {project.externalIssueTracker}
              </a>
            </div>
          )}

          {/* Deployment URL */}
          {project.deploymentUrl && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <label className="text-xs font-medium text-green-600 dark:text-green-400 block mb-3 uppercase tracking-wide">
                Deployment
              </label>
              <a
                href={project.deploymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 truncate block"
              >
                {project.deploymentUrl}
              </a>
            </div>
          )}

          {/* Empty State */}
          {!project.quickLinks?.length && !project.designFileLinks?.length && !project.externalIssueTracker && !project.deploymentUrl && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No resources added yet</p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleCardEdit('resources')}
                className="mt-3"
              >
                Add Resources
              </Button>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>,

    // Success Criteria Card
    <Card key="success-criteria" className="dark:!bg-black shadow-lg">
      <Card.Header>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Success Criteria
          </h3>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleCardEdit('success-criteria')}
            title="Edit card content"
          >
            <Edit size={14} />
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {project.successCriteria && project.successCriteria.length > 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {project.successCriteria.map((criterion, idx) => (
                <label
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={criterion.completed}
                    onChange={(e) => {
                      const updatedCriteria = project.successCriteria.map((c, i) =>
                        i === idx ? { ...c, completed: e.target.checked } : c
                      );
                      partialUpdateProject({
                        id: projectId,
                        updates: { successCriteria: updatedCriteria }
                      });
                    }}
                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <span
                    className={`text-sm text-gray-900 dark:text-white flex-1 ${
                      criterion.completed ? 'line-through opacity-50' : ''
                    }`}
                  >
                    {criterion.text}
                  </span>
                </label>
              ))}
            </div>
            {/* Progress Indicator */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Progress</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">
                  {project.successCriteria.filter(c => c.completed).length} / {project.successCriteria.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${(project.successCriteria.filter(c => c.completed).length / project.successCriteria.length) * 100}%`,
                    background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)'
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg font-medium mb-2">No success criteria defined</p>
            <p className="text-sm mb-4">Add criteria to track your project goals</p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleCardEdit('success-criteria')}
            >
              Add Criteria
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>,

    // Organization & Relationships Card
    <Card key="relationships" className="dark:!bg-black shadow-lg">
      <Card.Header>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Organization & Relationships
          </h3>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleCardEdit('relationships')}
            title="Edit card content"
          >
            <Edit size={14} />
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="space-y-5">
          {/* Related Projects */}
          {project.relatedProjectIds && project.relatedProjectIds.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-3 uppercase tracking-wide">
                Related Projects
              </label>
              <div className="flex flex-wrap gap-2">
                {project.relatedProjectIds.map((id, idx) => {
                  const relatedProject = projects?.find(p => p.id === id);
                  return relatedProject ? (
                    <Badge key={idx} variant="secondary" className="text-sm">
                      {relatedProject.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Blockers */}
          {project.blockers && project.blockers.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <label className="text-xs font-medium text-red-600 dark:text-red-400 block mb-3 uppercase tracking-wide">
                Blockers
              </label>
              <div className="space-y-3">
                {project.blockers.map((blocker, idx) => (
                  <div key={idx} className="bg-white dark:bg-gray-900 rounded p-3">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm text-gray-900 dark:text-white">{blocker.description}</p>
                      <Badge className={`${getPriorityColor(blocker.priority)} ml-2`}>
                        {blocker.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Status: {blocker.status}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!project.relatedProjectIds?.length && !project.blockers?.length && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No relationships or blockers defined</p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleCardEdit('relationships')}
                className="mt-3"
              >
                Add Details
              </Button>
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
              onClick={closeProjectPage}
              title="Back to Projects"
            >
              <ArrowLeft size={18} />
            </Button>
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: project.colorCode || '#3B82F6' }}
              />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {project.name}
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
            <Button
              size="sm"
              variant="secondary"
              onClick={openSettings}
              title="Settings"
            >
              <Settings size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Editable Grid Layout */}
      <div className="min-h-[calc(100vh-73px)] overflow-y-auto">
        <EditableGridLayout
          boardId={`project-${projectId}`}
          boardName={project.name}
          defaultLayout={defaultLayout}
          isEditMode={isEditMode}
        >
          {cards}
        </EditableGridLayout>
      </div>

      {/* Card Edit Modal */}
      <CardEditModal
        isOpen={isCardEditModalOpen}
        onClose={() => {
          setIsCardEditModalOpen(false);
          setEditingCard(null);
        }}
        onSave={handleSaveCardEdit}
        cardType={editingCard}
        initialData={project}
        projectId={projectId}
      />

      {/* Full-Screen Editor Modal */}
      {isFullScreenEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full h-full max-w-7xl max-h-[90vh] rounded-lg flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit {fullScreenContent.title}
              </h3>
              <button
                onClick={() => setIsFullScreenEditorOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Editor Content */}
            <div className="flex-1 p-4 overflow-hidden">
              <textarea
                className="w-full h-full p-4 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                value={fullScreenContent.content}
                onChange={(e) => setFullScreenContent(prev => ({ ...prev, content: e.target.value }))}
                placeholder={`Enter ${fullScreenContent.title.toLowerCase()} content...`}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="secondary"
                onClick={() => setIsFullScreenEditorOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => handleSaveEditor(fullScreenContent.content)}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Viewer Modal */}
      {isFullScreenViewOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full h-full max-w-7xl max-h-[90vh] rounded-lg flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {fullScreenContent.title}
              </h3>
              <button
                onClick={() => setIsFullScreenViewOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Viewer Content */}
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-800">
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                  {fullScreenContent.content}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="secondary"
                onClick={() => setIsFullScreenViewOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Note Modal */}
      {isCreateNoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-lg flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create New Note
              </h3>
              <button
                onClick={() => setIsCreateNoteModalOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Input Content */}
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Note Title
              </label>
              <input
                type="text"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="Enter note title..."
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newNoteTitle.trim()) {
                    const newNote = {
                      id: Date.now().toString(),
                      title: newNoteTitle.trim(),
                      content: '',
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    };
                    const updatedNotes = [...(project.notes || []), newNote];
                    partialUpdateProject({
                      id: projectId,
                      updates: { notes: updatedNotes }
                    });
                    setIsCreateNoteModalOpen(false);
                    setNewNoteTitle('');
                  }
                }}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsCreateNoteModalOpen(false);
                  setNewNoteTitle('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (newNoteTitle.trim()) {
                    const newNote = {
                      id: Date.now().toString(),
                      title: newNoteTitle.trim(),
                      content: '',
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    };
                    const updatedNotes = [...(project.notes || []), newNote];
                    partialUpdateProject({
                      id: projectId,
                      updates: { notes: updatedNotes }
                    });
                    setIsCreateNoteModalOpen(false);
                    setNewNoteTitle('');
                  }
                }}
                disabled={!newNoteTitle.trim()}
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectPage;
