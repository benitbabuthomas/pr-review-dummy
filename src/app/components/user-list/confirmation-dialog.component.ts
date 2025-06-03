import { Component, Inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirmation-dialog">
      <h2 mat-dialog-title class="dialog-title">
        <mat-icon class="warning-icon">warning</mat-icon>
        {{ data.title }}
      </h2>

      <mat-dialog-content class="dialog-content">
        <p>{{ data.message }}</p>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-button (click)="onCancel()" class="cancel-button">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button mat-raised-button (click)="onConfirm()" class="delete-button">
          <mat-icon>delete</mat-icon>
          {{ data.confirmText || 'Delete' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .confirmation-dialog {
        min-width: 380px;
        max-width: 450px;
        width: 100%;
        padding: 20px;
        display: flex;
        flex-direction: column;
      }

      .dialog-title {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0 0 16px 0;
        padding: 0;
        color: #333;
        font-weight: 500;
        font-size: 1.25rem;
        line-height: 1.4;
      }

      .warning-icon {
        color: #ff9800;
        font-size: 24px;
        width: 24px;
        height: 24px;
        flex-shrink: 0;
      }

      .dialog-content {
        margin: 0;
        padding: 0 0 20px 0;
      }

      .dialog-content p {
        margin: 0;
        color: #666;
        font-size: 15px;
        line-height: 1.6;
        word-wrap: break-word;
        white-space: normal;
      }

      .dialog-actions {
        margin: 0;
        padding: 0;
        gap: 16px;
        display: flex;
        justify-content: flex-end;
        align-items: center;
      }

      .cancel-button {
        color: #666;
        font-weight: 500;
        min-width: 90px;
        height: 40px;
        margin-right: 8px;
      }

      .cancel-button:hover {
        background-color: rgba(0, 0, 0, 0.04);
      }

      .delete-button {
        background-color: #f44336;
        color: white;
        font-weight: 500;
        min-width: 110px;
        height: 40px;
        box-shadow: 0 2px 4px rgba(244, 67, 54, 0.3);
      }

      .delete-button:hover {
        background-color: #d32f2f;
        box-shadow: 0 4px 8px rgba(244, 67, 54, 0.4);
      }

      .delete-button mat-icon {
        margin-right: 6px;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      /* Mobile responsive */
      @media (max-width: 599px) {
        .confirmation-dialog {
          min-width: 300px;
          max-width: calc(100vw - 32px);
          padding: 16px;
        }

        .dialog-title {
          font-size: 1.125rem;
          margin-bottom: 12px;
        }

        .dialog-content {
          padding-bottom: 16px;
        }

        .dialog-actions {
          flex-direction: column-reverse;
          gap: 12px;
        }

        .cancel-button,
        .delete-button {
          width: 100%;
          margin: 0;
          height: 44px;
        }
      }

      /* Tablet responsive */
      @media (max-width: 768px) and (min-width: 600px) {
        .confirmation-dialog {
          padding: 18px;
        }
      }
    `,
  ],
})
export class ConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
