import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import ColorPicker from '../ui/ColorPicker';
import TagInput from '../ui/TagInput';
import CollapsibleSection from '../ui/CollapsibleSection';
import { BookOpen, X, Save, Plus, Trash2 } from 'lucide-react';
import notify from '../../utils/notifications';

const SubjectModal = ({ isOpen, onClose, onSubmit, subject = null, subjects = [], projects = [] }) => {
  const isEditing = !!subject;

  // Initial form state
  const [formData, setFormData] = useState({
    // Required
    name: '',
    priority: 'medium',

    // Basic Info
    status: 'not_started',
    description: '',
    colorCode: '#3B82F6',
    category: 'programming',
    difficultyLevel: 'beginner',
    platform: '',
    instructor: '',
    courseUrl: '',
    language: 'English',

    // Timeline
    startDate: '',
    targetDate: '',
    estimatedHours: '',
    weeklyGoalHours: '',

    // Relationships
    prerequisites: [],
    relatedSubjects: [],
    relatedProjects: [],
    tags: [],

    // Knowledge Base
    knowledgeBaseLinks: [],
    resourceLinks: [],

    // Subtopics
    subtopics: [],

    // Additional
    icon: { type: 'emoji', value: '📚' },
    certification: '',
    cost: { isFree: true, amount: 0, currency: 'USD' },
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load subject data if editing
  useEffect(() => {
    if (subject) {
      setFormData({
        name: subject.name || '',
        priority: subject.priority || 'medium',
        status: subject.status || 'not_started',
        description: subject.description || '',
        colorCode: subject.colorCode || '#3B82F6',
        category: subject.category || 'programming',
        difficultyLevel: subject.difficultyLevel || 'beginner',
        platform: subject.platform || '',
        instructor: subject.instructor || '',
        courseUrl: subject.courseUrl || '',
        language: subject.language || 'English',
        startDate: subject.startDate ? new Date(subject.startDate).toISOString().split('T')[0] : '',
        targetDate: subject.targetDate ? new Date(subject.targetDate).toISOString().split('T')[0] : '',
        estimatedHours: subject.estimatedHours || '',
        weeklyGoalHours: subject.weeklyGoalHours || '',
        prerequisites: subject.prerequisites || [],
        relatedSubjects: subject.relatedSubjects || [],
        relatedProjects: subject.relatedProjects || [],
        tags: subject.tags || [],
        knowledgeBaseLinks: subject.knowledgeBaseLinks || [],
        resourceLinks: subject.resourceLinks || [],
        subtopics: subject.subtopics || [],
        icon: subject.icon || { type: 'emoji', value: '📚' },
        certification: subject.certification || '',
        cost: subject.cost || { isFree: true, amount: 0, currency: 'USD' },
        notes: subject.notes || '',
      });
    }
  }, [subject]);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [formData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleNestedChange = (field, subfield, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: { ...prev[field], [subfield]: value }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Subject name is required';
    }

    if (formData.courseUrl && formData.courseUrl.trim()) {
      try {
        new URL(formData.courseUrl);
      } catch {
        newErrors.courseUrl = 'Invalid URL format';
      }
    }

    if (formData.startDate && formData.targetDate) {
      if (new Date(formData.targetDate) < new Date(formData.startDate)) {
        newErrors.targetDate = 'Target date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const prepareDataForSubmit = (data) => {
    return {
      name: (data.name || '').trim(),
      priority: data.priority,
      status: data.status,
      description: (data.description || '').trim(),
      colorCode: data.colorCode,
      category: (data.category || '').trim(),
      difficultyLevel: data.difficultyLevel,
      platform: (data.platform || '').trim(),
      instructor: (data.instructor || '').trim(),
      courseUrl: (data.courseUrl || '').trim(),
      language: data.language,
      startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
      targetDate: data.targetDate ? new Date(data.targetDate).toISOString() : null,
      estimatedHours: data.estimatedHours ? parseFloat(data.estimatedHours) : null,
      weeklyGoalHours: data.weeklyGoalHours ? parseFloat(data.weeklyGoalHours) : null,
      prerequisites: data.prerequisites || [],
      relatedSubjects: data.relatedSubjects || [],
      relatedProjects: data.relatedProjects || [],
      tags: data.tags || [],
      knowledgeBaseLinks: (data.knowledgeBaseLinks || []).filter(link => link.url && link.url.trim()),
      resourceLinks: (data.resourceLinks || []).filter(link => link.url && link.url.trim()),
      subtopics: data.subtopics || [],
      icon: data.icon,
      certification: (data.certification || '').trim(),
      cost: data.cost,
      notes: (data.notes || '').trim(),
    };
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      notify.error('Please fix the errors before submitting');
      return;
    }

    const cleanedData = prepareDataForSubmit(formData);
    onSubmit(cleanedData);
    setHasUnsavedChanges(false);
    onClose();
  };

  const handleSaveDraft = () => {
    const draftData = prepareDataForSubmit({ ...formData, status: 'not_started' });
    onSubmit(draftData);
    setHasUnsavedChanges(false);
    notify.success('Saved as draft');
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  const addKnowledgeBaseLink = () => {
    setFormData(prev => ({
      ...prev,
      knowledgeBaseLinks: [...prev.knowledgeBaseLinks, { label: '', url: '', type: 'documentation' }]
    }));
  };

  const removeKnowledgeBaseLink = (index) => {
    setFormData(prev => ({
      ...prev,
      knowledgeBaseLinks: prev.knowledgeBaseLinks.filter((_, i) => i !== index)
    }));
  };

  const updateKnowledgeBaseLink = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      knowledgeBaseLinks: prev.knowledgeBaseLinks.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  const addResourceLink = () => {
    setFormData(prev => ({
      ...prev,
      resourceLinks: [...prev.resourceLinks, { label: '', url: '' }]
    }));
  };

  const removeResourceLink = (index) => {
    setFormData(prev => ({
      ...prev,
      resourceLinks: prev.resourceLinks.filter((_, i) => i !== index)
    }));
  };

  const updateResourceLink = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      resourceLinks: prev.resourceLinks.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  if (!isOpen) return null;

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
          {isEditing ? 'Update Subject' : 'Create Subject'}
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Edit Subject' : 'Create New Subject'}
      size="xl"
      footer={footer}
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 bg-black dark:bg-black">
          {/* Section 1: Basic Information */}
          <CollapsibleSection title="Basic Information" defaultOpen={true} badge="Required">
            <div className="space-y-4">
              {/* Subject Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., C Programming, Data Structures, React Fundamentals"
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                    errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  maxLength={150}
                  autoFocus
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <label className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition ${
                    formData.priority === 'high'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-red-300 dark:border-red-700 hover:border-red-400'
                  }`}>
                    <input
                      type="radio"
                      name="priority"
                      value="high"
                      checked={formData.priority === 'high'}
                      onChange={(e) => handleChange('priority', e.target.value)}
                      className="sr-only"
                    />
                    <span className="font-medium text-red-700 dark:text-red-400">High</span>
                  </label>
                  <label className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition ${
                    formData.priority === 'medium'
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                      : 'border-yellow-300 dark:border-yellow-700 hover:border-yellow-400'
                  }`}>
                    <input
                      type="radio"
                      name="priority"
                      value="medium"
                      checked={formData.priority === 'medium'}
                      onChange={(e) => handleChange('priority', e.target.value)}
                      className="sr-only"
                    />
                    <span className="font-medium text-yellow-700 dark:text-yellow-400">Medium</span>
                  </label>
                  <label className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition ${
                    formData.priority === 'low'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-green-300 dark:border-green-700 hover:border-green-400'
                  }`}>
                    <input
                      type="radio"
                      name="priority"
                      value="low"
                      checked={formData.priority === 'low'}
                      onChange={(e) => handleChange('priority', e.target.value)}
                      className="sr-only"
                    />
                    <span className="font-medium text-green-700 dark:text-green-400">Low</span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="What will you learn in this subject? What are the key concepts?"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-y"
                  rows={4}
                  maxLength={2000}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.description.length}/2000 characters
                </p>
              </div>

              {/* Color Code */}
              <div>
                <ColorPicker
                  value={formData.colorCode}
                  onChange={(color) => handleChange('colorCode', color)}
                  label="Subject Color"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { value: 'not_started', label: 'Not Started' },
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'on_hold', label: 'On Hold' },
                    { value: 'reviewing', label: 'Reviewing' },
                  ].map(status => (
                    <label
                      key={status.value}
                      className={`flex items-center justify-center gap-2 p-2 border rounded-lg cursor-pointer transition ${
                        formData.status === status.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={status.value}
                        checked={formData.status === status.value}
                        onChange={(e) => handleChange('status', e.target.value)}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {status.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 2: Subject Details */}
          <CollapsibleSection title="Subject Details" defaultOpen={true}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category/Domain
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="programming">Programming</option>
                    <option value="computer-science">Computer Science</option>
                    <option value="mathematics">Mathematics</option>
                    <option value="data-science">Data Science & AI</option>
                    <option value="web-development">Web Development</option>
                    <option value="mobile-development">Mobile Development</option>
                    <option value="devops">DevOps & Cloud</option>
                    <option value="database">Database</option>
                    <option value="design">Design</option>
                    <option value="languages">Languages</option>
                    <option value="business">Business/Soft Skills</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Difficulty Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={formData.difficultyLevel}
                    onChange={(e) => handleChange('difficultyLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>

                {/* Platform */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Platform/Source
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => handleChange('platform', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Select platform...</option>
                    <option value="udemy">Udemy</option>
                    <option value="coursera">Coursera</option>
                    <option value="youtube">YouTube</option>
                    <option value="book">Book</option>
                    <option value="documentation">Documentation</option>
                    <option value="university">University Course</option>
                    <option value="self-study">Self-Study</option>
                    <option value="bootcamp">Bootcamp</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => handleChange('language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Mandarin">Mandarin</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Instructor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Instructor/Author
                </label>
                <input
                  type="text"
                  value={formData.instructor}
                  onChange={(e) => handleChange('instructor', e.target.value)}
                  placeholder="Course instructor or book author name"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  maxLength={100}
                />
              </div>

              {/* Course URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Course URL
                </label>
                <input
                  type="url"
                  value={formData.courseUrl}
                  onChange={(e) => handleChange('courseUrl', e.target.value)}
                  placeholder="https://udemy.com/course/..."
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                    errors.courseUrl ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.courseUrl && (
                  <p className="text-red-500 text-sm mt-1">{errors.courseUrl}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Link to the course or learning resource
                </p>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 3: Timeline & Goals */}
          <CollapsibleSection title="Timeline & Goals" defaultOpen={false}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Target Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target Completion Date
                  </label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => handleChange('targetDate', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                      errors.targetDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.targetDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.targetDate}</p>
                  )}
                </div>

                {/* Estimated Hours */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estimated Total Hours
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.estimatedHours}
                      onChange={(e) => handleChange('estimatedHours', e.target.value)}
                      placeholder="0"
                      min="1"
                      max="10000"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <span className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
                      hours
                    </span>
                  </div>
                </div>

                {/* Weekly Goal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Time Goal per Week
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.weeklyGoalHours}
                      onChange={(e) => handleChange('weeklyGoalHours', e.target.value)}
                      placeholder="0"
                      min="1"
                      max="168"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <span className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
                      hrs/week
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 4: Prerequisites & Relationships */}
          <CollapsibleSection title="Prerequisites & Relationships" defaultOpen={false}>
            <div className="space-y-4">
              {/* Tags */}
              <div>
                <TagInput
                  value={formData.tags}
                  onChange={(tags) => handleChange('tags', tags)}
                  label="Tags"
                  presetTags={['algorithms', 'backend', 'frontend', 'theory', 'practical', 'fundamentals']}
                  maxTags={20}
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 5: Knowledge Base & Resources */}
          <CollapsibleSection title="Knowledge Base & Resources" defaultOpen={false}>
            <div className="space-y-4">
              {/* Knowledge Base Links */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Knowledge Base Links
                  </label>
                  <Button size="sm" variant="secondary" onClick={addKnowledgeBaseLink}>
                    <Plus size={14} />
                    Add Link
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.knowledgeBaseLinks.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => updateKnowledgeBaseLink(index, 'label', e.target.value)}
                        placeholder="Label (e.g., Official Docs)"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      />
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => updateKnowledgeBaseLink(index, 'url', e.target.value)}
                        placeholder="https://..."
                        className="flex-[2] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      />
                      <select
                        value={link.type}
                        onChange={(e) => updateKnowledgeBaseLink(index, 'type', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="documentation">Docs</option>
                        <option value="github">GitHub</option>
                        <option value="article">Article</option>
                        <option value="video">Video</option>
                        <option value="book">Book</option>
                        <option value="notes">Notes</option>
                        <option value="other">Other</option>
                      </select>
                      <button
                        onClick={() => removeKnowledgeBaseLink(index)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {formData.knowledgeBaseLinks.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No knowledge base links added yet
                    </p>
                  )}
                </div>
              </div>

              {/* Resource Links */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Main Resource Links
                  </label>
                  <Button size="sm" variant="secondary" onClick={addResourceLink}>
                    <Plus size={14} />
                    Add Resource
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.resourceLinks.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => updateResourceLink(index, 'label', e.target.value)}
                        placeholder="Label (e.g., Course Playlist)"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      />
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => updateResourceLink(index, 'url', e.target.value)}
                        placeholder="https://..."
                        className="flex-[2] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      />
                      <button
                        onClick={() => removeResourceLink(index)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {formData.resourceLinks.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No resource links added yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 6: Subtopics - Placeholder for now */}
          <CollapsibleSection title="Subtopics" defaultOpen={false} badge="0 topics">
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <p>Subtopic management coming soon...</p>
              <p className="text-sm mt-2">Manual entry and bulk import features will be added next</p>
            </div>
          </CollapsibleSection>

          {/* Section 7: Additional Settings */}
          <CollapsibleSection title="Additional Settings" defaultOpen={false}>
            <div className="space-y-4">
              {/* Certification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Certification Info
                </label>
                <input
                  type="text"
                  value={formData.certification}
                  onChange={(e) => handleChange('certification', e.target.value)}
                  placeholder="Associated certification or exam name"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              {/* Cost */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cost
                </label>
                <div className="flex items-center gap-4 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.cost.isFree}
                      onChange={(e) => handleNestedChange('cost', 'isFree', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Free</span>
                  </label>
                </div>
                {!formData.cost.isFree && (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.cost.amount}
                      onChange={(e) => handleNestedChange('cost', 'amount', parseFloat(e.target.value))}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <select
                      value={formData.cost.currency}
                      onChange={(e) => handleNestedChange('cost', 'currency', e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="INR">INR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Additional notes about this subject..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-y"
                  rows={3}
                  maxLength={2000}
                />
              </div>
            </div>
          </CollapsibleSection>
      </div>
    </Modal>
  );
};

export default SubjectModal;
