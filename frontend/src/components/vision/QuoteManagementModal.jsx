import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, GripVertical, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import {
  useAllVisionQuotes,
  useCreateVisionQuote,
  useUpdateVisionQuote,
  useDeleteVisionQuote,
  useReorderVisionQuotes,
} from '../../hooks/useVisionBoard';

const QuoteManagementModal = ({ isOpen, onClose }) => {
  const { data: quotes = [], isLoading } = useAllVisionQuotes();
  const createQuote = useCreateVisionQuote();
  const updateQuote = useUpdateVisionQuote();
  const deleteQuote = useDeleteVisionQuote();
  const reorderQuotes = useReorderVisionQuotes();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState(null);
  const [formData, setFormData] = useState({
    quoteText: '',
    author: '',
    isActive: true,
  });
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [localQuotes, setLocalQuotes] = useState([]);

  useEffect(() => {
    if (quotes) {
      setLocalQuotes([...quotes].sort((a, b) => a.order - b.order));
    }
  }, [quotes]);

  const resetForm = () => {
    setFormData({
      quoteText: '',
      author: '',
      isActive: true,
    });
    setIsAddingNew(false);
    setEditingQuoteId(null);
  };

  const handleEdit = (quote) => {
    setFormData({
      quoteText: quote.quoteText,
      author: quote.author || '',
      isActive: quote.isActive,
    });
    setEditingQuoteId(quote.quoteId);
    setIsAddingNew(false);
  };

  const handleSubmit = async () => {
    if (!formData.quoteText.trim()) return;

    if (editingQuoteId) {
      await updateQuote.mutateAsync({
        id: editingQuoteId,
        ...formData,
      });
    } else {
      await createQuote.mutateAsync({
        ...formData,
        order: quotes.length,
      });
    }

    resetForm();
  };

  const handleDelete = async (quoteId) => {
    if (!window.confirm('Are you sure you want to delete this quote?')) return;

    try {
      await deleteQuote.mutateAsync(quoteId);
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to delete quote');
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newQuotes = [...localQuotes];
    const draggedQuote = newQuotes[draggedIndex];

    newQuotes.splice(draggedIndex, 1);
    newQuotes.splice(index, 0, draggedQuote);

    setLocalQuotes(newQuotes);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex !== null) {
      // Save new order to backend
      const quoteOrders = localQuotes.map((quote, index) => ({
        quoteId: quote.quoteId,
        order: index,
      }));

      await reorderQuotes.mutateAsync(quoteOrders);
    }

    setDraggedIndex(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const characterCount = formData.quoteText.length;
  const maxChars = 500;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Manage Quotes"
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Add/Edit Quote Form */}
        {(isAddingNew || editingQuoteId) && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingQuoteId ? 'Edit Quote' : 'Add New Quote'}
              </h3>
              <button
                onClick={resetForm}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={18} />
              </button>
            </div>

            <Textarea
              label="Quote Text *"
              value={formData.quoteText}
              onChange={(e) =>
                setFormData({ ...formData, quoteText: e.target.value })
              }
              placeholder="Enter an inspirational quote..."
              rows={4}
              maxLength={maxChars}
            />
            <div className="text-xs text-right text-gray-500 dark:text-gray-400">
              {characterCount}/{maxChars} characters
            </div>

            <Input
              label="Author (Optional)"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              placeholder="e.g., Steve Jobs"
              maxLength={100}
            />

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="rounded text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Active (show in carousel)
              </span>
            </label>

            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={createQuote.isPending || updateQuote.isPending}
                disabled={!formData.quoteText.trim()}
              >
                {editingQuoteId ? 'Update Quote' : 'Add Quote'}
              </Button>
              <Button variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Add New Quote Button */}
        {!isAddingNew && !editingQuoteId && (
          <Button
            variant="outline"
            onClick={() => setIsAddingNew(true)}
            disabled={quotes.length >= 15}
            className="w-full"
          >
            <Plus size={16} />
            Add New Quote {quotes.length >= 15 && '(Maximum reached)'}
          </Button>
        )}

        {/* Quote List */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Your Quotes ({quotes.length}/15)
          </h3>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Loading quotes...
            </div>
          ) : localQuotes.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No quotes yet. Add your first quote!
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {localQuotes.map((quote, index) => (
                <div
                  key={quote.quoteId}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border-2 transition-colors cursor-move ${
                    draggedIndex === index
                      ? 'border-primary-500 opacity-50'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  } ${
                    !quote.isActive ? 'opacity-60' : ''
                  }`}
                >
                  {/* Drag Handle */}
                  <div className="pt-1 text-gray-400 cursor-grab active:cursor-grabbing">
                    <GripVertical size={18} />
                  </div>

                  {/* Quote Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white leading-relaxed line-clamp-2 italic">
                      "{quote.quoteText}"
                    </p>
                    {quote.author && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        — {quote.author}
                      </p>
                    )}
                    {!quote.isActive && (
                      <span className="inline-block text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        (Inactive)
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(quote)}
                      className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(quote.quoteId)}
                      className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete"
                      disabled={quotes.filter((q) => q.isActive).length <= 1 && quote.isActive}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-primary-50 dark:bg-primary-900/20 p-3 rounded">
          <strong>Tip:</strong> Drag quotes to reorder them. At least one quote must remain active.
        </div>
      </div>
    </Modal>
  );
};

export default QuoteManagementModal;
