import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { HomeComponent } from './home/home.component';
import { RegisterComponent } from './register/register.component';
import { PasswordResetComponent } from './password-reset/password-reset.component';
import { AccountInformationComponent } from './account-information/account-information.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { AdminAuthGuard } from './guards/admin-auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'accountInfo', component: AccountInformationComponent },
  { path: 'changePassword', component: ChangePasswordComponent },
  { path: 'password-reset/confirm', component: PasswordResetComponent },
  { path: 'home', component: HomeComponent, title: 'Home page' },
  { path: 'user-list', loadChildren: () => import('./admin/user-list/user-list.module').then(m => m.UserListModule), title: 'User List page', canActivate: [AdminAuthGuard] },
  { path: 'dashboard', loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule), title: 'Dashboard page', canActivate: [AuthGuard] },
  { path: 'admin-dashboard', loadChildren: () => import('./admin/admin-dashboard/admin-dashboard.module').then(m => m.AdminDashboardModule), title: 'Admin Dashboard page', canActivate: [AdminAuthGuard] },
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
  { path: 'itemList', loadChildren: () => import('./configuration/item-list/item-list.module').then(m => m.ItemListModule), title: 'Item List page', canActivate: [AuthGuard] },
  { path: 'openingStock', loadChildren: () => import('./configuration/opening-stock/opening-stock.module').then(m => m.OpeningStockModule), title: 'Opening Stock page', canActivate: [AuthGuard] },
  { path: 'yieldList', loadChildren: () => import('./configuration/yield/yield.module').then(m => m.YieldModule), title: 'Yield List page', canActivate: [AuthGuard] },
  { path: 'conversionList', loadChildren: () => import('./configuration/conversion/conversion.module').then(m => m.ConversionModule), title: 'Conversion List page', canActivate: [AuthGuard] },
  { path: 'journalEntries', loadChildren: () => import('./dataentry/journal-list/journal-list.module').then(m => m.JournalListModule), title: 'Journal Entry page', canActivate: [AuthGuard] },
  { path: 'cashBook', loadChildren: () => import('./dataentry/cash-book/cash-book.module').then(m => m.CashBookModule), title: 'Cash Book page', canActivate: [AuthGuard] },
  { path: 'purchaseEntry', loadChildren: () => import('./dataentry/purchase-entry/purchase-entry.module').then(m => m.PurchaseEntryModule), title: 'Purchase Entry page', canActivate: [AuthGuard] },
  { path: 'saleEntry', loadChildren: () => import('./dataentry/sale-entry/sale-entry.module').then(m => m.SaleEntryModule), title: 'Sale Entry page', canActivate: [AuthGuard] },
  { path: 'purchaseReturn', loadChildren: () => import('./dataentry/purchase-return/purchase-return.module').then(m => m.PurchaseReturnModule), title: 'Purchase Return page', canActivate: [AuthGuard] },
  { path: 'saleReturn', loadChildren: () => import('./dataentry/sale-return/sale-return.module').then(m => m.SaleReturnModule), title: 'Sale Return page', canActivate: [AuthGuard] },
  { path: 'creditNote', loadChildren: () => import('./dataentry/credit-note/credit-note.module').then(m => m.CreditNoteModule), title: 'Credit Note page', canActivate: [AuthGuard] },
  { path: 'debitNote', loadChildren: () => import('./dataentry/debit-note/debit-note.module').then(m => m.DebitNoteModule), title: 'Debit Note page', canActivate: [AuthGuard] },
  { path: 'productionEntry', loadChildren: () => import('./dataentry/production-entry/production-entry.module').then(m => m.ProductionEntryModule), title: 'Production Entry page', canActivate: [AuthGuard] },
  { path: 'trailBalance', loadChildren: () => import('./reports/trail-balance/trail-balance.module').then(m => m.TrailBalanceModule), title: 'Trail Balance page', canActivate: [AuthGuard] },
  { path: 'stockRegister', loadChildren: () => import('./reports/stock-register/stock-register.module').then(m => m.StockRegisterModule), title: 'Stock Register page', canActivate: [AuthGuard] },
  { path: 'closingStock', loadChildren: () => import('./reports/closing-stock-valuation/closing-stock-valuation.module').then(m => m.ClosingStockValuationModule), title: 'Closing stock Valuation page', canActivate: [AuthGuard] },
  { path: 'yieldStatement', loadChildren: () => import('./reports/yield-statement/yield-statement.module').then(m => m.YieldStatementModule), title: 'Yield Statment page', canActivate: [AuthGuard] },
  { path: 'daybook', loadChildren: () => import('./reports/daybook/daybook.module').then(m => m.DayBookModule), title: 'Day Book page', canActivate: [AuthGuard] },
  { path: 'accountCopy', loadChildren: () => import('./reports/account-copy/account-copy.module').then(m => m.AccountCopyModule), title: 'Account Copy page', canActivate: [AuthGuard] },
  { path: 'ledger', loadChildren: () => import('./reports/ledger/ledger.module').then(m => m.LedgerModule), title: 'Ledger page', canActivate: [AuthGuard] },
  { path: 'bankStatement', loadChildren: () => import('./upload/bank-statement/bank-statement.module').then(m => m.BankStatementModule), title: 'Bank Statement page', canActivate: [AuthGuard] },
  { path: 'entriesUpload', loadChildren: () => import('./upload/entries/entries.module').then(m => m.EntriesModule), title: 'Entries upload page', canActivate: [AuthGuard] },
];
