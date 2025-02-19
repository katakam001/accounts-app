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

const USER_KEY = 'auth-user';
const ADMIN_KEY = 'admin-user';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
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
    private financialYearService: FinancialYearService
  ) {}

  clean(): void {
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
      this.accountService.clearCache();
      this.unitService.clearCache();
      this.groupService.clearCache();
      this.categoryService.clearCache();
      this.fieldService.clearCache();
      this.fieldMappingService.clearCache();
      this.categoryUnitService.clearCache();
      this.brokerService.clearCache();
      this.areaService.clearCache();
      this.financialYearService.clearFinancialYear();
    }
  }

  public saveUser(user: any): void {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(USER_KEY);
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }

  public getUser(): any {
    if (typeof window !== 'undefined') {
      const user = window.localStorage.getItem(USER_KEY);
      if (user) {
        return JSON.parse(user);
      }
    }
    return null;
  }

  public saveAdminDetails(admin: any): void {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
    }
  }

  public getAdminDetails(): any {
    if (typeof window !== 'undefined') {
      const admin = window.localStorage.getItem(ADMIN_KEY);
      if (admin) {
        return JSON.parse(admin);
      }
    }
    return null;
  }

  public clearAdminDetails(): void {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(ADMIN_KEY);
    }
  }

  public isLoggedIn(): boolean {
    if (typeof window !== 'undefined') {
      const user = window.localStorage.getItem(USER_KEY);
      return !!user;
    }
    return false;
  }
}
