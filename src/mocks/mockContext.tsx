import type { UserAccount } from '../types/auth';
import type { CalendarEvent } from '../services/CalendarService';

// Create a context for mocking
interface MockContext {
  mockAuthStore?: {
    accounts: UserAccount[];
    isLoading: boolean;
    error: string | null;
    addAccount: () => Promise<void>;
    removeAccount: (id: string) => Promise<void>;
    init: () => Promise<void>;
  };
  mockEvents?: CalendarEvent[];
  mockLoading?: boolean;
  mockError?: string | null;
}

let currentMockContext: MockContext = {};

export const setMockContext = (context: MockContext) => {
  currentMockContext = context;
};

export const getMockContext = () => currentMockContext;

export const clearMockContext = () => {
  currentMockContext = {};
};

// Hook to use mocked auth store
export const useMockAuthStore = async() => {
  if (currentMockContext.mockAuthStore) {
    return currentMockContext.mockAuthStore;
  }
  // Fallback to real store
  // const { useAuthStore } = require('../store/useAuthStore');
  const useAuthStore = (await import('../store/useAuthStore')).useAuthStore;
  return useAuthStore();
};

// Mock CalendarService methods
export const getMockCalendarService = () => {
  return {
    loadInitialEvents: async () => {
      if (currentMockContext.mockLoading) {
        return new Promise<CalendarEvent[]>(() => {}); // Never resolves
      }
      if (currentMockContext.mockError) {
        throw new Error(currentMockContext.mockError);
      }
      return currentMockContext.mockEvents || [];
    },
    loadMoreEvents: async () => {
      return [];
    },
  };
};
