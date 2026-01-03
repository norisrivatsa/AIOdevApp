import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { X, Plus, Trash2, Clock } from 'lucide-react';

const PracticeSessionModal = ({ isOpen, onClose, onSubmit, session = null, subjectId }) => {
  const [formData, setFormData] = useState({
    title: '',
    practiceType: 'other',
    description: '',
    notes: '',
    duration: 0, // in seconds
    durationHours: 0,
    durationMinutes: 0,
    startTime: '',
    endTime: '',
    resourceLinks: [],
    problemsSolved: 0,
    tasksCompleted: 0,
    pagesRead: 0,
    tags: [],
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (session) {
      // Editing existing session
      const hours = Math.floor(session.duration / 3600);
      const minutes = Math.floor((session.duration % 3600) / 60);

      setFormData({
        title: session.title || '',
        practiceType: session.practiceType || 'other',
        description: session.description || '',
        notes: session.notes || '',
        duration: session.duration || 0,
        durationHours: hours,
        durationMinutes: minutes,
        startTime: session.startTime ? new Date(session.startTime).toISOString().slice(0, 16) : '',
        endTime: session.endTime ? new Date(session.endTime).toISOString().slice(0, 16) : '',
        resourceLinks: session.resourceLinks || [],
        problemsSolved: session.problemsSolved || 0,
        tasksCompleted: session.tasksCompleted || 0,
        pagesRead: session.pagesRead || 0,
        tags: session.tags || [],
      });
    } else {
      // Reset for new session
      setFormData({
        title: '',
        practiceType: 'other',
        description: '',
        notes: '',
        duration: 0,
        durationHours: 0,
        durationMinutes: 0,
        startTime: '',
        endTime: '',
        resourceLinks: [],
        problemsSolved: 0,
        tasksCompleted: 0,
        pagesRead: 0,
        tags: [],
      });
    }
  }, [session, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      return;
    }

    // Calculate duration in seconds from hours and minutes
    const durationInSeconds = (formData.durationHours * 3600) + (formData.durationMinutes * 60);

    const sessionData = {
      subjectId,
      title: formData.title.trim(),
      practiceType: formData.practiceType,
      description: formData.description.trim(),
      notes: formData.notes.trim(),
      duration: durationInSeconds,
      startTime: formData.startTime ? new Date(formData.startTime).toISOString() : null,
      endTime: formData.endTime ? new Date(formData.endTime).toISOString() : null,
      resourceLinks: formData.resourceLinks.filter(link => link.url && link.url.trim()),
      problemsSolved: parseInt(formData.problemsSolved) || 0,
      tasksCompleted: parseInt(formData.tasksCompleted) || 0,
      pagesRead: parseInt(formData.pagesRead) || 0,
      tags: formData.tags,
    };

    onSubmit(sessionData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      title: '',
      practiceType: 'other',
      description: '',
      notes: '',
      duration: 0,
      durationHours: 0,
      durationMinutes: 0,
      startTime: '',
      endTime: '',
      resourceLinks: [],
      problemsSolved: 0,
      tasksCompleted: 0,
      pagesRead: 0,
      tags: [],
    });
    setTagInput('');
    onClose();
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

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {session ? 'Edit Practice Session' : 'New Practice Session'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Session Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Array Problems Practice"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Practice Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Practice Type
            </label>
            <select
              value={formData.practiceType}
              onChange={(e) => setFormData({ ...formData, practiceType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="coding">Coding</option>
              <option value="problem_solving">Problem Solving</option>
              <option value="reading">Reading</option>
              <option value="writing">Writing</option>
              <option value="practical">Practical/Hands-on</option>
              <option value="exercises">Exercises</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Clock size={16} className="inline mr-1" />
              Duration
            </label>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="number"
                  value={formData.durationHours}
                  onChange={(e) => setFormData({ ...formData, durationHours: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hours</p>
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  max="59"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Minutes</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What did you practice?"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              rows={3}
            />
          </div>

          {/* Metrics (conditional based on practice type) */}
          <div className="grid grid-cols-3 gap-4">
            {(formData.practiceType === 'coding' || formData.practiceType === 'problem_solving') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Problems Solved
                </label>
                <input
                  type="number"
                  value={formData.problemsSolved}
                  onChange={(e) => setFormData({ ...formData, problemsSolved: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {formData.practiceType === 'reading' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pages Read
                </label>
                <input
                  type="number"
                  value={formData.pagesRead}
                  onChange={(e) => setFormData({ ...formData, pagesRead: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {(formData.practiceType === 'exercises' || formData.practiceType === 'practical') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tasks Completed
                </label>
                <input
                  type="number"
                  value={formData.tasksCompleted}
                  onChange={(e) => setFormData({ ...formData, tasksCompleted: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* Resource Links */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Resource Links
              </label>
              <Button size="sm" variant="secondary" type="button" onClick={addResourceLink}>
                <Plus size={14} />
                Add Link
              </Button>
            </div>
            <div className="space-y-3">
              {formData.resourceLinks.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => updateResourceLink(index, 'label', e.target.value)}
                    placeholder="Label (e.g., LeetCode, Notion)"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => updateResourceLink(index, 'url', e.target.value)}
                    placeholder="https:// or obsidian://"
                    className="flex-[2] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeResourceLink(index)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {formData.resourceLinks.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No resource links added
                </p>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Add links to any resources: videos, Obsidian notes, Notion pages, GitHub repos, blogs, etc.
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a tag and press Enter"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button size="sm" variant="secondary" type="button" onClick={addTag}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-blue-900 dark:hover:text-blue-100"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes, learnings, reflections..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              rows={3}
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              {session ? 'Update Session' : 'Create Session'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default PracticeSessionModal;
