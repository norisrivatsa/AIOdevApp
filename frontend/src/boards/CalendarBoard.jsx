import { useState } from 'react';
import { useDailyActivity } from '../hooks/useAnalytics';
import { useTimeBreakdown } from '../hooks/useTimeBreakdown';
import Card from '../components/ui/Card';
import CalendarView from '../components/calendar/CalendarView';
import TimeBreakdownPieChart from '../components/charts/TimeBreakdownPieChart';
import EditableGridLayout from '../components/layout/EditableGridLayout';
import { formatDate, formatDuration } from '../utils/date';
import Button from '../components/ui/Button';
import { Clock } from 'lucide-react';

const CalendarBoard = () => {
  const [days, setDays] = useState(90); // Fetch more data for calendar
  const { data: activity, isLoading } = useDailyActivity(days);
  const [selectedDate, setSelectedDate] = useState(null);

  // Get time breakdown for month and week
  const { data: monthBreakdown, isLoading: monthLoading } = useTimeBreakdown('month');
  const { data: weekBreakdown, isLoading: weekLoading } = useTimeBreakdown('week');

  if (isLoading || monthLoading || weekLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-gray-400">Loading calendar...</div>
      </div>
    );
  }

  // Ensure activity is an array and handle errors
  const activityData = Array.isArray(activity) ? activity : [];

  // Handle data validation - ensure breakdown objects are properly structured
  const safeMonthBreakdown = monthBreakdown && typeof monthBreakdown === 'object' && !Array.isArray(monthBreakdown)
    ? monthBreakdown
    : { total: 0, totalHours: 0, courses: [], projects: [], byCategory: { courses: 0, projects: 0 } };

  const safeWeekBreakdown = weekBreakdown && typeof weekBreakdown === 'object' && !Array.isArray(weekBreakdown)
    ? weekBreakdown
    : { total: 0, totalHours: 0, courses: [], projects: [], byCategory: { courses: 0, projects: 0 } };

  // Calculate max for color intensity
  const maxSeconds = activityData.length > 0
    ? Math.max(...activityData.map(d => d.totalSeconds || 0))
    : 0;

  const getIntensityColor = (seconds) => {
    if (seconds === 0) return 'bg-gray-100 dark:bg-gray-800';
    const intensity = seconds / maxSeconds;
    if (intensity < 0.25) return 'bg-green-200 dark:bg-green-900';
    if (intensity < 0.5) return 'bg-green-400 dark:bg-green-700';
    if (intensity < 0.75) return 'bg-green-600 dark:bg-green-500';
    return 'bg-green-800 dark:bg-green-400';
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    console.log('Selected date:', date);
  };

  // Default layout for calendar board cards
  const defaultLayout = [
    { i: 'activity-heatmap', x: 0, y: 0, w: 5, h: 3, minW: 3, minH: 2, cardType: 'chart' },
    { i: 'time-month', x: 0, y: 3, w: 2, h: 2, minW: 2, minH: 2, cardType: 'stat' },
    { i: 'time-week', x: 2, y: 3, w: 3, h: 2, minW: 2, minH: 2, cardType: 'stat' },
    { i: 'time-breakdown', x: 0, y: 5, w: 5, h: 4, minW: 3, minH: 3, cardType: 'chart' },
    { i: 'calendar-view', x: 5, y: 0, w: 7, h: 9, minW: 5, minH: 6, cardType: 'calendar' },
  ];

  // Prepare cards as individual components
  const cards = [
    // Activity Heatmap Card
    <Card key="activity-heatmap">
      <Card.Header>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Activity Heatmap
          </h3>
          <div className="flex gap-2">
            <button
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                days === 30
                  ? 'btn-gradient text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => setDays(30)}
            >
              30d
            </button>
            <button
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                days === 60
                  ? 'btn-gradient text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => setDays(60)}
            >
              60d
            </button>
            <button
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                days === 90
                  ? 'btn-gradient text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => setDays(90)}
            >
              90d
            </button>
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        {activityData.length > 0 ? (
          <div>
            <div className="grid grid-cols-10 gap-1.5">
              {activityData.map((day) => (
                <div
                  key={day.date}
                  className={`
                    aspect-square rounded cursor-pointer transition-all hover:scale-110 hover:shadow-md
                    ${getIntensityColor(day.totalSeconds)}
                  `}
                  title={`${formatDate(day.date)}: ${formatDuration(day.totalSeconds)}`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 text-xs text-gray-600 dark:text-gray-400">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded" />
                <div className="w-3 h-3 bg-green-200 dark:bg-green-900 rounded" />
                <div className="w-3 h-3 bg-green-400 dark:bg-green-700 rounded" />
                <div className="w-3 h-3 bg-green-600 dark:bg-green-500 rounded" />
                <div className="w-3 h-3 bg-green-800 dark:bg-green-400 rounded" />
              </div>
              <span>More</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No activity data available</p>
        )}
      </Card.Body>
    </Card>,

    // Time This Month Card
    <Card key="time-month">
      <Card.Body className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={16} className="text-gray-500 dark:text-gray-400" />
          <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400">
            This Month
          </h4>
        </div>
        <div className="text-2xl font-bold text-gradient">
          {safeMonthBreakdown?.totalHours?.toFixed(1) || '0.0'}h
        </div>
      </Card.Body>
    </Card>,

    // Time This Week Card
    <Card key="time-week">
      <Card.Body className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={16} className="text-gray-500 dark:text-gray-400" />
          <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400">
            This Week
          </h4>
        </div>
        <div className="text-2xl font-bold text-gradient">
          {safeWeekBreakdown?.totalHours?.toFixed(1) || '0.0'}h
        </div>
      </Card.Body>
    </Card>,

    // Time Breakdown Pie Chart Card
    <Card key="time-breakdown">
      <Card.Header>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Time Distribution
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Breakdown by courses and projects this month
        </p>
      </Card.Header>
      <Card.Body>
        <TimeBreakdownPieChart breakdown={safeMonthBreakdown} />
      </Card.Body>
    </Card>,

    // Calendar View Card
    <Card key="calendar-view">
      <Card.Body className="h-full p-6">
        <CalendarView
          activityData={activityData}
          onDateSelect={handleDateSelect}
        />
      </Card.Body>
    </Card>,
  ];

  return (
    <div className="h-full overflow-hidden bg-gray-50 dark:bg-black">
      <EditableGridLayout
        boardId="calendar"
        boardName="Calendar"
        defaultLayout={defaultLayout}
      >
        {cards}
      </EditableGridLayout>
    </div>
  );
};

export default CalendarBoard;
