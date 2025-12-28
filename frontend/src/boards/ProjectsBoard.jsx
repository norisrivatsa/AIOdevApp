import { useState } from 'react';
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useSyncGithub,
} from '../hooks/useProjects';
import useUIStore from '../stores/uiStore';
import {
  PROJECT_STATUS,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
} from '../utils/constants';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Select from '../components/ui/Select';
import { Plus, Pencil, Trash2, FolderGit2, Github } from 'lucide-react';

const ProjectsBoard = () => {
  const { data: projects = [], isLoading } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const syncGithub = useSyncGithub();

  const { isProjectModalOpen, openProjectModal, closeProjectModal, selectedProjectId, openProjectPage } =
    useUIStore();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    repository_url: '',
    status: PROJECT_STATUS.PLANNING,
  });

  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)
    : null;

  // Open modal for creating a new project
  const handleCreateNew = () => {
    setFormData({
      name: '',
      description: '',
      repository_url: '',
      status: PROJECT_STATUS.PLANNING,
    });
    openProjectModal();
  };

  // Open modal for editing an existing project
  const handleEdit = (project) => {
    setFormData({
      name: project.name,
      description: project.description || '',
      repository_url: project.repository_url || '',
      status: project.status,
    });
    openProjectModal(project.id);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedProjectId) {
      // Update existing project
      await updateProject.mutateAsync({
        id: selectedProjectId,
        data: formData,
      });
    } else {
      // Create new project
      await createProject.mutateAsync(formData);
    }

    closeProjectModal();
  };

  // Handle project deletion
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      await deleteProject.mutateAsync(id);
    }
  };

  // Handle GitHub sync
  const handleSync = async (id) => {
    await syncGithub.mutateAsync(id);
  };

  // Get badge variant based on status
  const getStatusBadgeVariant = (status) => {
    const colorMap = {
      [PROJECT_STATUS.PLANNING]: 'default',
      [PROJECT_STATUS.ACTIVE]: 'info',
      [PROJECT_STATUS.COMPLETED]: 'success',
      [PROJECT_STATUS.ARCHIVED]: 'default',
    };
    return colorMap[status] || 'default';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-gray-400">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your development projects and track progress
          </p>
        </div>
        <button
          className="btn-gradient px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          onClick={handleCreateNew}
        >
          <Plus size={20} />
          New Project
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden px-8 py-6">
        <div className="h-full overflow-y-auto">
        {projects.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FolderGit2 size={64} className="text-gray-400 dark:text-gray-600 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              No projects yet
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
              Get started by creating your first project. Track your development work,
              sync with GitHub, and monitor your progress.
            </p>
            <button
              className="btn-gradient px-4 py-2 rounded-lg font-medium flex items-center gap-2"
              onClick={handleCreateNew}
            >
              <Plus size={20} />
              Create Your First Project
            </button>
          </div>
        ) : (
          // Projects Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="flex flex-col cursor-pointer" onClick={() => openProjectPage(project.id)}>
                <Card.Header className="flex-none">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {project.name}
                      </h3>
                      <Badge
                        variant={getStatusBadgeVariant(project.status)}
                        size="sm"
                        className="mt-2"
                      >
                        {PROJECT_STATUS_LABELS[project.status]}
                      </Badge>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(project); }}
                        className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        title="Edit project"
                      >
                        <Pencil size={18} />
                      </button>
                      {(project.githubRepoUrl || project.repository_url) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); syncGithub.mutate(project.id); }}
                          disabled={syncGithub.isPending}
                          className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors disabled:opacity-50"
                          title="Sync GitHub data"
                        >
                          <Github size={18} className={syncGithub.isPending ? 'animate-spin' : ''} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete project"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </Card.Header>

                <Card.Body className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                    {project.description || 'No description provided.'}
                  </p>

                  {project.repository_url && (
                    <div className="mt-4">
                      <a
                        href={project.repository_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                      >
                        <Github size={16} />
                        <span className="truncate">{project.repository_url}</span>
                      </a>
                    </div>
                  )}

                  {project.github_data && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Stars</div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {project.github_data.stars || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Forks</div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {project.github_data.forks || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Issues</div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {project.github_data.open_issues || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card.Body>

                {project.repository_url && (
                  <Card.Footer>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleSync(project.id); }}
                      loading={syncGithub.isPending}
                      className="w-full gap-2"
                    >
                      <Github size={16} />
                      Sync GitHub Data
                    </Button>
                  </Card.Footer>
                )}
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Project Modal */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={closeProjectModal}
        title={selectedProjectId ? 'Edit Project' : 'Create New Project'}
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" onClick={closeProjectModal}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={createProject.isPending || updateProject.isPending}
            >
              {selectedProjectId ? 'Update Project' : 'Create Project'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Project Name *
            </label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter project name"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Description
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter project description"
              rows={4}
            />
          </div>

          <div>
            <label
              htmlFor="repository_url"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Repository URL
            </label>
            <Input
              id="repository_url"
              type="url"
              value={formData.repository_url}
              onChange={(e) =>
                setFormData({ ...formData, repository_url: e.target.value })
              }
              placeholder="https://github.com/username/repo"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Status *
            </label>
            <Select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              required
            >
              {Object.entries(PROJECT_STATUS).map(([key, value]) => (
                <option key={value} value={value}>
                  {PROJECT_STATUS_LABELS[value]}
                </option>
              ))}
            </Select>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectsBoard;
