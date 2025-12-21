import { useState } from 'react';
import {
  useCourses,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
} from '../hooks/useCourses';
import useUIStore from '../stores/uiStore';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Progress from '../components/ui/Progress';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import {
  COURSE_STATUS,
  COURSE_STATUS_LABELS,
  COURSE_STATUS_COLORS,
} from '../utils/constants';
import { Plus, Pencil, Trash2, BookOpen, Filter, X } from 'lucide-react';

const CoursesBoard = () => {
  const [statusFilter, setStatusFilter] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { openCourseModal } = useUIStore();
  const { data: courses, isLoading } = useCourses(statusFilter);
  const deleteCourse = useDeleteCourse();

  const handleCreateCourse = () => {
    openCourseModal();
  };

  const handleEditCourse = (courseId, e) => {
    e.stopPropagation();
    openCourseModal(courseId);
  };

  const handleDeleteCourse = (courseId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this course?')) {
      deleteCourse.mutate(courseId);
    }
  };

  const handleViewDetails = (course) => {
    setSelectedCourse(course);
    setIsDetailModalOpen(true);
  };

  const getStatusBadgeVariant = (status) => {
    const statusVariantMap = {
      [COURSE_STATUS.NOT_STARTED]: 'default',
      [COURSE_STATUS.IN_PROGRESS]: 'info',
      [COURSE_STATUS.COMPLETED]: 'success',
      [COURSE_STATUS.ON_HOLD]: 'warning',
    };
    return statusVariantMap[status] || 'default';
  };

  const calculateProgress = (course) => {
    if (!course.subtopics || course.subtopics.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }
    const completed = course.subtopics.filter((s) => s.completed).length;
    const total = course.subtopics.length;
    const percentage = (completed / total) * 100;
    return { completed, total, percentage };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-gray-400">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-black">
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Courses
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your learning courses and track progress
          </p>
        </div>
        <button
          className="btn-gradient px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          onClick={handleCreateCourse}
        >
          <Plus size={20} />
          New Course
        </button>
      </div>

      {/* Filter Section */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter by status:
          </span>
        </div>
        <button
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            statusFilter === null
              ? 'btn-gradient text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          onClick={() => setStatusFilter(null)}
        >
          All
        </button>
        {Object.entries(COURSE_STATUS).map(([key, value]) => (
          <button
            key={value}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              statusFilter === value
                ? 'btn-gradient text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            onClick={() => setStatusFilter(value)}
          >
            {COURSE_STATUS_LABELS[value]}
          </button>
        ))}
        {statusFilter && (
          <button
            className="ml-2 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-1"
            onClick={() => setStatusFilter(null)}
          >
            <X size={16} />
            Clear
          </button>
        )}
      </div>

      {/* Courses Grid */}
      {courses && courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const progress = calculateProgress(course);
            return (
              <Card
                key={course.id}
                hoverable
                onClick={() => handleViewDetails(course)}
                className="flex flex-col"
              >
                <Card.Header className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
                      <BookOpen
                        size={24}
                        className="text-blue-600 dark:text-blue-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {course.title}
                      </h3>
                      <Badge
                        variant={getStatusBadgeVariant(course.status)}
                        size="sm"
                        className="mt-2"
                      >
                        {COURSE_STATUS_LABELS[course.status]}
                      </Badge>
                    </div>
                  </div>
                </Card.Header>

                <Card.Body className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
                    {course.description || 'No description provided'}
                  </p>

                  {/* Progress Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        Progress
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {progress.completed} / {progress.total} subtopics
                      </span>
                    </div>
                    <Progress value={progress.percentage} max={100} />
                    <div className="text-right">
                      <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                        {Math.round(progress.percentage)}%
                      </span>
                    </div>
                  </div>
                </Card.Body>

                <Card.Footer className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleEditCourse(course.id, e)}
                  >
                    <Pencil size={16} className="mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDeleteCourse(course.id, e)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={16} className="mr-1" />
                    Delete
                  </Button>
                </Card.Footer>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <Card>
          <Card.Body className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <BookOpen
                  size={48}
                  className="text-gray-400 dark:text-gray-500"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No courses found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                {statusFilter
                  ? `No courses with status "${COURSE_STATUS_LABELS[statusFilter]}". Try adjusting your filters or create a new course.`
                  : 'Get started by creating your first course to track your learning journey.'}
              </p>
              <Button variant="primary" size="md" onClick={handleCreateCourse}>
                <Plus size={20} className="mr-2" />
                Create Your First Course
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Course Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedCourse?.title || 'Course Details'}
        size="lg"
      >
        {selectedCourse && (
          <div className="space-y-6">
            {/* Course Info */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <div className="mt-1">
                  <Badge
                    variant={getStatusBadgeVariant(selectedCourse.status)}
                    size="md"
                  >
                    {COURSE_STATUS_LABELS[selectedCourse.status]}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  {selectedCourse.description || 'No description provided'}
                </p>
              </div>

              {/* Overall Progress */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Overall Progress
                </label>
                <div className="space-y-2">
                  <Progress
                    value={calculateProgress(selectedCourse).percentage}
                    max={100}
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {calculateProgress(selectedCourse).completed} of{' '}
                      {calculateProgress(selectedCourse).total} subtopics completed
                    </span>
                    <span className="font-semibold text-primary-600 dark:text-primary-400">
                      {Math.round(calculateProgress(selectedCourse).percentage)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Subtopics Section */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Subtopics
              </h4>
              {selectedCourse.subtopics && selectedCourse.subtopics.length > 0 ? (
                <div className="space-y-2">
                  {selectedCourse.subtopics.map((subtopic, index) => (
                    <div
                      key={subtopic.id || index}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          subtopic.completed
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {subtopic.completed && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-medium ${
                            subtopic.completed
                              ? 'text-gray-500 dark:text-gray-400 line-through'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {subtopic.title}
                        </p>
                        {subtopic.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {subtopic.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">
                    No subtopics added yet
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleEditCourse(selectedCourse.id, { stopPropagation: () => {} });
                }}
              >
                <Pencil size={16} className="mr-2" />
                Edit Course
              </Button>
            </div>
          </div>
        )}
      </Modal>
      </div>
    </div>
  );
};

export default CoursesBoard;
