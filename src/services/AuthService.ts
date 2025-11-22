import type { AuthToken, UserAccount } from '../types/auth';

// Webapp client ID - use import.meta.env for Vite compatibility
const CLIENT_ID = import.meta.env.VITE_AUTH_CLIENT_ID || '';

if (!CLIENT_ID) {
  console.error('VITE_AUTH_CLIENT_ID is not set. Please configure your .env file.');
}

const TOKEN_TTL = 3600;

const AUTH_URL = `https://accounts.google.com/o/oauth2/auth`;
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export class AuthService {
  static async login(): Promise<UserAccount> {
    const authToken = await this.launchAuthFlow(true);
    const userInfo = await this.fetchUserInfo(authToken.token);

    return {
      ...userInfo,
      token: authToken,
    };
  }

  static async refreshToken(email: string): Promise<UserAccount> {
    const authToken = await this.launchAuthFlow(false, email);

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

  private static async launchAuthFlow(interactive: boolean, loginHint?: string): Promise<AuthToken> {
    return new Promise((resolve, reject) => {
      const redirectUri = chrome.identity.getRedirectURL();
      let authUrl = `${AUTH_URL}?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(SCOPES.join(' '))}`;

      if (loginHint) {
        authUrl += `&login_hint=${encodeURIComponent(loginHint)}`;
      }

      if (interactive) {
        console.log('OAuth Debug Info:');
        console.log('Redirect URI:', redirectUri);
        console.log('Auth URL:', authUrl);
      } else {
        console.log('Refreshing token for:', loginHint);
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
          const params = new URLSearchParams(url.hash.substring(1));
          const token = params.get('access_token');
          const expiresIn = params.get('expires_in');

          console.log('=== launchWebAuthFlow', { expiresIn });

          if (!token) {
            reject(new Error('No token found'));
            return;
          }

          const authToken: AuthToken = {
            token,
            expiry: Date.now() + (Number(expiresIn) || TOKEN_TTL) * 1000,
          };

          resolve(authToken);
        },
      );
    });
  }
}
