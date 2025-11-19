import { create } from 'zustand';
import type { UserAccount } from '../types/auth';
import { AuthService } from '../services/AuthService';

interface AuthState {
  accounts: UserAccount[];
  isLoading: boolean;
  error: string | null;
  init: () => Promise<void>;
  addAccount: (account?: UserAccount) => Promise<void>;
  removeAccount: (accountId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accounts: [],
  isLoading: false,
  error: null,

  init: async () => {
    const result = await chrome.storage.local.get('accounts');
    if (result.accounts) {
      set({ accounts: result.accounts as UserAccount[] });
    }
  },

  addAccount: async (account?: UserAccount) => {
    set({ isLoading: true, error: null });
    try {
      const newAccount = account || await AuthService.login();
      const currentAccounts = get().accounts;
      
      // Check if account already exists
      const existingIndex = currentAccounts.findIndex(a => a.id === newAccount.id);
      
      let updatedAccounts;
      if (existingIndex >= 0) {
        // Update existing account (e.g. new token)
        updatedAccounts = [...currentAccounts];
        updatedAccounts[existingIndex] = newAccount;
      } else {
        // Add new account
        updatedAccounts = [...currentAccounts, newAccount];
      }

      set({ accounts: updatedAccounts, isLoading: false });
      await chrome.storage.local.set({ accounts: updatedAccounts });
    } catch (err: any) {
      set({ error: err.message || 'Failed to add account', isLoading: false });
    }
  },

  removeAccount: async (accountId: string) => {
    const updatedAccounts = get().accounts.filter(a => a.id !== accountId);
    set({ accounts: updatedAccounts });
    await chrome.storage.local.set({ accounts: updatedAccounts });
    // Note: We might want to revoke the token here too
  },
}));
