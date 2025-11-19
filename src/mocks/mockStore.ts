import { create } from 'zustand';
import type { UserAccount } from '../types/auth';

interface AuthState {
  accounts: UserAccount[];
  isLoading: boolean;
  error: string | null;
  init: () => Promise<void>;
  addAccount: (account?: UserAccount) => Promise<void>;
  removeAccount: (accountId: string) => Promise<void>;
}

/**
 * Creates a mock auth store for Storybook stories
 * This allows stories to have isolated state without affecting the real store
 */
export const createMockAuthStore = (initialState?: Partial<AuthState>) => {
  return create<AuthState>((set) => ({
    accounts: initialState?.accounts || [],
    isLoading: initialState?.isLoading || false,
    error: initialState?.error || null,
    
    init: async () => {
      console.log('[Mock Store] init called');
    },
    
    addAccount: async (account?: UserAccount) => {
      console.log('[Mock Store] addAccount called', account);
      set({ isLoading: true, error: null });
      
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (account) {
        set(state => ({
          accounts: [...state.accounts, account],
          isLoading: false,
        }));
      } else {
        set({ isLoading: false });
      }
    },
    
    removeAccount: async (accountId: string) => {
      console.log('[Mock Store] removeAccount called', accountId);
      set(state => ({
        accounts: state.accounts.filter(a => a.id !== accountId),
      }));
    },
  }));
};
