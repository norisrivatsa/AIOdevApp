import { useSessionStats } from '../hooks/useSessions';
import { useProgress, useStreaks } from '../hooks/useAnalytics';
import { useCourses } from '../hooks/useCourses';
import { useProjects } from '../hooks/useProjects';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Progress from '../components/ui/Progress';
import EditableGridLayout from '../components/layout/EditableGridLayout';
import { Clock, BookOpen, FolderGit2, Flame } from 'lucide-react';
import { formatDuration } from '../utils/date';
import { COURSE_STATUS, PROJECT_STATUS } from '../utils/constants';

const DashboardBoard = () => {
  const { data: stats, isLoading: statsLoading } = useSessionStats();
  const { data: progress, isLoading: progressLoading } = useProgress();
  const { data: streaks, isLoading: streaksLoading } = useStreaks();
  const { data: courses, isLoading: coursesLoading } = useCourses(COURSE_STATUS.IN_PROGRESS);
  const { data: projects, isLoading: projectsLoading } = useProjects(PROJECT_STATUS.ACTIVE);

  // Default layout for dashboard cards
  const defaultLayout = [
    { i: 'time-today', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2, cardType: 'stat' },
    { i: 'active-courses-stat', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2, cardType: 'stat' },
    { i: 'active-projects-stat', x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2, cardType: 'stat' },
    { i: 'current-streak', x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2, cardType: 'stat' },
    { i: 'courses-list', x: 0, y: 2, w: 6, h: 4, minW: 4, minH: 3, cardType: 'list' },
    { i: 'projects-list', x: 6, y: 2, w: 6, h: 4, minW: 4, minH: 3, cardType: 'list' },
  ];

  if (statsLoading || progressLoading || streaksLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  // Prepare cards as individual components
  const cards = [
    // Time Today Card
    <Card key="time-today">
      <Card.Body>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Time Today</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {formatDuration(stats?.today || 0)}
            </p>
          </div>
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <Clock className="text-gray-700 dark:text-gray-300" size={24} />
          </div>
        </div>
      </Card.Body>
    </Card>,

    // Active Courses Stat Card
    <Card key="active-courses-stat">
      <Card.Body>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Courses</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {progress?.coursesByStatus?.in_progress || 0}
            </p>
          </div>
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
            <BookOpen className="text-emerald-600 dark:text-emerald-300" size={24} />
          </div>
        </div>
      </Card.Body>
    </Card>,

    // Active Projects Stat Card
    <Card key="active-projects-stat">
      <Card.Body>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Projects</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {progress?.projectsByStatus?.active || 0}
            </p>
          </div>
          <div className="p-3 bg-violet-100 dark:bg-violet-900 rounded-lg">
            <FolderGit2 className="text-violet-600 dark:text-violet-300" size={24} />
          </div>
        </div>
      </Card.Body>
    </Card>,

    // Current Streak Card
    <Card key="current-streak">
      <Card.Body>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Current Streak</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {streaks?.currentStreak || 0} days
            </p>
          </div>
          <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-lg">
            <Flame className="text-amber-600 dark:text-amber-300" size={24} />
          </div>
        </div>
      </Card.Body>
    </Card>,

    // Courses List Card
    <Card key="courses-list" className="dark:!bg-black">
      <Card.Header>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Active Courses
        </h3>
      </Card.Header>
      <Card.Body>
        {coursesLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : courses && courses.length > 0 ? (
          <div className="space-y-3">
            {courses.slice(0, 5).map((course) => {
              const completed = course.subtopics?.filter(s => s.completed).length || 0;
              const total = course.subtopics?.length || 0;
              const percentage = total > 0 ? (completed / total) * 100 : 0;

              return (
                <div key={course.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {course.title}
                    </h4>
                    <Badge variant="primary" size="sm">
                      {completed}/{total}
                    </Badge>
                  </div>
                  <Progress value={percentage} max={100} />
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500">No active courses</p>
        )}
      </Card.Body>
    </Card>,

    // Projects List Card
    <Card key="projects-list" className="dark:!bg-black">
      <Card.Header>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Active Projects
        </h3>
      </Card.Header>
      <Card.Body>
        {projectsLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : projects && projects.length > 0 ? (
          <div className="space-y-3">
            {projects.slice(0, 5).map((project) => (
              <div key={project.id} className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {project.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {project.description}
                  </p>
                </div>
                <Badge variant="info" size="sm">{project.status}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No active projects</p>
        )}
      </Card.Body>
    </Card>,
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-black">
      {/* Header - Outside of grid */}
      <div className="flex-none p-8 pb-4">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of your learning progress and activities
        </p>
      </div>

      {/* Editable Grid Layout */}
      <div className="flex-1 overflow-hidden">
        <EditableGridLayout
          boardId="dashboard"
          boardName="Dashboard"
          defaultLayout={defaultLayout}
        >
          {cards}
        </EditableGridLayout>
      </div>
    </div>
  );
};

export default DashboardBoard;
