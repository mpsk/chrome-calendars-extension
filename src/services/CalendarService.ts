import type { CalendarConfig, UserAccount } from '../types/auth';
import { AuthService } from './AuthService';

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

const BASE_URL = 'https://www.googleapis.com/calendar/v3';

const CALENDAR_API_V3 = {
  userCalendarList: `${BASE_URL}/users/me/calendarList?minAccessRole=reader`,
  calendarEvents: ({ calendar, timeMin, timeMax }: { calendar: CalendarConfig; timeMin: Date; timeMax: Date }) => {
    const url = new URL(`${BASE_URL}/calendars/${encodeURIComponent(calendar.id)}/events`);
    url.searchParams.append('timeMin', timeMin.toISOString());
    url.searchParams.append('timeMax', timeMax.toISOString());
    url.searchParams.append('singleEvents', 'true');
    url.searchParams.append('orderBy', 'startTime');
    return url.toString();
  },
};

export class CalendarService {
  private static tokenRefreshListeners = new Map<(account: UserAccount) => void, (account: UserAccount) => void>();

  static addTokenRefreshListener(listener: (account: UserAccount) => void) {
    this.tokenRefreshListeners.set(listener, listener);

    return () => {
      this.tokenRefreshListeners.delete(listener);
    };
  }

  static async getEvents(account: UserAccount, timeMin: Date, timeMax: Date): Promise<CalendarEvent[]> {
    // 1. Fetch list of calendars (or use stored ones)
    let calendars: CalendarConfig[] = [];

    if (account.calendars && account.calendars.length > 0) {
      // Use stored calendars if available, filtering by visibility
      calendars = account.calendars.filter((c) => c.visible);
    } else {
      // Fallback to fetching if no calendars stored (legacy behavior or first load)
      let listResponse = await fetch(CALENDAR_API_V3.userCalendarList, {
        headers: { Authorization: `Bearer ${account.token.token}` },
      });

      // Handle 401 (Unauthorized) - Attempt Refresh
      if (listResponse.status === 401) {
        console.log(`Token expired for ${account.email}, attempting silent refresh...`);
        try {
          // 1. Refresh the token
          const newAccount = await AuthService.refreshToken(account.email);

          // 2. Update the store via listeners
          this.tokenRefreshListeners.forEach((listener) => listener(newAccount));

          // 3. Retry the request with new token
          listResponse = await fetch(CALENDAR_API_V3.userCalendarList, {
            headers: { Authorization: `Bearer ${newAccount.token.token}` },
          });

          // Update local account variable for subsequent requests in this function
          account = newAccount;
        } catch (refreshError) {
          console.error('Silent refresh failed:', refreshError);
          throw new Error(`Session expired for ${account.email}`);
        }
      }

      if (!listResponse.ok) {
        throw new Error(
          `Failed to fetch calendar list for ${account.email} (${listResponse.status} ${listResponse.statusText})`,
        );
      }

      const listData = await listResponse.json();
      calendars = listData.items.filter((cal: any) => cal.selected);

      // Ensure 'primary' is always included if it wasn't selected
      const primaryCal = listData.items.find((cal: any) => cal.primary);
      if (primaryCal && !calendars.find((c: any) => c.id === primaryCal.id)) {
        calendars.push(primaryCal);
      }
    }

    // 2. Fetch events for each calendar
    const eventPromises = calendars.map((cal) => {
      return this.fetchAccountCalendarEvents({ account, calendar: cal, timeMax, timeMin });
    });
    const results = await Promise.all(eventPromises);
    return results.flat();
  }

  static async getUserCalendars(account: UserAccount): Promise<CalendarConfig[]> {
    const response = await fetch(CALENDAR_API_V3.userCalendarList, {
      headers: { Authorization: `Bearer ${account.token.token}` },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Let the caller handle refresh or just fail for now, as this is usually called during addAccount where we have a fresh token,
        // or we can implement retry logic here too. For simplicity, let's throw.
        throw new Error('Unauthorized');
      }
      throw new Error(`Failed to fetch calendars: ${response.statusText}`);
    }

    const data = await response.json();

    console.log({ account, data });

    if (!Array.isArray(data.items)) {
      throw new Error('Invalid calendar list response');
    }
    const googleCalendars = data.items.filter((cal: CalendarConfig) => {
      return !!cal.id.match(account.email) || !!cal.id.match('calendar.google.com');
    });
    return googleCalendars;
  }

  static async loadInitialEvents(accounts: UserAccount[], forceRefresh = false): Promise<CalendarEvent[]> {
    const now = new Date();
    const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const events = await this.fetchEventsForRange(accounts, now, twoWeeksLater);
    return events;
  }

  static async loadMoreEvents(accounts: UserAccount[], startDate: Date): Promise<CalendarEvent[]> {
    const endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    return this.fetchEventsForRange(accounts, startDate, endDate);
  }

  private static async fetchAccountCalendarEvents(params: {
    account: UserAccount;
    calendar: CalendarConfig;
    timeMin: Date;
    timeMax: Date;
  }): Promise<CalendarEvent[]> {
    const { account, calendar, timeMax, timeMin } = params;
    try {
      // const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;
      const url = CALENDAR_API_V3.calendarEvents({ calendar, timeMax, timeMin });

      let response = await fetch(url, {
        headers: { Authorization: `Bearer ${account.token.token}` },
      });

      if (response.status === 401) {
        console.log(`Token expired for ${account.email} during event fetch, attempting silent refresh...`);
        try {
          // 1. Refresh the token
          const newAccount = await AuthService.refreshToken(account.email);

          // 2. Update the store via listeners
          this.tokenRefreshListeners.forEach((listener) => listener(newAccount));

          // 3. Retry the request with new token
          response = await fetch(url, {
            headers: { Authorization: `Bearer ${newAccount.token.token}` },
          });

          // Update local account variable (though not strictly needed for this scope as we used newAccount for fetch)
          // account = newAccount;
        } catch (refreshError) {
          console.error('Silent refresh failed during event fetch:', refreshError);
          // Don't throw here to avoid breaking Promise.all for other calendars, just return empty
          return [];
        }
      }

      if (!response.ok) {
        console.error(`Failed to fetch events for ${calendar.summary}:`, response.statusText);
        return [];
      }
      const data = await response.json();

      return data.items.map((item: CalendarEvent) => ({
        id: item.id,
        summary: item.summary,
        start: item.start,
        end: item.end,
        htmlLink: item.htmlLink,
        accountId: account.id,
        accountColor: calendar.backgroundColor, // Use calendar color
        isPrimary: !!calendar.primary, // Set isPrimary flag
      }));
    } catch (err) {
      console.error('=== fetchAccountCalendarEvents: error', err);
      return [];
    }
  }

  private static async fetchEventsForRange(
    accounts: UserAccount[],
    timeMin: Date,
    timeMax: Date,
  ): Promise<CalendarEvent[]> {
    try {
      const promises = accounts.map((account) => this.getEvents(account, timeMin, timeMax));
      const results = await Promise.allSettled(promises);
      const events: CalendarEvent[] = [];
      const errors: string[] = [];

      results.forEach((result) => {
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
    } catch (err) {
      console.error('fetchEventsForRange:error', err);
      return [];
    }
  }

  // Deprecated but kept for compatibility if needed, redirecting to new logic
  static async getAllUpcomingEvents(accounts: UserAccount[]): Promise<CalendarEvent[]> {
    return this.loadInitialEvents(accounts);
  }
}
