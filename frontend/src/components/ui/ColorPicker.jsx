import { useState } from 'react';
import { Check } from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Green', value: '#10B981' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Slate', value: '#64748B' },
  { name: 'Gray', value: '#6B7280' },
];

const ColorPicker = ({ value, onChange, label, error }) => {
  const [showCustom, setShowCustom] = useState(false);
  const [customColor, setCustomColor] = useState(value || '#3B82F6');

  const handleColorSelect = (color) => {
    onChange(color);
    setCustomColor(color);
  };

  const handleCustomColorChange = (e) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    onChange(newColor);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}

      {/* Preset Colors Grid */}
      <div className="grid grid-cols-6 gap-2 mb-3">
        {PRESET_COLORS.map((color) => (
          <button
            key={color.value}
            type="button"
            onClick={() => handleColorSelect(color.value)}
            className="relative h-10 w-full rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            style={{ backgroundColor: color.value }}
            title={color.name}
          >
            {value === color.value && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Check size={20} className="text-white drop-shadow-md" strokeWidth={3} />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Custom Color Section */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
        >
          {showCustom ? 'Hide' : 'Show'} custom color
        </button>

        {showCustom && (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={customColor}
              onChange={handleCustomColorChange}
              className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
            />
            <input
              type="text"
              value={customColor}
              onChange={(e) => {
                const val = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                  setCustomColor(val);
                  if (val.length === 7) {
                    onChange(val);
                  }
                }
              }}
              placeholder="#3B82F6"
              maxLength={7}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
        )}
      </div>

      {/* Color Preview */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Selected:</span>
        <div
          className="h-6 w-6 rounded border border-gray-300 dark:border-gray-600"
          style={{ backgroundColor: value }}
        />
        <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{value}</span>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default ColorPicker;
