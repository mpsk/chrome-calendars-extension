import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { CalendarService } from '../services/CalendarService';
import { mockAccounts, mockEvents } from '../mocks/mockData';
import type { AuthState } from '../store/useAuthStore';

export const mockChromeApi = () => {
  // Mock chrome API
  const mockChrome = {
    storage: {
      local: {
        get: async () => ({}),
        set: async () => {},
        remove: async () => {},
      },
    },
    runtime: {
      lastError: undefined,
    },
  };

  if (typeof window !== 'undefined' && !(window as any).chrome) {
    (window as any).chrome = mockChrome;
  }
}

export interface MockAppContextProps extends AuthState {
  events: typeof mockEvents;
}

export const useMockAppContext = ({
  isLoading = false, 
  accounts = mockAccounts,
  error = null as string | null,
  events = mockEvents,
  addAccount = () => Promise.resolve(),
  removeAccount = () => Promise.resolve(),
}: Partial<MockAppContextProps>) => {
    useEffect(() => {
      
      mockChromeApi();

      // Reset store
      useAuthStore.setState({
        accounts: accounts,
        isLoading: isLoading,
        error: error,
        addAccount,
        removeAccount
      });
  
      // Mock CalendarService
      const originalLoadInitial = CalendarService.loadInitialEvents;
      const originalLoadMore = CalendarService.loadMoreEvents;
      const originalClearCache = CalendarService.clearCache;
  
      CalendarService.loadInitialEvents = async () => events;
      CalendarService.loadMoreEvents = async () => [];
      CalendarService.clearCache = async () => {};

      return () => {
        // Cleanup
        CalendarService.loadInitialEvents = originalLoadInitial;
        CalendarService.loadMoreEvents = originalLoadMore;
        CalendarService.clearCache = originalClearCache;
      };
    }, [isLoading, accounts, error, events, addAccount, removeAccount]);
};

