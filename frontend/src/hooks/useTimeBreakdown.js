import { useQuery } from '@tanstack/react-query';
import { useSessions } from './useSessions';
import { useCourses } from './useCourses';
import { useProjects } from './useProjects';
import { useMemo } from 'react';

/**
 * Custom hook to get detailed time breakdown by courses and projects
 * @param {string} period - 'week' or 'month'
 */
export const useTimeBreakdown = (period = 'month') => {
  // Calculate date range based on period
  const now = new Date();
  const startDate = useMemo(() => {
    if (period === 'week') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      weekStart.setHours(0, 0, 0, 0);
      return weekStart;
    } else {
      // month
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      monthStart.setHours(0, 0, 0, 0);
      return monthStart;
    }
  }, [period]);

  const endDate = useMemo(() => {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return end;
  }, []);

  // Fetch all sessions (we'll filter on frontend for now)
  const { data: sessions, isLoading: sessionsLoading, error: sessionsError } = useSessions();
  const { data: courses, isLoading: coursesLoading, error: coursesError } = useCourses();
  const { data: projects, isLoading: projectsLoading, error: projectsError } = useProjects();

  const breakdown = useMemo(() => {
    // Handle errors or missing data
    if (sessionsError || coursesError || projectsError) {
      console.error('Error fetching data:', { sessionsError, coursesError, projectsError });
      return {
        total: 0,
        totalHours: 0,
        courses: [],
        projects: [],
        byCategory: {
          courses: 0,
          projects: 0,
          coursesHours: 0,
          projectsHours: 0,
          coursesPercentage: 0,
          projectsPercentage: 0,
        }
      };
    }

    if (!sessions || !courses || !projects) {
      return {
        total: 0,
        totalHours: 0,
        courses: [],
        projects: [],
        byCategory: {
          courses: 0,
          projects: 0,
          coursesHours: 0,
          projectsHours: 0,
          coursesPercentage: 0,
          projectsPercentage: 0,
        }
      };
    }

    // Ensure sessions is an array
    const sessionsList = Array.isArray(sessions) ? sessions : [];

    // Filter sessions by date range
    const filteredSessions = sessionsList.filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate >= startDate && sessionDate <= endDate;
    });

    // Group by courses
    const courseMap = new Map();
    const projectMap = new Map();
    let totalDuration = 0;
    let totalCourseDuration = 0;
    let totalProjectDuration = 0;

    filteredSessions.forEach(session => {
      totalDuration += session.duration;

      if (session.type === 'course') {
        totalCourseDuration += session.duration;
        const current = courseMap.get(session.referenceId) || 0;
        courseMap.set(session.referenceId, current + session.duration);
      } else if (session.type === 'project') {
        totalProjectDuration += session.duration;
        const current = projectMap.get(session.referenceId) || 0;
        projectMap.set(session.referenceId, current + session.duration);
      }
    });

    // Map to course details
    const courseBreakdown = Array.from(courseMap.entries()).map(([id, duration]) => {
      const course = courses.find(c => c.id === id);
      return {
        id,
        name: course?.title || 'Unknown Course',
        duration,
        hours: parseFloat((duration / 3600).toFixed(2)),
        percentage: totalDuration > 0 ? parseFloat(((duration / totalDuration) * 100).toFixed(1)) : 0,
      };
    }).sort((a, b) => b.duration - a.duration);

    // Map to project details
    const projectBreakdown = Array.from(projectMap.entries()).map(([id, duration]) => {
      const project = projects.find(p => p.id === id);
      return {
        id,
        name: project?.name || 'Unknown Project',
        duration,
        hours: parseFloat((duration / 3600).toFixed(2)),
        percentage: totalDuration > 0 ? parseFloat(((duration / totalDuration) * 100).toFixed(1)) : 0,
      };
    }).sort((a, b) => b.duration - a.duration);

    return {
      total: totalDuration,
      totalHours: parseFloat((totalDuration / 3600).toFixed(2)),
      courses: courseBreakdown,
      projects: projectBreakdown,
      byCategory: {
        courses: totalCourseDuration,
        projects: totalProjectDuration,
        coursesHours: parseFloat((totalCourseDuration / 3600).toFixed(2)),
        projectsHours: parseFloat((totalProjectDuration / 3600).toFixed(2)),
        coursesPercentage: totalDuration > 0 ? parseFloat(((totalCourseDuration / totalDuration) * 100).toFixed(1)) : 0,
        projectsPercentage: totalDuration > 0 ? parseFloat(((totalProjectDuration / totalDuration) * 100).toFixed(1)) : 0,
      }
    };
  }, [sessions, courses, projects, startDate, endDate, sessionsError, coursesError, projectsError]);

  return {
    data: breakdown,
    isLoading: sessionsLoading || coursesLoading || projectsLoading,
    error: sessionsError || coursesError || projectsError,
  };
};
