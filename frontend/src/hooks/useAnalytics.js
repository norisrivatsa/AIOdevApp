import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../lib/api';
import { queryKeys } from '../lib/queryClient';

export const useTimeSummary = (period = 'day') => {
  return useQuery({
    queryKey: queryKeys.analytics.timeSummary(period),
    queryFn: async () => {
      const response = await analyticsApi.getTimeSummary(period);
      return response.data;
    },
  });
};

export const useDistribution = (days = 30) => {
  return useQuery({
    queryKey: queryKeys.analytics.distribution(days),
    queryFn: async () => {
      const response = await analyticsApi.getDistribution(days);
      return response.data;
    },
  });
};

export const useStreaks = () => {
  return useQuery({
    queryKey: queryKeys.analytics.streaks,
    queryFn: async () => {
      const response = await analyticsApi.getStreaks();
      return response.data;
    },
  });
};

export const useProgress = () => {
  return useQuery({
    queryKey: queryKeys.analytics.progress,
    queryFn: async () => {
      const response = await analyticsApi.getProgress();
      return response.data;
    },
  });
};

export const useDailyActivity = (days = 30) => {
  return useQuery({
    queryKey: queryKeys.analytics.dailyActivity(days),
    queryFn: async () => {
      const response = await analyticsApi.getDailyActivity(days);
      // Return just the activity array, not the whole response object
      return response.data.activity || [];
    },
  });
};
