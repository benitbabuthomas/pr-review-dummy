import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// DummyJSON User interface - this is our main user interface now
export interface DummyJSONUser {
  id: number;
  firstName: string;
  lastName: string;
  maidenName?: string;
  age?: number;
  gender?: string;
  email: string;
  phone: string;
  username?: string;
  password?: string;
  birthDate?: string;
  image?: string;
  bloodGroup?: string;
  height?: number;
  weight?: number;
  eyeColor?: string;
  hair?: {
    color: string;
    type: string;
  };
  ip?: string;
  address?: {
    address: string;
    city: string;
    state?: string;
    stateCode?: string;
    postalCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    country?: string;
  };
  macAddress?: string;
  university?: string;
  bank?: {
    cardExpire: string;
    cardNumber: string;
    cardType: string;
    currency: string;
    iban: string;
  };
  company?: {
    department?: string;
    name: string;
    title?: string;
    address?: {
      address: string;
      city: string;
      state?: string;
      stateCode?: string;
      postalCode: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
      country?: string;
    };
  };
  ein?: string;
  ssn?: string;
  userAgent?: string;
  crypto?: {
    coin: string;
    wallet: string;
    network: string;
  };
  role?: string;
}

// DummyJSON Users response interface
interface DummyJSONUsersResponse {
  users: DummyJSONUser[];
  total: number;
  skip: number;
  limit: number;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly baseUrl = 'https://dummyjson.com';

  constructor(private http: HttpClient) {}

  // GET all users
  getUsers(): Observable<DummyJSONUser[]> {
    return this.http.get<DummyJSONUsersResponse>(`${this.baseUrl}/users`).pipe(
      map((response) => response.users),
      catchError((error) =>
        throwError(() => new Error('Failed to fetch users'))
      )
    );
  }

  // GET user by ID
  getUserById(id: number): Observable<DummyJSONUser> {
    return this.http.get<DummyJSONUser>(`${this.baseUrl}/users/${id}`).pipe(
      catchError((error) => {
        if (error.status === 404) {
          return throwError(() => new Error('User not found'));
        }
        return throwError(() => new Error('Failed to fetch user'));
      })
    );
  }

  // POST - Create new user
  createUser(user: Omit<DummyJSONUser, 'id'>): Observable<DummyJSONUser> {
    return this.http
      .post<DummyJSONUser>(`${this.baseUrl}/users/add`, user)
      .pipe(
        catchError((error) =>
          throwError(() => new Error('Failed to create user'))
        )
      );
  }

  // PUT - Update user
  updateUser(
    id: number,
    user: Partial<DummyJSONUser>
  ): Observable<DummyJSONUser> {
    return this.http
      .put<DummyJSONUser>(`${this.baseUrl}/users/${id}`, user)
      .pipe(
        catchError((error) => {
          if (error.status === 404) {
            return throwError(() => new Error('User not found'));
          }
          return throwError(() => new Error('Failed to update user'));
        })
      );
  }

  // DELETE user
  deleteUser(id: number): Observable<boolean> {
    return this.http
      .delete<DummyJSONUser & { isDeleted: boolean }>(
        `${this.baseUrl}/users/${id}`
      )
      .pipe(
        map((response) => response.isDeleted || true),
        catchError((error) => {
          if (error.status === 404) {
            return throwError(() => new Error('User not found'));
          }
          return throwError(() => new Error('Failed to delete user'));
        })
      );
  }

  // Additional DummyJSON-specific methods

  // Search users
  searchUsers(query: string): Observable<DummyJSONUser[]> {
    return this.http
      .get<DummyJSONUsersResponse>(
        `${this.baseUrl}/users/search?q=${encodeURIComponent(query)}`
      )
      .pipe(
        map((response) => response.users),
        catchError((error) =>
          throwError(() => new Error('Failed to search users'))
        )
      );
  }

  // Get users with pagination
  getUsersPaginated(
    limit: number = 30,
    skip: number = 0
  ): Observable<DummyJSONUsersResponse> {
    return this.http
      .get<DummyJSONUsersResponse>(
        `${this.baseUrl}/users?limit=${limit}&skip=${skip}`
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error('Failed to fetch users'))
        )
      );
  }

  // Filter users by key-value
  filterUsers(key: string, value: string): Observable<DummyJSONUser[]> {
    return this.http
      .get<DummyJSONUsersResponse>(
        `${this.baseUrl}/users/filter?key=${key}&value=${encodeURIComponent(
          value
        )}`
      )
      .pipe(
        map((response) => response.users),
        catchError((error) =>
          throwError(() => new Error('Failed to filter users'))
        )
      );
  }

  // Sort users
  getUsersSorted(
    sortBy: string,
    order: 'asc' | 'desc' = 'asc'
  ): Observable<DummyJSONUser[]> {
    return this.http
      .get<DummyJSONUsersResponse>(
        `${this.baseUrl}/users?sortBy=${sortBy}&order=${order}`
      )
      .pipe(
        map((response) => response.users),
        catchError((error) =>
          throwError(() => new Error('Failed to fetch sorted users'))
        )
      );
  }
}
