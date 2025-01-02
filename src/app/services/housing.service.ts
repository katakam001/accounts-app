import { Injectable } from '@angular/core';
import { HousingLocation } from './housinglocation';
import { Data } from '../models/data';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  withCredentials: true // Include credentials (cookies) in the request
};

@Injectable({
  providedIn: 'root'
})
export class HousingService {
  constructor(private http: HttpClient) { }

  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api`; // Append the path to the base URL
  private url = `${this.baseUrl}/api/locations`; // Append the path to the base URL

  async getAllHousingLocations(): Promise<HousingLocation[]> {
    const data = await fetch(this.url, {
      credentials: 'include' // Include credentials (cookies) in the request
    });
    return (await data.json()) ?? [];
  }

  async getHousingLocationById(id: number): Promise<HousingLocation | undefined> {
    const data = await fetch(`${this.url}/${id}`, {
      credentials: 'include' // Include credentials (cookies) in the request
    });
    return (await data.json()) ?? {};
  }

  // Method to post data asynchronously
  async postData(data: Data): Promise<Data | undefined> {
    return await this.http.post<Data>(`${this.apiUrl}/items`, data, httpOptions).toPromise();
  }

  // Method to update data asynchronously
  async updateData(id: number, data: Data): Promise<Data | undefined> {
    return await this.http.put<Data>(`${this.apiUrl}/items/${id}`, data, httpOptions).toPromise();
  }

  // Method to delete data asynchronously
  async deleteData(id: number): Promise<void> {
    return await this.http.delete<void>(`${this.apiUrl}/items/${id}`, httpOptions).toPromise();
  }
}