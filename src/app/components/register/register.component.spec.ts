import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth.service';
import { AuthState } from '../../models/auth.model';
import { DummyJSONUser } from '../../services/user.service';

// Mock DummyJSONUser
const mockDummyJSONUser: DummyJSONUser = {
  id: 1,
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  phone: '123-456-7890',
  username: 'testuser',
  age: 25,
  gender: 'male',
};

// Mock AuthService
const mockAuthService = {
  authState$: of({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  } as AuthState),
  register: jasmine
    .createSpy('register')
    .and.returnValue(of(mockDummyJSONUser)),
  clearError: jasmine.createSpy('clearError'),
};

// Mock Router
const mockRouter = {
  navigate: jasmine.createSpy('navigate'),
};

// Mock MatSnackBar
const mockSnackBar = {
  open: jasmine.createSpy('open'),
};

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  beforeEach(() => {
    // Reset spies before each test
    mockAuthService.register.calls.reset();
    mockAuthService.clearError.calls.reset();
    mockRouter.navigate.calls.reset();
    mockSnackBar.open.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    fixture.detectChanges();

    expect(component.registerForm.get('firstName')?.value).toBe('');
    expect(component.registerForm.get('lastName')?.value).toBe('');
    expect(component.registerForm.get('username')?.value).toBe('');
    expect(component.registerForm.get('email')?.value).toBe('');
    expect(component.registerForm.get('password')?.value).toBe('');
    expect(component.registerForm.get('confirmPassword')?.value).toBe('');
  });

  it('should validate required fields', () => {
    fixture.detectChanges();

    const firstNameControl = component.registerForm.get('firstName');
    const lastNameControl = component.registerForm.get('lastName');
    const usernameControl = component.registerForm.get('username');
    const emailControl = component.registerForm.get('email');
    const passwordControl = component.registerForm.get('password');
    const confirmPasswordControl =
      component.registerForm.get('confirmPassword');

    expect(firstNameControl?.hasError('required')).toBeTruthy();
    expect(lastNameControl?.hasError('required')).toBeTruthy();
    expect(usernameControl?.hasError('required')).toBeTruthy();
    expect(emailControl?.hasError('required')).toBeTruthy();
    expect(passwordControl?.hasError('required')).toBeTruthy();
    expect(confirmPasswordControl?.hasError('required')).toBeTruthy();
  });

  it('should validate email format', () => {
    fixture.detectChanges();

    const emailControl = component.registerForm.get('email');
    emailControl?.setValue('invalid-email');

    expect(emailControl?.hasError('email')).toBeTruthy();
  });

  it('should validate password minimum length', () => {
    fixture.detectChanges();

    const passwordControl = component.registerForm.get('password');
    passwordControl?.setValue('123');

    expect(passwordControl?.hasError('minlength')).toBeTruthy();
  });

  it('should validate password match', () => {
    fixture.detectChanges();

    component.registerForm.patchValue({
      password: 'password123',
      confirmPassword: 'different123',
    });

    expect(component.registerForm.hasError('passwordMismatch')).toBeTruthy();
  });

  it('should validate phone pattern', () => {
    fixture.detectChanges();

    const phoneControl = component.registerForm.get('phone');
    phoneControl?.setValue('invalid-phone');

    expect(phoneControl?.hasError('pattern')).toBeTruthy();
  });

  it('should validate age range', () => {
    fixture.detectChanges();

    const ageControl = component.registerForm.get('age');

    ageControl?.setValue(10);
    expect(ageControl?.hasError('min')).toBeTruthy();

    ageControl?.setValue(150);
    expect(ageControl?.hasError('max')).toBeTruthy();
  });

  it('should submit valid form', () => {
    fixture.detectChanges();

    component.registerForm.patchValue({
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      phone: '123-456-7890',
      age: 25,
      gender: 'male',
    });

    component.onSubmit();

    expect(mockAuthService.register).toHaveBeenCalledWith({
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      phone: '123-456-7890',
      age: 25,
      gender: 'male',
    });
  });

  it('should not submit invalid form', () => {
    fixture.detectChanges();

    component.registerForm.patchValue({
      firstName: '',
      lastName: '',
      username: '',
      email: 'invalid-email',
      password: '123',
      confirmPassword: 'different',
    });

    component.onSubmit();

    expect(mockAuthService.register).not.toHaveBeenCalled();
  });

  it('should handle successful registration', () => {
    fixture.detectChanges();

    component.registerForm.patchValue({
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    component.onSubmit();

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Registration successful! Please login with your credentials.',
      'Close',
      jasmine.objectContaining({
        duration: 5000,
        panelClass: ['success-snackbar'],
      })
    );
  });

  it('should navigate to login after successful registration', (done) => {
    fixture.detectChanges();

    component.registerForm.patchValue({
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    component.onSubmit();

    // Wait for the setTimeout in the component
    setTimeout(() => {
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
      done();
    }, 2100);
  });

  it('should handle registration error', () => {
    mockAuthService.register.and.returnValue(
      throwError(() => new Error('Registration failed'))
    );
    fixture.detectChanges();

    component.registerForm.patchValue({
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    component.onSubmit();

    expect(mockAuthService.register).toHaveBeenCalled();
  });

  it('should navigate to login page', () => {
    fixture.detectChanges();

    component.goToLogin();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should toggle password visibility', () => {
    fixture.detectChanges();

    expect(component.hidePassword).toBeTruthy();
    expect(component.hideConfirmPassword).toBeTruthy();

    component.hidePassword = !component.hidePassword;
    component.hideConfirmPassword = !component.hideConfirmPassword;

    expect(component.hidePassword).toBeFalsy();
    expect(component.hideConfirmPassword).toBeFalsy();
  });

  it('should get error messages correctly', () => {
    fixture.detectChanges();

    const firstNameControl = component.registerForm.get('firstName');
    const emailControl = component.registerForm.get('email');
    const passwordControl = component.registerForm.get('password');
    const phoneControl = component.registerForm.get('phone');
    const ageControl = component.registerForm.get('age');

    firstNameControl?.markAsTouched();
    emailControl?.markAsTouched();
    passwordControl?.markAsTouched();
    phoneControl?.markAsTouched();
    ageControl?.markAsTouched();

    firstNameControl?.setValue('');
    emailControl?.setValue('invalid-email');
    passwordControl?.setValue('123');
    phoneControl?.setValue('invalid-phone');
    ageControl?.setValue(10);

    expect(component.getErrorMessage('firstName')).toBe(
      'First Name is required'
    );
    expect(component.getErrorMessage('email')).toBe(
      'Please enter a valid email address'
    );
    expect(component.getErrorMessage('password')).toBe(
      'Password must be at least 6 characters long'
    );
    expect(component.getErrorMessage('phone')).toBe(
      'Please enter a valid phone number'
    );
    expect(component.getErrorMessage('age')).toBe('Minimum age is 13');
  });

  it('should get password mismatch error', () => {
    fixture.detectChanges();

    component.registerForm.patchValue({
      password: 'password123',
      confirmPassword: 'different123',
    });

    const confirmPasswordControl =
      component.registerForm.get('confirmPassword');
    confirmPasswordControl?.markAsTouched();

    expect(component.getPasswordMismatchError()).toBe('Passwords do not match');
  });

  it('should show error message from auth state', () => {
    mockAuthService.authState$ = of({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: 'Registration failed',
    } as AuthState);

    fixture.detectChanges();

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Registration failed',
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

  it('should have gender options', () => {
    expect(component.genderOptions).toEqual([
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
      { value: 'other', label: 'Other' },
    ]);
  });
});
