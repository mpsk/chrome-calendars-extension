import type { CalendarEvent, UserAccount } from '../types/auth';

export class StorageService {
  static async saveAccounts(accounts: UserAccount[]) {
    await chrome.storage.local.set({ accounts });
  }

  static async getAccounts(): Promise<UserAccount[]> {
    const result = await chrome.storage.local.get('accounts');
    return (result.accounts as UserAccount[]) || [];
  }

  static async saveInitialEvents(events: CalendarEvent[]) {
    await chrome.storage.local.set({ events });
  }

  static async getInitialEvents(): Promise<CalendarEvent[]> {
    const result = await chrome.storage.local.get('events');
    return result.events as CalendarEvent[];
  }
}
