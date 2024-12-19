import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { SharedModule } from './shared/shared.module';
import { AccountService } from './services/account.service';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideHttpClient(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(),
    provideAnimationsAsync(),
    importProvidersFrom(BrowserModule),
    importProvidersFrom(BrowserAnimationsModule),
    importProvidersFrom(MatDialogModule),
    importProvidersFrom(ReactiveFormsModule),
    importProvidersFrom(SharedModule),
    DatePipe,
    AccountService, provideAnimationsAsync(), provideAnimationsAsync()
  ]
};
