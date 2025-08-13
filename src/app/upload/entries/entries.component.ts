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
import { CategoryUnitService } from '../../services/category-unit.service';
import { CategoryService } from '../../services/category.service';
import { ItemsService } from '../../services/items.service';
import { GroupMappingService } from '../../services/group-mapping.service';
import { GroupNode } from '../../models/group-node.interface';
import { FieldMappingService } from '../../services/field-mapping.service';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

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
    MatCheckboxModule,
    MatButtonToggleModule
  ],
  templateUrl: './entries.component.html',
  styleUrls: ['./entries.component.css'],
})
export class EntriesComponent {
  accounts: Account[] = [];
  categoryAccount: Account[] = [];
  categories: any[] = [];
  fieldMapping: { [key: number]: any[] } = {};
  financialYear: string;
  groupMapping: any[] = []; // Add fields array
  items: any[] = []; // Add items array
  isUploading: boolean = false; // To track the upload process
  selectedFile: File | null = null;
  selectedInvoiceType: string | null = null;
  selectedTaxType: 'cgst' | 'igst' = 'cgst'; // default selection
  taxAccountMap: Map<number, string> = new Map();
  unitsMap: { [key: number]: any[] } = {}; // Store units for each categoryId
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
    hardStopErrors: [
      // Header & Sequence Issues
      "Invalid Headers",
      "Missing sNo",
      "Duplicate sNo",
      "Invalid Date Format",
      "Invalid sNo Sequence",

      // GST Mismatches (CGST/SGST)
      "Mismatch in total GST",
      "Mismatch in gst5",
      "Mismatch in gst12",
      "Mismatch in gst18",
      "Mismatch in gst28",

      // IGST Mismatches
      "Mismatch in total IGST",
      "Mismatch in igst5",
      "Mismatch in igst12",
      "Mismatch in igst18",
      "Mismatch in igst28",

      // Invoice Type & Entity Mapping
      "Invalid Invoice Type",
      "Missing Item",
      "Missing Purchase Account",
      "Missing Sale Account",
      "Missing Category",

      // Category Configuration
      "Missing Unit",
      "Missing Dynamic Field",
      "Missing Tax Field",
      "Invalid 0% Tax Fields",
      "Invalid 0% Fields"
    ]
  };

  constructor(
    private accountService: AccountService,
    private categoryService: CategoryService,
    private categoryUnitService: CategoryUnitService,
    private fieldMappingService: FieldMappingService,
    private financialYearService: FinancialYearService,
    private groupMappingService: GroupMappingService, // Inject FieldMappingService
    private itemsService: ItemsService, // Inject ItemService
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

  downloadTemplate(): void {
    if (!this.selectedInvoiceType || !this.selectedTaxType) {
      alert('Please select both invoice type and tax type before downloading a template.');
      return;
    }

    const headers = this.getTemplateHeaders();
    const sampleRow = this.getSampleRow();

    const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });

    // ✅ Include tax type in filename for clarity
    const fileName = `${this.selectedInvoiceType}_${this.selectedTaxType}_invoice_template.csv`;
    saveAs(blob, fileName);
  }

  getSampleRow(): string[] {
    if (this.selectedTaxType === 'cgst') {
      return this.selectedInvoiceType === 'purchase'
        ? ['purchase', '1', 'SR00001', '01-04-2024', 'RAMA STORES', '37ADEFS1234J1ZH', 'FERTIZER', '0', '32304.76', '1615.24', '0', '0', '0', '0', '0', '0', '807.62', '807.62', '1615.24', '33920']
        : ['sale', '1', 'SR00001', '01-04-2024', 'RAMA STORES', '37ADEFS1234J1ZH', 'FANCY ITEM', '0', '32304.76', '1615.24', '0', '0', '0', '0', '0', '0', '807.62', '807.62', '1615.24', '33920'];
    } else {
      return this.selectedInvoiceType === 'purchase'
        ? ['purchase', '1', '2473', '08-10-2024', 'STORE1', 'ABC2342423423ZA', 'FERTIZER', '82200', '0', '0', '0', '0', '0', '0', '0', '0', '0', '82200']
        : ['sale', '1', 'ABSD3534', '01-04-2024', 'STORE1', 'ABCD1324242424', 'FERTIZER', '0', '32304.76', '1615.24', '0', '0', '0', '0', '0', '0', '1615.24', '33920'];
    }
  }

  getTemplateHeaders(): string[] {
    if (this.selectedTaxType === 'cgst') {
      return [
        "type", "sNo", "invoiceNo", "entryDate", "name", "gstNo", "itemName",
        "gstValue0", "gstValue5", "gst5",
        "gstValue12", "gst12",
        "gstValue18", "gst18",
        "gstValue28", "gst28",
        "cgst", "sgst", "totGst", "netAmt"
      ];
    } else {
      return [
        "type", "sNo", "invoiceNo", "entryDate", "name", "gstNo", "itemName",
        "gstValue0", "gstValue5", "igst5",
        "gstValue12", "igst12",
        "gstValue18", "igst18",
        "gstValue28", "igst28",
        "totIgst", "netAmt"
      ];
    }
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
      this.accounts = data;
      this.validAccounts = new Set(data.map(account => account.name.toLowerCase()));
      this.fetchGroupMapping();
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
        type: this.selectedInvoiceType === 'purchase' ? '1' : this.selectedInvoiceType === 'sales' ? '2' : 'unknown',
        taxType: this.selectedTaxType,
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
  }

  validateEachRow(
    row: Record<string, any>,
    index: number,
    latestSNo: number,
    sNoSet: Set<number>,
    validationErrorsMap: Map<string, Map<string, number>>
  ): void {
    const accountName = row["name"]?.toLowerCase();
    const itemName = row["itemName"]?.trim().toUpperCase();

    const extractedData: Record<string, number> = this.selectedTaxType === 'cgst'
      ? [
        "gstValue0", "gstValue5", "gst5", "gstValue12", "gst12", "gstValue18", "gst18",
        "gstValue28", "gst28", "cgst", "sgst", "totGst"
      ].reduce((acc, key) => ({ ...acc, [key]: parseFloat(row[key] || "0") }), {})
      : [
        "gstValue0", "gstValue5", "igst5", "gstValue12", "igst12", "gstValue18", "igst18",
        "gstValue28", "igst28", "totIgst"
      ].reduce((acc, key) => ({ ...acc, [key]: parseFloat(row[key] || "0") }), {});

    const taxTolerance = 0.02;
    const expectedSNo = latestSNo;

    // ✅ Basic validations
    const validationChecks = [
      { condition: !row["sNo"] || isNaN(row["sNo"]), errorType: "Missing sNo", message: `Row ${index + 1}` },
      { condition: sNoSet.has(row["sNo"]), errorType: "Duplicate sNo", message: `sNo ${row["sNo"]}` },
      { condition: row["entryDate"] && !this.validateDateFormat(row["entryDate"]), errorType: "Invalid Date Format", message: `Row ${index + 1}: ${row["entryDate"]}` },
      { condition: Number(row["sNo"]) !== expectedSNo, errorType: "Invalid sNo Sequence", message: `Row ${index + 1}: Expected ${expectedSNo} Found ${row["sNo"]}` },
      { condition: !this.validAccounts.has(accountName), errorType: "Missing Accounts", message: `Row ${index + 1}: Account '${accountName}' not found` },
      { condition: row["type"] !== (this.selectedInvoiceType === "purchase" ? "purchase" : "sale"), errorType: "Invalid Invoice Type", message: `Row ${index + 1}: Expected '${this.selectedInvoiceType}' Found '${row["type"]}'` }
    ];
    validationChecks.forEach(({ condition, errorType, message }) => {
      if (condition) this.addValidationError(validationErrorsMap, errorType, message);
    });

    // ✅ GST field validations
    const validateTax = (gstValue: number, gstRate: number, gstFieldName: string) => {
      const calculatedGst = parseFloat((gstValue * gstRate).toFixed(2));
      const gstDifference = Math.abs(extractedData[gstFieldName] - calculatedGst).toFixed(2);
      if (parseFloat(gstDifference) > taxTolerance) {
        this.addValidationError(validationErrorsMap, `Mismatch in ${gstFieldName}`, `Row ${index + 1}: Expected ${calculatedGst} Found ${extractedData[gstFieldName]}`);
      }
    };

    const taxFieldMap = this.selectedTaxType === 'cgst'
      ? [{ value: "gstValue5", rate: 0.05, field: "gst5" },
      { value: "gstValue12", rate: 0.12, field: "gst12" },
      { value: "gstValue18", rate: 0.18, field: "gst18" },
      { value: "gstValue28", rate: 0.28, field: "gst28" }]
      : [{ value: "gstValue5", rate: 0.05, field: "igst5" },
      { value: "gstValue12", rate: 0.12, field: "igst12" },
      { value: "gstValue18", rate: 0.18, field: "igst18" },
      { value: "gstValue28", rate: 0.28, field: "igst28" }];

    taxFieldMap.forEach(({ value, rate, field }) => validateTax(extractedData[value], rate, field));

    const tolerance = 0.05;

    if (this.selectedTaxType === 'cgst') {

      const calculatedGstSum = parseFloat(
        ((extractedData["gstValue5"] * 0.05) +
          (extractedData["gstValue12"] * 0.12) +
          (extractedData["gstValue18"] * 0.18) +
          (extractedData["gstValue28"] * 0.28)).toFixed(2)
      );

      const calculatedCgstSgstSum = parseFloat((extractedData["cgst"] + extractedData["sgst"]).toFixed(2));
      const totalGst = extractedData["totGst"];

      if (Math.abs(calculatedGstSum - totalGst) > tolerance ||
        Math.abs(calculatedCgstSgstSum - totalGst) > tolerance) {
        this.addValidationError(
          validationErrorsMap,
          "Mismatch in total GST",
          `Row ${index + 1}: Expected ${calculatedGstSum} Found ${totalGst}`
        );
      }
    } else {
      const calculatedIgstSum = parseFloat(
        ((extractedData["gstValue5"] * 0.05) +
          (extractedData["gstValue12"] * 0.12) +
          (extractedData["gstValue18"] * 0.18) +
          (extractedData["gstValue28"] * 0.28)).toFixed(2)
      );

      const totalIgst = extractedData["totIgst"];

      if (Math.abs(calculatedIgstSum - totalIgst) > tolerance) {
        this.addValidationError(
          validationErrorsMap,
          "Mismatch in total IGST",
          `Row ${index + 1}: Expected ${calculatedIgstSum} Found ${totalIgst}`
        );
      }
    }

    // ✅ Tax-based validations
    const taxKeys = ["gstValue0", "gstValue5", "gstValue12", "gstValue18", "gstValue28"];
    const activeTaxes = taxKeys.filter(key => parseFloat(row[key] || "0") > 0);
    const resolvedCategoryIds: number[] = [];

    activeTaxes.forEach(taxKey => {
      const taxRate = taxKey.replace("gstValue", "");
      const expectedItem = `${itemName} ${taxRate}%`;
      const itemExists = this.items.some(item => item.name.toUpperCase() === expectedItem);
      if (!itemExists) {
        this.addValidationError(validationErrorsMap, "Missing Item", `Row ${index + 1}: Item '${expectedItem}' not found`);
      }

      // 🔹 Determine tax label for account and category naming
      const taxLabel = this.selectedTaxType === 'cgst' ? '' : ' IGST';

      // 🔹 Expected Account Name
      const expectedAccount = `${this.selectedInvoiceType === "purchase" ? "PURCHASE" : "SALE"} OF ${itemName} ${taxRate}%${taxLabel}`;
      const accountExists = this.categoryAccount.some(acc => acc.name.toUpperCase() === expectedAccount);
      if (!accountExists) {
        this.addValidationError(validationErrorsMap, `Missing ${this.selectedInvoiceType === "purchase" ? "Purchase" : "Sale"} Account`, `Row ${index + 1}: Account '${expectedAccount}' not found`);
      }

      // 🔹 Expected Category Name
      const expectedCategoryName = `${this.selectedInvoiceType === "purchase" ? "PURCHASE" : "SALE"} ${itemName} ${taxRate}%${taxLabel}`;
      const category = this.categories.find(cat => cat.name.toUpperCase() === expectedCategoryName);
      if (category) {
        resolvedCategoryIds.push(category.id);
      } else {
        this.addValidationError(validationErrorsMap, "Missing Category", `Row ${index + 1}: Category '${expectedCategoryName}' not found`);
      }
    });

    // ✅ Units and Dynamic Field validations
    resolvedCategoryIds.forEach(categoryId => {
      const category = this.categories.find(cat => cat.id === categoryId);
      const categoryName = category?.name?.toUpperCase() || "";
      const fields = this.fieldMapping[categoryId] || [];

      if (!this.unitsMap[categoryId] || this.unitsMap[categoryId].length === 0) {
        this.addValidationError(validationErrorsMap, "Missing Unit", `Row ${index + 1}: No units found for category '${categoryName}'`);
      }

      if (fields.length === 0) {
        this.addValidationError(validationErrorsMap, "Missing Dynamic Field", `Row ${index + 1}: No dynamic fields configured for category '${categoryName}'`);
        return;
      }

      const expectedTaxAccountIds = Array.from(this.taxAccountMap.keys());
      const taxRateMatch = categoryName.match(/(\d+)%/);
      const taxRate = taxRateMatch ? parseInt(taxRateMatch[1], 10) : 0;

      if (taxRate === 0) {
        const nonTaxFields = fields.filter(field => !expectedTaxAccountIds.includes(field.account_id));
        const hasInvoiceNoField = nonTaxFields.some(field => field.field_name?.toUpperCase() === "INVOICE NO.");
        if (nonTaxFields.length !== 1) {
          this.addValidationError(validationErrorsMap, "Invalid 0% Tax Fields", `Row ${index + 1}: Category '${categoryName}' should have exactly one non-tax field`);
        }
        if (!hasInvoiceNoField) {
          this.addValidationError(validationErrorsMap, "Invalid 0% Fields", `Row ${index + 1}: Category '${categoryName}' must have only one non-tax field named 'INVOICE NO.'`);
        }
      } else {
        const taxFields = fields.filter(field => expectedTaxAccountIds.includes(field.account_id));

        if (this.selectedTaxType === 'cgst') {
          const cgstField = taxFields.find(field => field.field_name?.toUpperCase().includes("CGST"));
          const sgstField = taxFields.find(field => field.field_name?.toUpperCase().includes("SGST"));

          if (!cgstField || !sgstField) {
            this.addValidationError(validationErrorsMap, "Missing Tax Field", `Row ${index + 1}: Category '${categoryName}' missing CGST or SGST field for ${taxRate}%`);
          }
        } else {
          const igstField = taxFields.find(field => field.field_name?.toUpperCase().includes("IGST"));

          if (!igstField) {
            this.addValidationError(validationErrorsMap, "Missing Tax Field", `Row ${index + 1}: Category '${categoryName}' missing IGST field for ${taxRate}%`);
          }
        }
      }
    });

    sNoSet.add(row["sNo"]);
  }

  validateFile(): void {
    if (this.selectedFile) {
      this.validationMessage = 'Validating file, please wait...';
      this.validationErrorsMap.clear();  // ✅ Clears old errors before revalidating
      const templateHeaders = this.getTemplateHeaders();
      this.validationSuccess = false;    // ✅ Reset validation state
      let configReady = false;
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
                  parser.abort();
                  return;
                }
                headersValidated = true;

                parser.pause(); // ⏸ Pause parsing until config is ready

                Promise.all([
                  this.fetchAccountWithGroup(),
                  this.fetchItems(),
                  this.fetchCategories(this.selectedInvoiceType === 'purchase' ? 1 : 2)
                ]).then(() => {
                  let configMissing = false;

                  if (!this.categoryAccount || this.categoryAccount.length === 0) {
                    this.addValidationError(validationErrorsMap, `Missing ${this.selectedInvoiceType === "purchase" ? "Purchase" : "Sale"} Account`, `No ${this.selectedInvoiceType} accounts found.`);
                    configMissing = true;
                  }

                  if (!this.items || this.items.length === 0) {
                    this.addValidationError(validationErrorsMap, 'Missing Item', 'No items found for the selected financial year.');
                    configMissing = true;
                  }

                  if (!this.categories || this.categories.length === 0) {
                    this.addValidationError(validationErrorsMap, 'Missing Category', `No category found for the ${this.selectedInvoiceType} type.`);
                    configMissing = true;
                  }

                  if (!this.unitsMap || Object.keys(this.unitsMap).length === 0) {
                    this.addValidationError(validationErrorsMap, 'Missing Unit', `No Units found for the ${this.selectedInvoiceType} type.`);
                    configMissing = true;
                  }

                  if (!this.fieldMapping || Object.keys(this.fieldMapping).length === 0) {
                    this.addValidationError(validationErrorsMap, 'Missing Dynamic Field', `No dynamic fields found for the ${this.selectedInvoiceType} type.`);
                    configMissing = true;
                  }

                  if (configMissing) {
                    this.validationMessage = 'Missing configuration data. Please ensure accounts, items, units, dynamicFields and categories are set up.';
                    validationFailed = true;
                    parser.abort(); // ✅ Now this will work
                    this.validationErrorsMap = validationErrorsMap; // ✅ Store errors for later override check
                    this.finalizeValidation();

                  } else {
                    configReady = true;
                    results.data.forEach((row, index) => {
                      latestSNo++;
                      this.validateEachRow(row, index, latestSNo, sNoSet, validationErrorsMap);
                    });
                    parser.resume(); // ✅ Resume only if config is valid
                  }
                });

                return; // Prevent premature parsing
              }
              if (configReady) {
                // If headers already validated and config already fetched
                results.data.forEach((row, index) => {
                  latestSNo++;
                  this.validateEachRow(row, index, latestSNo, sNoSet, validationErrorsMap);
                });

                parser.pause();
                setTimeout(() => parser.resume(), 100);
              }
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

  fetchAccountWithGroup(): Promise<void> {
    const groupAccountMapping: { [key: number]: string } = {
      1: 'Purchase Account',
      2: 'Sale Account'
    };

    // Get the group name based on this.data.type
    const groupName = groupAccountMapping[this.selectedInvoiceType === 'purchase' ? 1 : 2];

    return new Promise((resolve) => {
      this.accountService.getAccountsByUserIdAndFinancialYear(this.userId, this.financialYear, [groupName]).subscribe((accounts: Account[]) => {
        this.categoryAccount = accounts;
        resolve();
      });
    });
  }

  fetchItems(): Promise<void> {
    return new Promise((resolve) => {
      this.itemsService.getItemsByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((data: any[]) => {
        this.items = data;
        resolve();
      });
    });
  }

  fetchCategories(type: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.categoryService.getCategoriesByType(this.userId, this.financialYear, type).subscribe({
        next: (categories: any[]) => {
          this.categories = categories;
          const categoryIds = categories.map(cat => cat.id);

          // Fetch units and field mappings in parallel
          Promise.all([
            new Promise<void>((unitResolve, unitReject) => {
              this.categoryUnitService.getCategoryUnitsByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe({
                next: (unitData: any[]) => {
                  this.unitsMap = {};
                  unitData.forEach(unit => {
                    if (categoryIds.includes(unit.category_id)) {
                      const categoryId = unit.category_id;
                      const unitEntry = { id: unit.unit_id, name: unit.unit_name };
                      if (!this.unitsMap[categoryId]) {
                        this.unitsMap[categoryId] = [];
                      }
                      this.unitsMap[categoryId].push(unitEntry);
                    }
                  });
                  unitResolve();
                },
                error: err => unitReject(err)
              });
            }),

            new Promise<void>((fieldResolve, fieldReject) => {
              this.fieldMappingService.getFieldMappingsByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe({
                next: (fieldData: any[]) => {
                  this.fieldMapping = {};
                  fieldData.forEach(field => {
                    if (categoryIds.includes(field.category_id)) {
                      const categoryId = field.category_id;
                      if (!this.fieldMapping[categoryId]) {
                        this.fieldMapping[categoryId] = [];
                      }
                      this.fieldMapping[categoryId].push(field);
                    }
                  });
                  fieldResolve();
                },
                error: err => fieldReject(err)
              });
            })
          ]).then(() => {
            resolve(); // ✅ All data loaded
          }).catch(err => reject(err));
        },
        error: err => reject(err)
      });
    });
  }

  fetchGroupMapping(): Promise<void> {
    return new Promise((resolve) => {
      this.groupMappingService.getGroupMappingTree(this.userId, this.financialYear).subscribe(data => {
        this.groupMapping = data;
        const accountIds = this.getAccountIdsFromNodeByName('Indirect Expenses');
        this.fetchTaxAccounts(accountIds);
        resolve();
      });
    });
  }

  fetchTaxAccounts(accountIds: number[]): void {
    const filteredAccounts = this.accounts.filter(account => accountIds.includes(account.id));
    this.taxAccountMap = new Map(filteredAccounts.map(account => [account.id, account.name]));
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
