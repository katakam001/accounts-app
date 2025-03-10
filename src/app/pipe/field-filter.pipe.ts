import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fieldFilter'
})
export class FieldFilterPipe implements PipeTransform {

  transform(fields: any[], searchText: string): any[] {
    if (!fields) return [];
    if (!searchText) return fields;

    console.log(searchText);

    searchText = searchText.toLowerCase();
    return fields.filter(field => field.field_name.toLowerCase().includes(searchText));
  }

}
