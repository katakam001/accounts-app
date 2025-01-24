import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import 'chartjs-adapter-date-fns';

@Component({
  selector: 'app-stock-register-chart',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './stock-register-chart.component.html',
  styleUrls: ['./stock-register-chart.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StockRegisterChartComponent implements OnInit {
  @Input() chartData: ChartConfiguration<'line'>['data'];

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'MMM dd, yyyy'
        },
        title: {
          display: true,
          text: 'Date',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(200, 200, 200, 0.2)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Closing Stock',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        ticks: {
          callback: function(value) {
            return value.toLocaleString(); // Format y-axis values
          }
        },
        grid: {
          color: 'rgba(200, 200, 200, 0.2)'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: {
            size: 14
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toLocaleString();
            }
            return label;
          }
        }
      }
    },
    elements: {
      line: {
        borderWidth: 2,
        backgroundColor: 'rgba(75, 192, 192, 0.2)'
      },
      point: {
        radius: 5,
        hoverRadius: 7,
        hoverBorderWidth: 2
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutBounce'
    }
  };
  public lineChartLegend = true;
  public lineChartType: ChartType = 'line';

  ngOnInit(): void {
    // Ensure the chart updates when chartData changes
    if (this.chartData) {
      this.chartData.labels = this.chartData.labels || [];
      this.chartData.datasets = this.chartData.datasets || [{ data: [] }];
    }
  }
}
