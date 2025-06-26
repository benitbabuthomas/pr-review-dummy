import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
  NavigationEnd,
} from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil, filter } from 'rxjs';
import { AuthService } from './services/auth.service';
import { AuthUser } from './models/auth.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatSnackBarModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'User Management System';
  currentUser: AuthUser | null = null;
  isAuthenticated = false;
  currentRoute = '';
  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Subscribe to authentication state
    this.authService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.currentUser = state.user;
        this.isAuthenticated = state.isAuthenticated;
      });

    // Subscribe to route changes
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
      });

    // Set initial route
    this.currentRoute = this.router.url;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onLogout(): void {
    this.authService.logout();
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  // Get the appropriate auth button based on current route
  getAuthButtonConfig(): { text: string; icon: string; action: () => void } {
    if (this.currentRoute === '/login') {
      return {
        text: 'Register',
        icon: 'person_add',
        action: () => this.goToRegister(),
      };
    } else {
      return {
        text: 'Login',
        icon: 'login',
        action: () => this.goToLogin(),
      };
    }
  }
}
