import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  AuthUser,
} from '../models/auth.model';
import { DummyJSONUser } from './user.service';

// Mock for AuthUser
const mockAuthUser: AuthUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  gender: 'male',
  image: 'test-image.jpg',
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
};

// Mock for LoginResponse
const mockLoginResponse: LoginResponse = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  gender: 'male',
  image: 'test-image.jpg',
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
};

// Mock for DummyJSONUser
const mockDummyJSONUser: DummyJSONUser = {
  id: 1,
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  phone: '123-456-7890',
  username: 'testuser',
  age: 25,
  gender: 'male',
  image: 'test-image.jpg',
};

// Mock Router
const mockRouter = {
  navigate: jasmine.createSpy('navigate'),
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, { provide: Router, useValue: mockRouter }],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login user successfully', () => {
      const loginRequest: LoginRequest = {
        username: 'testuser',
        password: 'password123',
        expiresInMins: 30,
      };

      service.login(loginRequest).subscribe((user) => {
        expect(user).toEqual(mockAuthUser);
      });

      const req = httpMock.expectOne('https://dummyjson.com/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(loginRequest);
      req.flush(mockLoginResponse);
    });

    it('should handle login error', () => {
      const loginRequest: LoginRequest = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      service.login(loginRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('Invalid credentials');
        },
      });

      const req = httpMock.expectOne('https://dummyjson.com/auth/login');
      req.flush(
        { message: 'Invalid credentials' },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('register', () => {
    it('should register user successfully', () => {
      const registerRequest: RegisterRequest = {
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      service.register(registerRequest).subscribe((user) => {
        expect(user).toEqual(mockDummyJSONUser);
      });

      const req = httpMock.expectOne('https://dummyjson.com/users/add');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerRequest);
      req.flush(mockDummyJSONUser);
    });

    it('should handle registration error', () => {
      const registerRequest: RegisterRequest = {
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123',
      };

      service.register(registerRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('Authentication failed');
        },
      });

      const req = httpMock.expectOne('https://dummyjson.com/users/add');
      req.flush(
        { message: 'Invalid data' },
        { status: 401, statusText: 'Unauthorized' }
      );
    });
  });

  describe('logout', () => {
    it('should logout user and navigate to login', () => {
      // Set up authenticated state
      localStorage.setItem('auth_user', JSON.stringify(mockAuthUser));
      localStorage.setItem('refresh_token', 'mock-refresh-token');

      service.logout();

      expect(localStorage.getItem('auth_user')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', () => {
      localStorage.setItem('refresh_token', 'mock-refresh-token');

      service.refreshToken().subscribe((user) => {
        expect(user.accessToken).toBe('new-access-token');
        expect(user.refreshToken).toBe('new-refresh-token');
      });

      const req = httpMock.expectOne('https://dummyjson.com/auth/refresh');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        refreshToken: 'mock-refresh-token',
        expiresInMins: 30,
      });
      req.flush({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });

    it('should handle refresh token failure', () => {
      localStorage.setItem('refresh_token', 'invalid-token');

      service.refreshToken().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('Session expired');
        },
      });

      const req = httpMock.expectOne('https://dummyjson.com/auth/refresh');
      req.flush(
        { message: 'Invalid token' },
        { status: 401, statusText: 'Unauthorized' }
      );
    });

    it('should logout when no refresh token available', () => {
      service.refreshToken().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('No refresh token available');
        },
      });

      httpMock.expectNone('https://dummyjson.com/auth/refresh');
    });
  });

  describe('getCurrentUserProfile', () => {
    it('should get current user profile successfully', () => {
      // Set up authenticated state
      service['authStateSubject'].next({
        user: mockAuthUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      service.getCurrentUserProfile().subscribe((profile) => {
        expect(profile).toEqual(mockDummyJSONUser);
      });

      const req = httpMock.expectOne('https://dummyjson.com/auth/me');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer mock-access-token'
      );
      req.flush(mockDummyJSONUser);
    });

    it('should handle unauthorized access', () => {
      service['authStateSubject'].next({
        user: mockAuthUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      service.getCurrentUserProfile().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('Session expired');
        },
      });

      const req = httpMock.expectOne('https://dummyjson.com/auth/me');
      req.flush(
        { message: 'Unauthorized' },
        { status: 401, statusText: 'Unauthorized' }
      );
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', () => {
      // Set up authenticated state
      service['authStateSubject'].next({
        user: mockAuthUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      const updateData = { firstName: 'Updated', lastName: 'Name' };

      service.updateProfile(updateData).subscribe((updatedUser) => {
        expect(updatedUser.firstName).toBe('Updated');
        expect(updatedUser.lastName).toBe('Name');
      });

      const req = httpMock.expectOne('https://dummyjson.com/users/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer mock-access-token'
      );
      req.flush({ ...mockDummyJSONUser, ...updateData });
    });
  });

  describe('isAuthenticated', () => {
    it('should return authentication status', () => {
      service.isAuthenticated().subscribe((isAuth) => {
        expect(isAuth).toBe(false);
      });

      // Set authenticated state
      service['authStateSubject'].next({
        user: mockAuthUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      service.isAuthenticated().subscribe((isAuth) => {
        expect(isAuth).toBe(true);
      });
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', () => {
      service.getCurrentUser().subscribe((user) => {
        expect(user).toBeNull();
      });

      // Set authenticated state
      service['authStateSubject'].next({
        user: mockAuthUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      service.getCurrentUser().subscribe((user) => {
        expect(user).toEqual(mockAuthUser);
      });
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      // Set error state
      service['authStateSubject'].next({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Test error',
      });

      service.clearError();

      service.authState$.subscribe((state) => {
        expect(state.error).toBeNull();
      });
    });
  });
});
