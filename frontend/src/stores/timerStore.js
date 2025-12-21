import { create } from 'zustand';
import { sessionsApi } from '../lib/api';

const useTimerStore = create((set, get) => ({
  // Active session data
  activeSession: null,
  isRunning: false,
  elapsedSeconds: 0,
  timerInterval: null,

  // Timer actions
  startTimer: async (type, referenceId, referenceName) => {
    try {
      // Create a new session
      const response = await sessionsApi.create({
        type,
        referenceId,
        startTime: new Date().toISOString(),
        notes: '',
        tags: [],
        manualEntry: false,
      });

      const session = response.data;

      // Start the interval
      const interval = setInterval(() => {
        set((state) => ({
          elapsedSeconds: state.elapsedSeconds + 1,
        }));
      }, 1000);

      set({
        activeSession: { ...session, referenceName },
        isRunning: true,
        elapsedSeconds: 0,
        timerInterval: interval,
      });

      return session;
    } catch (error) {
      console.error('Failed to start timer:', error);
      throw error;
    }
  },

  stopTimer: async (notes = '') => {
    const { activeSession, timerInterval, elapsedSeconds } = get();

    if (!activeSession) return;

    try {
      // Stop the interval
      if (timerInterval) {
        clearInterval(timerInterval);
      }

      // Update the session with end time
      const response = await sessionsApi.update(activeSession.id, {
        endTime: new Date().toISOString(),
        notes,
        duration: elapsedSeconds,
      });

      set({
        activeSession: null,
        isRunning: false,
        elapsedSeconds: 0,
        timerInterval: null,
      });

      return response.data;
    } catch (error) {
      console.error('Failed to stop timer:', error);
      throw error;
    }
  },

  pauseTimer: () => {
    const { timerInterval } = get();

    if (timerInterval) {
      clearInterval(timerInterval);
    }

    set({
      isRunning: false,
      timerInterval: null,
    });
  },

  resumeTimer: () => {
    const { isRunning } = get();

    if (isRunning) return;

    const interval = setInterval(() => {
      set((state) => ({
        elapsedSeconds: state.elapsedSeconds + 1,
      }));
    }, 1000);

    set({
      isRunning: true,
      timerInterval: interval,
    });
  },

  loadActiveSession: async () => {
    try {
      const response = await sessionsApi.getActive();
      const session = response.data;

      if (session) {
        // Calculate elapsed time from start
        const startTime = new Date(session.startTime);
        const now = new Date();
        const elapsed = Math.floor((now - startTime) / 1000);

        // Start the interval
        const interval = setInterval(() => {
          set((state) => ({
            elapsedSeconds: state.elapsedSeconds + 1,
          }));
        }, 1000);

        set({
          activeSession: session,
          isRunning: true,
          elapsedSeconds: elapsed,
          timerInterval: interval,
        });
      }
    } catch (error) {
      console.error('Failed to load active session:', error);
    }
  },

  resetTimer: () => {
    const { timerInterval } = get();

    if (timerInterval) {
      clearInterval(timerInterval);
    }

    set({
      activeSession: null,
      isRunning: false,
      elapsedSeconds: 0,
      timerInterval: null,
    });
  },
}));

export default useTimerStore;
