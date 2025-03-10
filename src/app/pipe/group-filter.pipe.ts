import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'groupFilter'
})
export class GroupFilterPipe implements PipeTransform {

  transform(groups: any[], searchText: string): any[] {
    if (!groups) return [];
    if (!searchText) return groups;

    console.log(searchText);

    searchText = searchText.toLowerCase();
    return groups.filter(group => group.name.toLowerCase().includes(searchText));
  }

}
