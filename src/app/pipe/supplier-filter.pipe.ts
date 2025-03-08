import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'supplierFilter'
})
export class SupplierFilterPipe implements PipeTransform {
  transform(suppliers: any[], searchText: string): any[] {
    if (!suppliers) return [];
    if (!searchText) return suppliers;

    console.log(searchText);

    searchText = searchText.toLowerCase();
    return suppliers.filter(supplier => supplier.name.toLowerCase().includes(searchText));
  }
}
