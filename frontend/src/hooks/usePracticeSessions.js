import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { practiceSessionsApi } from '../lib/api';
import toast from 'react-hot-toast';

const queryKeys = {
  practiceSessions: {
    all: ['practiceSessions'],
    byId: (id) => ['practiceSessions', id],
    bySubject: (subjectId) => ['practiceSessions', 'subject', subjectId],
    stats: (subjectId) => ['practiceSessions', 'subject', subjectId, 'stats'],
  },
};

// Helper to format validation errors
const formatValidationError = (error) => {
  if (!error.response?.data?.detail) {
    return 'An error occurred';
  }

  const detail = error.response.data.detail;

  if (typeof detail === 'string') {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail.map(err => {
      const field = err.loc?.slice(1).join('.') || 'field';
      return `${field}: ${err.msg}`;
    }).join(', ');
  }

  if (typeof detail === 'object') {
    return detail.msg || detail.message || JSON.stringify(detail);
  }

  return 'Validation error';
};

export const usePracticeSessions = (subjectId) => {
  return useQuery({
    queryKey: subjectId ? queryKeys.practiceSessions.bySubject(subjectId) : queryKeys.practiceSessions.all,
    queryFn: async () => {
      const response = await practiceSessionsApi.getAll(subjectId);
      return response.data;
    },
  });
};

export const usePracticeSession = (id) => {
  return useQuery({
    queryKey: queryKeys.practiceSessions.byId(id),
    queryFn: async () => {
      const response = await practiceSessionsApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const usePracticeSessionStats = (subjectId) => {
  return useQuery({
    queryKey: queryKeys.practiceSessions.stats(subjectId),
    queryFn: async () => {
      const response = await practiceSessionsApi.getSubjectStats(subjectId);
      return response.data;
    },
    enabled: !!subjectId,
  });
};

export const useCreatePracticeSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => practiceSessionsApi.create(data),
    onSuccess: (response) => {
      const subjectId = response.data.subjectId;
      queryClient.invalidateQueries({ queryKey: queryKeys.practiceSessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.practiceSessions.bySubject(subjectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.practiceSessions.stats(subjectId) });
      // Also invalidate subject queries to update total time
      queryClient.invalidateQueries({ queryKey: ['subjects', subjectId] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Practice session created successfully!');
    },
    onError: (error) => {
      const errorMessage = formatValidationError(error);
      toast.error(errorMessage || 'Failed to create practice session');
    },
  });
};

export const useUpdatePracticeSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => practiceSessionsApi.update(id, data),
    onSuccess: (response, variables) => {
      const subjectId = response.data.subjectId;
      queryClient.invalidateQueries({ queryKey: queryKeys.practiceSessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.practiceSessions.bySubject(subjectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.practiceSessions.byId(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.practiceSessions.stats(subjectId) });
      queryClient.invalidateQueries({ queryKey: ['subjects', subjectId] });
      toast.success('Practice session updated successfully!');
    },
    onError: (error) => {
      const errorMessage = formatValidationError(error);
      toast.error(errorMessage || 'Failed to update practice session');
    },
  });
};

export const usePartialUpdatePracticeSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }) => practiceSessionsApi.partialUpdate(id, updates),
    onSuccess: (response, variables) => {
      const subjectId = response.data.subjectId;
      queryClient.invalidateQueries({ queryKey: queryKeys.practiceSessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.practiceSessions.bySubject(subjectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.practiceSessions.byId(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.practiceSessions.stats(subjectId) });
      toast.success('Practice session updated successfully!');
    },
    onError: (error) => {
      const errorMessage = formatValidationError(error);
      toast.error(errorMessage || 'Failed to update practice session');
    },
  });
};

export const useDeletePracticeSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, subjectId }) => practiceSessionsApi.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.practiceSessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.practiceSessions.bySubject(variables.subjectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.practiceSessions.stats(variables.subjectId) });
      queryClient.invalidateQueries({ queryKey: ['subjects', variables.subjectId] });
      toast.success('Practice session deleted successfully!');
    },
    onError: (error) => {
      const errorMessage = formatValidationError(error);
      toast.error(errorMessage || 'Failed to delete practice session');
    },
  });
};
