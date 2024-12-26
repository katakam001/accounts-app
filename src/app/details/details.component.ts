import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {HousingService} from '../services/housing.service';
import {HousingLocation} from '../services/housinglocation';
import {Data} from '../models/data';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule,MatRadioModule],
  templateUrl: './details.component.html',
  styleUrl: './details.component.css'
})
export class DetailsComponent {
  route: ActivatedRoute = inject(ActivatedRoute);
  housingService = inject(HousingService);
  housingLocation: HousingLocation | undefined;
  applyForm = new FormGroup({
    firstName: new FormControl(''),
    lastName: new FormControl(''),
    email: new FormControl(''),
  });
  constructor() {
    const housingLocationId = parseInt(this.route.snapshot.params['id'], 10);
    this.housingService.getHousingLocationById(housingLocationId).then((housingLocation) => {
      this.housingLocation = housingLocation;
    });
  }
  async updateData(id: number) {
    const updatedData: Data = {
      firstname: '',
      lastname: '',
      email:'katakam.bhaskar@gmail.com'
        };

    try {
      const response = await this.housingService.updateData(id, updatedData);
      console.log('Updated Response:', response);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async deleteData(id: number) {
    try {
      await this.housingService.deleteData(id);
      console.log('Data deleted successfully');
    } catch (error) {
      console.error('Error:', error);
    }
  }
  async submitApplication() {
    const newData: Data = {
      firstname: this.applyForm.value.firstName ?? '',
      lastname: this.applyForm.value.lastName ?? '',
      email:this.applyForm.value.email ?? ''
    };

    try {
      const response = await this.housingService.postData(newData);
      console.log('Response:', response);
    } catch (error) {
      console.error('Error:', error);
    }
  }
}
