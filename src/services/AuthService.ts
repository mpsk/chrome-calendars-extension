import type { AuthToken, UserAccount } from '../types/auth';

// Webapp client ID - use import.meta.env for Vite compatibility
const CLIENT_ID = import.meta.env.VITE_AUTH_CLIENT_ID || '';
const CLIENT_SECRET = import.meta.env.VITE_AUTH_CLIENT_SECRET || '';

if (!CLIENT_ID) {
  console.error('VITE_AUTH_CLIENT_ID is not set. Please configure your .env file.');
}
if (!CLIENT_SECRET) {
  console.error('VITE_AUTH_CLIENT_SECRET is not set. Please configure your .env file.');
}

const TOKEN_TTL = 3600;

const AUTH_URL = `https://accounts.google.com/o/oauth2/auth`;
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

const TOKEN_URL = 'https://oauth2.googleapis.com/token';

export class AuthService {
  static async login(): Promise<UserAccount> {
    const { code } = await this.launchAuthFlow(true);
    const authToken = await this.exchangeCodeForToken(code);
    const userInfo = await this.fetchUserInfo(authToken.token);

    return {
      ...userInfo,
      token: authToken,
    };
  }

  static async refreshToken(email: string, refreshToken?: string): Promise<UserAccount> {
    if (!refreshToken) {
      console.warn(`No refresh token for ${email}, cannot refresh silently.`);
      throw new Error('No refresh token available');
    }

    const authToken = await this.exchangeRefreshToken(refreshToken);

    // We don't strictly need to fetch user info again if we trust the email match,
    // but it's good practice to verify the token belongs to the user we expect.
    const userInfo = await this.fetchUserInfo(authToken.token);

    if (userInfo.email !== email) {
      throw new Error('Token email mismatch');
    }

    return {
      ...userInfo,
      token: authToken,
    };
  }

  private static async fetchUserInfo(token: AuthToken['token']): Promise<Omit<UserAccount, 'token'>> {
    const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }
    const data = await response.json();
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture,
    };
  }

  private static async launchAuthFlow(interactive: boolean): Promise<{ code: string }> {
    return new Promise((resolve, reject) => {
      const redirectUri = chrome.identity.getRedirectURL();
      const authUrl = `${AUTH_URL}?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(SCOPES.join(' '))}&access_type=offline&prompt=consent`;

      if (interactive) {
        console.log('OAuth Debug Info:');
        console.log('Redirect URI:', redirectUri);
        console.log('Auth URL:', authUrl);
      }

      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl,
          interactive,
        },
        (redirectUrl) => {
          if (chrome.runtime.lastError || !redirectUrl) {
            const errorMsg = interactive ? 'Login failed' : 'Silent refresh failed';
            console.error(`${errorMsg}:`, chrome.runtime.lastError);
            reject(chrome.runtime.lastError || new Error(errorMsg));
            return;
          }

          const url = new URL(redirectUrl);
          const code = url.searchParams.get('code');

          if (!code) {
            reject(new Error('No code found'));
            return;
          }

          resolve({ code });
        },
      );
    });
  }

  private static async exchangeCodeForToken(code: string): Promise<AuthToken> {
    const redirectUri = chrome.identity.getRedirectURL();
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('code', code);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', redirectUri);

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to exchange code for token: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return {
      token: data.access_token,
      expiry: Date.now() + (data.expires_in || TOKEN_TTL) * 1000,
      refreshToken: data.refresh_token,
    };
  }

  private static async exchangeRefreshToken(refreshToken: string): Promise<AuthToken> {
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('refresh_token', refreshToken);
    params.append('grant_type', 'refresh_token');

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to refresh token: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return {
      token: data.access_token,
      expiry: Date.now() + (data.expires_in || TOKEN_TTL) * 1000,
      refreshToken: data.refresh_token || refreshToken, // Keep old refresh token if new one not provided
    };
  }
}
