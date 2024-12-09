import { Injectable } from '@angular/core';
import { HousingLocation } from './housinglocation';
import { Data } from './data';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class HousingService {
  constructor(private http: HttpClient) { }


  url = 'http://localhost:8080/api/locations';
  apiUrl = 'http://localhost:8080/api';
  async getAllHousingLocations(): Promise<HousingLocation[]> {
    const data = await fetch(this.url);
    return (await data.json()) ?? [];
  }
  async getHousingLocationById(id: number): Promise<HousingLocation | undefined> {
    const data = await fetch(`${this.url}/${id}`);
    return (await data.json()) ?? {};
  }
  // Method to post data asynchronously
  async postData(data: Data): Promise<Data | undefined> {
    return await this.http.post<Data>(`${this.apiUrl}/items`, data).toPromise();
  }
  // Method to update data asynchronously
  async updateData(id: number, data: Data): Promise<Data | undefined> {
    return await this.http.put<Data>(`${this.apiUrl}/items/${id}`, data).toPromise();
  }

  // Method to delete data asynchronously
  async deleteData(id: number): Promise<void> {
    return await this.http.delete<void>(`${this.apiUrl}/items/${id}`).toPromise();
  }
}

