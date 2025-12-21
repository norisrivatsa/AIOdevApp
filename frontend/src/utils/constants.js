// Course statuses
export const COURSE_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold',
};

export const COURSE_STATUS_LABELS = {
  [COURSE_STATUS.NOT_STARTED]: 'Not Started',
  [COURSE_STATUS.IN_PROGRESS]: 'In Progress',
  [COURSE_STATUS.COMPLETED]: 'Completed',
  [COURSE_STATUS.ON_HOLD]: 'On Hold',
};

export const COURSE_STATUS_COLORS = {
  [COURSE_STATUS.NOT_STARTED]: 'bg-gray-500',
  [COURSE_STATUS.IN_PROGRESS]: 'bg-blue-500',
  [COURSE_STATUS.COMPLETED]: 'bg-green-500',
  [COURSE_STATUS.ON_HOLD]: 'bg-yellow-500',
};

// Project statuses
export const PROJECT_STATUS = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
};

export const PROJECT_STATUS_LABELS = {
  [PROJECT_STATUS.PLANNING]: 'Planning',
  [PROJECT_STATUS.ACTIVE]: 'Active',
  [PROJECT_STATUS.COMPLETED]: 'Completed',
  [PROJECT_STATUS.ARCHIVED]: 'Archived',
};

export const PROJECT_STATUS_COLORS = {
  [PROJECT_STATUS.PLANNING]: 'bg-purple-500',
  [PROJECT_STATUS.ACTIVE]: 'bg-blue-500',
  [PROJECT_STATUS.COMPLETED]: 'bg-green-500',
  [PROJECT_STATUS.ARCHIVED]: 'bg-gray-500',
};

// Session types
export const SESSION_TYPE = {
  COURSE: 'course',
  PROJECT: 'project',
};

export const SESSION_TYPE_LABELS = {
  [SESSION_TYPE.COURSE]: 'Course',
  [SESSION_TYPE.PROJECT]: 'Project',
};

// Theme options
export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
};

// Default board names
export const DEFAULT_BOARDS = [
  { name: 'Dashboard', key: 'dashboard' },
  { name: 'Calendar', key: 'calendar' },
  { name: 'Courses', key: 'courses' },
  { name: 'Projects', key: 'projects' },
  { name: 'Focus', key: 'focus' },
];

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  NEXT_BOARD: 'ArrowRight',
  PREV_BOARD: 'ArrowLeft',
  COMMAND_PALETTE: 'k',
  NEW_ITEM: 'n',
  SAVE: 's',
  SETTINGS: ',',
  SEARCH: 'f',
  START_STOP_TIMER: ' ', // Space
  JUMP_TO_BOARD_1: '1',
  JUMP_TO_BOARD_2: '2',
  JUMP_TO_BOARD_3: '3',
  JUMP_TO_BOARD_4: '4',
  JUMP_TO_BOARD_5: '5',
  JUMP_TO_BOARD_6: '6',
  JUMP_TO_BOARD_7: '7',
};

// Time periods
export const TIME_PERIOD = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
};

// Card types for dashboard customization
export const CARD_TYPE = {
  ACTIVE_COURSES: 'active_courses',
  ACTIVE_PROJECTS: 'active_projects',
  TIME_STATS: 'time_stats',
  RECENT_SESSIONS: 'recent_sessions',
  STREAK: 'streak',
  QUICK_ACTIONS: 'quick_actions',
  TIMER: 'timer',
  PROGRESS_RINGS: 'progress_rings',
  CALENDAR_WIDGET: 'calendar_widget',
};
