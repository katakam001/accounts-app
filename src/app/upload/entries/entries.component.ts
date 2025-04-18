import { CommonModule } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FinancialYearService } from '../../services/financial-year.service';
import { PdfService } from '../../services/pdf.service';
import { StorageService } from '../../services/storage.service';
import saveAs from 'file-saver';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-entries',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatCheckboxModule
  ],
  templateUrl: './entries.component.html',
  styleUrls: ['./entries.component.css'],
})
export class EntriesComponent {
  selectedFile: File | null = null;
  uploadSuccess: boolean | null = null; // To determine upload status
  uploadMessage: string | null = null; // To show messages to the user
  isUploading: boolean = false; // To track the upload process
  financialYear: string;
  userId: number;
  validationMessage: string | null = null; // To display validation messages
  validationSuccess: boolean = false; // Flag for validation success
  userOverride: boolean = false; // Flag for override option

  constructor(
    private storageService: StorageService,
    private financialYearService: FinancialYearService,
    private pdfService: PdfService
  ) {}

  ngOnInit(): void {
    this.userId = this.storageService.getUser().id;
    this.getFinancialYear();
  }

  // Handle File Selection
  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  // Validate File
  validateFile(): void {
    if (this.selectedFile) {
      this.validationMessage = 'Validating file, please wait...';

      // Call the backend to validate the file and return the Excel file directly
      this.pdfService.validateExcelFile(this.selectedFile, this.userId, this.financialYear).subscribe(
        (response: Blob) => {
          // Use FileSaver to trigger a download of the received file
          saveAs(response, `missing_accounts_${this.userId}_${this.financialYear}.xlsx`);
          this.validationMessage =
            'Validation failed! The missing accounts list has been downloaded. Please add accounts or enable override to upload.';
          this.validationSuccess = false; // Validation failed; user needs to re-upload or override
        },
        (error) => {
          // Handle validation errors
          console.error('Error during file validation:', error);
          this.validationMessage = 'Error during validation: ' + error.message;
          this.validationSuccess = false;
        }
      );
    }
  }

  // Handle File Upload
  uploadFile(): void {
    if (this.selectedFile) {
      this.isUploading = true;
      this.uploadMessage = null;

      this.pdfService.uploadExcelFile(this.selectedFile, this.userId, this.financialYear).subscribe(
        (event) => {
          // Handle upload progress
          if (event.type === HttpEventType.UploadProgress && event.total) {
            const progress = Math.round((100 * event.loaded) / event.total);
            this.uploadMessage = `Uploading: ${progress}%`;
          } else if (event.type === HttpEventType.Response) {
            // Handle successful response
            this.isUploading = false;
            this.uploadSuccess = true;
            this.uploadMessage = 'File uploaded successfully!';
          }
        },
        (error) => {
          // Handle error response
          this.isUploading = false;
          this.uploadSuccess = false;
          this.uploadMessage = 'Error uploading file: ' + error.message;
          console.error('Error uploading file:', error);
        }
      );
    }
  }

  getFinancialYear() {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
    }
  }
}
