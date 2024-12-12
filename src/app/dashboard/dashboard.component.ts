import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { HousingLocationComponent } from '../housing-location/housing-location.component';
import { HousingLocation } from '../services/housinglocation';
import { HousingService } from '../services/housing.service';
import { FinancialYearService } from '../services/financial-year.service';
import { MatDialog } from '@angular/material/dialog';
import { FinancialYearDialogComponent } from '../dialogbox/financial-year-dialog/financial-year-dialog.component';


@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, HousingLocationComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  housingLocationList: HousingLocation[] = [];
  housingService: HousingService = inject(HousingService);
  filteredLocationList: HousingLocation[] = [];
  financialYear: string;

  constructor(private dialog: MatDialog,
    private financialYearService: FinancialYearService) {
    this.housingService.getAllHousingLocations().then((housingLocationList: HousingLocation[]) => {
      this.housingLocationList = housingLocationList;
      this.filteredLocationList = housingLocationList;
    });
    this.getFinancialYear();
  }

  filterResults(text: string) {
    if (!text) {
      this.filteredLocationList = this.housingLocationList;
      return;
    }
    this.filteredLocationList = this.housingLocationList.filter((housingLocation) =>
      housingLocation?.city.toLowerCase().includes(text.toLowerCase()),
    );
  }

  getFinancialYear() {
    this.financialYearService.financialYear$.subscribe(year => {
      this.financialYear = year;
    });
  }
  openFinancialYearDialog() {
    this.dialog.open(FinancialYearDialogComponent);
  }
}
