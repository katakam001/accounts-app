import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AdminAuthGuard } from './admin-auth.guard';
import { StorageService } from '../services/storage.service'; // Ensure proper import
import { RouterTestingModule } from '@angular/router/testing';

describe('AdminAuthGuard', () => {
  let guard: AdminAuthGuard;
  let router: Router;
  let storageService: StorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [AdminAuthGuard, StorageService]
    });

    guard = TestBed.inject(AdminAuthGuard);
    router = TestBed.inject(Router);
    storageService = TestBed.inject(StorageService);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow the admin user to activate the route', () => {
    spyOn(storageService, 'getUser').and.returnValue({ roles: ['ROLE_ADMIN'] });
    const route: ActivatedRouteSnapshot = {} as ActivatedRouteSnapshot;
    const state: RouterStateSnapshot = {} as RouterStateSnapshot;
    expect(guard.canActivate(route, state)).toBe(true);
  });

  it('should not allow a non-admin user to activate the route and redirect to dashboard', () => {
    spyOn(storageService, 'getUser').and.returnValue({ roles: ['ROLE_USER'] });
    const navigateSpy = spyOn(router, 'navigate');
    const route: ActivatedRouteSnapshot = {} as ActivatedRouteSnapshot;
    const state: RouterStateSnapshot = {} as RouterStateSnapshot;

    expect(guard.canActivate(route, state)).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should not allow an unauthenticated user to activate the route and redirect to dashboard', () => {
    spyOn(storageService, 'getUser').and.returnValue(null);
    const navigateSpy = spyOn(router, 'navigate');
    const route: ActivatedRouteSnapshot = {} as ActivatedRouteSnapshot;
    const state: RouterStateSnapshot = {} as RouterStateSnapshot;

    expect(guard.canActivate(route, state)).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  });
});
