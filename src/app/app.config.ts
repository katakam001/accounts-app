import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { SharedModule } from './shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { provideIndexedDb } from 'ngx-indexed-db';
import { dbConfig } from './indexDB/indexed-db.config';
import { AuthInterceptor } from './interceptors/auth.interceptor'; // Import the AuthInterceptor
import { CredentialsInterceptor } from './interceptors/credentials.interceptor'; // Import the CredentialsInterceptor
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideHttpClient(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(
      BrowserModule,
      BrowserAnimationsModule,
      MatDialogModule,
      ReactiveFormsModule,
      SharedModule,
      HttpClientModule // Import HttpClientModule
    ),
    provideIndexedDb(dbConfig),
    DatePipe,
    { provide: HTTP_INTERCEPTORS, useClass: CredentialsInterceptor, multi: true }, // Provide the CredentialsInterceptor
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }, // Provide the AuthInterceptor
    provideCharts(withDefaultRegisterables()) // Provide ng2-charts
  ]
};
