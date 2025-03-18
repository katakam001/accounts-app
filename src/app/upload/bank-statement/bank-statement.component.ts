import { Component } from '@angular/core';
import { PdfService } from '../../services/pdf.service';
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
  imports: [CommonModule,FormsModule,MatSelectModule,    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatFormFieldModule,MatIconModule],
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

  banks: string[] = ['UNION BANK OF INDIA', 'Bank B', 'Bank C'];
  creditCards: string[] = ['Credit Card X', 'Credit Card Y', 'Credit Card Z'];
  // bankAccounts: string[] = ['Bank Account 1', 'Bank Account 2', 'Bank Account 3'];
  creditCardAccounts: Account[] = [];

  constructor(private pdfService: PdfService,
     private storageService: StorageService,
         private accountService: AccountService,
        private financialYearService: FinancialYearService,
  ) {}

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

  // Handle File Upload
  uploadFile(): void {
    if (this.selectedFile) {
      this.isUploading = true;
      this.uploadMessage = null;
      console.log(this.selectedStatementType);
      console.log(this.selectedBankName);
      console.log(this.selectedAccountName);


        this.pdfService.uploadPdf(this.selectedFile, this.selectedStatementType, this.selectedBankName, this.selectedAccountName,this.userId,this.financialYear).subscribe(
          (event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            const progress = Math.round((100 * event.loaded) / event.total);
            this.uploadMessage = `Uploading: ${progress}%`;
          } else if (event.type === HttpEventType.Response) {
            this.isUploading = false;
            this.uploadSuccess = true;
            this.uploadMessage = 'File uploaded successfully!';
          }
        },
        (error) => {
          this.isUploading = false;
          this.uploadSuccess = false;
          this.uploadMessage = 'Error uploading file: ' + error.message;
          console.error('Error uploading file:', error);
        }
      );
    }
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
    this.accountService.getAccountsByUserIdAndFinancialYear(this.userId, this.financialYear,['Bank Account']).subscribe((accounts: Account[]) => {
      this.bankAccounts=accounts;
      this.onStatementTypeChange();
    });
  }
}
