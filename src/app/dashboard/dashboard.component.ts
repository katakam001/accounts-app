import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { HousingLocationComponent } from '../housing-location/housing-location.component';
import { HousingLocation } from '../services/housinglocation';
import { HousingService } from '../services/housing.service';
import { FinancialYearService } from '../services/financial-year.service';
import { MatDialog } from '@angular/material/dialog';
import { FinancialYearDialogComponent } from '../dialogbox/financial-year-dialog/financial-year-dialog.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HousingLocationComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  housingLocationList: HousingLocation[] = [];
  housingService: HousingService = inject(HousingService);
  filteredLocationList: HousingLocation[] = [];
  financialYear: string;

  constructor(private dialog: MatDialog, private financialYearService: FinancialYearService) {}

  ngOnInit(): void {
    // this.housingService.getAllHousingLocations().then((housingLocationList: HousingLocation[]) => {
    //   this.housingLocationList = housingLocationList;
    //   this.filteredLocationList = housingLocationList;
    // });
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
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
    }
  }

  openFinancialYearDialog() {
    const dialogRef = this.dialog.open(FinancialYearDialogComponent);

    dialogRef.afterClosed().subscribe(() => {
      this.getFinancialYear(); // Fetch the financial year from local storage and update
    });
  }
}
