import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { ProfileComponent } from './profile.component';
import { AuthService } from '../../services/auth.service';
import { AuthUser } from '../../models/auth.model';
import { DummyJSONUser } from '../../services/user.service';

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
  image: 'test-image.jpg',
  university: 'Test University',
  address: {
    address: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    postalCode: '12345',
    country: 'Test Country',
  },
  company: {
    name: 'Test Company',
    title: 'Test Title',
    department: 'Test Department',
  },
};

// Mock AuthService
const mockAuthService = {
  getCurrentUser: jasmine
    .createSpy('getCurrentUser')
    .and.returnValue(of(mockAuthUser)),
  getCurrentUserProfile: jasmine
    .createSpy('getCurrentUserProfile')
    .and.returnValue(of(mockDummyJSONUser)),
  updateProfile: jasmine
    .createSpy('updateProfile')
    .and.returnValue(of(mockDummyJSONUser)),
};

// Mock MatSnackBar
const mockSnackBar = {
  open: jasmine.createSpy('open'),
};

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  beforeEach(() => {
    // Reset spies before each test
    mockAuthService.getCurrentUser.calls.reset();
    mockAuthService.getCurrentUserProfile.calls.reset();
    mockAuthService.updateProfile.calls.reset();
    mockSnackBar.open.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load user data on init', () => {
    fixture.detectChanges();

    expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
    expect(mockAuthService.getCurrentUserProfile).toHaveBeenCalled();
    expect(component.currentUser).toEqual(mockAuthUser);
    expect(component.userProfile).toEqual(mockDummyJSONUser);
  });

  it('should populate form with user data', () => {
    fixture.detectChanges();

    expect(component.profileForm.get('firstName')?.value).toBe('Test');
    expect(component.profileForm.get('lastName')?.value).toBe('User');
    expect(component.profileForm.get('email')?.value).toBe('test@example.com');
    expect(component.profileForm.get('phone')?.value).toBe('123-456-7890');
    expect(component.profileForm.get('age')?.value).toBe(25);
    expect(component.profileForm.get('university')?.value).toBe(
      'Test University'
    );

    // Check nested form groups
    expect(component.profileForm.get('address.address')?.value).toBe(
      '123 Test St'
    );
    expect(component.profileForm.get('address.city')?.value).toBe('Test City');
    expect(component.profileForm.get('company.name')?.value).toBe(
      'Test Company'
    );
    expect(component.profileForm.get('company.title')?.value).toBe(
      'Test Title'
    );
  });

  it('should handle loading error', () => {
    mockAuthService.getCurrentUser.and.returnValue(
      throwError(() => new Error('Load failed'))
    );
    mockAuthService.getCurrentUserProfile.and.returnValue(
      throwError(() => new Error('Load failed'))
    );

    fixture.detectChanges();

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Failed to load profile data',
      'Close',
      jasmine.objectContaining({
        duration: 5000,
        panelClass: ['error-snackbar'],
      })
    );
  });

  it('should validate required fields', () => {
    fixture.detectChanges();

    component.profileForm.patchValue({
      firstName: '',
      lastName: '',
      email: '',
    });

    const firstNameControl = component.profileForm.get('firstName');
    const lastNameControl = component.profileForm.get('lastName');
    const emailControl = component.profileForm.get('email');

    expect(firstNameControl?.hasError('required')).toBeTruthy();
    expect(lastNameControl?.hasError('required')).toBeTruthy();
    expect(emailControl?.hasError('required')).toBeTruthy();
  });

  it('should validate email format', () => {
    fixture.detectChanges();

    const emailControl = component.profileForm.get('email');
    emailControl?.setValue('invalid-email');

    expect(emailControl?.hasError('email')).toBeTruthy();
  });

  it('should validate age range', () => {
    fixture.detectChanges();

    const ageControl = component.profileForm.get('age');

    ageControl?.setValue(10);
    expect(ageControl?.hasError('min')).toBeTruthy();

    ageControl?.setValue(150);
    expect(ageControl?.hasError('max')).toBeTruthy();
  });

  it('should save profile successfully', () => {
    fixture.detectChanges();

    component.profileForm.patchValue({
      firstName: 'Updated',
      lastName: 'Name',
    });

    component.onSave();

    expect(mockAuthService.updateProfile).toHaveBeenCalled();
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Profile updated successfully!',
      'Close',
      jasmine.objectContaining({
        duration: 3000,
        panelClass: ['success-snackbar'],
      })
    );
  });

  it('should handle save error', () => {
    mockAuthService.updateProfile.and.returnValue(
      throwError(() => new Error('Update failed'))
    );
    fixture.detectChanges();

    component.profileForm.patchValue({
      firstName: 'Updated',
      lastName: 'Name',
    });

    component.onSave();

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Failed to update profile',
      'Close',
      jasmine.objectContaining({
        duration: 5000,
        panelClass: ['error-snackbar'],
      })
    );
  });

  it('should not save invalid form', () => {
    fixture.detectChanges();

    component.profileForm.patchValue({
      firstName: '',
      lastName: '',
      email: 'invalid-email',
    });

    component.onSave();

    expect(mockAuthService.updateProfile).not.toHaveBeenCalled();
  });

  it('should cancel changes', () => {
    fixture.detectChanges();

    // Make some changes
    component.profileForm.patchValue({
      firstName: 'Changed',
      lastName: 'Name',
    });

    component.onCancel();

    // Should revert to original values
    expect(component.profileForm.get('firstName')?.value).toBe('Test');
    expect(component.profileForm.get('lastName')?.value).toBe('User');

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Changes discarded',
      'Close',
      jasmine.objectContaining({
        duration: 2000,
      })
    );
  });

  it('should get error messages correctly', () => {
    fixture.detectChanges();

    const firstNameControl = component.profileForm.get('firstName');
    const emailControl = component.profileForm.get('email');
    const ageControl = component.profileForm.get('age');

    firstNameControl?.markAsTouched();
    emailControl?.markAsTouched();
    ageControl?.markAsTouched();

    firstNameControl?.setValue('');
    emailControl?.setValue('invalid-email');
    ageControl?.setValue(10);

    expect(component.getErrorMessage('firstName')).toBe(
      'First Name is required'
    );
    expect(component.getErrorMessage('email')).toBe(
      'Please enter a valid email address'
    );
    expect(component.getErrorMessage('age')).toBe('Minimum age is 13');
  });

  it('should get error messages for nested form groups', () => {
    fixture.detectChanges();

    const addressControl = component.profileForm.get('address.address');
    addressControl?.setValidators([]);
    addressControl?.markAsTouched();

    // Test with a field that doesn't have validation errors
    expect(component.getErrorMessage('address', 'address')).toBe('');
  });

  it('should detect form changes', () => {
    fixture.detectChanges();

    expect(component.hasChanges).toBeFalsy();

    component.profileForm.patchValue({
      firstName: 'Changed',
    });

    expect(component.hasChanges).toBeTruthy();
  });

  it('should show loading state', () => {
    component.isLoading = true;
    fixture.detectChanges();

    expect(component.isLoading).toBeTruthy();
  });

  it('should show updating state', () => {
    fixture.detectChanges();

    component.isUpdating = true;

    expect(component.isUpdating).toBeTruthy();
  });

  it('should handle empty user profile data', () => {
    mockAuthService.getCurrentUserProfile.and.returnValue(
      of({
        id: 1,
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
      } as DummyJSONUser)
    );

    fixture.detectChanges();

    expect(component.profileForm.get('firstName')?.value).toBe('');
    expect(component.profileForm.get('lastName')?.value).toBe('');
    expect(component.profileForm.get('email')?.value).toBe('');
  });

  it('should create form with proper structure', () => {
    expect(component.profileForm.get('firstName')).toBeTruthy();
    expect(component.profileForm.get('lastName')).toBeTruthy();
    expect(component.profileForm.get('email')).toBeTruthy();
    expect(component.profileForm.get('phone')).toBeTruthy();
    expect(component.profileForm.get('age')).toBeTruthy();
    expect(component.profileForm.get('university')).toBeTruthy();
    expect(component.profileForm.get('address')).toBeTruthy();
    expect(component.profileForm.get('company')).toBeTruthy();

    // Check nested form groups
    expect(component.profileForm.get('address.address')).toBeTruthy();
    expect(component.profileForm.get('address.city')).toBeTruthy();
    expect(component.profileForm.get('company.name')).toBeTruthy();
    expect(component.profileForm.get('company.title')).toBeTruthy();
  });
});
