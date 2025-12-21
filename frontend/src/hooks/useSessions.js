import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsApi } from '../lib/api';
import { queryKeys } from '../lib/queryClient';
import toast from 'react-hot-toast';

export const useSessions = (params) => {
  return useQuery({
    queryKey: [...queryKeys.sessions.all, params],
    queryFn: async () => {
      try {
        const response = await sessionsApi.getAll(params);
        return response.data;
      } catch (error) {
        console.error('Error fetching sessions:', error);
        // Return empty array on error to prevent breaking the UI
        return [];
      }
    },
    retry: 1,
    staleTime: 30000,
  });
};

export const useSession = (id) => {
  return useQuery({
    queryKey: queryKeys.sessions.byId(id),
    queryFn: async () => {
      const response = await sessionsApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useActiveSession = () => {
  return useQuery({
    queryKey: queryKeys.sessions.active,
    queryFn: async () => {
      const response = await sessionsApi.getActive();
      return response.data;
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });
};

export const useSessionStats = () => {
  return useQuery({
    queryKey: queryKeys.sessions.stats,
    queryFn: async () => {
      const response = await sessionsApi.getStats();
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useCreateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => sessionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.active });
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to create session');
    },
  });
};

export const useUpdateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => sessionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.active });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.stats });
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update session');
    },
  });
};

export const useDeleteSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => sessionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.stats });
      toast.success('Session deleted!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete session');
    },
  });
};
