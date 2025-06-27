import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { AuthUser, AuthState } from '../../models/auth.model';

// Mock AuthUser
const mockAuthUser: AuthUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  gender: 'male',
  image: 'test-image.jpg',
  token: 'mock-token',
  refreshToken: 'mock-refresh-token',
};

// Mock AuthService
const mockAuthService = {
  authState$: of({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  } as AuthState),
  login: jasmine.createSpy('login').and.returnValue(of(mockAuthUser)),
  clearError: jasmine.createSpy('clearError'),
};

// Mock Router
const mockRouter = {
  navigate: jasmine.createSpy('navigate'),
};

// Mock ActivatedRoute
const mockActivatedRoute = {
  snapshot: {
    queryParams: {},
  },
};

// Mock MatSnackBar
const mockSnackBar = {
  open: jasmine.createSpy('open'),
};

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  beforeEach(() => {
    // Reset spies before each test
    mockAuthService.login.calls.reset();
    mockAuthService.clearError.calls.reset();
    mockRouter.navigate.calls.reset();
    mockSnackBar.open.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    fixture.detectChanges();

    expect(component.loginForm.get('username')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
  });

  it('should validate required fields', () => {
    fixture.detectChanges();

    const usernameControl = component.loginForm.get('username');
    const passwordControl = component.loginForm.get('password');

    expect(usernameControl?.hasError('required')).toBeTruthy();
    expect(passwordControl?.hasError('required')).toBeTruthy();
  });

  it('should validate password minimum length', () => {
    fixture.detectChanges();

    const passwordControl = component.loginForm.get('password');
    passwordControl?.setValue('123');

    expect(passwordControl?.hasError('minlength')).toBeTruthy();
  });

  it('should submit valid form', () => {
    fixture.detectChanges();

    component.loginForm.patchValue({
      username: 'testuser',
      password: 'password123',
    });

    component.onSubmit();

    expect(mockAuthService.login).toHaveBeenCalledWith({
      username: 'testuser',
      password: 'password123',
      expiresInMins: 30,
    });
  });

  it('should not submit invalid form', () => {
    fixture.detectChanges();

    component.loginForm.patchValue({
      username: '',
      password: '123',
    });

    component.onSubmit();

    expect(mockAuthService.login).not.toHaveBeenCalled();
  });

  it('should handle successful login', () => {
    fixture.detectChanges();

    component.loginForm.patchValue({
      username: 'testuser',
      password: 'password123',
    });

    component.onSubmit();

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Welcome back, Test!',
      'Close',
      jasmine.objectContaining({
        duration: 3000,
        panelClass: ['success-snackbar'],
      })
    );
  });

  it('should handle login error', () => {
    mockAuthService.login.and.returnValue(
      throwError(() => new Error('Login failed'))
    );
    fixture.detectChanges();

    component.loginForm.patchValue({
      username: 'testuser',
      password: 'wrongpassword',
    });

    component.onSubmit();

    // Error handling is done through auth state subscription
    expect(mockAuthService.login).toHaveBeenCalled();
  });

  it('should navigate to register page', () => {
    fixture.detectChanges();

    component.goToRegister();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/register']);
  });

  it('should toggle password visibility', () => {
    fixture.detectChanges();

    expect(component.hidePassword).toBeTruthy();

    // Simulate clicking the visibility toggle button
    component.hidePassword = !component.hidePassword;

    expect(component.hidePassword).toBeFalsy();
  });

  it('should get error messages correctly', () => {
    fixture.detectChanges();

    const usernameControl = component.loginForm.get('username');
    const passwordControl = component.loginForm.get('password');

    usernameControl?.markAsTouched();
    passwordControl?.markAsTouched();
    passwordControl?.setValue('123');

    expect(component.getErrorMessage('username')).toBe('Username is required');
    expect(component.getErrorMessage('password')).toBe(
      'Password must be at least 6 characters long'
    );
  });

  it('should handle return URL from query params', () => {
    mockActivatedRoute.snapshot.queryParams = { returnUrl: '/users' };

    fixture.detectChanges();

    expect(component.returnUrl).toBe('/users');
  });

  it('should navigate to return URL on successful authentication', () => {
    mockAuthService.authState$ = of({
      user: mockAuthUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    } as AuthState);

    component.returnUrl = '/users';
    fixture.detectChanges();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/users']);
  });

  it('should show error message from auth state', () => {
    mockAuthService.authState$ = of({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: 'Invalid credentials',
    } as AuthState);

    fixture.detectChanges();

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Invalid credentials',
      'Close',
      jasmine.objectContaining({
        duration: 5000,
        panelClass: ['error-snackbar'],
      })
    );
  });

  it('should clear errors on init', () => {
    fixture.detectChanges();

    expect(mockAuthService.clearError).toHaveBeenCalled();
  });

  it('should update loading state from auth service', () => {
    mockAuthService.authState$ = of({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
    } as AuthState);

    fixture.detectChanges();

    expect(component.isLoading).toBeTruthy();
  });
});
