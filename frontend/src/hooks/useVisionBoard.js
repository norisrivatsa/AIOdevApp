import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

// ==================== QUOTES HOOKS ====================

export const useVisionQuotes = () => {
  return useQuery({
    queryKey: ['visionQuotes'],
    queryFn: async () => {
      const { data } = await api.get('/visions/quotes');
      return data;
    },
  });
};

export const useAllVisionQuotes = () => {
  return useQuery({
    queryKey: ['visionQuotes', 'all'],
    queryFn: async () => {
      const { data } = await api.get('/visions/quotes/all');
      return data;
    },
  });
};

export const useCreateVisionQuote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quoteData) => {
      const { data } = await api.post('/visions/quotes', quoteData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visionQuotes'] });
    },
  });
};

export const useUpdateVisionQuote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...quoteData }) => {
      const { data } = await api.put(`/visions/quotes/${id}`, quoteData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visionQuotes'] });
    },
  });
};

export const useDeleteVisionQuote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quoteId) => {
      await api.delete(`/visions/quotes/${quoteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visionQuotes'] });
    },
  });
};

export const useReorderVisionQuotes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quoteOrders) => {
      const { data } = await api.put('/visions/quotes/reorder', quoteOrders);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visionQuotes'] });
    },
  });
};

// ==================== CARDS HOOKS ====================

export const useVisionCards = () => {
  return useQuery({
    queryKey: ['visionCards'],
    queryFn: async () => {
      const { data } = await api.get('/visions/cards');
      return data;
    },
  });
};

export const useVisionCard = (cardId) => {
  return useQuery({
    queryKey: ['visionCards', cardId],
    queryFn: async () => {
      const { data } = await api.get(`/visions/cards/${cardId}`);
      return data;
    },
    enabled: !!cardId,
  });
};

export const useCreateVisionCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardData) => {
      const { data } = await api.post('/visions/cards', cardData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visionCards'] });
    },
  });
};

export const useUpdateVisionCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...cardData }) => {
      const { data } = await api.put(`/visions/cards/${id}`, cardData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visionCards'] });
    },
  });
};

export const useDeleteVisionCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardId) => {
      await api.delete(`/visions/cards/${cardId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visionCards'] });
      queryClient.invalidateQueries({ queryKey: ['visionGoals'] });
    },
  });
};

export const useReorderVisionCards = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardPositions) => {
      const { data } = await api.put('/visions/cards/reorder', cardPositions);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visionCards'] });
    },
  });
};

// ==================== GOALS HOOKS ====================

export const useVisionGoals = (cardId) => {
  return useQuery({
    queryKey: ['visionGoals', cardId],
    queryFn: async () => {
      const { data } = await api.get(`/visions/cards/${cardId}/goals`);
      return data;
    },
    enabled: !!cardId,
  });
};

export const useVisionGoal = (goalId) => {
  return useQuery({
    queryKey: ['visionGoals', 'single', goalId],
    queryFn: async () => {
      const { data } = await api.get(`/visions/goals/${goalId}`);
      return data;
    },
    enabled: !!goalId,
  });
};

export const useCreateVisionGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, ...goalData }) => {
      const { data } = await api.post(`/visions/cards/${cardId}/goals`, goalData);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['visionGoals', variables.cardId] });
      queryClient.invalidateQueries({ queryKey: ['visionCards'] });
    },
  });
};

export const useUpdateVisionGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...goalData }) => {
      const { data } = await api.put(`/visions/goals/${id}`, goalData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visionGoals'] });
      queryClient.invalidateQueries({ queryKey: ['visionCards'] });
    },
  });
};

export const useDeleteVisionGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, cardId }) => {
      await api.delete(`/visions/goals/${id}`);
      return { cardId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['visionGoals', data.cardId] });
      queryClient.invalidateQueries({ queryKey: ['visionCards'] });
    },
  });
};

export const useCompleteVisionGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }) => {
      const { data } = await api.put(`/visions/goals/${id}/complete`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visionGoals'] });
      queryClient.invalidateQueries({ queryKey: ['visionCards'] });
    },
  });
};

export const useConvertGoalToSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalId) => {
      const { data } = await api.post(`/visions/goals/${goalId}/convert-to-subject`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visionGoals'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
};

export const useConvertGoalToProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalId) => {
      const { data } = await api.post(`/visions/goals/${goalId}/convert-to-project`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visionGoals'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

// ==================== INITIALIZATION ====================

export const useInitializeVisionBoard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/visions/initialize');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visionQuotes'] });
      queryClient.invalidateQueries({ queryKey: ['visionCards'] });
    },
  });
};
