import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectsApi } from '../lib/api';
import toast from 'react-hot-toast';

const queryKeys = {
  subjects: {
    all: ['subjects'],
    byId: (id) => ['subjects', id],
    byStatus: (status) => ['subjects', { status }],
  },
};

export const useSubjects = (status) => {
  return useQuery({
    queryKey: status ? queryKeys.subjects.byStatus(status) : queryKeys.subjects.all,
    queryFn: async () => {
      const response = await subjectsApi.getAll(status);
      return response.data;
    },
  });
};

export const useSubject = (id) => {
  return useQuery({
    queryKey: queryKeys.subjects.byId(id),
    queryFn: async () => {
      const response = await subjectsApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => subjectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all });
      toast.success('Subject created successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to create subject');
    },
  });
};

export const useUpdateSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => subjectsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.byId(variables.id) });
      toast.success('Subject updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update subject');
    },
  });
};

export const useDeleteSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => subjectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all });
      toast.success('Subject deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete subject');
    },
  });
};

export const useAddSubtopic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ subjectId, data }) => subjectsApi.addSubtopic(subjectId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.byId(variables.subjectId) });
      toast.success('Subtopic added!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to add subtopic');
    },
  });
};

export const useUpdateSubtopic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ subjectId, subtopicId, data }) =>
      subjectsApi.updateSubtopic(subjectId, subtopicId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.byId(variables.subjectId) });
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update subtopic');
    },
  });
};

export const useDeleteSubtopic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ subjectId, subtopicId }) =>
      subjectsApi.deleteSubtopic(subjectId, subtopicId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.byId(variables.subjectId) });
      toast.success('Subtopic deleted!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete subtopic');
    },
  });
};
