/**
 * Secure Authentication Service for Alumni Portal
 * - Manages JWT access/refresh tokens securely
 * - Implements token auto-refresh
 * - Handles secure logout
 */

import axios, { AxiosInstance } from 'axios';
import DOMPurify from 'dompurify';

// Use DOMPurify default export
const sanitizer = DOMPurify;

interface AuthTokens {
  accessToken: string;
  user: any;
}

export class SecureAuthService {
  private axiosInstance: AxiosInstance;
  private refreshTokenRequest: Promise<any> | null = null;
  private readonly BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  private accessToken: string = ''; // Memory only - never localStorage

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: this.BACKEND_URL,
      withCredentials: true, // Send httpOnly refresh token cookie
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor: Add access token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: Handle token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // 401: Try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Prevent multiple refresh requests
            if (!this.refreshTokenRequest) {
              this.refreshTokenRequest = this.refreshAccessToken();
            }

            await this.refreshTokenRequest;
            this.refreshTokenRequest = null;

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            // Refresh failed - force logout
            this.logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    try {
      const response = await this.axiosInstance.post('/api/auth/login', {
        email: sanitizer.sanitize(email),
        password, // Never sanitize passwords
      });

      this.accessToken = response.data.access_token;
      
      // Refresh token is automatically set in httpOnly cookie
      // Access token stored in memory only
      localStorage.setItem('user', JSON.stringify(response.data.user));

      return {
        accessToken: response.data.access_token,
        user: response.data.user,
      };
    } catch (error) {
      throw new Error('Login failed');
    }
  }

  async signup(data: any): Promise<AuthTokens> {
    try {
      // Sanitize user input
      const sanitizedData = {
        name: sanitizer.sanitize(data.name),
        email: sanitizer.sanitize(data.email),
        password: data.password, // Never sanitize
        department: sanitizer.sanitize(data.department),
        phone: sanitizer.sanitize(data.phone),
        registration_number: sanitizer.sanitize(data.registration_number),
        passout_year: parseInt(data.passout_year),
        dob: data.dob,
      };

      const response = await this.axiosInstance.post('/api/auth/signup', sanitizedData);

      this.accessToken = response.data.access_token;
      localStorage.setItem('user', JSON.stringify(response.data.user));

      return {
        accessToken: response.data.access_token,
        user: response.data.user,
      };
    } catch (error) {
      throw new Error('Signup failed');
    }
  }

  private async refreshAccessToken(): Promise<void> {
    try {
      const response = await this.axiosInstance.post('/api/auth/refresh');
      this.accessToken = response.data.access_token;
    } catch (error) {
      // Refresh failed - clear auth
      this.clearAuth();
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.axiosInstance.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      this.clearAuth();
    }
  }

  async logoutAll(): Promise<void> {
    try {
      await this.axiosInstance.post('/api/auth/logout-all');
    } catch (error) {
      console.error('Logout all failed:', error);
    } finally {
      this.clearAuth();
    }
  }

  private clearAuth(): void {
    this.accessToken = '';
    localStorage.removeItem('user');
    localStorage.removeItem('access_token'); // Ensure not in storage
  }

  getAccessToken(): string {
    return this.accessToken;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  /**
   * Sanitize HTML content before rendering in React
   * Use this in dangerouslySetInnerHTML scenarios
   */
  sanitizeHtml(html: string): string {
    return sanitizer.sanitize(html, { 
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p'],
      ALLOWED_ATTR: ['href', 'target']
    });
  }

  /**
   * Re-authenticate for sensitive operations
   */
  async reauthenticate(password: string): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post('/api/auth/verify-password', {
        password,
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Change password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      await this.axiosInstance.post('/api/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      });
    } catch (error) {
      throw new Error('Password change failed');
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await this.axiosInstance.post('/api/auth/request-password-reset', {
        email: sanitizer.sanitize(email),
      });
    } catch (error) {
      throw new Error('Password reset request failed');
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await this.axiosInstance.post('/api/auth/reset-password', {
        token,
        new_password: newPassword,
      });
    } catch (error) {
      throw new Error('Password reset failed');
    }
  }
}

export const authService = new SecureAuthService();
