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
import { GroupMappingService } from '../../services/group-mapping.service';
import { GroupNode } from '../../models/group-node.interface';

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
  securedLoanAccounts: Account[] = []; // Add fields array
  unSecuredLoanAccounts: Account[] = []; // Add fields array
  accounts: Account[] = [];
  groupMapping: any[] = []; // Add fields array

  // Dropdown Data
  selectedStatementType: string = 'bank';
  selectedBankName: string = '';
  selectedAccountName: string = '';

  bankNames: string[] = [];
  accountNames: Account[] = [];

  banks: string[] = ['UNION BANK OF INDIA', 'CANARA BANK', 'ICICI BANK', 'INDIAN BANK', 'SBI', 'CITY UNION BANK', 'HDFC BANK', 'AXIS BANK', 'BANK OF INDIA', 'IDFC FIRST BANK'];
  creditCards: string[] = ['Credit Card X', 'Credit Card Y', 'Credit Card Z'];

  constructor(private uploadService: UploadService,
    private storageService: StorageService,
    private accountService: AccountService,
    private financialYearService: FinancialYearService,
    private groupMappingService: GroupMappingService, // Inject FieldMappingService
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
      financialYear: this.financialYear,
      fileSize: this.selectedFile.size.toString() // in bytes
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
      this.accountNames = this.securedLoanAccounts;
    } else if (this.selectedStatementType === 'creditCard') {
      this.bankNames = this.creditCards;
      this.accountNames = this.unSecuredLoanAccounts;
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
    this.accountService.getAccountsByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((accounts: Account[]) => {
      this.accounts = accounts;
      this.groupMappingService.getGroupMappingTree(this.userId, this.financialYear).subscribe(data => {
        this.groupMapping = data;
        const securedLoanAccountIds = this.getAccountIdsFromNodeByName('Secured Loans');
        const bankAccountIds = this.getAccountIdsFromNodeByName('Bank Account');

        // Merge and deduplicate
        const mergedAccountIds = Array.from(new Set([...securedLoanAccountIds, ...bankAccountIds]));

        // Filter accounts
        this.securedLoanAccounts = this.accounts.filter(account => mergedAccountIds.includes(account.id));

        const unSecuredLoanAccountIds = this.getAccountIdsFromNodeByName('Unsecured Loans');
        this.unSecuredLoanAccounts = this.accounts.filter(account => unSecuredLoanAccountIds.includes(account.id));
        this.onStatementTypeChange(); // ✅ Safe to invoke here
      });
    });
  }

  // Function to find a node by its name
  findNodeByName(node: GroupNode, name: string): GroupNode | null {
    if (node.name === name) {
      return node;
    }

    if (node.children && node.children.length) {
      for (const child of node.children) {
        const result = this.findNodeByName(child, name);
        if (result) {
          return result;
        }
      }
    }

    return null;
  }

  // Function to extract account IDs from a node and return a set of unique IDs
  extractAccountIds(node: GroupNode, result = new Set<number>()): number[] {
    if (!node.children || node.children.length === 0) {
      // This is an account node
      result.add(Number(node.id));
    } else {
      // This is a group node, traverse its children
      node.children.forEach(child => this.extractAccountIds(child, result));
    }
    // Convert the set to an array for the final output
    return Array.from(result);
  }

  getNodeByName(nodeName: string): GroupNode | null {
    for (const node of this.groupMapping) {
      const result = this.findNodeByName(node, nodeName);
      if (result) {
        return result;
      }
    }
    return null;
  }

  // Function to get account IDs from a specific node by its name
  getAccountIdsFromNodeByName(nodeName: string): number[] {
    const node = this.getNodeByName(nodeName);
    if (node) {
      return this.extractAccountIds(node);
    } else {
      console.error('Node not found');
      return [];
    }
  }

}
