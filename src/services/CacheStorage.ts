import type { UserAccount } from "../types/auth";

export class CacheStorage {
  static async saveAccounts(accounts: UserAccount[]) {
    await chrome.storage.local.set({ accounts });
  }

  static async getAccounts(): Promise<UserAccount[]> {
    const result = await chrome.storage.local.get('accounts');
    return result.accounts as UserAccount[];
  }
}
