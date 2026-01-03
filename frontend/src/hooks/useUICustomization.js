import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { uiCustomizationApi } from '../lib/api';
import { queryKeys } from '../lib/queryClient';
import toast from 'react-hot-toast';

export const useUICustomization = () => {
  return useQuery({
    queryKey: queryKeys.uiCustomization.all,
    queryFn: async () => {
      const response = await uiCustomizationApi.get();
      return response.data;
    },
  });
};

export const useCreateUICustomization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => uiCustomizationApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.uiCustomization.all });
      toast.success('Customization saved!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to save customization');
    },
  });
};

export const useUpdateUICustomization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => uiCustomizationApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.uiCustomization.all });
      toast.success('Customization updated!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update customization');
    },
  });
};

export const useUpdateBoardCustomization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, data }) => uiCustomizationApi.updateBoard(boardId, data),
    onSuccess: (response, variables) => {
      // Update the cache with optimistic data immediately
      queryClient.setQueryData(queryKeys.uiCustomization.all, (oldData) => {
        if (!oldData) return oldData;

        const boards = oldData.boards || [];
        const existingBoardIndex = boards.findIndex(b => b.boardId === variables.boardId);

        if (existingBoardIndex >= 0) {
          // Update existing board
          boards[existingBoardIndex] = variables.data;
        } else {
          // Add new board
          boards.push(variables.data);
        }

        return {
          ...oldData,
          boards
        };
      });

      // No toast notification for auto-saves to avoid spam
    },
    onError: (error) => {
      // Log detailed error for debugging
      console.error('Board customization update error:', error);
      console.error('Error response:', error.response?.data);

      // Format error message
      const detail = error.response?.data?.detail;
      let errorMessage = 'Failed to update board customization';

      if (Array.isArray(detail)) {
        // FastAPI validation errors
        errorMessage = detail.map(err => `${err.loc?.join('.')}: ${err.msg}`).join(', ');
        console.error('Validation errors:', detail);
      } else if (typeof detail === 'string') {
        errorMessage = detail;
      }

      toast.error(errorMessage);
    },
  });
};

export const useDeleteBoardCustomization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (boardId) => uiCustomizationApi.deleteBoard(boardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.uiCustomization.all });
      toast.success('Board customization removed!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to remove board customization');
    },
  });
};
