import { format, formatDistanceToNow, differenceInSeconds, differenceInDays } from 'date-fns';

/**
 * Format a date to a readable string
 */
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return '';
  return format(new Date(date), formatStr);
};

/**
 * Format a date with time
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

/**
 * Calculate duration between two dates in seconds
 */
export const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  return differenceInSeconds(new Date(endDate), new Date(startDate));
};

/**
 * Calculate days between two dates
 */
export const daysBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  return differenceInDays(new Date(endDate), new Date(startDate));
};

/**
 * Format duration in seconds to human readable format
 * @param {number} seconds
 * @returns {string} e.g., "2h 30m" or "45m" or "30s"
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0s';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 && hours === 0) parts.push(`${secs}s`);

  return parts.join(' ') || '0s';
};

/**
 * Format duration to HH:MM:SS
 */
export const formatDurationHMS = (seconds) => {
  if (!seconds || seconds < 0) return '00:00:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [hours, minutes, secs]
    .map(val => val.toString().padStart(2, '0'))
    .join(':');
};

/**
 * Convert seconds to hours (decimal)
 */
export const secondsToHours = (seconds) => {
  return (seconds / 3600).toFixed(2);
};

/**
 * Convert hours to seconds
 */
export const hoursToSeconds = (hours) => {
  return Math.round(hours * 3600);
};

/**
 * Get start of day
 */
export const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get end of day
 */
export const getEndOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Check if date is today
 */
export const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  return checkDate.toDateString() === today.toDateString();
};

/**
 * IST Timezone Utilities
 * IST is UTC+5:30
 */
const IST_OFFSET = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds

/**
 * Get current date and time in IST
 */
export const getISTNow = () => {
  const now = new Date();
  return new Date(now.getTime() + IST_OFFSET);
};

/**
 * Get today's date in IST (YYYY-MM-DD format)
 */
export const getISTToday = () => {
  const istNow = getISTNow();
  return istNow.toISOString().split('T')[0];
};

/**
 * Convert a date to IST and return ISO string
 */
export const toISTString = (date) => {
  const d = new Date(date);
  const istDate = new Date(d.getTime() + IST_OFFSET);
  return istDate.toISOString();
};

/**
 * Get IST date string from date input (YYYY-MM-DD) and time input (HH:MM)
 * Returns ISO string in UTC (which represents the IST time)
 */
export const getISTDateTimeString = (dateStr, timeStr) => {
  // Create date string in IST format
  const istDateTimeStr = `${dateStr}T${timeStr}:00.000+05:30`;
  return new Date(istDateTimeStr).toISOString();
};
