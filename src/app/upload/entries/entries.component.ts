import { CommonModule } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FinancialYearService } from '../../services/financial-year.service';
import { UploadService } from '../../services/upload.service';
import { StorageService } from '../../services/storage.service';
import saveAs from 'file-saver';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AccountService } from '../../services/account.service';
import { Account } from '../../models/account.interface';
import { parse, ParseResult, Parser } from 'papaparse';
import { SequenceNumberService } from '../../services/sequence-number.service';

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
  financialYear: string;
  isUploading: boolean = false; // To track the upload process
  selectedFile: File | null = null;
  selectedInvoiceType: string | null = null;
  uploadMessage: string | null = null; // To show messages to the user
  uploadSuccess: boolean | null = null; // To determine upload status
  userId: number;
  userOverride: boolean = false; // Flag for override option
  validationMessage: string | null = null; // To display validation messages
  validationSuccess: boolean = false; // Flag for validation success
  validAccounts: Set<string> = new Set(); //  Cache valid accounts
  validationErrorsMap = new Map<string, Map<string, number>>(); // ✅ Store validation issues
  validationConfig = {
    allowOverrides: ["Missing Accounts"], // ✅ Errors user can override
    hardStopErrors: ["Invalid Headers", "Missing sNo", "Duplicate sNo", "Invalid Date Format", "Invalid sNo Sequence", "Mismatch in total GST", "Mismatch in gst5", "Mismatch in gst12", "Mismatch in gst18", "Mismatch in gst28", "Invalid Invoice Type"] // ❌ Must be fixed before upload
  };

  constructor(
    private accountService: AccountService,
    private financialYearService: FinancialYearService,
    private uploadService: UploadService,
    private sequenceNumberService: SequenceNumberService,
    private storageService: StorageService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  addValidationError(validationErrorsMap: Map<string, Map<string, number>>, type: string, key: string): void {
    if (!validationErrorsMap.has(type)) {
      validationErrorsMap.set(type, new Map());
    }
    const errorMap = validationErrorsMap.get(type)!;
    errorMap.set(key, (errorMap.get(key) || 0) + 1);
  }

  canUpload(): boolean {
    if (!this.selectedFile) return false; // ✅ No file selected
    if (this.isUploading) return false; // ✅ Prevent uploading during an ongoing process

    const validationTypes = Array.from(this.validationErrorsMap.keys());
    const hasHardStopErrors = validationTypes.some(error => this.validationConfig.hardStopErrors.includes(error));
    const onlyAllowOverrides = validationTypes.every(error => this.validationConfig.allowOverrides.includes(error));

    return !hasHardStopErrors && (this.validationSuccess || (this.userOverride && onlyAllowOverrides));
  }

  downloadTemplate() {
    if (!this.selectedInvoiceType) {
      alert('Please select an invoice type before downloading a template.');
      return;
    }
    const headers = this.getTemplateHeaders();
    const sampleRow = this.getSampleRow();

    // Construct CSV content dynamically
    const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });

    // ✅ Using file-saver for download instead of manual anchor element
    saveAs(blob, `${this.selectedInvoiceType}_invoice_template.csv`);
  }

  getSampleRow(): string[] {
    return this.selectedInvoiceType === 'purchase'
      ? ['purchase', '1', 'SR00001', '01-04-2024', 'RAMA STORES', '37ADEFS1234J1ZH', '0', '32304.76', '1615.24', '0', '0', '0', '0', '0', '0', '807.62', '807.62', '1615.24', '33920']
      : ['sale', '1', 'SR00001', '01-04-2024', 'RAMA STORES', '37ADEFS1234J1ZH', '0', '32304.76', '1615.24', '0', '0', '0', '0', '0', '0', '807.62', '807.62', '1615.24', '33920'];
  }

  getTemplateHeaders(): string[] {
    return ['type', 'sNo', 'invoiceNo', 'entryDate', 'name', 'gstNo', 'gstValue0', 'gstValue5', 'gst5', 'gstValue12', 'gst12', 'gstValue18', 'gst18', 'gstValue28', 'gst28', 'cgst', 'sgst', 'totGst', 'netAmt'];
  }

  generateValidationReportCSV(): void {
    let csvContent = "Validation Type,Error Detail,Entries Count\n";

    this.validationErrorsMap.forEach((errorMap, type) => {
      errorMap.forEach((count, key) => {
        csvContent += `${type},${key},${count}\n`;
      });
    });

    const blob = new Blob([csvContent], { type: "text/csv" });
    saveAs(blob, "validation_report.csv");
  }


  getFinancialYear() {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
      this.fetchAccounts(this.userId, this.financialYear);
    }
  }

  fetchAccounts(userId: number, financialYear: string): void {
    this.accountService.getAccountsByUserIdAndFinancialYear(userId, financialYear).subscribe((data: Account[]) => {
      this.validAccounts = new Set(data.map(account => account.name.toLowerCase()));
    });
  }

  finalizeValidation() {
    if (this.validationErrorsMap.size > 0) {
      this.validationMessage = 'Validation completed with errors. Please review and override if needed.';
      this.validationSuccess = false; // Validation failed; user needs to re-upload or override
      this.generateValidationReportCSV();
    } else {
      this.validationMessage = 'Validation successful! All accounts are valid and ready for upload.';
      this.validationSuccess = true; // Validation success
    }
  }

  // Handle File Selection
  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  ngOnInit(): void {
    this.userId = this.storageService.getUser().id;
    this.getFinancialYear();
  }

  // Handle File Upload
  uploadFile(): void {
    if (this.selectedFile) {
      this.isUploading = true;
      this.uploadMessage = null;

      const metadata = {
        userId: this.userId.toString(),
        financialYear: this.financialYear,
        type: this.selectedInvoiceType === 'purchase' ? '1' : this.selectedInvoiceType === 'sales' ? '2' : 'unknown'
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
  }

  validateEachRow(row: Record<string, any>, index: number, latestSNo: number, sNoSet: Set<number>, validationErrorsMap: Map<string, Map<string, number>>): void {
    const accountName = row["name"].toLowerCase();

    // ✅ Extract GST-related data
    const extractedData: Record<string, number> = [
      "gstValue5", "gst5", "gstValue12", "gst12", "gstValue18", "gst18",
      "gstValue28", "gst28", "cgst", "sgst", "totGst"
    ].reduce((acc, key) => ({ ...acc, [key]: parseFloat(row[key] || "0") }), {});

    const taxTolerance = 0.02;
    let expectedSNo = latestSNo; // ✅ Fix first-row logic


    // ✅ Common validation checks
    const validationChecks = [
      { condition: !row["sNo"] || isNaN(row["sNo"]), errorType: "Missing sNo", message: `Row ${index + 1}` },
      { condition: sNoSet.has(row["sNo"]), errorType: "Duplicate sNo", message: `sNo ${row["sNo"]}` },
      { condition: row["entryDate"] && !this.validateDateFormat(row["entryDate"]), errorType: "Invalid Date Format", message: `Row ${index + 1}: ${row["entryDate"]}` },
      { condition: Number(row["sNo"]) !== expectedSNo, errorType: "Invalid sNo Sequence", message: `Row ${index + 1}: Expected ${expectedSNo} Found ${row["sNo"]}` },
      { condition: !this.validAccounts.has(accountName), errorType: "Missing Accounts", message: `Row ${index + 1}: Account '${accountName}' not found` },
      { condition: row["type"] !== (this.selectedInvoiceType === "purchase" ? "purchase" : "sale"), errorType: "Invalid Invoice Type", message: `Row ${index + 1}: Expected '${this.selectedInvoiceType === "purchase" ? "purchase" : "sale"}' Found '${row["type"]}'` }
    ];

    validationChecks.forEach(({ condition, errorType, message }) => {
      if (condition) this.addValidationError(validationErrorsMap, errorType, message);
    });

    // ✅ Function to validate GST calculations
    const validateGST = (gstValue: number, gstRate: number, gstFieldName: string) => {
      const calculatedGst = parseFloat((gstValue * gstRate).toFixed(2));
      const gstDifference = Math.abs(extractedData[gstFieldName] - calculatedGst).toFixed(2);

      if (parseFloat(gstDifference) > taxTolerance) {
        this.addValidationError(validationErrorsMap, `Mismatch in ${gstFieldName}`, `Row ${index + 1}: Expected ${calculatedGst} Found ${extractedData[gstFieldName]}`);
      }
    };

    // ✅ Apply GST validations dynamically
    [{ value: "gstValue5", rate: 0.05, field: "gst5" },
    { value: "gstValue12", rate: 0.12, field: "gst12" },
    { value: "gstValue18", rate: 0.18, field: "gst18" },
    { value: "gstValue28", rate: 0.28, field: "gst28" }]
      .forEach(({ value, rate, field }) => validateGST(extractedData[value], rate, field));

    // ✅ GST Summation Validation
    const calculatedGstSum = parseFloat(
      ((extractedData["gstValue5"] * 0.05) +
        (extractedData["gstValue12"] * 0.12) +
        (extractedData["gstValue18"] * 0.18) +
        (extractedData["gstValue28"] * 0.28)).toFixed(2)
    );

    const calculatedCgstSgstSum = parseFloat((extractedData["cgst"] + extractedData["sgst"]).toFixed(2));
    const tolerance = 0.05;

    if (Math.abs(calculatedGstSum - extractedData["totGst"]) > tolerance ||
      Math.abs(calculatedCgstSgstSum - extractedData["totGst"]) > tolerance) {
      this.addValidationError(validationErrorsMap, "Mismatch in total GST", `Row ${index + 1}: Expected ${calculatedGstSum} Found ${extractedData["totGst"]}`);
    }

    sNoSet.add(row["sNo"]); // ✅ Track unique entries
  }

  validateFile(): void {
    if (this.selectedFile) {

      this.validationMessage = 'Validating file, please wait...';
      this.validationErrorsMap.clear();  // ✅ Clears old errors before revalidating
      const templateHeaders = this.getTemplateHeaders();
      this.validationSuccess = false;    // ✅ Reset validation state
      let headersValidated = false;
      let validationFailed = false;
      let latestSNo: number = 0; // ✅ Start from `0`, avoiding null
      const sNoSet = new Set<number>(); //  Track duplicates
      const validationErrorsMap = new Map<string, Map<string, number>>(); //  Store validation issues

      //  Invoke `getInvoicesNo()` from `SequenceNumberService`
      this.sequenceNumberService.getInvoicesNo(this.userId, this.financialYear, this.selectedInvoiceType === 'purchase' ? 1 : 2).subscribe(
        response => {
          latestSNo = response?.last_sNo;
          console.log(`Fetched latest sNo: ${latestSNo}`);

          // 🔹 Ensure `this.selectedFile` is **not null** before calling `parse()`
          if (!this.selectedFile) {
            console.error("File missing before parsing. Validation aborted.");
            return;
          }
console.log(this.selectedFile);
          parse(this.selectedFile, {
            header: true,
            skipEmptyLines: true,
            chunk: (results: ParseResult<Record<string, any>>, parser: Parser) => {
              if (!headersValidated) {
                const fileHeaders = results.meta.fields;
                if (!fileHeaders || !this.validateHeaders(fileHeaders, templateHeaders)) {
                  this.validationSuccess = false;
                  this.validationMessage = `Invalid ${this.selectedInvoiceType} template format. Please use the provided template.`;
                  this.addValidationError(validationErrorsMap, "Invalid Headers", "Template headers do not match expected format.");
                  this.downloadTemplate();
                  validationFailed = true;
                  parser.abort(); //  Stop further parsing
                  return;
                }
                headersValidated = true;
              }

              console.log(`Processing chunk: ${results.data.length} rows`);

              results.data.forEach((row, index) => {
                latestSNo = latestSNo + 1;
                this.validateEachRow(row, index, latestSNo, sNoSet, validationErrorsMap);
              });

              parser.pause();
              setTimeout(() => parser.resume(), 100);
            },
            complete: () => {
              this.validationErrorsMap = validationErrorsMap; // ✅ Store errors for later override check
              if (!validationFailed) { // ✅ Prevent finalization if validation failed
                this.finalizeValidation();
              }
            },
          });
        },
        error => {
          console.error(`Error fetching latest sNo: ${error}`);
          this.validationMessage = 'Error fetching latest sNo. Please try again.';
        }
      );
    }
  }

  validateDateFormat(entryDate: string): boolean {
    const datePattern = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/; // ✅ Strict DD-MM-YYYY format
    if (!datePattern.test(entryDate)) return false; // ✅ Format check

    // ✅ Validate if the date exists
    const [day, month, year] = entryDate.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day);

    return parsedDate.getDate() === day && parsedDate.getMonth() === month - 1 && parsedDate.getFullYear() === year;
  }

  validateHeaders(fileHeaders: string[], expectedHeaders: string[]): boolean {
    return JSON.stringify(fileHeaders) === JSON.stringify(expectedHeaders);
  }

}
