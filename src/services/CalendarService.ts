import type { UserAccount } from '../types/auth';

export interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink: string;
  accountId: string; // To know which account it belongs to
  accountColor?: string; // Optional color for UI
  isPrimary?: boolean; // True if from the primary calendar
}

interface CacheData {
  timestamp: number;
  events: CalendarEvent[];
}

export class CalendarService {
  private static CACHE_KEY = 'calendar_events_cache';
  private static CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  static async getEvents(account: UserAccount, timeMin: string, timeMax: string): Promise<CalendarEvent[]> {
    // 1. Fetch list of calendars
    const calendarListUrl = 'https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader';
    let listResponse = await fetch(calendarListUrl, {
      headers: { Authorization: `Bearer ${account.token.token}` },
    });

    // Handle 401 (Unauthorized) - Attempt Refresh
    if (listResponse.status === 401) {
      console.log(`Token expired for ${account.email}, attempting silent refresh...`);
      try {
        // 1. Refresh the token
        const { AuthService } = await import('./AuthService');
        const { useAuthStore } = await import('../store/useAuthStore');
        
        const newAccount = await AuthService.refreshToken(account.email);
        
        // 2. Update the store
        useAuthStore.getState().addAccount(newAccount);
        
        // 3. Retry the request with new token
        listResponse = await fetch(calendarListUrl, {
          headers: { Authorization: `Bearer ${newAccount.token.token}` },
        });
        
        // Update local account variable for subsequent requests in this function
        account = newAccount;
        
      } catch (refreshError) {
        console.error('Silent refresh failed:', refreshError);
        throw new Error(`Session expired for ${account.email}. Please remove and add the account again.`);
      }
    }

    if (!listResponse.ok) {
      throw new Error(`Failed to fetch calendar list for ${account.email} (${listResponse.status} ${listResponse.statusText})`);
    }

    const listData = await listResponse.json();
    let calendars = listData.items.filter((cal: any) => cal.selected);

    // Ensure 'primary' is always included if it wasn't selected
    const primaryCal = listData.items.find((cal: any) => cal.primary);
    if (primaryCal && !calendars.find((c: any) => c.id === primaryCal.id)) {
      calendars.push(primaryCal);
    }

    // 2. Fetch events for each calendar
    const eventPromises = calendars.map(async (cal: any) => {
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${account.token.token}` },
      });
      if (!response.ok) {
        console.error(`Failed to fetch events for ${cal.summary}:`, response.statusText);
        return [];
      }
      const data = await response.json();

      return data.items.map((item: any) => ({
          id: item.id,
          summary: item.summary,
          start: item.start,
          end: item.end,
          htmlLink: item.htmlLink,
          accountId: account.id,
          accountColor: cal.backgroundColor, // Use calendar color
          isPrimary: !!cal.primary, // Set isPrimary flag
        }));
    });

    const results = await Promise.all(eventPromises);
    return results.flat();
  }

  static async loadInitialEvents(accounts: UserAccount[], forceRefresh = false): Promise<CalendarEvent[]> {
    if (!forceRefresh) {
      const cached = await chrome.storage.local.get(this.CACHE_KEY);
      const cacheData = cached[this.CACHE_KEY] as CacheData | undefined;
      
      if (cacheData && (Date.now() - cacheData.timestamp < this.CACHE_DURATION_MS)) {
        console.log('Returning cached events');
        return cacheData.events;
      }
    }

    const now = new Date();
    const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    const events = await this.fetchEventsForRange(accounts, now.toISOString(), twoWeeksLater.toISOString());
    
    // Save to cache
    await chrome.storage.local.set({
      [this.CACHE_KEY]: {
        timestamp: Date.now(),
        events: events
      }
    });

    return events;
  }

  static async loadMoreEvents(accounts: UserAccount[], startDate: Date): Promise<CalendarEvent[]> {
    const endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    return this.fetchEventsForRange(accounts, startDate.toISOString(), endDate.toISOString());
  }

  private static async fetchEventsForRange(accounts: UserAccount[], timeMin: string, timeMax: string): Promise<CalendarEvent[]> {
    const promises = accounts.map(account => this.getEvents(account, timeMin, timeMax));
    const results = await Promise.allSettled(promises);
    
    const events: CalendarEvent[] = [];
    const errors: string[] = [];

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        events.push(...result.value);
      } else {
        console.error('Error fetching events:', result.reason);
        errors.push(result.reason?.message || 'Unknown error');
      }
    });

    // If we have no events but we have errors, throw the error so the UI shows it
    if (events.length === 0 && errors.length > 0) {
      throw new Error(errors.join('\n'));
    }

    // Sort by start time
    return events.sort((a, b) => {
      const startA = new Date(a.start.dateTime || a.start.date || 0).getTime();
      const startB = new Date(b.start.dateTime || b.start.date || 0).getTime();
      return startA - startB;
    });
  }

  static async clearCache(): Promise<void> {
    await chrome.storage.local.remove(this.CACHE_KEY);
  }

  // Deprecated but kept for compatibility if needed, redirecting to new logic
  static async getAllUpcomingEvents(accounts: UserAccount[]): Promise<CalendarEvent[]> {
     return this.loadInitialEvents(accounts);
  }
}
