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
}
