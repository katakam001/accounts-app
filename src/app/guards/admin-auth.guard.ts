// src/app/guards/admin-auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { StorageService } from '../services/storage.service'; // Make sure to import StorageService

@Injectable({
  providedIn: 'root'
})
export class AdminAuthGuard implements CanActivate {
  constructor(private storageService: StorageService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const user = this.storageService.getUser(); // Get the user from storageService

    if (user && user.roles && user.roles.some((role:string) => role === 'ROLE_ADMIN')) {
      return true;
    }

    // Navigate to dashboard page if not an admin
    this.router.navigate(['/dashboard']);
    return false;
  }
}
