import { Settings, Moon, Sun, Edit3 } from 'lucide-react';
import useSettingsStore from '../../stores/settingsStore';
import useUIStore from '../../stores/uiStore';
import { THEME } from '../../utils/constants';
import Button from '../ui/Button';

const TopBar = ({ currentBoardName }) => {
  const { theme, toggleTheme } = useSettingsStore();
  const { openSettings, isEditMode, toggleEditMode } = useUIStore();

  return (
    <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-6" style={{ height: '5vh' }}>
      <div className="flex items-center justify-between w-full h-full">
        {/* Logo/Title - Left */}
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Time Tracker
          </h1>
        </div>

        {/* Current Board Name - Center */}
        <div className="flex-1 text-center">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {currentBoardName}
          </h2>
        </div>

        {/* Actions - Right */}
        <div className="flex-1 flex items-center justify-end gap-3">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="p-2"
          >
            {theme === THEME.DARK ? <Sun size={20} /> : <Moon size={20} />}
          </Button>

          {/* Edit Mode Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleEditMode}
            className={`p-2 ${isEditMode ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : ''}`}
          >
            <Edit3 size={20} />
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            onClick={openSettings}
            className="p-2"
          >
            <Settings size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
