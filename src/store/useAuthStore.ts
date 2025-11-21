import { create } from 'zustand';
import { AuthService } from '../services/AuthService';
import { CalendarService } from '../services/CalendarService';
import type { UserAccount, CalendarConfig } from '../types/auth';

export interface AuthState {
  accounts: UserAccount[];
  isLoading: boolean;
  error: string | null;
  init: () => Promise<void>;
  addAccount: (account?: UserAccount) => Promise<void>;
  removeAccount: (accountId: string) => Promise<void>;
  toggleCalendarVisibility: (accountId: string, calendarId: string) => Promise<void>;
  refreshAccounts: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accounts: [],
  isLoading: false,
  error: null,

  init: async () => {
    const result = await chrome.storage.local.get('accounts');
    console.log('result.accounts', result.accounts);
    if (result.accounts) {
      set({ accounts: result.accounts as UserAccount[] });
    }
  },

  refreshAccounts: async () => {
    set({ isLoading: true, error: null });
    try {
      const currentAccounts = get().accounts;
      const updatedAccounts = await Promise.all(currentAccounts.map(async (account) => {
        try {
          const calendars = await CalendarService.getUserCalendars(account);

          // Merge with existing visibility settings
          const mergedCalendars = calendars.map((cal: any) => {
            const existingCal = account.calendars?.find(c => c.id === cal.id);
            return {
              id: cal.id,
              summary: cal.summary,
              backgroundColor: cal.backgroundColor,
              primary: !!cal.primary,
              visible: existingCal ? existingCal.visible : (cal.selected !== false)
            };
          });

          return { ...account, calendars: mergedCalendars };
        } catch (err) {
          console.error(`Failed to refresh calendars for ${account.email}`, err);
          return account; // Keep old state if refresh fails
        }
      }));

      set({ accounts: updatedAccounts, isLoading: false });
      await chrome.storage.local.set({ accounts: updatedAccounts });
    } catch (err: any) {
      set({ error: err.message || 'Failed to refresh accounts', isLoading: false });
    }
  },

  addAccount: async (account?: UserAccount) => {
    set({ isLoading: true, error: null });
    try {
      const newAccount = account || await AuthService.login();

      // Fetch calendars for the new account
      try {
        const calendars = await CalendarService.getUserCalendars(newAccount);
        newAccount.calendars = calendars.map((cal: any) => ({
          id: cal.id,
          summary: cal.summary,
          backgroundColor: cal.backgroundColor,
          primary: !!cal.primary,
          visible: cal.selected !== false // Default to visible unless explicitly unselected
        }));
      } catch (calError) {
        console.error('Failed to fetch calendars for new account', calError);
        // Continue without calendars, user can retry later or we can show a warning
      }

      const currentAccounts = get().accounts;

      // Check if account already exists
      const existingIndex = currentAccounts.findIndex(a => a.id === newAccount.id);

      let updatedAccounts;
      if (existingIndex >= 0) {
        // Update existing account (preserve existing calendar visibility if possible)
        const existingAccount = currentAccounts[existingIndex];

        // Merge visibility settings
        if (existingAccount.calendars && newAccount.calendars) {
          newAccount.calendars = newAccount.calendars.map(newCal => {
            const existingCal = existingAccount.calendars?.find(c => c.id === newCal.id);
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

  toggleCalendarVisibility: async (accountId: string, calendarId: string) => {
    const currentAccounts = get().accounts;
    const accountIndex = currentAccounts.findIndex(a => a.id === accountId);

    if (accountIndex >= 0) {
      const updatedAccounts = [...currentAccounts];
      const account = { ...updatedAccounts[accountIndex] };

      if (account.calendars) {
        account.calendars = account.calendars.map(cal =>
          cal.id === calendarId ? { ...cal, visible: !cal.visible } : cal
        );

        updatedAccounts[accountIndex] = account;
        set({ accounts: updatedAccounts });
        await chrome.storage.local.set({ accounts: updatedAccounts });


      }
    }
  }
}));
