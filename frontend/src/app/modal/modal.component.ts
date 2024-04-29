import { Component, EventEmitter, Inject, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface ModalVars {
  title: string,
  message: string,
  cancel?: string,
  accept?: string,
}

@Component({
  selector: 'app-modal',
  standalone: true,
  templateUrl: 'modal.component.html',
  imports: [MatDialogModule, MatButtonModule],
})
export class ModalModule {
  constructor(
    public dialogRef: MatDialogRef<ModalModule>,
    @Inject(MAT_DIALOG_DATA) public data: ModalVars) { }

  static async open(dialog: MatDialog, title: string, message: string): Promise<boolean> {
    const dialogRef = dialog.open(ModalModule, {
      width: '250px',
      data: { title, message }
    });

    return new Promise((resolve) => {
      dialogRef.afterClosed().subscribe(ok => {
        resolve(ok);
      });
    });
  }
}
