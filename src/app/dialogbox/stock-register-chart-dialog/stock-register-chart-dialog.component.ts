import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { StockRegisterChartComponent } from '../../charts/stock-register-chart/stock-register-chart.component';

@Component({
  selector: 'app-stock-register-chart-dialog',
  standalone: true,
  imports: [CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    StockRegisterChartComponent],
  templateUrl: './stock-register-chart-dialog.component.html',
  styleUrls: ['./stock-register-chart-dialog.component.css']
})

export class StockRegisterChartDialogComponent {
  chartData: any;
  contextLabel: string;
  viewType: string;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.chartData = data.chartData;
    this.contextLabel = data.contextLabel;
    this.viewType = data.viewType;
  }
}

