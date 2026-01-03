import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { X } from 'lucide-react';

const SubtopicModal = ({ isOpen, onClose, onSubmit, parentSubtopic = null, editingSubtopic = null, allSubtopics = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    status: 'active',
    order: 0,
  });

  useEffect(() => {
    if (editingSubtopic) {
      setFormData({
        name: editingSubtopic.name || '',
        status: editingSubtopic.status || 'active',
        order: editingSubtopic.order || 0,
      });
    } else {
      // Reset form when creating new subtopic
      // Calculate order based on parent's subtopics
      const siblings = parentSubtopic ? (parentSubtopic.subtopics || []) : allSubtopics;
      setFormData({
        name: '',
        status: 'active',
        order: siblings.length, // Auto-increment order
      });
    }
  }, [editingSubtopic, isOpen, parentSubtopic, allSubtopics]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

    const subtopicData = {
      ...formData,
      status: formData.status || 'active',
      completedDate: editingSubtopic?.completedDate || null,
      cachedCompletion: editingSubtopic?.cachedCompletion || 0,
      subtopics: editingSubtopic?.subtopics || [],
    };

    // If editing, include the id
    if (editingSubtopic) {
      subtopicData.id = editingSubtopic.id;
    }

    onSubmit(subtopicData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      name: '',
      status: 'active',
      order: 0,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editingSubtopic ? 'Edit Subtopic' : 'Create New Subtopic'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Parent Info (if creating under a parent) */}
          {parentSubtopic && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Creating subtopic under: <span className="font-semibold">{parentSubtopic.name}</span>
              </p>
            </div>
          )}

          {/* Subtopic Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subtopic Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Introduction to React"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Mark as completed if you've finished this subtopic
            </p>
          </div>

          {/* Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Order
            </label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Display order (lower numbers appear first)
            </p>
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
              {editingSubtopic ? 'Update Subtopic' : 'Create Subtopic'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default SubtopicModal;
