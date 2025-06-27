import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, timer } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegisterRequest,
  AuthUser,
  AuthState,
} from '../models/auth.model';
import { DummyJSONUser } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly baseUrl = 'https://dummyjson.com';
  private readonly storageKey = 'auth_user';
  private readonly refreshTokenKey = 'refresh_token';

  // Auth state management
  private authStateSubject = new BehaviorSubject<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  public authState$ = this.authStateSubject.asObservable();
  private tokenRefreshTimer?: any;

  constructor(private http: HttpClient, private router: Router) {
    this.initializeAuth();
  }

  // Initialize authentication on service start
  private initializeAuth(): void {
    const storedUser = this.getStoredUser();
    if (storedUser) {
      this.setAuthState({
        user: storedUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      this.startTokenRefreshTimer();
    }
  }

  // Login method
  login(credentials: LoginRequest): Observable<AuthUser> {
    this.setAuthState({
      ...this.authStateSubject.value,
      isLoading: true,
      error: null,
    });

    return this.http
      .post<LoginResponse>(`${this.baseUrl}/auth/login`, credentials)
      .pipe(
        map((response) => this.mapToAuthUser(response)),
        tap((user) => {
          this.storeUser(user);
          this.setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          this.startTokenRefreshTimer();
        }),
        catchError((error) => {
          const errorMessage = this.handleAuthError(error);
          this.setAuthState({
            ...this.authStateSubject.value,
            isLoading: false,
            error: errorMessage,
          });
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Register new user
  register(userData: RegisterRequest): Observable<DummyJSONUser> {
    this.setAuthState({
      ...this.authStateSubject.value,
      isLoading: true,
      error: null,
    });

    return this.http
      .post<DummyJSONUser>(`${this.baseUrl}/users/add`, userData)
      .pipe(
        tap(() => {
          this.setAuthState({
            ...this.authStateSubject.value,
            isLoading: false,
            error: null,
          });
        }),
        catchError((error) => {
          const errorMessage = this.handleAuthError(error);
          this.setAuthState({
            ...this.authStateSubject.value,
            isLoading: false,
            error: errorMessage,
          });
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Logout method
  logout(): void {
    this.clearStoredData();
    this.stopTokenRefreshTimer();
    this.setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    this.router.navigate(['/login']);
  }

  // Refresh token
  refreshToken(): Observable<AuthUser> {
    const refreshToken = localStorage.getItem(this.refreshTokenKey);

    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    const refreshRequest: RefreshTokenRequest = {
      refreshToken,
      expiresInMins: 30,
    };

    return this.http
      .post<RefreshTokenResponse>(
        `${this.baseUrl}/auth/refresh`,
        refreshRequest
      )
      .pipe(
        map((response) => {
          const currentUser = this.authStateSubject.value.user;
          if (!currentUser) {
            throw new Error('No current user');
          }
          return {
            ...currentUser,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
          };
        }),
        tap((user) => {
          this.storeUser(user);
          this.setAuthState({
            ...this.authStateSubject.value,
            user,
            isAuthenticated: true,
          });
        }),
        catchError((error) => {
          console.error('Token refresh failed:', error);
          this.logout();
          return throwError(
            () => new Error('Session expired. Please login again.')
          );
        })
      );
  }

  // Get current user
  getCurrentUser(): Observable<AuthUser | null> {
    return this.authState$.pipe(map((state) => state.user));
  }

  // Check if user is authenticated
  isAuthenticated(): Observable<boolean> {
    return this.authState$.pipe(map((state) => state.isAuthenticated));
  }

  // Get current user profile
  getCurrentUserProfile(): Observable<DummyJSONUser> {
    const currentUser = this.authStateSubject.value.user;
    if (!currentUser) {
      return throwError(() => new Error('No authenticated user'));
    }

    return this.http
      .get<DummyJSONUser>(`${this.baseUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${currentUser.accessToken}`,
        },
      })
      .pipe(
        catchError((error) => {
          if (error.status === 401) {
            this.logout();
            return throwError(() => new Error('Session expired'));
          }
          return throwError(() => new Error('Failed to fetch user profile'));
        })
      );
  }

  // Update user profile
  updateProfile(
    profileData: Partial<DummyJSONUser>
  ): Observable<DummyJSONUser> {
    const currentUser = this.authStateSubject.value.user;
    if (!currentUser) {
      return throwError(() => new Error('No authenticated user'));
    }

    return this.http
      .put<DummyJSONUser>(
        `${this.baseUrl}/users/${currentUser.id}`,
        profileData,
        {
          headers: {
            Authorization: `Bearer ${currentUser.accessToken}`,
          },
        }
      )
      .pipe(
        tap((updatedUser) => {
          // Update stored user data with new profile information
          const updatedAuthUser: AuthUser = {
            ...currentUser,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            image: updatedUser.image || currentUser.image,
          };
          this.storeUser(updatedAuthUser);
          this.setAuthState({
            ...this.authStateSubject.value,
            user: updatedAuthUser,
          });
        }),
        catchError((error) => {
          if (error.status === 401) {
            this.logout();
            return throwError(() => new Error('Session expired'));
          }
          return throwError(() => new Error('Failed to update profile'));
        })
      );
  }

  // Private helper methods
  private mapToAuthUser(response: LoginResponse): AuthUser {
    return {
      id: response.id,
      username: response.username,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      gender: response.gender,
      image: response.image,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    };
  }

  private setAuthState(state: AuthState): void {
    this.authStateSubject.next(state);
  }

  private storeUser(user: AuthUser): void {
    localStorage.setItem(this.storageKey, JSON.stringify(user));
    localStorage.setItem(this.refreshTokenKey, user.refreshToken);
  }

  private getStoredUser(): AuthUser | null {
    try {
      const storedUser = localStorage.getItem(this.storageKey);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  }

  private clearStoredData(): void {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  private handleAuthError(error: HttpErrorResponse): string {
    if (error.status === 400) {
      return 'Invalid credentials. Please check your username and password.';
    } else if (error.status === 401) {
      return 'Authentication failed. Please try again.';
    } else if (error.status === 500) {
      return 'Server error. Please try again later.';
    } else {
      return 'An unexpected error occurred. Please try again.';
    }
  }

  // Token refresh timer management
  private startTokenRefreshTimer(): void {
    this.stopTokenRefreshTimer();

    // Refresh token every 25 minutes (assuming 30-minute expiry)
    this.tokenRefreshTimer = timer(25 * 60 * 1000, 25 * 60 * 1000)
      .pipe(switchMap(() => this.refreshToken()))
      .subscribe({
        next: () => console.log('Token refreshed successfully'),
        error: (error) => console.error('Token refresh failed:', error),
      });
  }

  private stopTokenRefreshTimer(): void {
    if (this.tokenRefreshTimer) {
      this.tokenRefreshTimer.unsubscribe();
      this.tokenRefreshTimer = undefined;
    }
  }

  // Clear error state
  clearError(): void {
    this.setAuthState({
      ...this.authStateSubject.value,
      error: null,
    });
  }
}
