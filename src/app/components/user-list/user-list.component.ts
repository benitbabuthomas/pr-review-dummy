import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatChipsModule } from '@angular/material/chips';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UserService, DummyJSONUser } from '../../services/user.service';
import {
  ConfirmationDialogComponent,
  ConfirmationDialogData,
} from './confirmation-dialog.component';

interface DummyJSONUsersResponse {
  users: DummyJSONUser[];
  total: number;
  skip: number;
  limit: number;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatToolbarModule,
    MatChipsModule,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  users: DummyJSONUser[] = [];
  loading = false;
  error: string | null = null;

  // Pagination
  totalUsers = 0;
  pageSize = 10;
  currentPage = 0;
  pageSizeOptions = [5, 10, 20, 50];

  // Sorting
  sortBy = '';
  sortOrder: 'asc' | 'desc' = 'asc';
  sortOptions = [
    { value: 'firstName', label: 'First Name' },
    { value: 'lastName', label: 'Last Name' },
    { value: 'email', label: 'Email' },
    { value: 'age', label: 'Age' },
    { value: 'company.name', label: 'Company' },
  ];

  // Filtering and Search
  filterForm: FormGroup;
  searchTerm = '';
  activeFilters: string[] = [];

  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      sortBy: [''],
      sortOrder: [{ value: 'asc', disabled: true }],
    });
  }

  ngOnInit() {
    this.setupFormSubscriptions();
    this.loadUsers();
  }

  setupFormSubscriptions() {
    // Search with debounce
    this.filterForm
      .get('search')
      ?.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        this.searchTerm = value || '';
        this.currentPage = 0;
        this.loadUsers();
      });

    // Sort changes
    this.filterForm.get('sortBy')?.valueChanges.subscribe((value) => {
      this.sortBy = value || '';
      this.currentPage = 0;

      // Enable/disable sortOrder based on sortBy value
      const sortOrderControl = this.filterForm.get('sortOrder');
      if (value) {
        sortOrderControl?.enable();
      } else {
        sortOrderControl?.disable();
      }

      this.loadUsers();
    });

    this.filterForm.get('sortOrder')?.valueChanges.subscribe((value) => {
      this.sortOrder = value || 'asc';
      this.currentPage = 0;
      this.loadUsers();
    });
  }

  loadUsers() {
    this.loading = true;
    this.error = null;
    this.updateActiveFilters();

    const skip = this.currentPage * this.pageSize;

    // Determine which service method to use based on current filters
    if (this.searchTerm.trim()) {
      // Search takes priority
      this.userService.searchUsers(this.searchTerm.trim()).subscribe({
        next: (users: DummyJSONUser[]) => {
          this.users = users.slice(skip, skip + this.pageSize);
          this.totalUsers = users.length;
          this.loading = false;
        },
        error: (err: any) => {
          this.handleLoadError(err);
        },
      });
    } else if (this.sortBy) {
      // Apply sorting
      this.userService.getUsersSorted(this.sortBy, this.sortOrder).subscribe({
        next: (users: DummyJSONUser[]) => {
          this.users = users.slice(skip, skip + this.pageSize);
          this.totalUsers = users.length;
          this.loading = false;
        },
        error: (err: any) => {
          this.handleLoadError(err);
        },
      });
    } else {
      // Default pagination
      this.userService.getUsersPaginated(this.pageSize, skip).subscribe({
        next: (response: DummyJSONUsersResponse) => {
          this.users = response.users;
          this.totalUsers = response.total;
          this.loading = false;
        },
        error: (err: any) => {
          this.handleLoadError(err);
        },
      });
    }
  }

  private handleLoadError(err: any) {
    this.error = 'Failed to load users';
    this.loading = false;
    this.snackBar.open('Failed to load users', 'Close', { duration: 3000 });
    console.error('Error loading users:', err);
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  clearFilters() {
    this.filterForm.reset({
      search: '',
      sortBy: '',
      sortOrder: 'asc',
    });
    this.searchTerm = '';
    this.sortBy = '';
    this.sortOrder = 'asc';
    this.currentPage = 0;
    this.loadUsers();
  }

  updateActiveFilters() {
    this.activeFilters = [];

    if (this.searchTerm.trim()) {
      this.activeFilters.push(`Search: "${this.searchTerm}"`);
    }

    if (this.sortBy) {
      const sortLabel =
        this.sortOptions.find((opt) => opt.value === this.sortBy)?.label ||
        this.sortBy;
      this.activeFilters.push(
        `Sort: ${sortLabel} (${this.sortOrder.toUpperCase()})`
      );
    }
  }

  deleteUser(id: number) {
    const dialogData: ConfirmationDialogData = {
      title: 'Delete User',
      message:
        'Are you sure you want to delete this user? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '450px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: dialogData,
      disableClose: false,
      autoFocus: false,
      restoreFocus: true,
      panelClass: 'confirmation-dialog-panel',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.userService.deleteUser(id).subscribe({
          next: () => {
            this.users = this.users.filter((user) => user.id !== id);
            this.totalUsers = Math.max(0, this.totalUsers - 1);
            this.snackBar.open('User deleted successfully', 'Close', {
              duration: 3000,
            });

            // Reload if current page becomes empty
            if (this.users.length === 0 && this.currentPage > 0) {
              this.currentPage = Math.max(0, this.currentPage - 1);
              this.loadUsers();
            }
          },
          error: (err) => {
            this.error = 'Failed to delete user';
            this.snackBar.open('Failed to delete user', 'Close', {
              duration: 3000,
            });
            console.error('Error deleting user:', err);
          },
        });
      }
    });
  }
}
