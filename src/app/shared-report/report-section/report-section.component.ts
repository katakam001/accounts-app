import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-report-section',
  templateUrl: './report-section.component.html',
  styleUrls: ['./report-section.component.css'],
  imports: [CommonModule],
  standalone: true
})
export class ReportSectionComponent {
  @Input() title: string = '';
  @Input() groups: any[] = [];
  @Input() showSummary: boolean = false;
  @Input() summaryLabel: string = '';
  @Input() summaryValue: number = 0;
  @Input() showHeader: boolean = false;
  @Input() showTotals: boolean = false;
  @Input() totalQuantity: number = 0;
  @Input() totalAmount: number = 0;
  @Input() maxRowCount = 0;

  getGroupClass(group: { groupMode: string }): string {
    const modeColorMap: { [key: string]: string } = {
      structured: 'bg-structured',
      flat: 'bg-flat'
    };
    return modeColorMap[group.groupMode] || 'bg-default';
  }

  getBlankRows(): number[] {
    const actualRows = this.groups.reduce((sum, g) => sum + g.items.length, 0);
    const blanks = this.maxRowCount - actualRows;
    return Array(blanks).fill(0);
  }
}
