import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { DummyJSONUser } from '../../services/user.service';
import { AuthUser } from '../../models/auth.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSnackBarModule,
    MatTabsModule,
    MatDividerModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit, OnDestroy {
  currentUser: AuthUser | null = null;
  userProfile: DummyJSONUser | null = null;
  profileForm: FormGroup;
  isLoading = false;
  isUpdating = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      age: ['', [Validators.min(13), Validators.max(120)]],
      university: [''],
      address: this.fb.group({
        address: [''],
        city: [''],
        state: [''],
        postalCode: [''],
        country: [''],
      }),
      company: this.fb.group({
        name: [''],
        title: [''],
        department: [''],
      }),
    });
  }

  private loadUserData(): void {
    this.isLoading = true;

    forkJoin({
      currentUser: this.authService.getCurrentUser(),
      userProfile: this.authService.getCurrentUserProfile(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ currentUser, userProfile }) => {
          this.currentUser = currentUser;
          this.userProfile = userProfile;
          this.populateForm();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load user data:', error);
          this.snackBar.open('Failed to load profile data', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
          this.isLoading = false;
        },
      });
  }

  private populateForm(): void {
    if (this.userProfile) {
      this.profileForm.patchValue({
        firstName: this.userProfile.firstName || '',
        lastName: this.userProfile.lastName || '',
        email: this.userProfile.email || '',
        phone: this.userProfile.phone || '',
        age: this.userProfile.age || '',
        university: this.userProfile.university || '',
        address: {
          address: this.userProfile.address?.address || '',
          city: this.userProfile.address?.city || '',
          state: this.userProfile.address?.state || '',
          postalCode: this.userProfile.address?.postalCode || '',
          country: this.userProfile.address?.country || '',
        },
        company: {
          name: this.userProfile.company?.name || '',
          title: this.userProfile.company?.title || '',
          department: this.userProfile.company?.department || '',
        },
      });
    }
  }

  onSave(): void {
    if (this.profileForm.valid) {
      this.isUpdating = true;
      const formValue = this.profileForm.value;

      const updateData: Partial<DummyJSONUser> = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        phone: formValue.phone,
        age: formValue.age ? parseInt(formValue.age) : undefined,
        university: formValue.university,
        address: {
          address: formValue.address.address,
          city: formValue.address.city,
          state: formValue.address.state,
          postalCode: formValue.address.postalCode,
          country: formValue.address.country,
        },
        company: {
          name: formValue.company.name,
          title: formValue.company.title,
          department: formValue.company.department,
        },
      };

      this.authService
        .updateProfile(updateData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedUser) => {
            this.userProfile = updatedUser;
            this.isUpdating = false;
            this.snackBar.open('Profile updated successfully!', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar'],
            });
          },
          error: (error) => {
            console.error('Profile update failed:', error);
            this.snackBar.open('Failed to update profile', 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar'],
            });
            this.isUpdating = false;
          },
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.populateForm();
    this.snackBar.open('Changes discarded', 'Close', {
      duration: 2000,
    });
  }

  getErrorMessage(fieldName: string, parentGroup?: string): string {
    let field;
    if (parentGroup) {
      field = this.profileForm.get(parentGroup)?.get(fieldName);
    } else {
      field = this.profileForm.get(fieldName);
    }

    if (field?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength']?.requiredLength;
      return `${this.getFieldLabel(
        fieldName
      )} must be at least ${minLength} characters long`;
    }
    if (field?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (field?.hasError('min')) {
      return 'Minimum age is 13';
    }
    if (field?.hasError('max')) {
      return 'Maximum age is 120';
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      phone: 'Phone',
      age: 'Age',
      university: 'University',
      address: 'Address',
      city: 'City',
      state: 'State',
      postalCode: 'Postal Code',
      country: 'Country',
      name: 'Company Name',
      title: 'Job Title',
      department: 'Department',
    };
    return labels[fieldName] || fieldName;
  }

  private markFormGroupTouched(): void {
    this.markGroupTouched(this.profileForm);
  }

  private markGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  get hasChanges(): boolean {
    return this.profileForm.dirty;
  }
}
