import { useState, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import Badge from './Badge';

const TagInput = ({
  value = [],
  onChange,
  label,
  placeholder = 'Add tag...',
  error,
  helperText,
  presetTags = [],
  maxTags,
  allowCustom = true,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const inputRef = useRef(null);

  const handleAddTag = (tag) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (!trimmedTag) return;
    if (value.includes(trimmedTag)) return;
    if (maxTags && value.length >= maxTags) return;

    onChange([...value, trimmedTag]);
    setInputValue('');
    setShowPresets(false);
  };

  const handleRemoveTag = (tagToRemove) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (allowCustom) {
        handleAddTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove last tag on backspace if input is empty
      handleRemoveTag(value[value.length - 1]);
    }
  };

  const filteredPresets = presetTags.filter(
    (tag) =>
      !value.includes(tag.toLowerCase()) &&
      tag.toLowerCase().includes(inputValue.toLowerCase())
  );

  const showWarning = maxTags && value.length > 10;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}

      {/* Tags Display */}
      <div className="min-h-[42px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent bg-white dark:bg-gray-800">
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              size="sm"
              className="flex items-center gap-1"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:text-red-600 focus:outline-none"
              >
                <X size={14} />
              </button>
            </Badge>
          ))}

          {/* Input */}
          {(!maxTags || value.length < maxTags) && (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowPresets(true)}
              onBlur={() => setTimeout(() => setShowPresets(false), 200)}
              placeholder={value.length === 0 ? placeholder : ''}
              className="flex-1 min-w-[120px] outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          )}
        </div>
      </div>

      {/* Preset Tags */}
      {showPresets && presetTags.length > 0 && filteredPresets.length > 0 && (
        <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 shadow-lg">
          <div className="p-2 space-y-1">
            {filteredPresets.slice(0, 20).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleAddTag(tag)}
                className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2"
              >
                <Plus size={14} />
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Helper Text / Error / Warning */}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
      {showWarning && !error && (
        <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
          ⚠ You have many tags. Consider reducing for better organization.
        </p>
      )}
      {maxTags && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {value.length} / {maxTags} tags
        </p>
      )}
    </div>
  );
};

export default TagInput;
