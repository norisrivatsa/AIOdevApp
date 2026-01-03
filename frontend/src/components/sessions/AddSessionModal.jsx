import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { X, Clock, Calendar } from 'lucide-react';
import { getISTToday, getISTDateTimeString } from '../../utils/date';

const AddSessionModal = ({ isOpen, onClose, onSubmit, subjects = [], projects = [] }) => {
  const [formData, setFormData] = useState({
    referenceType: 'subject',
    referenceId: '',
    sessionType: 'study',
    date: getISTToday(), // Today's date in IST
    startTime: '09:00',
    endTime: '10:00',
    notes: '',
    tags: [],
  });

  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');

  // Get selected entity (subject or project)
  const selectedEntity = formData.referenceType === 'subject'
    ? subjects.find(s => s.id === formData.referenceId)
    : projects.find(p => p.id === formData.referenceId);

  // Calculate duration in minutes
  const calculateDuration = () => {
    if (!formData.startTime || !formData.endTime) return 0;

    // Parse times as IST
    const start = new Date(getISTDateTimeString(formData.date, formData.startTime));
    const end = new Date(getISTDateTimeString(formData.date, formData.endTime));

    if (end <= start) return 0;

    const durationMinutes = Math.round((end - start) / 60000);
    return durationMinutes;
  };

  const duration = calculateDuration();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.referenceId) {
      setError('Please select a subject or project');
      return;
    }

    if (!formData.date) {
      setError('Please select a date');
      return;
    }

    if (!formData.startTime || !formData.endTime) {
      setError('Please enter start and end times');
      return;
    }

    if (duration <= 0) {
      setError('End time must be after start time');
      return;
    }

    // Prepare session data with IST timezone
    const sessionData = {
      name: selectedEntity?.name || 'Unknown',
      referenceType: formData.referenceType,
      referenceId: formData.referenceId,
      sessionType: formData.sessionType,
      date: getISTDateTimeString(formData.date, '00:00'),
      startTime: getISTDateTimeString(formData.date, formData.startTime),
      endTime: getISTDateTimeString(formData.date, formData.endTime),
      duration,
      notes: formData.notes,
      tags: formData.tags,
      manualEntry: true,
    };

    onSubmit(sessionData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      referenceType: 'subject',
      referenceId: '',
      sessionType: 'study',
      date: getISTToday(),
      startTime: '09:00',
      endTime: '10:00',
      notes: '',
      tags: [],
    });
    setTagInput('');
    setError('');
    onClose();
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
    if (e.key === 'Enter' && e.target.name === 'tagInput') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Add Session
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manually add a study or practice session
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reference Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              For *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, referenceType: 'subject', referenceId: '' })}
                className={`p-3 border-2 rounded-lg font-medium transition ${
                  formData.referenceType === 'subject'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400'
                }`}
              >
                Subject
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, referenceType: 'project', referenceId: '' })}
                className={`p-3 border-2 rounded-lg font-medium transition ${
                  formData.referenceType === 'project'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400'
                }`}
              >
                Project
              </button>
            </div>
          </div>

          {/* Select Subject/Project */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {formData.referenceType === 'subject' ? 'Select Subject' : 'Select Project'} *
            </label>
            <select
              value={formData.referenceId}
              onChange={(e) => setFormData({ ...formData, referenceId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Choose...</option>
              {formData.referenceType === 'subject'
                ? subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))
                : projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))
              }
            </select>
          </div>

          {/* Session Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Session Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, sessionType: 'study' })}
                className={`p-3 border-2 rounded-lg font-medium transition ${
                  formData.sessionType === 'study'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-green-400'
                }`}
              >
                Study
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, sessionType: 'practice' })}
                className={`p-3 border-2 rounded-lg font-medium transition ${
                  formData.sessionType === 'practice'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-purple-400'
                }`}
              >
                Practice
              </button>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar size={16} className="inline mr-1" />
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock size={16} className="inline mr-1" />
                Start Time *
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock size={16} className="inline mr-1" />
                End Time *
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Duration Display */}
          {duration > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Duration: {Math.floor(duration / 60)}h {duration % 60}m
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="What did you work on?"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              rows={3}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                name="tagInput"
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
            {formData.tags.length > 0 && (
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
            )}
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
              Add Session
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddSessionModal;
