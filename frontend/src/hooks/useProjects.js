import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../lib/api';
import { queryKeys } from '../lib/queryClient';
import toast from 'react-hot-toast';

export const useProjects = (status) => {
  return useQuery({
    queryKey: status ? queryKeys.projects.byStatus(status) : queryKeys.projects.all,
    queryFn: async () => {
      const response = await projectsApi.getAll(status);
      return response.data;
    },
  });
};

export const useProject = (id) => {
  return useQuery({
    queryKey: queryKeys.projects.byId(id),
    queryFn: async () => {
      const response = await projectsApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      toast.success('Project created successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to create project');
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => projectsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.byId(variables.id) });
      toast.success('Project updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update project');
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      toast.success('Project deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete project');
    },
  });
};

export const useSyncGithub = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => projectsApi.syncGithub(id),
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.byId(projectId) });
      toast.success('GitHub data synced!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to sync GitHub data');
    },
  });
};
