import type { AuthToken, UserAccount } from '../types/auth';

// Webapp client ID - use import.meta.env for Vite compatibility
const CLIENT_ID = import.meta.env.VITE_AUTH_CLIENT_ID || '';

if (!CLIENT_ID) {
  console.error('VITE_AUTH_CLIENT_ID is not set. Please configure your .env file.');
}


const AUTH_URL = `https://accounts.google.com/o/oauth2/auth`;
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

export class AuthService {
  static async refreshToken(email: string): Promise<UserAccount> {
    return new Promise((resolve, reject) => {
      const redirectUri = chrome.identity.getRedirectURL();
      // Add login_hint to pre-fill the email and avoid account picker if possible
      const authUrl = `${AUTH_URL}?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(SCOPES.join(' '))}&login_hint=${encodeURIComponent(email)}`;
      
      console.log('Refreshing token for:', email);

      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl,
          interactive: false, // Silent refresh
        },
        async (redirectUrl) => {
          if (chrome.runtime.lastError || !redirectUrl) {
            console.error('Silent refresh failed:', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
            return;
          }

          const url = new URL(redirectUrl);
          const params = new URLSearchParams(url.hash.substring(1));
          const token = params.get('access_token');
          const expiresIn = params.get('expires_in');

          if (!token) {
            reject(new Error('No token found in refresh'));
            return;
          }

          const authToken: AuthToken = {
            token,
            expiry: Date.now() + (Number(expiresIn) || 3600) * 1000,
          };

          try {
            // We don't strictly need to fetch user info again if we trust the email match, 
            // but it's good practice to verify the token belongs to the user we expect.
            const userInfo = await this.fetchUserInfo(token);
            
            if (userInfo.email !== email) {
               reject(new Error('Token email mismatch'));
               return;
            }

            const account: UserAccount = {
              ...userInfo,
              token: authToken,
            };
            resolve(account);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  static async login(): Promise<UserAccount> {
    return new Promise((resolve, reject) => {
      const redirectUri = chrome.identity.getRedirectURL();
      const authUrl = `${AUTH_URL}?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(SCOPES.join(' '))}`;
      
      console.log('OAuth Debug Info:');
      console.log('Redirect URI:', redirectUri);
      console.log('Auth URL:', authUrl);

      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl,
          interactive: true,
        },
        async (redirectUrl) => {
          if (chrome.runtime.lastError || !redirectUrl) {
            reject(chrome.runtime.lastError);
            return;
          }

          const url = new URL(redirectUrl);
          const params = new URLSearchParams(url.hash.substring(1)); // Token is in hash
          const token = params.get('access_token');
          const expiresIn = params.get('expires_in');

          if (!token) {
            reject(new Error('No token found'));
            return;
          }

          const authToken: AuthToken = {
            token,
            expiry: Date.now() + (Number(expiresIn) || 3600) * 1000,
          };

          try {
            const userInfo = await this.fetchUserInfo(token);
            const account: UserAccount = {
              ...userInfo,
              token: authToken,
            };
            resolve(account);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  private static async fetchUserInfo(token: string): Promise<Omit<UserAccount, 'token'>> {
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
}
