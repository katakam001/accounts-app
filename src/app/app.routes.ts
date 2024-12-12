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

export const routes: Routes =
  [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'home', component: HomeComponent, title: 'Home page' },
    { path: 'accountList', component: AccountListComponent, title: 'Account List page' },
    { path: 'groupList', component: GroupListComponent, title: 'Group List page' },
    { path: 'journalEntries', component: JournalListComponent, title: 'Journal Entry page' },
    { path: 'dashboard', component: DashboardComponent, title: 'Dashboard page', canActivate: [AuthGuard] },
    { path: 'details/:id', component: DetailsComponent, title: 'Home details', canActivate: [AuthGuard] }
  ];
export default routes;

