import { useState } from 'react';
import { formatDuration } from '../../utils/date';

const TimeBreakdownPieChart = ({ breakdown }) => {
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  if (!breakdown || breakdown.total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No time logged yet
      </div>
    );
  }

  const { courses, projects, byCategory } = breakdown;

  // Prepare data for pie chart with accent gradient colors
  const categories = [];

  if (byCategory.courses > 0) {
    categories.push({
      name: 'Courses',
      value: byCategory.courses,
      percentage: byCategory.coursesPercentage,
      color: '#ef4444', // Using theme primary color (red from theme.json)
      items: courses,
    });
  }

  if (byCategory.projects > 0) {
    categories.push({
      name: 'Projects',
      value: byCategory.projects,
      percentage: byCategory.projectsPercentage,
      color: '#f59e0b', // Using theme secondary color (orange from theme.json)
      items: projects,
    });
  }

  // Calculate pie slices
  let currentAngle = -90; // Start from top
  const slices = categories.map((category) => {
    const angle = (category.percentage / 100) * 360;
    const slice = {
      ...category,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
    };
    currentAngle += angle;
    return slice;
  });

  // SVG path calculation for pie slice
  const createArc = (startAngle, endAngle, radius = 100, innerRadius = 0) => {
    const start = polarToCartesian(0, 0, radius, endAngle);
    const end = polarToCartesian(0, 0, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

    if (innerRadius === 0) {
      // Full pie slice
      return [
        `M 0 0`,
        `L ${start.x} ${start.y}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
        `Z`,
      ].join(' ');
    } else {
      // Donut slice
      const innerStart = polarToCartesian(0, 0, innerRadius, endAngle);
      const innerEnd = polarToCartesian(0, 0, innerRadius, startAngle);
      return [
        `M ${start.x} ${start.y}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
        `L ${innerEnd.x} ${innerEnd.y}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerStart.x} ${innerStart.y}`,
        `Z`,
      ].join(' ');
    }
  };

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const handleMouseMove = (e, category) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setHoveredCategory(category);
  };

  const handleMouseLeave = () => {
    setHoveredCategory(null);
  };

  return (
    <div className="relative">
      {/* Pie Chart */}
      <svg
        viewBox="-120 -120 240 240"
        className="w-full h-64"
        onMouseLeave={handleMouseLeave}
      >
        {slices.map((slice, index) => (
          <g key={index}>
            <path
              d={createArc(slice.startAngle, slice.endAngle, 100, 0)}
              fill={slice.color}
              stroke="white"
              strokeWidth="2"
              className="transition-all duration-200 cursor-pointer"
              style={{
                opacity: hoveredCategory === null || hoveredCategory === slice.name ? 1 : 0.4,
                transform: hoveredCategory === slice.name ? 'scale(1.05)' : 'scale(1)',
                transformOrigin: 'center',
              }}
              onMouseMove={(e) => handleMouseMove(e, slice.name)}
            />
            {/* Percentage label */}
            {slice.percentage > 5 && (
              <text
                x={polarToCartesian(0, 0, 60, (slice.startAngle + slice.endAngle) / 2).x}
                y={polarToCartesian(0, 0, 60, (slice.startAngle + slice.endAngle) / 2).y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-sm font-bold fill-white pointer-events-none"
                style={{ userSelect: 'none' }}
              >
                {slice.percentage.toFixed(0)}%
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4">
        {categories.map((category, index) => (
          <div
            key={index}
            className="flex items-center gap-2 cursor-pointer"
            onMouseEnter={() => setHoveredCategory(category.name)}
            onMouseLeave={() => setHoveredCategory(null)}
          >
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: category.color }}
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {category.name}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({category.percentage.toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {hoveredCategory && (
        <div
          className="absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-gray-200 dark:border-gray-700 p-4 min-w-[200px] pointer-events-none"
          style={{
            left: `${mousePosition.x + 10}px`,
            top: `${mousePosition.y + 10}px`,
            transform: 'translate(0, -50%)',
          }}
        >
          <div className="font-semibold text-gray-900 dark:text-white mb-2">
            {hoveredCategory}
          </div>
          <div className="space-y-1">
            {categories
              .find((cat) => cat.name === hoveredCategory)
              ?.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center text-xs"
                >
                  <span className="text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
                    {item.name}
                  </span>
                  <span className="text-gradient font-semibold ml-2">
                    {formatDuration(item.duration)}
                  </span>
                </div>
              ))}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-gray-700 dark:text-gray-300">Total:</span>
              <span className="text-gradient">
                {formatDuration(
                  categories.find((cat) => cat.name === hoveredCategory)?.value || 0
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeBreakdownPieChart;
