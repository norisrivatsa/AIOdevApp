import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '../lib/api';
import { queryKeys } from '../lib/queryClient';
import toast from 'react-hot-toast';

export const useCourses = (status) => {
  return useQuery({
    queryKey: status ? queryKeys.courses.byStatus(status) : queryKeys.courses.all,
    queryFn: async () => {
      const response = await coursesApi.getAll(status);
      return response.data;
    },
  });
};

export const useCourse = (id) => {
  return useQuery({
    queryKey: queryKeys.courses.byId(id),
    queryFn: async () => {
      const response = await coursesApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => coursesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
      toast.success('Course created successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to create course');
    },
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => coursesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.byId(variables.id) });
      toast.success('Course updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update course');
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => coursesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
      toast.success('Course deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete course');
    },
  });
};

export const useAddSubtopic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, data }) => coursesApi.addSubtopic(courseId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.byId(variables.courseId) });
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
    mutationFn: ({ courseId, subtopicId, data }) =>
      coursesApi.updateSubtopic(courseId, subtopicId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.byId(variables.courseId) });
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update subtopic');
    },
  });
};

export const useDeleteSubtopic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, subtopicId }) =>
      coursesApi.deleteSubtopic(courseId, subtopicId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.byId(variables.courseId) });
      toast.success('Subtopic deleted!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete subtopic');
    },
  });
};
