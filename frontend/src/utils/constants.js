// Subject statuses (formerly Course)
export const SUBJECT_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold',
  REVIEWING: 'reviewing',
};

export const SUBJECT_STATUS_LABELS = {
  [SUBJECT_STATUS.NOT_STARTED]: 'Not Started',
  [SUBJECT_STATUS.IN_PROGRESS]: 'In Progress',
  [SUBJECT_STATUS.COMPLETED]: 'Completed',
  [SUBJECT_STATUS.ON_HOLD]: 'On Hold',
  [SUBJECT_STATUS.REVIEWING]: 'Reviewing',
};

export const SUBJECT_STATUS_COLORS = {
  [SUBJECT_STATUS.NOT_STARTED]: 'bg-gray-500',
  [SUBJECT_STATUS.IN_PROGRESS]: 'bg-blue-500',
  [SUBJECT_STATUS.COMPLETED]: 'bg-green-500',
  [SUBJECT_STATUS.ON_HOLD]: 'bg-yellow-500',
  [SUBJECT_STATUS.REVIEWING]: 'bg-purple-500',
};

// Subject priority
export const SUBJECT_PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

export const SUBJECT_PRIORITY_LABELS = {
  [SUBJECT_PRIORITY.HIGH]: 'High',
  [SUBJECT_PRIORITY.MEDIUM]: 'Medium',
  [SUBJECT_PRIORITY.LOW]: 'Low',
};

export const SUBJECT_PRIORITY_COLORS = {
  [SUBJECT_PRIORITY.HIGH]: 'border-red-500 text-red-700 dark:text-red-400',
  [SUBJECT_PRIORITY.MEDIUM]: 'border-yellow-500 text-yellow-700 dark:text-yellow-400',
  [SUBJECT_PRIORITY.LOW]: 'border-green-500 text-green-700 dark:text-green-400',
};

// Subject difficulty levels
export const SUBJECT_DIFFICULTY = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert',
};

export const SUBJECT_DIFFICULTY_LABELS = {
  [SUBJECT_DIFFICULTY.BEGINNER]: 'Beginner',
  [SUBJECT_DIFFICULTY.INTERMEDIATE]: 'Intermediate',
  [SUBJECT_DIFFICULTY.ADVANCED]: 'Advanced',
  [SUBJECT_DIFFICULTY.EXPERT]: 'Expert',
};

export const SUBJECT_DIFFICULTY_COLORS = {
  [SUBJECT_DIFFICULTY.BEGINNER]: 'bg-green-500',
  [SUBJECT_DIFFICULTY.INTERMEDIATE]: 'bg-yellow-500',
  [SUBJECT_DIFFICULTY.ADVANCED]: 'bg-orange-500',
  [SUBJECT_DIFFICULTY.EXPERT]: 'bg-red-500',
};

// Resource types
export const RESOURCE_TYPE = {
  DOCUMENTATION: 'documentation',
  GITHUB: 'github',
  ARTICLE: 'article',
  VIDEO: 'video',
  BOOK: 'book',
  NOTES: 'notes',
  OTHER: 'other',
};

export const RESOURCE_TYPE_LABELS = {
  [RESOURCE_TYPE.DOCUMENTATION]: 'Documentation',
  [RESOURCE_TYPE.GITHUB]: 'GitHub',
  [RESOURCE_TYPE.ARTICLE]: 'Article',
  [RESOURCE_TYPE.VIDEO]: 'Video',
  [RESOURCE_TYPE.BOOK]: 'Book',
  [RESOURCE_TYPE.NOTES]: 'Notes',
  [RESOURCE_TYPE.OTHER]: 'Other',
};

// Backward compatibility
export const COURSE_STATUS = SUBJECT_STATUS;
export const COURSE_STATUS_LABELS = SUBJECT_STATUS_LABELS;
export const COURSE_STATUS_COLORS = SUBJECT_STATUS_COLORS;

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

// Practice platforms
export const PRACTICE_PLATFORM = {
  LEETCODE: 'leetcode',
  CODEFORCES: 'codeforces',
  HACKERRANK: 'hackerrank',
  CODEWARS: 'codewars',
  OTHER: 'other',
};

export const PRACTICE_PLATFORM_LABELS = {
  [PRACTICE_PLATFORM.LEETCODE]: 'LeetCode',
  [PRACTICE_PLATFORM.CODEFORCES]: 'Codeforces',
  [PRACTICE_PLATFORM.HACKERRANK]: 'HackerRank',
  [PRACTICE_PLATFORM.CODEWARS]: 'Codewars',
  [PRACTICE_PLATFORM.OTHER]: 'Other',
};

export const DIFFICULTY_LEVEL = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
};

export const DIFFICULTY_LEVEL_LABELS = {
  [DIFFICULTY_LEVEL.EASY]: 'Easy',
  [DIFFICULTY_LEVEL.MEDIUM]: 'Medium',
  [DIFFICULTY_LEVEL.HARD]: 'Hard',
};

export const DIFFICULTY_LEVEL_COLORS = {
  [DIFFICULTY_LEVEL.EASY]: 'bg-green-500',
  [DIFFICULTY_LEVEL.MEDIUM]: 'bg-yellow-500',
  [DIFFICULTY_LEVEL.HARD]: 'bg-red-500',
};

// Session types
export const SESSION_TYPE = {
  SUBJECT: 'subject',
  PROJECT: 'project',
  PRACTICE: 'practice',
};

export const SESSION_TYPE_LABELS = {
  [SESSION_TYPE.SUBJECT]: 'Subject',
  [SESSION_TYPE.PROJECT]: 'Project',
  [SESSION_TYPE.PRACTICE]: 'Practice',
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
  { name: 'Analytics', key: 'analytics' },
  { name: 'Projects & Subjects', key: 'creation' },
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
