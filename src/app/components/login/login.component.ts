import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/auth.model';

@Component({
  selector: 'app-login',
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
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;
  returnUrl = '/home';
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    // Get return URL from route parameters or default to '/home'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';

    // Subscribe to auth state
    this.authService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.isLoading = state.isLoading;

        if (state.error) {
          this.snackBar.open(state.error, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
        }

        if (state.isAuthenticated) {
          this.router.navigate([this.returnUrl]);
        }
      });

    // Clear any existing errors
    this.authService.clearError();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const credentials: LoginRequest = {
        username: this.loginForm.value.username,
        password: this.loginForm.value.password,
        expiresInMins: 30,
      };

      this.authService
        .login(credentials)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (user) => {
            this.snackBar.open(`Welcome back, ${user.firstName}!`, 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar'],
            });
          },
          error: (error) => {
            // Error handling is managed by the auth service and displayed via snackbar
            console.error('Login failed:', error);
          },
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  getErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${
        fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
      } is required`;
    }
    if (field?.hasError('minlength')) {
      return `${
        fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
      } must be at least 6 characters long`;
    }
    return '';
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach((key) => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
