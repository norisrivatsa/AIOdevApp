import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const CollapsibleSection = ({
  title,
  children,
  defaultOpen = false,
  badge,
  icon: Icon,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown size={20} className="text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
          )}
          {Icon && <Icon size={18} className="text-gray-600 dark:text-gray-400" />}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          {badge && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
              {badge}
            </span>
          )}
        </div>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="px-4 py-4 bg-white dark:bg-gray-900">
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;
