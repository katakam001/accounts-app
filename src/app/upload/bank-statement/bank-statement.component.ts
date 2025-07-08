import { Component } from '@angular/core';
import { UploadService } from '../../services/upload.service';
import { HttpEventType } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FinancialYearService } from '../../services/financial-year.service';
import { StorageService } from '../../services/storage.service';
import { Account } from '../../models/account.interface';
import { AccountService } from '../../services/account.service';

@Component({
  selector: 'app-bank-statement',
  imports: [CommonModule, FormsModule, MatSelectModule, MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatFormFieldModule, MatIconModule],
  templateUrl: './bank-statement.component.html',
  styleUrls: ['./bank-statement.component.css']
})
export class BankStatementComponent {
  selectedFile: File | null = null;
  uploadSuccess: boolean | null = null; // To determine upload status
  uploadMessage: string | null = null; // To show messages to the user
  isUploading: boolean = false; // To track the upload process
  financialYear: string;
  userId: number;
  bankAccounts: Account[] = []; // Add fields array

  // Dropdown Data
  selectedStatementType: string = 'bank';
  selectedBankName: string = '';
  selectedAccountName: string = '';

  bankNames: string[] = [];
  accountNames: Account[] = [];

  banks: string[] = ['UNION BANK OF INDIA', 'CANARA BANK', 'ICICI BANK', 'INDIAN BANK', 'SBI', 'CITY UNION BANK'];
  creditCards: string[] = ['Credit Card X', 'Credit Card Y', 'Credit Card Z'];
  creditCardAccounts: Account[] = [];

  constructor(private uploadService: UploadService,
    private storageService: StorageService,
    private accountService: AccountService,
    private financialYearService: FinancialYearService,
  ) { }

  ngOnInit(): void {
    this.userId = this.storageService.getUser().id;
    this.getFinancialYear();
  }

  // Handle File Selection
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedFile = file;
    } else {
      this.selectedFile = null;
      alert('Please select a valid PDF file.');
    }
  }

  uploadFile(): void {
    if (!this.selectedFile) {
      console.error('No file selected.');
      this.uploadMessage = 'Please select a file before uploading.';
      return;
    }

    this.isUploading = true;
    this.uploadMessage = null;

    const metadata = {
      statementType: this.selectedStatementType,
      bankName: this.selectedBankName,
      accountId: this.selectedAccountName,
      userId: this.userId.toString(),
      financialYear: this.financialYear
    };

    // Step 1: Get Presigned URL from Backend
    this.uploadService.getPresignedUrl(this.selectedFile.name, metadata).subscribe(
      (response) => {
        const presignedUrl = response?.presignedUrl; // Safe check

        if (!presignedUrl) {
          this.isUploading = false;
          this.uploadSuccess = false;
          this.uploadMessage = 'Error: Presigned URL is missing!';
          console.error('Error: Presigned URL is missing in backend response.');
          return;
        }

        // Step 2: Upload File Using Presigned URL
        this.uploadService.uploadFile(this.selectedFile!, presignedUrl)?.subscribe(
          (event) => {
            if (event.type === HttpEventType.UploadProgress && event.total) {
              const progress = Math.round((100 * event.loaded) / event.total);
              this.uploadMessage = `Uploading: ${progress}%`;
            } else if (event.type === HttpEventType.Response) {
              this.isUploading = false;
              this.uploadSuccess = true;
              this.uploadMessage = 'File uploaded successfully!';
              // Step 3: Call Start Monitoring API here
              this.uploadService.startMonitoring().subscribe(
                () => console.log('Monitoring started successfully!'),
                error => console.error('Error starting monitoring:', error)
              );
            }
          },
          (error) => {
            this.isUploading = false;
            this.uploadSuccess = false;
            this.uploadMessage = 'Error uploading file: ' + error.message;
            console.error('Error uploading file:', error);
          }
        );
      },
      (error) => {
        this.isUploading = false;
        this.uploadSuccess = false;
        this.uploadMessage = 'Error generating presigned URL: ' + error.message;
        console.error('Error fetching presigned URL:', error);
      }
    );
  }

  // Handle Dropdown Changes
  onStatementTypeChange(): void {
    if (this.selectedStatementType === 'bank') {
      this.bankNames = this.banks;
      this.accountNames = this.bankAccounts;
    } else if (this.selectedStatementType === 'creditCard') {
      this.bankNames = this.creditCards;
      this.accountNames = this.creditCardAccounts;
    } else {
      // Disable dropdowns for Trial Balance
      this.bankNames = [];
      this.accountNames = [];
    }

    // Reset selected options
    this.selectedBankName = '';
    this.selectedAccountName = '';
  }
  getFinancialYear() {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
      this.fetchAccounts();
    }
  }
  fetchAccounts(): void {
    this.accountService.getAccountsByUserIdAndFinancialYear(this.userId, this.financialYear, ['Bank Account']).subscribe((accounts: Account[]) => {
      this.bankAccounts = accounts;
      this.onStatementTypeChange();
    });
  }
}
