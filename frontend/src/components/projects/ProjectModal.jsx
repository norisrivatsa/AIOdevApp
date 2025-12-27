import { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  Github,
  Settings,
  FileText,
  Link as LinkIcon,
  Code2,
  Sparkles,
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import ColorPicker from '../ui/ColorPicker';
import TagInput from '../ui/TagInput';
import CollapsibleSection from '../ui/CollapsibleSection';
import notify from '../../utils/notifications';

const TECH_STACK_PRESETS = [
  'React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js',
  'Python', 'FastAPI', 'Django', 'Flask',
  'Node.js', 'Express', 'NestJS',
  'TypeScript', 'JavaScript', 'Go', 'Rust', 'Java', 'C++', 'C#',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'SQLite',
  'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
  'GraphQL', 'REST API', 'WebSocket',
  'TailwindCSS', 'Material-UI', 'Bootstrap',
  'Git', 'GitHub Actions', 'CI/CD',
];

const PROJECT_TYPE_OPTIONS = [
  'personal',
  'work',
  'open source',
  'learning',
  'side project',
  'client work',
  'research',
];

const ProjectModal = ({ isOpen, onClose, onSubmit, initialData = null, projects = [], courses = [] }) => {
  // Form state
  const [formData, setFormData] = useState({
    // Required
    name: '',
    priority: 'medium',

    // Basic Info
    description: '',
    colorCode: '#3B82F6',
    projectType: ['personal'],
    status: 'active',

    // Timeline
    startDate: new Date().toISOString().split('T')[0],
    targetDate: '',
    estimatedTime: { value: '', unit: 'hours' },
    completionPercentage: 0,
    autoCalculateProgress: false,

    // Technical
    githubRepoUrl: '',
    defaultBranch: 'main',
    currentBranch: '',
    techStack: [],
    deploymentStatus: 'not_deployed',

    // Organization
    tags: [],
    parentProjectId: '',
    relatedProjectIds: [],
    relatedCourseIds: [],
    isPinned: false,

    // Documentation
    readme: '',
    technicalNotes: '',
    blockers: [],
    motivation: '',
    learningGoals: '',
    successCriteria: [],

    // Links
    quickLinks: [],
    designFileLinks: [],
    externalIssueTracker: '',

    // GitHub Settings
    githubSync: {
      autoFetchInterval: 'hourly',
      issueLabels: [],
      trackMilestones: true,
    },

    // Advanced
    projectIcon: { type: 'initials', value: '' },
    environmentNotes: '',
    setupCommands: '',
  });

  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [isGithubFetching, setIsGithubFetching] = useState(false);
  const [githubFetchError, setGithubFetchError] = useState('');

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({ ...formData, ...initialData });
    }
  }, [initialData]);

  // Track dirty state
  useEffect(() => {
    setIsDirty(true);
  }, [formData]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value },
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (formData.targetDate && formData.startDate) {
      if (new Date(formData.targetDate) < new Date(formData.startDate)) {
        newErrors.targetDate = 'Target date must be after start date';
      }
    }

    if (formData.githubRepoUrl && !formData.githubRepoUrl.includes('github.com')) {
      newErrors.githubRepoUrl = 'Must be a valid GitHub URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const prepareDataForSubmit = (data) => {
    // Clean up the data to match backend schema
    const cleanedData = {
      name: (data.name || '').trim(),
      priority: data.priority,
      description: (data.description || '').trim(),
      colorCode: data.colorCode,
      projectType: data.projectType || [],
      status: data.status,

      // Dates - convert to ISO string or null
      startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
      targetDate: data.targetDate ? new Date(data.targetDate).toISOString() : null,

      // Estimated time
      estimatedTime: {
        value: data.estimatedTime?.value ? parseFloat(data.estimatedTime.value) : null,
        unit: data.estimatedTime?.unit || 'hours',
      },
      completionPercentage: parseFloat(data.completionPercentage) || 0,
      autoCalculateProgress: data.autoCalculateProgress || false,

      // Technical details
      githubRepoUrl: (data.githubRepoUrl || '').trim(),
      defaultBranch: (data.defaultBranch || 'main').trim(),
      currentBranch: (data.currentBranch || '').trim(),
      techStack: data.techStack || [],
      deploymentStatus: data.deploymentStatus,

      // Organization
      tags: data.tags || [],
      parentProjectId: data.parentProjectId || null,
      relatedProjectIds: data.relatedProjectIds || [],
      relatedCourseIds: data.relatedCourseIds || [],
      isPinned: data.isPinned || false,

      // Documentation
      readme: (data.readme || '').trim(),
      technicalNotes: (data.technicalNotes || '').trim(),
      blockers: (data.blockers || []).filter(b => b.description && b.description.trim()),
      motivation: (data.motivation || '').trim(),
      learningGoals: (data.learningGoals || '').trim(),
      successCriteria: (data.successCriteria || []).filter(c => c.text && c.text.trim()),

      // Links
      quickLinks: (data.quickLinks || []).filter(l => (l.label && l.label.trim()) || (l.url && l.url.trim())),
      designFileLinks: (data.designFileLinks || []).filter(l => l && l.trim()),
      externalIssueTracker: (data.externalIssueTracker || '').trim(),

      // GitHub settings
      githubSync: data.githubSync || {
        autoFetchInterval: 'hourly',
        issueLabels: [],
        trackMilestones: true,
      },

      // Advanced
      projectIcon: data.projectIcon || { type: 'initials', value: '' },
      environmentNotes: (data.environmentNotes || '').trim(),
      setupCommands: (data.setupCommands || '').trim(),
    };

    return cleanedData;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const cleanedData = prepareDataForSubmit(formData);
    onSubmit(cleanedData);
    handleClose();
  };

  const handleSaveDraft = () => {
    if (!formData.name.trim()) {
      setErrors({ name: 'Project name is required even for drafts' });
      return;
    }

    const cleanedData = prepareDataForSubmit({ ...formData, status: 'hibernation' });
    onSubmit(cleanedData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      name: '',
      priority: 'medium',
      description: '',
      colorCode: '#3B82F6',
      projectType: ['personal'],
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      targetDate: '',
      estimatedTime: { value: '', unit: 'hours' },
      completionPercentage: 0,
      techStack: [],
      tags: [],
      blockers: [],
      successCriteria: [],
      quickLinks: [],
    });
    setIsDirty(false);
    setErrors({});
    onClose();
  };

  const handleFetchGithub = async () => {
    if (!formData.githubRepoUrl) return;

    setIsGithubFetching(true);
    setGithubFetchError('');

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/projects/fetch-github`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ repoUrl: formData.githubRepoUrl }),
      // });
      // const data = await response.json();

      // Mock data for now
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Auto-populate fields
      // setFormData(prev => ({
      //   ...prev,
      //   name: prev.name || data.name,
      //   description: prev.description || data.description,
      //   techStack: [...new Set([...prev.techStack, ...data.languages])],
      //   readme: prev.readme || data.readme,
      //   defaultBranch: data.defaultBranch,
      // }));

      notify.success('GitHub data imported successfully (feature coming soon)');
    } catch (error) {
      setGithubFetchError('Failed to fetch GitHub data. Please check the URL and try again.');
      notify.error('Failed to fetch GitHub data. Please check the URL and try again.');
    } finally {
      setIsGithubFetching(false);
    }
  };

  const addBlocker = () => {
    setFormData((prev) => ({
      ...prev,
      blockers: [
        ...prev.blockers,
        { description: '', priority: 'medium', status: 'active' },
      ],
    }));
  };

  const removeBlocker = (index) => {
    setFormData((prev) => ({
      ...prev,
      blockers: prev.blockers.filter((_, i) => i !== index),
    }));
  };

  const updateBlocker = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      blockers: prev.blockers.map((blocker, i) =>
        i === index ? { ...blocker, [field]: value } : blocker
      ),
    }));
  };

  const addSuccessCriterion = () => {
    setFormData((prev) => ({
      ...prev,
      successCriteria: [
        ...prev.successCriteria,
        { text: '', completed: false, order: prev.successCriteria.length },
      ],
    }));
  };

  const removeSuccessCriterion = (index) => {
    setFormData((prev) => ({
      ...prev,
      successCriteria: prev.successCriteria.filter((_, i) => i !== index),
    }));
  };

  const updateSuccessCriterion = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      successCriteria: prev.successCriteria.map((criterion, i) =>
        i === index ? { ...criterion, [field]: value } : criterion
      ),
    }));
  };

  const addQuickLink = () => {
    setFormData((prev) => ({
      ...prev,
      quickLinks: [...prev.quickLinks, { label: '', url: '', icon: '' }],
    }));
  };

  const removeQuickLink = (index) => {
    setFormData((prev) => ({
      ...prev,
      quickLinks: prev.quickLinks.filter((_, i) => i !== index),
    }));
  };

  const updateQuickLink = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      quickLinks: prev.quickLinks.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      ),
    }));
  };

  const footer = (
    <div className="flex items-center justify-between w-full">
      <Button variant="secondary" onClick={handleClose}>
        Cancel
      </Button>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleSaveDraft}>
          Save as Draft
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          {initialData ? 'Update Project' : 'Create Project'}
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={initialData ? 'Edit Project' : 'Create New Project'}
      size="xl"
      footer={footer}
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        {/* Section 1: Basic Information */}
        <CollapsibleSection
          title="Basic Information"
          defaultOpen={true}
          icon={BookOpen}
          badge="Required"
        >
          <div className="space-y-4">
            <Input
              label="Project Name *"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="My Awesome Project"
              error={errors.name}
              autoFocus
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority *
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label
                  className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition ${
                    formData.priority === 'high'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-red-300 dark:border-red-700 hover:border-red-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value="high"
                    checked={formData.priority === 'high'}
                    onChange={(e) => handleChange('priority', e.target.value)}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    High
                  </span>
                </label>
                <label
                  className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition ${
                    formData.priority === 'medium'
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                      : 'border-yellow-300 dark:border-yellow-700 hover:border-yellow-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value="medium"
                    checked={formData.priority === 'medium'}
                    onChange={(e) => handleChange('priority', e.target.value)}
                    className="text-yellow-600 focus:ring-yellow-500"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Medium
                  </span>
                </label>
                <label
                  className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition ${
                    formData.priority === 'low'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-green-300 dark:border-green-700 hover:border-green-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value="low"
                    checked={formData.priority === 'low'}
                    onChange={(e) => handleChange('priority', e.target.value)}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Low
                  </span>
                </label>
              </div>
            </div>

            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="What is this project about? What are you building?"
              rows={3}
              maxLength={2000}
            />

            <ColorPicker
              label="Color Code"
              value={formData.colorCode}
              onChange={(value) => handleChange('colorCode', value)}
            />

            <TagInput
              label="Project Type"
              value={formData.projectType}
              onChange={(value) => handleChange('projectType', value)}
              presetTags={PROJECT_TYPE_OPTIONS}
              helperText="Select one or more types"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'active', label: 'Active', desc: 'Currently working on' },
                  { value: 'completed', label: 'Completed', desc: 'Finished and deployed' },
                  { value: 'hibernation', label: 'Hibernation', desc: 'Paused but will resume' },
                  { value: 'archived', label: 'Archived', desc: 'No longer relevant' },
                ].map((status) => (
                  <label
                    key={status.value}
                    className={`flex items-start gap-2 p-3 border-2 rounded-lg cursor-pointer transition ${
                      formData.status === status.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={status.value}
                      checked={formData.status === status.value}
                      onChange={(e) => handleChange('status', e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {status.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {status.desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Section 2: Timeline & Tracking */}
        <CollapsibleSection title="Timeline & Tracking" icon={Calendar}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
              />
              <Input
                label="Target/Deadline Date"
                type="date"
                value={formData.targetDate}
                onChange={(e) => handleChange('targetDate', e.target.value)}
                error={errors.targetDate}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estimated Completion Time
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={formData.estimatedTime.value}
                  onChange={(e) =>
                    handleNestedChange('estimatedTime', 'value', e.target.value)
                  }
                  placeholder="Enter time"
                  className="flex-1"
                />
                <select
                  value={formData.estimatedTime.unit}
                  onChange={(e) =>
                    handleNestedChange('estimatedTime', 'unit', e.target.value)
                  }
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Completion Percentage: {formData.completionPercentage}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.completionPercentage}
                onChange={(e) =>
                  handleChange('completionPercentage', parseInt(e.target.value))
                }
                className="w-full"
              />
              <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${formData.completionPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Section 3: Technical Details */}
        <CollapsibleSection title="Technical Details" icon={Code2}>
          <div className="space-y-4">
            <div>
              <Input
                label="GitHub Repository Link"
                value={formData.githubRepoUrl}
                onChange={(e) => handleChange('githubRepoUrl', e.target.value)}
                placeholder="https://github.com/username/repo"
                error={errors.githubRepoUrl || githubFetchError}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleFetchGithub}
                loading={isGithubFetching}
                className="mt-2"
                disabled={!formData.githubRepoUrl}
              >
                <Github size={16} />
                Fetch from GitHub
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Default Branch"
                value={formData.defaultBranch}
                onChange={(e) => handleChange('defaultBranch', e.target.value)}
                placeholder="main"
              />
              <Input
                label="Current Working Branch"
                value={formData.currentBranch}
                onChange={(e) => handleChange('currentBranch', e.target.value)}
                placeholder="feature/my-feature"
              />
            </div>

            <TagInput
              label="Tech Stack"
              value={formData.techStack}
              onChange={(value) => handleChange('techStack', value)}
              presetTags={TECH_STACK_PRESETS}
              placeholder="Add technology..."
              helperText="Select from presets or type custom"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Deployment Status
              </label>
              <select
                value={formData.deploymentStatus}
                onChange={(e) => handleChange('deploymentStatus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="not_deployed">Not Deployed</option>
                <option value="in_development">In Development</option>
                <option value="staging">Staging</option>
                <option value="production">Production</option>
                <option value="deprecated">Deprecated</option>
              </select>
            </div>
          </div>
        </CollapsibleSection>

        {/* Section 4: Organization & Relationships */}
        <CollapsibleSection title="Organization & Relationships" icon={LinkIcon}>
          <div className="space-y-4">
            <TagInput
              label="Tags"
              value={formData.tags}
              onChange={(value) => handleChange('tags', value)}
              placeholder="Add tags (e.g., backend, api, urgent)..."
              maxTags={20}
            />

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isPinned}
                onChange={(e) => handleChange('isPinned', e.target.checked)}
                className="rounded text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Pin to top of project list
              </span>
            </label>

            {projects.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Parent Project
                </label>
                <select
                  value={formData.parentProjectId}
                  onChange={(e) => handleChange('parentProjectId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">None (Independent Project)</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Section 5: Documentation & Notes */}
        <CollapsibleSection title="Documentation & Notes" icon={FileText}>
          <div className="space-y-4">
            <Textarea
              label="Project README/Overview"
              value={formData.readme}
              onChange={(e) => handleChange('readme', e.target.value)}
              placeholder="Project overview, architecture, key decisions..."
              rows={6}
              maxLength={10000}
            />

            <Textarea
              label="Technical Notes"
              value={formData.technicalNotes}
              onChange={(e) => handleChange('technicalNotes', e.target.value)}
              placeholder="Setup instructions, architecture decisions, important notes..."
              rows={4}
              maxLength={5000}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Known Issues/Blockers
              </label>
              {formData.blockers.map((blocker, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={blocker.description}
                    onChange={(e) => updateBlocker(index, 'description', e.target.value)}
                    placeholder="Describe the blocker..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <select
                    value={blocker.priority}
                    onChange={(e) => updateBlocker(index, 'priority', e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => removeBlocker(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addBlocker}>
                + Add Blocker
              </Button>
            </div>

            <Textarea
              label="Why This Project?"
              value={formData.motivation}
              onChange={(e) => handleChange('motivation', e.target.value)}
              placeholder="Your motivation and goals for this project..."
              rows={3}
              maxLength={1000}
            />

            <Textarea
              label="Learning Goals"
              value={formData.learningGoals}
              onChange={(e) => handleChange('learningGoals', e.target.value)}
              placeholder="What do you want to learn from this project?"
              rows={3}
              maxLength={1000}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Success Criteria
              </label>
              {formData.successCriteria.map((criterion, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={criterion.completed}
                    onChange={(e) =>
                      updateSuccessCriterion(index, 'completed', e.target.checked)
                    }
                    className="mt-1 rounded text-primary-600 focus:ring-primary-500"
                  />
                  <input
                    type="text"
                    value={criterion.text}
                    onChange={(e) => updateSuccessCriterion(index, 'text', e.target.value)}
                    placeholder="What does 'done' look like?"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => removeSuccessCriterion(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addSuccessCriterion}>
                + Add Criterion
              </Button>
            </div>
          </div>
        </CollapsibleSection>

        {/* Section 6: Links & Resources */}
        <CollapsibleSection title="Links & Resources" icon={LinkIcon}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quick Links
              </label>
              {formData.quickLinks.map((link, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => updateQuickLink(index, 'label', e.target.value)}
                    placeholder="Label (e.g., Live Site)"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => updateQuickLink(index, 'url', e.target.value)}
                    placeholder="https://..."
                    className="flex-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={link.icon}
                    onChange={(e) => updateQuickLink(index, 'icon', e.target.value)}
                    placeholder="Icon"
                    maxLength={2}
                    className="w-20 px-3 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => removeQuickLink(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addQuickLink}>
                + Add Link
              </Button>
            </div>

            <Input
              label="External Issue Tracker"
              value={formData.externalIssueTracker}
              onChange={(e) => handleChange('externalIssueTracker', e.target.value)}
              placeholder="Jira, Linear, Notion board URL..."
              helperText="For projects not using GitHub Issues"
            />
          </div>
        </CollapsibleSection>

        {/* Section 7: GitHub Integration Settings */}
        {formData.githubRepoUrl && (
          <CollapsibleSection title="GitHub Integration Settings" icon={Github}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Auto-fetch Interval
                </label>
                <select
                  value={formData.githubSync.autoFetchInterval}
                  onChange={(e) =>
                    handleNestedChange('githubSync', 'autoFetchInterval', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="never">Never (manual sync only)</option>
                  <option value="5min">Every 5 minutes</option>
                  <option value="15min">Every 15 minutes</option>
                  <option value="hourly">Every hour</option>
                  <option value="6hours">Every 6 hours</option>
                  <option value="daily">Daily</option>
                </select>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.githubSync.trackMilestones}
                  onChange={(e) =>
                    handleNestedChange('githubSync', 'trackMilestones', e.target.checked)
                  }
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Sync GitHub milestones
                </span>
              </label>
            </div>
          </CollapsibleSection>
        )}

        {/* Section 8: Advanced Options */}
        <CollapsibleSection title="Advanced Options" icon={Settings}>
          <div className="space-y-4">
            <Textarea
              label="Environment Setup Notes"
              value={formData.environmentNotes}
              onChange={(e) => handleChange('environmentNotes', e.target.value)}
              placeholder="Notes about .env files, API keys, setup..."
              rows={3}
              maxLength={1000}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Setup Commands
              </label>
              <textarea
                value={formData.setupCommands}
                onChange={(e) => handleChange('setupCommands', e.target.value)}
                placeholder="npm install&#10;docker-compose up&#10;python setup.py"
                rows={4}
                maxLength={2000}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </Modal>
  );
};

export default ProjectModal;
