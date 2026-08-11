import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'userFilter'
})
export class UserFilterPipe implements PipeTransform {
  transform(users: any[], searchText: string): any[] {
    if (!users) return [];
    if (!searchText) return users;

    searchText = searchText.toLowerCase();

    return users.filter(user =>
      (user.username && user.username.toLowerCase().includes(searchText)) ||
      (user.email && user.email.toLowerCase().includes(searchText)) ||
      (user.contact_number && user.contact_number.toLowerCase().includes(searchText))

    );
  }
}
