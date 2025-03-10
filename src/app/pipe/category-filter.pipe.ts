import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'categoryFilter'
})
export class CategoryFilterPipe implements PipeTransform {

  transform(categories: any[], searchText: string): any[] {
    if (!categories) return [];
    if (!searchText) return categories;

    console.log(searchText);

    searchText = searchText.toLowerCase();
    return categories.filter(category => category.name.toLowerCase().includes(searchText));
  }

}
