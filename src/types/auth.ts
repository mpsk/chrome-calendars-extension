export interface AuthToken {
  token: string;
  expiry: number; // Timestamp
  refreshToken?: string;
}

export interface CalendarConfig {
  id: string;
  summary: string;
  backgroundColor: string;
  primary: boolean;
  visible: boolean;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  picture: string;
  token: AuthToken;
  calendars?: CalendarConfig[];
}
