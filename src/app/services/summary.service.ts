import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SummaryService {
  calculatePageSummary(groupedObjectsArray: any[]): any {
    const pageSummary: { [key: number]: any } = {};

    groupedObjectsArray.forEach((groupedObject) => {
      // Iterate through entries of each grouped object
      groupedObject.entries.forEach((entry: any) => {
        const categoryAccountId = entry.category_account_id;
        const categoryAccountName = entry.category_account_name;

        // Initialize summary object for the category if not already present
        if (!pageSummary[categoryAccountId]) {
          pageSummary[categoryAccountId] = {
            categoryAccountName: categoryAccountName,
            totalValue: 0, // Sum of sales/purchase value
            totalAmount: 0, // Sum of total_amount (value + taxes)
            taxes: {}, // Dynamic object for tax breakdown
          };
        }

        // Accumulate sales/purchase value and total amount (fixed to 2 decimals)
        pageSummary[categoryAccountId].totalValue = parseFloat(
          (pageSummary[categoryAccountId].totalValue + parseFloat(entry.value || "0")).toFixed(2)
        );

        pageSummary[categoryAccountId].totalAmount = parseFloat(
          (pageSummary[categoryAccountId].totalAmount + parseFloat(entry.total_amount || "0")).toFixed(2)
        );

        // Process dynamicFields to calculate taxes
        entry.dynamicFields.forEach((field: any) => {
          if (field.tax_account_id) {
            const taxName = field.field_name;
            const taxValue = parseFloat(field.field_value || "0");

            // Initialize tax name if not already present
            if (!pageSummary[categoryAccountId].taxes[taxName]) {
              pageSummary[categoryAccountId].taxes[taxName] = 0;
            }

            // Accumulate tax values (fixed to 2 decimals)
            pageSummary[categoryAccountId].taxes[taxName] = parseFloat(
              (pageSummary[categoryAccountId].taxes[taxName] + taxValue).toFixed(2)
            );
          }
        });
      });
    });

    return pageSummary;
  }

}
