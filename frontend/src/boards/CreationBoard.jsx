import { useState } from 'react';
import { useSubjects, useCreateSubject } from '../hooks/useSubjects';
import { useProjects, useCreateProject } from '../hooks/useProjects';
import { usePractices } from '../hooks/usePractices';
import useUIStore from '../stores/uiStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EditableGridLayout from '../components/layout/EditableGridLayout';
import ProjectModal from '../components/projects/ProjectModal';
import SubjectModal from '../components/subjects/SubjectModal';
import { Plus, BookOpen, FolderGit2, Code2, ExternalLink } from 'lucide-react';

const CreationBoard = () => {
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: practices, isLoading: practicesLoading } = usePractices();
  const { mutate: createProject } = useCreateProject();
  const { mutate: createSubject } = useCreateSubject();
  const { openProjectPage, openSubjectPage } = useUIStore();

  // Modal state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

  // Custom column selectors for projects (4 columns)
  const [projectColumn1, setProjectColumn1] = useState('priority');
  const [projectColumn2, setProjectColumn2] = useState('techStack');
  const [projectColumn3, setProjectColumn3] = useState('completion');
  const [projectColumn4, setProjectColumn4] = useState('dates');

  // Custom column selectors for subjects (4 columns)
  const [subjectColumn1, setSubjectColumn1] = useState('priority');
  const [subjectColumn2, setSubjectColumn2] = useState('difficulty');
  const [subjectColumn3, setSubjectColumn3] = useState('platform');
  const [subjectColumn4, setSubjectColumn4] = useState('progress');

  // Handle project creation
  const handleCreateProject = (projectData) => {
    createProject(projectData);
    setIsProjectModalOpen(false);
  };

  // Handle subject creation
  const handleCreateSubject = (subjectData) => {
    createSubject(subjectData);
    setIsSubjectModalOpen(false);
  };

  // Navigate to subject page
  const handleOpenSubject = (subjectId) => {
    // TODO: Implement SubjectPage component
    console.log('Opening subject:', subjectId);
    // openSubjectPage(subjectId);
  };

  // Navigate to project page
  const handleOpenProject = (projectId) => {
    openProjectPage(projectId);
  };

  // Get field value for a project
  const getProjectFieldValue = (project, field) => {
    switch (field) {
      case 'priority':
        return (project.priority || 'medium').toUpperCase();
      case 'description':
        return project.description || '-';
      case 'techStack':
        return project.techStack?.length > 0 ? project.techStack.slice(0, 2).join(', ') : '-';
      case 'tags':
        return project.tags?.length > 0 ? project.tags.slice(0, 2).join(', ') : '-';
      case 'githubRepoUrl':
        return project.githubRepoUrl || project.repositoryUrl ? '🔗 Repo' : '-';
      case 'completion':
        return `${project.completionPercentage || 0}%`;
      case 'dates':
        if (project.targetDate) {
          return new Date(project.targetDate).toLocaleDateString();
        }
        return '-';
      case 'deployment':
        return project.deploymentStatus?.replace('_', ' ') || '-';
      default:
        return '-';
    }
  };

  // Get field value for a subject
  const getSubjectFieldValue = (subject, field) => {
    switch (field) {
      case 'priority':
        return (subject.priority || 'medium').toUpperCase();
      case 'difficulty':
        return subject.difficultyLevel || 'beginner';
      case 'platform':
        return subject.platform || '-';
      case 'category':
        return subject.category || '-';
      case 'instructor':
        return subject.instructor || '-';
      case 'progress':
        return `${subject.progress || 0}%`;
      case 'dates':
        if (subject.targetDate) {
          return new Date(subject.targetDate).toLocaleDateString();
        }
        return '-';
      case 'tags':
        return subject.tags?.length > 0 ? subject.tags.slice(0, 2).join(', ') : '-';
      default:
        return '-';
    }
  };

  // Get priority color classes
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

  // Get status color classes
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

  // Default layout for the 3 customizable cards
  const defaultLayout = [
    { i: 'subjects-section', x: 0, y: 0, w: 4, h: 6, minW: 3, minH: 4, cardType: 'list' },
    { i: 'projects-section', x: 4, y: 0, w: 4, h: 6, minW: 3, minH: 4, cardType: 'list' },
    { i: 'practices-section', x: 8, y: 0, w: 4, h: 6, minW: 3, minH: 4, cardType: 'list' },
  ];

  // Prepare cards as individual components
  const cards = [
    // Subjects Card
    <Card key="subjects-section" className="dark:!bg-black">
      <Card.Header>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="text-blue-500" size={20} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Subjects
            </h3>
          </div>
          <Button size="sm" variant="primary" onClick={() => setIsSubjectModalOpen(true)}>
            <Plus size={16} />
            New
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {subjectsLoading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading subjects...</p>
        ) : subjects && subjects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <div className="w-3" /> {/* Spacer for color circle */}
                      <span>Name</span>
                    </div>
                  </th>
                  <th className="text-left py-2 px-3 w-32">
                    <select
                      value={subjectColumn1}
                      onChange={(e) => setSubjectColumn1(e.target.value)}
                      className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="priority">Priority</option>
                      <option value="difficulty">Difficulty</option>
                      <option value="platform">Platform</option>
                      <option value="category">Category</option>
                      <option value="instructor">Instructor</option>
                      <option value="progress">Progress</option>
                      <option value="dates">Target Date</option>
                      <option value="tags">Tags</option>
                    </select>
                  </th>
                  <th className="text-left py-2 px-3 w-32">
                    <select
                      value={subjectColumn2}
                      onChange={(e) => setSubjectColumn2(e.target.value)}
                      className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="priority">Priority</option>
                      <option value="difficulty">Difficulty</option>
                      <option value="platform">Platform</option>
                      <option value="category">Category</option>
                      <option value="instructor">Instructor</option>
                      <option value="progress">Progress</option>
                      <option value="dates">Target Date</option>
                      <option value="tags">Tags</option>
                    </select>
                  </th>
                  <th className="text-left py-2 px-3 w-32">
                    <select
                      value={subjectColumn3}
                      onChange={(e) => setSubjectColumn3(e.target.value)}
                      className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="priority">Priority</option>
                      <option value="difficulty">Difficulty</option>
                      <option value="platform">Platform</option>
                      <option value="category">Category</option>
                      <option value="instructor">Instructor</option>
                      <option value="progress">Progress</option>
                      <option value="dates">Target Date</option>
                      <option value="tags">Tags</option>
                    </select>
                  </th>
                  <th className="text-left py-2 px-3 w-32">
                    <select
                      value={subjectColumn4}
                      onChange={(e) => setSubjectColumn4(e.target.value)}
                      className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="priority">Priority</option>
                      <option value="difficulty">Difficulty</option>
                      <option value="platform">Platform</option>
                      <option value="category">Category</option>
                      <option value="instructor">Instructor</option>
                      <option value="progress">Progress</option>
                      <option value="dates">Target Date</option>
                      <option value="tags">Tags</option>
                    </select>
                  </th>
                  {/* Open Icon Column */}
                  <th className="text-left py-2 px-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr
                    key={subject.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    {/* Name Column with Color Circle and Status */}
                    <td className="py-3 px-3">
                      <div className="flex items-start gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                          style={{ backgroundColor: subject.colorCode || '#3B82F6' }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate text-sm">
                            {subject.name || subject.title}
                          </h4>
                          <div className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded border ${getStatusColor(subject.status)}`}>
                            {subject.status.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Column 1 */}
                    <td className="py-3 px-3 w-32 text-xs text-gray-600 dark:text-gray-400 truncate">
                      {getSubjectFieldValue(subject, subjectColumn1)}
                    </td>
                    {/* Column 2 */}
                    <td className="py-3 px-3 w-32 text-xs text-gray-600 dark:text-gray-400 truncate">
                      {getSubjectFieldValue(subject, subjectColumn2)}
                    </td>
                    {/* Column 3 */}
                    <td className="py-3 px-3 w-32 text-xs text-gray-600 dark:text-gray-400 truncate">
                      {getSubjectFieldValue(subject, subjectColumn3)}
                    </td>
                    {/* Column 4 */}
                    <td className="py-3 px-3 w-32 text-xs text-gray-600 dark:text-gray-400 truncate">
                      {getSubjectFieldValue(subject, subjectColumn4)}
                    </td>
                    {/* Open Button */}
                    <td className="py-3 px-3 w-12 text-center">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenSubject(subject.id);
                        }}
                        title="Open subject"
                      >
                        <ExternalLink size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No subjects yet
            </p>
            <Button size="sm" variant="secondary" onClick={() => setIsSubjectModalOpen(true)}>
              <Plus size={16} />
              Create your first subject
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>,

    // Projects Card
    <Card key="projects-section" className="dark:!bg-black">
      <Card.Header>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderGit2 className="text-purple-500" size={20} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Projects
            </h3>
          </div>
          <Button size="sm" variant="primary" onClick={() => setIsProjectModalOpen(true)}>
            <Plus size={16} />
            New
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {projectsLoading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading projects...</p>
        ) : projects && projects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <div className="w-3" /> {/* Spacer for color circle */}
                      <span>Name</span>
                    </div>
                  </th>
                  <th className="text-left py-2 px-3 w-32">
                    <select
                      value={projectColumn1}
                      onChange={(e) => setProjectColumn1(e.target.value)}
                      className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="priority">Priority</option>
                      <option value="description">Description</option>
                      <option value="techStack">Tech Stack</option>
                      <option value="tags">Tags</option>
                      <option value="githubRepoUrl">Repository</option>
                      <option value="completion">Completion</option>
                      <option value="dates">Target Date</option>
                      <option value="deployment">Deployment</option>
                    </select>
                  </th>
                  <th className="text-left py-2 px-3 w-32">
                    <select
                      value={projectColumn2}
                      onChange={(e) => setProjectColumn2(e.target.value)}
                      className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="priority">Priority</option>
                      <option value="description">Description</option>
                      <option value="techStack">Tech Stack</option>
                      <option value="tags">Tags</option>
                      <option value="githubRepoUrl">Repository</option>
                      <option value="completion">Completion</option>
                      <option value="dates">Target Date</option>
                      <option value="deployment">Deployment</option>
                    </select>
                  </th>
                  <th className="text-left py-2 px-3 w-32">
                    <select
                      value={projectColumn3}
                      onChange={(e) => setProjectColumn3(e.target.value)}
                      className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="priority">Priority</option>
                      <option value="description">Description</option>
                      <option value="techStack">Tech Stack</option>
                      <option value="tags">Tags</option>
                      <option value="githubRepoUrl">Repository</option>
                      <option value="completion">Completion</option>
                      <option value="dates">Target Date</option>
                      <option value="deployment">Deployment</option>
                    </select>
                  </th>
                  <th className="text-left py-2 px-3 w-32">
                    <select
                      value={projectColumn4}
                      onChange={(e) => setProjectColumn4(e.target.value)}
                      className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="priority">Priority</option>
                      <option value="description">Description</option>
                      <option value="techStack">Tech Stack</option>
                      <option value="tags">Tags</option>
                      <option value="githubRepoUrl">Repository</option>
                      <option value="completion">Completion</option>
                      <option value="dates">Target Date</option>
                      <option value="deployment">Deployment</option>
                    </select>
                  </th>
                  {/* Open Icon Column */}
                  <th className="text-left py-2 px-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    {/* Name Column with Color Circle and Status */}
                    <td className="py-3 px-3">
                      <div className="flex items-start gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                          style={{ backgroundColor: project.colorCode || '#3B82F6' }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate text-sm">
                            {project.name}
                          </h4>
                          <div className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded border ${getStatusColor(project.status)}`}>
                            {project.status}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Column 1 */}
                    <td className="py-3 px-3 w-32 text-xs text-gray-600 dark:text-gray-400 truncate">
                      {getProjectFieldValue(project, projectColumn1)}
                    </td>
                    {/* Column 2 */}
                    <td className="py-3 px-3 w-32 text-xs text-gray-600 dark:text-gray-400 truncate">
                      {getProjectFieldValue(project, projectColumn2)}
                    </td>
                    {/* Column 3 */}
                    <td className="py-3 px-3 w-32 text-xs text-gray-600 dark:text-gray-400 truncate">
                      {getProjectFieldValue(project, projectColumn3)}
                    </td>
                    {/* Column 4 */}
                    <td className="py-3 px-3 w-32 text-xs text-gray-600 dark:text-gray-400 truncate">
                      {getProjectFieldValue(project, projectColumn4)}
                    </td>
                    {/* Open Button */}
                    <td className="py-3 px-3 w-12 text-center">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenProject(project.id);
                        }}
                        title="Open project"
                      >
                        <ExternalLink size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No projects yet
            </p>
            <Button size="sm" variant="secondary" onClick={() => setIsProjectModalOpen(true)}>
              <Plus size={16} />
              Create your first project
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>,

    // Practice Platforms Card
    <Card key="practices-section" className="dark:!bg-black">
      <Card.Header>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="text-green-500" size={20} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Practice Platforms
            </h3>
          </div>
          <Button size="sm" variant="primary">
            <Plus size={16} />
            New
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {practicesLoading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading practices...</p>
        ) : practices && practices.length > 0 ? (
          <div className="space-y-3">
            {practices.map((practice) => (
              <div
                key={practice.id}
                className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                    {practice.platform}
                  </h4>
                  <Badge variant="success" size="sm">
                    {practice.problemsSolved} solved
                  </Badge>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="text-green-600 dark:text-green-400">
                    Easy: {practice.easyCount}
                  </span>
                  <span className="text-yellow-600 dark:text-yellow-400">
                    Medium: {practice.mediumCount}
                  </span>
                  <span className="text-red-600 dark:text-red-400">
                    Hard: {practice.hardCount}
                  </span>
                </div>
                {practice.platformUrl && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                    {practice.platformUrl}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No practice platforms yet
            </p>
            <Button size="sm" variant="secondary">
              <Plus size={16} />
              Add your first platform
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>,
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-black">
      {/* Header - Outside of grid */}
      {/* <div className="flex-none p-8 pb-4">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Projects & Subjects
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Create and manage your subjects, projects, and practice platforms
        </p>
      </div> */}

      {/* Editable Grid Layout */}
      <div className="flex-1 overflow-hidden">
        <EditableGridLayout
          boardId="creation"
          boardName="Projects & Subjects"
          defaultLayout={defaultLayout}
        >
          {cards}
        </EditableGridLayout>
      </div>

      {/* Project Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSubmit={handleCreateProject}
        projects={projects || []}
        courses={subjects || []}
      />

      {/* Subject Modal */}
      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        onSubmit={handleCreateSubject}
        subjects={subjects || []}
        projects={projects || []}
      />
    </div>
  );
};

export default CreationBoard;
