import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportSectionComponent } from '../../shared-report/report-section/report-section.component';

@Component({
  selector: 'app-profit-loss',
  templateUrl: './profit-loss.component.html',
  styleUrls: ['./profit-loss.component.css'],
  standalone: true,
  imports: [CommonModule, ReportSectionComponent]
})
export class ProfitLossComponent {
  @Input() debitGroups: any[] = [];
  @Input() creditGroups: any[] = [];
  @Input() netProfit?: number;
  @Input() netLoss?: number;
  @Input() debitTotalQuantity: number = 0;
  @Input() debitTotalAmount: number = 0;
  @Input() creditTotalQuantity: number = 0;
  @Input() creditTotalAmount: number = 0;
  @Input() showHeader: boolean = true;


  getSummaryLabel(): string {
    console.log(this.netProfit);
    console.log(this.netLoss);
    if (typeof this.netProfit === 'number' && this.netProfit > 0) {
      return 'Net Profit';
    } else if (typeof this.netLoss === 'number' && this.netLoss > 0) {
      return 'Net Loss';
    } else {
      return '';
    }
  }

  getSummaryValue(): number {
    return this.netProfit ?? this.netLoss ?? 0;
  }

  getMaxRowCount(): number {
    const leftRows = this.debitGroups.reduce((sum, g) => sum + g.items.length, 0);
    const rightRows = this.creditGroups.reduce((sum, g) => sum + g.items.length, 0);
    return Math.max(leftRows, rightRows);
  }

  isNetProfit(): boolean {
    return typeof this.netProfit === 'number' && this.netProfit > 0;
  }

  isNetLoss(): boolean {
    return typeof this.netLoss === 'number' && this.netLoss > 0;
  }
}
