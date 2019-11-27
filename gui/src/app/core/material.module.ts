import { NgModule } from "@angular/core";
import { CommonModule } from '@angular/common';
import {
  MatButtonModule, MatCardModule, MatDialogModule, MatInputModule, MatTableModule,
  MatToolbarModule, MatMenuModule, MatIconModule, MatProgressSpinnerModule, MatDatepickerModule, MatNativeDateModule,
  MatCheckboxModule, MatRadioModule, MatExpansionModule, MatTabsModule, MatSnackBarModule, MatChipsModule,
  MatPaginatorModule, MatAutocompleteModule
} from '@angular/material';
@NgModule({
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatDialogModule,
    MatTableModule,
    MatMenuModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatRadioModule,
    MatExpansionModule,
    MatTabsModule,
    MatSnackBarModule,
    MatChipsModule,
    MatPaginatorModule,
    MatAutocompleteModule
  ],
  exports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatDialogModule,
    MatTableModule,
    MatMenuModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatRadioModule,
    MatExpansionModule,
    MatTabsModule,
    MatSnackBarModule,
    MatChipsModule,
    MatPaginatorModule,
    MatAutocompleteModule
  ],
})
export class CustomMaterialModule { }