import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { HomeComponent } from './home/home.component';
import { RegisterComponent } from './register/register.component';
import { PasswordResetComponent } from './password-reset/password-reset.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'password-reset/confirm', component: PasswordResetComponent },
  { path: 'home', component: HomeComponent, title: 'Home page' },
  { path: 'accountList', loadChildren: () => import('./configuration/account-list/account-list.module').then(m => m.AccountListModule), title: 'Account List page', canActivate: [AuthGuard] },
  { path: 'groupList', loadChildren: () => import('./configuration/group-list/group-list.module').then(m => m.GroupListModule), title: 'Group List page', canActivate: [AuthGuard] },
  { path: 'categories', loadChildren: () => import('./configuration/purchase-categories/purchase-categories.module').then(m => m.PurchaseCategoriesModule), title: 'Purchase Categories page', canActivate: [AuthGuard] },
  { path: 'fieldMapping', loadChildren: () => import('./configuration/purchase-fields/purchase-fields.module').then(m => m.PurchaseFieldsModule), title: 'Purchase fields page', canActivate: [AuthGuard] },
  { path: 'fields', loadChildren: () => import('./configuration/fields/fields.module').then(m => m.FieldsModule), title: 'Fields page', canActivate: [AuthGuard] },
  { path: 'brokerList', loadChildren: () => import('./configuration/broker/broker.module').then(m => m.BrokerModule), title: 'Brokers page', canActivate: [AuthGuard] },
  { path: 'areaList', loadChildren: () => import('./configuration/area/area.module').then(m => m.AreaModule), title: 'Areas page', canActivate: [AuthGuard] },
  { path: 'units', loadChildren: () => import('./configuration/units/units.module').then(m => m.UnitsModule), title: 'Units page', canActivate: [AuthGuard] },
  { path: 'categoryUnits', loadChildren: () => import('./configuration/category-units/category-units.module').then(m => m.CategoryUnitsModule), title: 'Category Units page', canActivate: [AuthGuard] },
  { path: 'groupMapping', loadChildren: () => import('./configuration/group-mapping-tree/group-mapping-tree.module').then(m => m.GroupMappingTreeModule), title: 'Group Mapping page', canActivate: [AuthGuard] },
  { path: 'journalEntries', loadChildren: () => import('./dataentry/journal-list/journal-list.module').then(m => m.JournalListModule), title: 'Journal Entry page', canActivate: [AuthGuard] },
  { path: 'cashBook', loadChildren: () => import('./dataentry/cash-book/cash-book.module').then(m => m.CashBookModule), title: 'Cash Book page', canActivate: [AuthGuard] },
  { path: 'purchaseEntry', loadChildren: () => import('./dataentry/purchase-entry/purchase-entry.module').then(m => m.PurchaseEntryModule), title: 'Purchase Entry page', canActivate: [AuthGuard] },
  { path: 'saleEntry', loadChildren: () => import('./dataentry/sale-entry/sale-entry.module').then(m => m.SaleEntryModule), title: 'Sale Entry page', canActivate: [AuthGuard] },
  { path: 'purchaseReturn', loadChildren: () => import('./dataentry/purchase-return/purchase-return.module').then(m => m.PurchaseReturnModule), title: 'Purchase Return page', canActivate: [AuthGuard] },
  { path: 'saleReturn', loadChildren: () => import('./dataentry/sale-return/sale-return.module').then(m => m.SaleReturnModule), title: 'Sale Return page', canActivate: [AuthGuard] },
  { path: 'dashboard', loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule), title: 'Dashboard page', canActivate: [AuthGuard] },
  { path: 'trailBalance', loadChildren: () => import('./reports/trail-balance/trail-balance.module').then(m => m.TrailBalanceModule), title: 'Trail Balance page', canActivate: [AuthGuard] },
  { path: 'details/:id', loadChildren: () => import('./details/details.module').then(m => m.DetailsModule), title: 'Home details', canActivate: [AuthGuard] }
];
