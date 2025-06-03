import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { UserService, DummyJSONUser } from '../../services/user.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  isEditMode = false;
  userId: number | null = null;
  loading = false;
  error: string | null = null;
  success = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      age: [''],
      companyName: [''],
      address: [''],
      city: [''],
      postalCode: [''],
      university: [''],
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.userId = parseInt(id, 10);
      this.loadUser();
    }
  }

  loadUser() {
    if (this.userId) {
      this.loading = true;
      this.userService.getUserById(this.userId).subscribe({
        next: (user) => {
          this.userForm.patchValue({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            age: user.age || '',
            companyName: user.company?.name || '',
            address: user.address?.address || '',
            city: user.address?.city || '',
            postalCode: user.address?.postalCode || '',
            university: user.university || '',
          });
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load user';
          this.loading = false;
          this.snackBar.open('Failed to load user', 'Close', {
            duration: 3000,
          });
          console.error('Error loading user:', err);
        },
      });
    }
  }

  onSubmit() {
    if (this.userForm.valid) {
      this.loading = true;
      this.error = null;

      const formValue = this.userForm.value;
      const userData: Partial<DummyJSONUser> = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        phone: formValue.phone,
        age: formValue.age ? parseInt(formValue.age) : undefined,
        company: formValue.companyName
          ? { name: formValue.companyName }
          : undefined,
        address:
          formValue.address || formValue.city || formValue.postalCode
            ? {
                address: formValue.address || '',
                city: formValue.city || '',
                postalCode: formValue.postalCode || '',
              }
            : undefined,
        university: formValue.university || undefined,
      };

      if (this.isEditMode && this.userId) {
        this.userService.updateUser(this.userId, userData).subscribe({
          next: () => {
            this.success = true;
            this.loading = false;
            this.snackBar.open('User updated successfully!', 'Close', {
              duration: 3000,
            });
            setTimeout(() => {
              this.router.navigate(['/users']);
            }, 1000);
          },
          error: (err) => {
            this.error = 'Failed to update user';
            this.loading = false;
            this.snackBar.open('Failed to update user', 'Close', {
              duration: 3000,
            });
            console.error('Error updating user:', err);
          },
        });
      } else {
        this.userService
          .createUser(userData as Omit<DummyJSONUser, 'id'>)
          .subscribe({
            next: () => {
              this.success = true;
              this.loading = false;
              this.snackBar.open('User created successfully!', 'Close', {
                duration: 3000,
              });
              setTimeout(() => {
                this.router.navigate(['/users']);
              }, 1000);
            },
            error: (err) => {
              this.error = 'Failed to create user';
              this.loading = false;
              this.snackBar.open('Failed to create user', 'Close', {
                duration: 3000,
              });
              console.error('Error creating user:', err);
            },
          });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  markFormGroupTouched() {
    Object.keys(this.userForm.controls).forEach((key) => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string | null {
    const control = this.userForm.get(fieldName);
    if (control && control.errors && control.touched) {
      if (control.errors['required']) {
        return `${
          fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
        } is required`;
      }
      if (control.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (control.errors['minlength']) {
        return `${
          fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
        } must be at least ${
          control.errors['minlength'].requiredLength
        } characters`;
      }
    }
    return null;
  }

  cancel() {
    this.router.navigate(['/users']);
  }
}
