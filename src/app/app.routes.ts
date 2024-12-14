import { Routes } from '@angular/router';
import { DetailsComponent } from './details/details.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './auth.guard';
import { HomeComponent } from './home/home.component';
import { RegisterComponent } from './register/register.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AccountListComponent } from './configuration/account-list/account-list.component';
import { GroupListComponent } from './configuration/group-list/group-list.component';
import { JournalListComponent } from './dataentry/journal-list/journal-list.component';
import { TrailBalanceComponent } from './reports/trail-balance/trail-balance.component';
import { CashBookComponent } from './dataentry/cash-book/cash-book.component';
import { PurchaseCategoriesComponent } from './configuration/purchase-categories/purchase-categories.component';
import { PurchaseFieldsComponent } from './configuration/purchase-fields/purchase-fields.component';
import { UnitsComponent } from './configuration/units/units.component';
import { CategoryUnitsComponent } from './configuration/category-units/category-units.component';

export const routes: Routes =
  [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'home', component: HomeComponent, title: 'Home page' },
    { path: 'accountList', component: AccountListComponent, title: 'Account List page' , canActivate: [AuthGuard] },
    { path: 'groupList', component: GroupListComponent, title: 'Group List page' , canActivate: [AuthGuard] },
    { path: 'purchaseCategories', component: PurchaseCategoriesComponent, title: 'Purchase Categories page' , canActivate: [AuthGuard] },
    { path: 'purchaseFields', component: PurchaseFieldsComponent, title: 'Purchase fields page' , canActivate: [AuthGuard] },
    { path: 'units', component: UnitsComponent, title: 'Units page' , canActivate: [AuthGuard] },
    { path: 'categoryUnits', component: CategoryUnitsComponent, title: 'Category Units page' , canActivate: [AuthGuard] },
    { path: 'journalEntries', component: JournalListComponent, title: 'Journal Entry page' , canActivate: [AuthGuard] },
    { path: 'cashBook', component: CashBookComponent, title: 'Cash Book page' , canActivate: [AuthGuard] },
    { path: 'dashboard', component: DashboardComponent, title: 'Dashboard page', canActivate: [AuthGuard] },
    { path: 'trailBalance', component: TrailBalanceComponent, title: 'Trail Balance page', canActivate: [AuthGuard] },
    { path: 'details/:id', component: DetailsComponent, title: 'Home details', canActivate: [AuthGuard] }
  ];
export default routes;

