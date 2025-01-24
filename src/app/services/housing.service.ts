import { Injectable } from '@angular/core';
import { HousingLocation } from './housinglocation';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class HousingService {
  constructor(private http: HttpClient) { }

  private baseUrl = environment.apiUrl;
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
}