export interface AuthToken {
  token: string;
  expiry: number; // Timestamp
  refreshToken?: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  picture: string;
  token: AuthToken;
  calendars?: CalendarConfig[];
  status?: 'active' | 'error';
  errorMessage?: string;
}

export interface CalendarConfigRaw {
  id: string;
  summary: string;
  backgroundColor: string;
  primary: boolean;
  selected: boolean;
}

export interface CalendarConfig extends CalendarConfigRaw {
  visible: boolean;
}

export interface CalendarEventRaw {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink: string;
  status: 'confirmed' | string;
}

export interface CalendarEvent extends CalendarEventRaw {
  accountId: string; // To know which account it belongs to
  accountColor: string; // Optional color for UI
  isPrimary: boolean; // True if from the primary calendar
}
