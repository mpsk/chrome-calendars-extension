import { create } from 'zustand';
import { AuthService } from '../services/AuthService';
import { CalendarService } from '../services/CalendarService';
import { StorageService } from '../services/StorageService';
import type { CalendarConfig, UserAccount } from '../types/auth';

export interface AuthState {
  accounts: UserAccount[];
  isLoading: boolean;
  error: string | null;
  init: () => Promise<void>;
  addAccount: (account?: UserAccount) => Promise<void>;
  removeAccount: (accountId: string) => Promise<void>;
  toggleCalendarVisibility: (accountId: string, calendarId: string) => Promise<void>;
  refreshAccounts: () => Promise<void>;
  reconnectAccount: (accountId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accounts: [],
  isLoading: false,
  error: null,

  init: async () => {
    const accounts = await StorageService.getAccounts();
    if (accounts) {
      set({ accounts });
    }

    // Set up the callback for token refreshes
    CalendarService.addTokenRefreshListener((account) => {
      get().addAccount(account);
    });
  },

  refreshAccounts: async () => {
    set({ isLoading: true, error: null });
    console.log('=== refreshAccounts');
    try {
      const currentAccounts = get().accounts;
      const updatedAccounts = await Promise.all(
        currentAccounts.map(async (account) => {
          try {
            const calendars = await CalendarService.getUserCalendars(account);

            // Merge with existing visibility settings
            const mergedCalendars = calendars.map((cal) => {
              const existingCal = account.calendars?.find((c) => c.id === cal.id);
              return {
                id: cal.id,
                summary: cal.summary,
                backgroundColor: cal.backgroundColor,
                primary: !!cal.primary,
                selected: cal.selected,
                visible: existingCal ? existingCal.visible : cal.selected !== false,
              };
            });

            return { ...account, calendars: mergedCalendars, status: 'active' as const, errorMessage: undefined };
          } catch (err: any) {
            console.error(`Failed to refresh calendars for ${account.email}`, err);
            if (err.message === 'Unauthorized' || err.message.includes('Session expired')) {
              return { ...account, status: 'error' as const, errorMessage: 'Session expired' };
            }
            return account; // Keep old state if refresh fails
          }
        }),
      );

      await CalendarService.loadInitialEvents(updatedAccounts);

      set({ accounts: updatedAccounts, isLoading: false });
      await StorageService.saveAccounts(updatedAccounts);
    } catch (err: any) {
      set({ error: err.message || 'Failed to refresh accounts', isLoading: false });
    }
  },

  addAccount: async (account?: UserAccount) => {
    set({ isLoading: true, error: null });
    try {
      const newAccount = account || (await AuthService.login());

      // Fetch calendars for the new account
      try {
        const calendars = await CalendarService.getUserCalendars(newAccount);
        newAccount.calendars = calendars.map((cal) => ({
          id: cal.id,
          summary: cal.summary,
          backgroundColor: cal.backgroundColor,
          primary: !!cal.primary,
          selected: cal.selected,
          visible: cal.selected !== false, // Default to visible unless explicitly unselected
        }));
      } catch (calError) {
        console.error('Failed to fetch calendars for new account', calError);
        // Continue without calendars, user can retry later or we can show a warning
      }

      const currentAccounts = get().accounts;

      // Check if account already exists
      const existingIndex = currentAccounts.findIndex((a) => a.id === newAccount.id);

      let updatedAccounts;
      if (existingIndex >= 0) {
        // Update existing account (preserve existing calendar visibility if possible)
        const existingAccount = currentAccounts[existingIndex];

        // Merge visibility settings
        if (existingAccount.calendars && newAccount.calendars) {
          newAccount.calendars = newAccount.calendars.map((newCal) => {
            const existingCal = existingAccount.calendars?.find((c) => c.id === newCal.id);
            return existingCal ? { ...newCal, visible: existingCal.visible } : newCal;
          });
        }

        updatedAccounts = [...currentAccounts];
        updatedAccounts[existingIndex] = newAccount;
      } else {
        // Add new account
        updatedAccounts = [...currentAccounts, newAccount];
      }

      set({ accounts: updatedAccounts, isLoading: false });
      await StorageService.saveAccounts(updatedAccounts);
    } catch (err: any) {
      set({ error: err.message || 'Failed to add account', isLoading: false });
    }
  },

  removeAccount: async (accountId: string) => {
    const updatedAccounts = get().accounts.filter((a) => a.id !== accountId);
    set({ accounts: updatedAccounts });
    await StorageService.saveAccounts(updatedAccounts);
    // Note: We might want to revoke the token here too
  },

  toggleCalendarVisibility: async (accountId: string, calendarId: string) => {
    const currentAccounts = get().accounts;
    const accountIndex = currentAccounts.findIndex((a) => a.id === accountId);

    if (accountIndex >= 0) {
      const updatedAccounts = [...currentAccounts];
      const account = { ...updatedAccounts[accountIndex] };

      if (account.calendars) {
        account.calendars = account.calendars.map((cal) =>
          cal.id === calendarId ? { ...cal, visible: !cal.visible } : cal,
        );

        updatedAccounts[accountIndex] = account;
        set({ accounts: updatedAccounts });
        await StorageService.saveAccounts(updatedAccounts);
      }
    }
  },

  reconnectAccount: async (accountId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Force interactive login
      const newAccount = await AuthService.login();

      const currentAccounts = get().accounts;
      const accountIndex = currentAccounts.findIndex((a) => a.id === accountId);

      if (accountIndex >= 0) {
        // Verify email matches
        if (currentAccounts[accountIndex].email !== newAccount.email) {
          throw new Error('Email mismatch. Please login with the correct account.');
        }

        // Update account with new token and clear error
        const updatedAccounts = [...currentAccounts];
        updatedAccounts[accountIndex] = {
          ...updatedAccounts[accountIndex],
          ...newAccount,
          status: 'active' as const,
          errorMessage: undefined,
        };

        // Refresh calendars for this account to be sure
        try {
          const calendars = await CalendarService.getUserCalendars(updatedAccounts[accountIndex]);
          // Merge visibility
          if (updatedAccounts[accountIndex].calendars) {
            updatedAccounts[accountIndex].calendars = calendars.map((cal) => {
              const existingCal = updatedAccounts[accountIndex].calendars?.find((c) => c.id === cal.id);
              return {
                id: cal.id,
                summary: cal.summary,
                backgroundColor: cal.backgroundColor,
                primary: !!cal.primary,
                selected: cal.selected,
                visible: existingCal ? existingCal.visible : cal.selected !== false,
              };
            });
          } else {
            updatedAccounts[accountIndex].calendars = calendars.map((cal) => ({
              id: cal.id,
              summary: cal.summary,
              backgroundColor: cal.backgroundColor,
              primary: !!cal.primary,
              selected: cal.selected,
              visible: cal.selected !== false,
            }));
          }
        } catch (calError) {
          console.error('Failed to refresh calendars after reconnect', calError);
        }

        set({ accounts: updatedAccounts, isLoading: false });
        await StorageService.saveAccounts(updatedAccounts);
      } else {
        throw new Error('Account not found');
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to reconnect account', isLoading: false });
    }
  },
}));
