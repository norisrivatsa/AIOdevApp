import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import { Save } from 'lucide-react';

const CardEditModal = ({ isOpen, onClose, onSave, cardType, initialData, projectId }) => {
  const [formData, setFormData] = useState(initialData || {});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  const renderFields = () => {
    switch (cardType) {
      case 'basic-info':
        return (
          <>
            <Input
              label="Project Name"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
            <Textarea
              label="Description"
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
            />
            <Input
              label="Color Code"
              type="color"
              value={formData.colorCode || '#3B82F6'}
              onChange={(e) => handleChange('colorCode', e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={formData.priority || 'medium'}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={formData.status || 'active'}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="hibernation">Hibernation</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </>
        );

      case 'documentation':
        return (
          <>
            <Textarea
              label="README"
              value={formData.readme || ''}
              onChange={(e) => handleChange('readme', e.target.value)}
              rows={5}
              placeholder="Project documentation..."
            />
            <Textarea
              label="Technical Notes"
              value={formData.technicalNotes || ''}
              onChange={(e) => handleChange('technicalNotes', e.target.value)}
              rows={4}
              placeholder="Development notes..."
            />
            <Textarea
              label="Motivation"
              value={formData.motivation || ''}
              onChange={(e) => handleChange('motivation', e.target.value)}
              rows={3}
              placeholder="Why this project?"
            />
            <Textarea
              label="Learning Goals"
              value={formData.learningGoals || ''}
              onChange={(e) => handleChange('learningGoals', e.target.value)}
              rows={3}
              placeholder="What do you want to learn?"
            />
          </>
        );

      case 'completion':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Completion Percentage: {formData.completionPercentage || 0}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.completionPercentage || 0}
                onChange={(e) => handleChange('completionPercentage', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate ? formData.startDate.split('T')[0] : ''}
              onChange={(e) => handleChange('startDate', e.target.value)}
            />
            <Input
              label="Target Date"
              type="date"
              value={formData.targetDate ? formData.targetDate.split('T')[0] : ''}
              onChange={(e) => handleChange('targetDate', e.target.value)}
            />
          </>
        );

      case 'success-criteria':
        return (
          <>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Success Criteria
              </label>
              {(formData.successCriteria || []).map((criterion, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={criterion.completed || false}
                    onChange={(e) => {
                      const updated = [...(formData.successCriteria || [])];
                      updated[index] = { ...updated[index], completed: e.target.checked };
                      handleChange('successCriteria', updated);
                    }}
                    className="mt-1 rounded text-primary-600 focus:ring-primary-500"
                  />
                  <input
                    type="text"
                    value={criterion.text || ''}
                    onChange={(e) => {
                      const updated = [...(formData.successCriteria || [])];
                      updated[index] = { ...updated[index], text: e.target.value };
                      handleChange('successCriteria', updated);
                    }}
                    placeholder="What defines success for this project?"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      const updated = (formData.successCriteria || []).filter((_, i) => i !== index);
                      handleChange('successCriteria', updated);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const updated = [
                    ...(formData.successCriteria || []),
                    { text: '', completed: false, order: (formData.successCriteria || []).length }
                  ];
                  handleChange('successCriteria', updated);
                }}
              >
                + Add Criterion
              </Button>
            </div>
          </>
        );

      case 'tech-stack':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tech Stack (comma-separated)
              </label>
              <Textarea
                value={(formData.techStack || []).join(', ')}
                onChange={(e) => handleChange('techStack', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                rows={3}
                placeholder="React, Node.js, MongoDB"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags (comma-separated)
              </label>
              <Textarea
                value={(formData.tags || []).join(', ')}
                onChange={(e) => handleChange('tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                rows={2}
                placeholder="frontend, backend, fullstack"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project Type (comma-separated)
              </label>
              <Textarea
                value={(formData.projectType || []).join(', ')}
                onChange={(e) => handleChange('projectType', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                rows={2}
                placeholder="personal, learning"
              />
            </div>
          </>
        );

      case 'resources':
        return (
          <>
            <Input
              label="Deployment URL"
              value={formData.deploymentUrl || ''}
              onChange={(e) => handleChange('deploymentUrl', e.target.value)}
              placeholder="https://myapp.com"
            />
            <Input
              label="External Issue Tracker"
              value={formData.externalIssueTracker || ''}
              onChange={(e) => handleChange('externalIssueTracker', e.target.value)}
              placeholder="https://jira.mycompany.com"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Design File Links (one per line)
              </label>
              <Textarea
                value={(formData.designFileLinks || []).join('\n')}
                onChange={(e) => handleChange('designFileLinks', e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
                rows={3}
                placeholder="https://figma.com/file/..."
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Note: Quick Links are managed in the main project modal
            </p>
          </>
        );

      case 'github-kanban':
        return (
          <>
            <Input
              label="GitHub Repository URL"
              value={formData.githubRepoUrl || ''}
              onChange={(e) => handleChange('githubRepoUrl', e.target.value)}
              placeholder="https://github.com/username/repo"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              GitHub issue integration will be available soon. For now, you can update the repository URL.
            </p>
          </>
        );

      case 'relationships':
        return (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Related projects and blockers can be managed in the main project modal for better control.
            </p>
            <Button
              variant="secondary"
              onClick={() => window.dispatchEvent(new CustomEvent('openProjectModal', { detail: projectId }))}
            >
              Open Full Project Editor
            </Button>
          </>
        );

      default:
        return <p className="text-gray-500">Editing for this card is not yet implemented.</p>;
    }
  };

  const getModalTitle = () => {
    switch (cardType) {
      case 'basic-info':
        return 'Edit Project Information';
      case 'documentation':
        return 'Edit Documentation';
      case 'completion':
        return 'Edit Completion Details';
      case 'success-criteria':
        return 'Edit Success Criteria';
      case 'tech-stack':
        return 'Edit Tech Stack';
      case 'resources':
        return 'Edit Resources';
      case 'github-kanban':
        return 'Edit GitHub Repository';
      case 'relationships':
        return 'Edit Relationships';
      default:
        return 'Edit Card';
    }
  };

  const footer = (
    <div className="flex gap-2 justify-end">
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSubmit}>
        <Save size={16} />
        Save Changes
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getModalTitle()}
      size="lg"
      footer={footer}
    >
      <div className="space-y-4">
        {renderFields()}
      </div>
    </Modal>
  );
};

export default CardEditModal;
