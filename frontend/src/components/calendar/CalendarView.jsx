import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { formatDuration } from '../../utils/date';

const CalendarView = ({ activityData = [], onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'
  const [hoveredDay, setHoveredDay] = useState(null);

  // Get the first day of the month
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  // Get the last day of the month
  const getLastDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };

  // Get days to display based on view mode
  const getDaysToDisplay = useMemo(() => {
    if (viewMode === 'week') {
      // Get the current week (Sunday to Saturday)
      const today = new Date(currentDate);
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);

      const days = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        days.push(day);
      }
      return days;
    } else {
      // Month view
      const firstDay = getFirstDayOfMonth(currentDate);
      const lastDay = getLastDayOfMonth(currentDate);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

      const days = [];
      const currentMonth = currentDate.getMonth();

      // Add days from previous month to fill the first week
      while (startDate <= lastDay || days.length % 7 !== 0) {
        days.push(new Date(startDate));
        startDate.setDate(startDate.getDate() + 1);

        // Stop after completing the last week
        if (startDate > lastDay && days.length % 7 === 0) break;
      }

      return days;
    }
  }, [currentDate, viewMode]);

  // Find activity data for a specific date
  const getActivityForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return activityData.find(d => d.date.split('T')[0] === dateStr);
  };

  // Navigate to previous period
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  // Navigate to next period
  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Navigate to today
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is in current month (for month view)
  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  // Get intensity color based on activity
  const getIntensityColor = (activity) => {
    if (!activity || activity.totalSeconds === 0) {
      return 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800';
    }

    // Calculate max from all activity data
    const maxSeconds = Math.max(...activityData.map(d => d.totalSeconds || 0), 1);
    const intensity = activity.totalSeconds / maxSeconds;

    if (intensity < 0.25) return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-800';
    if (intensity < 0.5) return 'bg-green-300 dark:bg-green-700/50 border-green-400 dark:border-green-600';
    if (intensity < 0.75) return 'bg-green-500 dark:bg-green-500/70 border-green-600 dark:border-green-400';
    return 'bg-green-700 dark:bg-green-300/90 border-green-800 dark:border-green-200';
  };

  // Format month/year display
  const formatDisplayDate = () => {
    const options = { month: 'long', year: 'numeric' };
    if (viewMode === 'week') {
      const firstDay = getDaysToDisplay[0];
      const lastDay = getDaysToDisplay[6];
      if (firstDay.getMonth() === lastDay.getMonth()) {
        return `${firstDay.toLocaleDateString('en-US', { month: 'long' })} ${firstDay.getDate()}-${lastDay.getDate()}, ${firstDay.getFullYear()}`;
      } else {
        return `${firstDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${lastDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
    }
    return currentDate.toLocaleDateString('en-US', options);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatDisplayDate()}
          </h3>
          <div className="flex gap-1">
            <button
              onClick={handlePrevious}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Next"
            >
              <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'month'
                ? 'btn-gradient text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'week'
                ? 'btn-gradient text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col">
        {/* Week day headers */}
        <div className={`grid ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-7'} gap-2 mb-2`}>
          {weekDays.map(day => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className={`grid ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-7'} gap-2 flex-1`}>
          {getDaysToDisplay.map((date, index) => {
            const activity = getActivityForDate(date);
            const isOutsideMonth = viewMode === 'month' && !isCurrentMonth(date);
            const isTodayDate = isToday(date);

            return (
              <div
                key={index}
                className={`
                  relative border-2 rounded-lg p-3 transition-all cursor-pointer
                  ${getIntensityColor(activity)}
                  ${isOutsideMonth ? 'opacity-40' : 'opacity-100'}
                  ${isTodayDate ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
                  ${viewMode === 'week' ? 'min-h-[120px]' : 'min-h-[80px]'}
                  hover:shadow-lg hover:scale-105 hover:z-10
                `}
                onMouseEnter={() => setHoveredDay(date.toISOString())}
                onMouseLeave={() => setHoveredDay(null)}
                onClick={() => onDateSelect?.(date)}
              >
                {/* Date number */}
                <div className={`text-lg font-semibold mb-1 ${
                  isOutsideMonth
                    ? 'text-gray-400 dark:text-gray-600'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {date.getDate()}
                </div>

                {/* Activity indicator */}
                {activity && activity.totalSeconds > 0 && (
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {formatDuration(activity.totalSeconds)}
                  </div>
                )}

                {/* Hover info panel */}
                {hoveredDay === date.toISOString() && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50 w-64 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-gray-200 dark:border-gray-700">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      {date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>

                    {activity && activity.totalSeconds > 0 ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Total Time:</span>
                          <span className="text-sm font-semibold text-gradient">
                            {formatDuration(activity.totalSeconds)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Sessions:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {activity.sessionCount || 0}
                          </span>
                        </div>
                        {activity.sessionCount > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Avg Session:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatDuration(Math.floor(activity.totalSeconds / activity.sessionCount))}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        No activity recorded
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
