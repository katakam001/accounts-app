import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportSectionComponent } from '../../shared-report/report-section/report-section.component';

@Component({
  selector: 'app-trading-account',
  templateUrl: './trading-account.component.html',
  styleUrls: ['./trading-account.component.css'],
  standalone: true,
  imports: [CommonModule, ReportSectionComponent]
})
export class TradingAccountComponent {
  @Input() debitGroups: any[] = [];
  @Input() creditGroups: any[] = [];
  @Input() grossProfit?: number;
  @Input() grossLoss?: number;
  @Input() debitTotalQuantity: number = 0;
  @Input() debitTotalAmount: number = 0;
  @Input() creditTotalQuantity: number = 0;
  @Input() creditTotalAmount: number = 0;

 getSummaryLabel(): string {
  if (typeof this.grossProfit === 'number' && this.grossProfit > 0) {
    return 'Gross Profit';
  } else if (typeof this.grossLoss === 'number' && this.grossLoss > 0) {
    return 'Gross Loss';
  } else {
    return '';
  }
}

  getSummaryValue(): number {
    return this.grossProfit ?? this.grossLoss ?? 0;
  }

  getMaxRowCount(): number {
  const leftRows = this.debitGroups.reduce((sum, g) => sum + g.items.length, 0);
  console.log(leftRows);
  const rightRows = this.creditGroups.reduce((sum, g) => sum + g.items.length, 0);
  console.log(rightRows);
  return Math.max(leftRows, rightRows);
}

isGrossProfit(): boolean {
  return typeof this.grossProfit === 'number' && this.grossProfit > 0;
}

isGrossLoss(): boolean {
  return typeof this.grossLoss === 'number' && this.grossLoss > 0;
}



}
