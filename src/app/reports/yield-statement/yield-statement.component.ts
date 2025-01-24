import { Component, OnInit } from '@angular/core';
import { YieldService } from '../../services/yield.service';
import { ConsolidatedStockService } from '../../services/consolidated-stock.service';
import { FinancialYearService } from '../../services/financial-year.service';
import { StorageService } from '../../services/storage.service';
import { CommonModule, DatePipe } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import * as ExcelJS from 'exceljs'
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-yield-statement',
  standalone: true,
  imports: [
    CommonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCardModule,
    MatIconModule,
    FormsModule // Add FormsModule to imports
  ],
  templateUrl: './yield-statement.component.html',
  styleUrls: ['./yield-statement.component.css']
})
export class YieldStatementComponent implements OnInit {
  yields: any[] = [];
  selectedYield: any;
  consolidatedStockDetails: any = {};
  userId: number;
  financialYear: string;
  reportLoaded: boolean = false; // Add this property

  constructor(
    private yieldService: YieldService,
    private consolidatedStockService: ConsolidatedStockService,
    private financialYearService: FinancialYearService,
    private storageService: StorageService
  ) { }

  ngOnInit(): void {
    this.userId = this.storageService.getUser().id;
    this.getFinancialYear();
    this.loadYields();
  }

  getFinancialYear() {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
    }
  }

  loadYields(): void {
    this.yieldService.getYieldsByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((data: any[]) => {
      this.yields = data;
    });
  }

  getLatestReport(): void {
    if (this.selectedYield) {
      const itemIds = [this.selectedYield.rawItem.item_id, ...this.selectedYield.processedItems.map((item: any) => item.item_id)];
      this.consolidatedStockService.getConsolidatedStockDetails(itemIds, this.userId, this.financialYear).subscribe((details: any) => {
        this.consolidatedStockDetails = details;
        this.reportLoaded = true; // Set reportLoaded to true once the report is fetched
      });
    }
  }

  calculateTotal(itemId: number): number {
    const details = this.consolidatedStockDetails[itemId];
    if (details) {
      return Number(details.total_purchase || 0) + Number(details.total_sale_return || 0);
    }
    return 0;
  }

  calculateTotalFields(itemId: number): number {
    const totalSales = Math.abs(Number(this.consolidatedStockDetails[itemId]?.total_sales || 0));
    const totalPurchaseReturn = Math.abs(Number(this.consolidatedStockDetails[itemId]?.total_purchase_return || 0));
    const totalClosingStock = Math.abs(Number(this.consolidatedStockDetails[itemId]?.total_closing_balance || 0));

    return totalSales + totalPurchaseReturn + totalClosingStock;
  }

  calculateTotalPercentage(rawItemId: number): string {
    let totalPercentage = 0;
    for (let processedItem of this.selectedYield.processedItems) {
      totalPercentage += parseFloat(this.calculatePercentage(processedItem.item_id, rawItemId));
    }
    return totalPercentage.toFixed(2);
  }

  calculatePercentage(processedItemId: number, rawItemId: number): string {
    const receivedFromProcess = Number(this.consolidatedStockDetails[processedItemId]?.total_received_from_process || 0);
    const dispatchToProcess = Number(this.consolidatedStockDetails[rawItemId]?.total_dispatch_to_process || 0);

    if (dispatchToProcess === 0) {
      return (0).toFixed(2); // To avoid division by zero
    }

    return ((receivedFromProcess / dispatchToProcess) * 100).toFixed(2);
  }

  calculateShortage(rawItemId: number): string {
    const totalDispatched = parseFloat(this.consolidatedStockDetails[rawItemId]?.total_dispatch_to_process || '0');
    let totalReceived = 0;

    for (let processedItem of this.selectedYield.processedItems) {
      totalReceived += parseFloat(this.consolidatedStockDetails[processedItem.item_id]?.total_received_from_process || '0');
    }

    const shortage = totalDispatched - totalReceived;
    return shortage.toFixed(2); // Return as string with two decimal places
  }

  calculateShortagePercentage(rawItemId: number): string {
    const totalDispatched = parseFloat(this.consolidatedStockDetails[rawItemId]?.total_dispatch_to_process || '0');
    const shortage = parseFloat(this.calculateShortage(rawItemId));

    if (totalDispatched === 0) {
      return '0.00'; // To avoid division by zero
    }

    return ((shortage / totalDispatched) * 100).toFixed(2); // Return as string with two decimal places
  }

  calculateReceivedTotal(rawItemId: number): string {
    let totalReceived = 0;

    for (let processedItem of this.selectedYield.processedItems) {
      totalReceived += parseFloat(this.consolidatedStockDetails[processedItem.item_id]?.total_received_from_process || '0');
    }
    console.log(totalReceived);
    return totalReceived.toFixed(2); // Return as string with two decimal places
  }

  getTotal(rawItemId: number): string {
    return (parseFloat(this.calculateReceivedTotal(rawItemId)) + parseFloat(this.calculateShortage(rawItemId))).toFixed(2);
  }

  getTotalPercentage(rawItemId: number): string {
    return (parseFloat(this.calculateTotalPercentage(rawItemId)) + parseFloat(this.calculateShortagePercentage(rawItemId))).toFixed(2);
  }

  exportToExcel(): void {
    const data = this.prepareExportData().map(({ itemId, quantity1, quantity2, ...rest }) => ({
      description: rest.description,
      quantity1: quantity1 !== '' ? Number(quantity1) : '', // Convert quantity1 to number if not empty
      quantity2: quantity2 !== '' ? Number(quantity2) : '', // Convert quantity2 to number if not empty
      issuedToProduction: rest.issuedToProduction !== '' ? Number(rest.issuedToProduction) : '', // Convert issuedToProduction to number if not empty
      percentage: rest.percentage !== '' ? `${Number(rest.percentage.replace('%', ''))}%` : '' // Remove % sign, convert to number, and add % symbol if not empty
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Yield Statement');

    // Add header row
    const header = ['Description', 'Quantity', '', 'Issued to Production/Received from Production', 'Percentage'];
    worksheet.addRow(header);

    // Merge the cells for Quantity header
    worksheet.mergeCells('B1:C1');

    // Increase row height for header
    worksheet.getRow(1).height = 50;

    // Wrap text for header
    worksheet.getRow(1).eachCell((cell) => {
      cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
    });

    // Add data rows
    data.forEach(row => {
      worksheet.addRow(Object.values(row));
    });

    // Set column widths
    worksheet.columns = [
      { width: 25 }, // Description
      { width: 15 }, // Quantity1
      { width: 15 }, // Quantity2
      { width: 20 }, // Issued to Production/Received from Production
      { width: 15 }  // Percentage
    ];

    // Set alignment for data
    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      if (rowNumber !== 1) { // Skip header row
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          if (colNumber !== 1) { // Skip the first column
            cell.alignment = { horizontal: 'right' }; // Right-align data
          }
        });
      }
    });


    // Add borders to the table
    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Apply bold and underline formatting to "Issued to Production" and "Percentage" data
    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      if (rowNumber !== 1) { // Skip header row
        const issuedToProductionCell = row.getCell(4); // Issued to Production/Received from Production column
        const percentageCell = row.getCell(5); // Percentage column

        issuedToProductionCell.font = { bold: true, underline: true };
        percentageCell.font = { bold: true, underline: true };
      }
    });

    // Generate Excel file and download
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'YieldStatement.xlsx');
    });
  }

  exportToPDF(): void {
    const data = this.prepareExportData().map(({ itemId, quantity1, quantity2, ...rest }) => ({
      description: rest.description,
      quantity1: quantity1 !== '' ? quantity1 : '', // Keep quantity1 as is if not empty
      quantity2: quantity2 !== '' ? quantity2 : '', // Keep quantity2 as is if not empty
      issuedToProduction: rest.issuedToProduction !== '' ? rest.issuedToProduction : '', // Keep issuedToProduction as is if not empty
      percentage: rest.percentage !== '' ? `${rest.percentage.replace('%', '')}%` : '' // Remove % sign and add % symbol if not empty
    }));

    const doc = new jsPDF('portrait'); // Set orientation to portrait
    doc.setFontSize(18);

    // Derive start and end dates from financialYear property
    const [startYear, endYear] = this.financialYear.split('-');
    const startOfFinancialYear = `01-04-${startYear}`;
    const endOfFinancialYear = `31-03-${endYear}`;

    // Center-align the title text
    const pageWidth = doc.internal.pageSize.getWidth();
    const titleText = `Yield Statement from ${startOfFinancialYear} to ${endOfFinancialYear}`;
    const textWidth = doc.getTextWidth(titleText);
    const textX = (pageWidth - textWidth) / 2;
    doc.text(titleText, textX, 22); // Add title to header

    let startY = 30; // Initial start position for the first table

    autoTable(doc, {
      startY: startY, // Adjust start position for each table
      head: [['Description', { content: 'Quantity', colSpan: 2, styles: { halign: 'center' as const } }, 'Issued to Production/Received from Production', 'Percentage']],
      body: data.map((item: { description: string; quantity1: string; quantity2: string; issuedToProduction: string; percentage: string }) => [
        { content: item.description, styles: { halign: 'center' as const } },
        { content: item.quantity1, styles: { halign: 'right' as const } },
        { content: item.quantity2, styles: { halign: 'right' as const } },
        { content: item.issuedToProduction, styles: { halign: 'right' as const } },
        { content: item.percentage, styles: { halign: 'right' as const } }
      ]),
      styles: {
        lineWidth: 0.1, // Add border width
        lineColor: [0, 0, 0] // Add border color
      },
      columnStyles: {
        0: { cellWidth: 50, halign: 'center' }, // Description
        1: { cellWidth: 25, halign: 'center' }, // Quantity (Sales, Purchase Return, Closing Stock)
        2: { cellWidth: 25, halign: 'center' }, // Quantity (Opening Stock, Purchase, Sale Return, Total)
        3: { cellWidth: 50, halign: 'center' }, // Issued to Production
        4: { cellWidth: 30, halign: 'center' } // Percentage
      },
      headStyles: {
        cellWidth: 20,
        minCellHeight: 10,
        halign: 'center',
        valign: 'middle',
        fontSize: 10,
        cellPadding: 2,
        overflow: 'linebreak'
      },
      bodyStyles: {
        halign: 'center' // Center-align cell values
      },
      didDrawCell: (data) => {
        if (data.section === 'head' && data.column.index === 2) {
          data.cell.text = ['']; // Remove the duplicate "Quantity" header
        }
      }
    });

    const timestamp = new DatePipe('en-US').transform(new Date(), 'dd-MM-yyyy_HH-mm-ss');
    doc.save(`YieldStatement_${timestamp}.pdf`);
  }

  prepareExportDataByItem(itemIds: number[]): any[] {
    const groupedData: any[] = [];

    itemIds.forEach((itemId: number) => {
      const itemData = this.prepareExportData().filter(data => data.itemId === itemId);
      groupedData.push(itemData);
    });

    // Handle the null itemId separately for the Shortage Percentage
    const shortageData = this.prepareExportData().filter(data => data.itemId === null);
    if (shortageData.length > 0) {
      groupedData.push(shortageData);
    }

    return groupedData;
  }

  prepareExportData(): any[] {
    const data = [];
    if (this.selectedYield) {
      data.push({
        itemId: this.selectedYield.rawItem.item_id,
        description: this.selectedYield.rawItem.item_name,
        quantity1: '',
        quantity2: '',
        issuedToProduction: '',
        percentage: ''
      });
      data.push({
        itemId: this.selectedYield.rawItem.item_id,
        description: 'Opening Stock',
        quantity1: '0',
        quantity2: '',
        issuedToProduction: '',
        percentage: ''
      });
      data.push({
        itemId: this.selectedYield.rawItem.item_id,
        description: 'Purchase',
        quantity1: this.consolidatedStockDetails[this.selectedYield.rawItem.item_id]?.total_purchase,
        quantity2: '',
        issuedToProduction: '',
        percentage: ''
      });
      data.push({
        itemId: this.selectedYield.rawItem.item_id,
        description: 'Sale Return',
        quantity1: this.consolidatedStockDetails[this.selectedYield.rawItem.item_id]?.total_sale_return,
        quantity2: '',
        issuedToProduction: '',
        percentage: ''
      });
      data.push({
        itemId: this.selectedYield.rawItem.item_id,
        description: 'Total',
        quantity1: this.calculateTotal(this.selectedYield.rawItem.item_id),
        quantity2: '',
        issuedToProduction: '',
        percentage: ''
      });
      data.push({
        itemId: this.selectedYield.rawItem.item_id,
        description: 'Sales',
        quantity1: '',
        quantity2: this.consolidatedStockDetails[this.selectedYield.rawItem.item_id]?.total_sales,
        issuedToProduction: '',
        percentage: ''
      });
      data.push({
        itemId: this.selectedYield.rawItem.item_id,
        description: 'Purchase Return',
        quantity1: '',
        quantity2: this.consolidatedStockDetails[this.selectedYield.rawItem.item_id]?.total_purchase_return,
        issuedToProduction: '',
        percentage: ''
      });
      data.push({
        itemId: this.selectedYield.rawItem.item_id,
        description: 'Closing Stock',
        quantity1: '',
        quantity2: this.consolidatedStockDetails[this.selectedYield.rawItem.item_id]?.total_closing_balance,
        issuedToProduction: '',
        percentage: ''
      });
      data.push({
        itemId: this.selectedYield.rawItem.item_id,
        description: 'Total',
        quantity1: '',
        quantity2: this.calculateTotalFields(this.selectedYield.rawItem.item_id),
        issuedToProduction: '',
        percentage: ''
      });
      data.push({
        itemId: this.selectedYield.rawItem.item_id,
        description: 'Issued to Production',
        quantity1: '',
        quantity2: '',
        issuedToProduction: this.consolidatedStockDetails[this.selectedYield.rawItem.item_id]?.total_dispatch_to_process,
        percentage: '100.00%'
      });

      for (let processedItem of this.selectedYield.processedItems) {
        data.push({
          itemId: processedItem.item_id,
          description: processedItem.item_name,
          quantity1: '',
          quantity2: '',
          issuedToProduction: '',
          percentage: ''
        });
        data.push({
          itemId: processedItem.item_id,
          description: 'Opening Stock',
          quantity1: '0',
          quantity2: '',
          issuedToProduction: '',
          percentage: ''
        });
        data.push({
          itemId: processedItem.item_id,
          description: 'Purchase',
          quantity1: this.consolidatedStockDetails[processedItem.item_id]?.total_purchase,
          quantity2: '',
          issuedToProduction: '',
          percentage: ''
        });
        data.push({
          itemId: processedItem.item_id,
          description: 'Sale Return',
          quantity1: this.consolidatedStockDetails[processedItem.item_id]?.total_sale_return,
          quantity2: '',
          issuedToProduction: '',
          percentage: ''
        });
        data.push({
          itemId: processedItem.item_id,
          description: 'Total',
          quantity1: this.calculateTotal(processedItem.item_id),
          quantity2: '',
          issuedToProduction: '',
          percentage: ''
        });
        data.push({
          itemId: processedItem.item_id,
          description: 'Sales',
          quantity1: '',
          quantity2: this.consolidatedStockDetails[processedItem.item_id]?.total_sales,
          issuedToProduction: '',
          percentage: ''
        });
        data.push({
          itemId: processedItem.item_id,
          description: 'Purchase Return',
          quantity1: '',
          quantity2: this.consolidatedStockDetails[processedItem.item_id]?.total_purchase_return,
          issuedToProduction: '',
          percentage: ''
        });
        data.push({
          itemId: processedItem.item_id,
          description: 'Closing Stock',
          quantity1: '',
          quantity2: this.consolidatedStockDetails[processedItem.item_id]?.total_closing_balance,
          issuedToProduction: '',
          percentage: ''
        });
        data.push({
          itemId: processedItem.item_id,
          description: 'Total',
          quantity1: '',
          quantity2: this.calculateTotalFields(processedItem.item_id),
          issuedToProduction: '',
          percentage: ''
        });
        data.push({
          itemId: processedItem.item_id,
          description: 'Received from Production',
          quantity1: '',
          quantity2: '',
          issuedToProduction: this.consolidatedStockDetails[processedItem.item_id]?.total_received_from_process,
          percentage: this.calculatePercentage(processedItem.item_id, this.selectedYield.rawItem.item_id) + '%'
        });
      }

      data.push({
        itemId: null,
        description: 'Shortage',
        quantity1: '',
        quantity2: '',
        issuedToProduction: this.calculateShortage(this.selectedYield.rawItem.item_id),
        percentage: this.calculateShortagePercentage(this.selectedYield.rawItem.item_id) + '%'
      });
      data.push({
        itemId: null,
        description: 'Total',
        quantity1: '',
        quantity2: '',
        issuedToProduction: this.getTotal(this.selectedYield.rawItem.item_id),
        percentage: this.getTotalPercentage(this.selectedYield.rawItem.item_id) + '%'
      });
    }
    return data;
  }


}
