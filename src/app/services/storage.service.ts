import { Injectable } from '@angular/core';
import { AccountService } from './account.service';
import { UnitService } from './unit.service';
import { GroupService } from './group.service';
import { CategoryService } from './category.service';
import { FieldService } from './field.service';
import { FieldMappingService } from './field-mapping.service';
import { CategoryUnitService } from './category-unit.service';
import { BrokerService } from './broker.service';
import { AreaService } from './area.service';
import { FinancialYearService } from './financial-year.service';
import { ConversionService } from './conversion.service';
import { GroupMappingService } from './group-mapping.service';
import { ItemsService } from './items.service';
import { OpeningStockService } from './opening-stock.service';
import { YieldService } from './yield.service';

const USER_KEY = 'auth-user';
const ADMIN_KEY = 'admin-user';
const IMPERSONATION_KEY = 'is-impersonating';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private cacheServices: any[] = [];

  constructor(
    private accountService: AccountService,
    private unitService: UnitService,
    private groupService: GroupService,
    private categoryService: CategoryService,
    private fieldService: FieldService,
    private fieldMappingService: FieldMappingService,
    private categoryUnitService: CategoryUnitService,
    private brokerService: BrokerService,
    private areaService: AreaService,
    private itemsService: ItemsService,
    private yieldService: YieldService,
    private conversionService: ConversionService,
    private groupMappingService: GroupMappingService,
    private openingStockService: OpeningStockService,
    private financialYearService: FinancialYearService
  ) {
    this.cacheServices = [
      this.accountService, this.unitService, this.groupService,
      this.categoryService, this.fieldService, this.fieldMappingService,
      this.categoryUnitService, this.brokerService, this.areaService,
      this.itemsService, this.yieldService, this.conversionService,
      this.groupMappingService, this.openingStockService
    ];
  }

  private setItem(key: string, value: any): void {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  }

  private getItem<T>(key: string): T | null {
    if (typeof window !== 'undefined') {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    }
    return null;
  }

  private removeItem(key: string): void {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  }

  private clearAllCaches(): void {
    this.cacheServices.forEach(service => service.clearCache?.());
    this.financialYearService.clearFinancialYear();
  }

  clean(): void {
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
      this.clearAllCaches();
    }
  }

  saveUser(user: any): void {
    this.removeItem(USER_KEY);
    this.setItem(USER_KEY, user);
  }

  getUser(): any {
    return this.getItem(USER_KEY);
  }

  saveAdminDetails(admin: any): void {
    this.setItem(ADMIN_KEY, admin);
  }

  getAdminDetails(): any {
    return this.getItem(ADMIN_KEY);
  }

  clearAdminDetails(): void {
    this.removeItem(ADMIN_KEY);
  }

  setImpersonationState(state: boolean): void {
    this.setItem(IMPERSONATION_KEY, state);
  }

  isImpersonating(): boolean {
    return this.getItem<boolean>(IMPERSONATION_KEY) === true;
  }

  clearImpersonationState(): void {
    this.removeItem(IMPERSONATION_KEY);
    this.clearAllCaches();
  }

  isLoggedIn(): boolean {
    return !!this.getItem(USER_KEY);
  }

  isAdminLoggedIn(): boolean {
    return !!this.getItem(ADMIN_KEY);
  }

  isUserProfileCompleted(): boolean {
    const user = this.getUser();
    return user?.profile_completed === true;
  }

  isAdminProfileCompleted(): boolean {
    const admin = this.getAdminDetails();
    return admin?.profile_completed === true;
  }
}
