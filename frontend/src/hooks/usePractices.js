import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { practicesApi } from '../lib/api';
import toast from 'react-hot-toast';

const queryKeys = {
  practices: {
    all: ['practices'],
    byId: (id) => ['practices', id],
  },
};

export const usePractices = () => {
  return useQuery({
    queryKey: queryKeys.practices.all,
    queryFn: async () => {
      const response = await practicesApi.getAll();
      return response.data;
    },
  });
};

export const usePractice = (id) => {
  return useQuery({
    queryKey: queryKeys.practices.byId(id),
    queryFn: async () => {
      const response = await practicesApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreatePractice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => practicesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.practices.all });
      toast.success('Practice platform created successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to create practice platform');
    },
  });
};

export const useUpdatePractice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => practicesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.practices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.practices.byId(variables.id) });
      toast.success('Practice platform updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update practice platform');
    },
  });
};

export const useDeletePractice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => practicesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.practices.all });
      toast.success('Practice platform deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete practice platform');
    },
  });
};

export const useUpdatePracticeStats = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => practicesApi.updateStats(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.practices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.practices.byId(variables.id) });
      toast.success('Stats updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update stats');
    },
  });
};
