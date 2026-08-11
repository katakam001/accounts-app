import { AbstractControl, ValidationErrors } from '@angular/forms';

export function exclusiveAmountValidator(control: AbstractControl): ValidationErrors | null {
  const debit = control.get('debit_amount')?.value;
  const credit = control.get('credit_amount')?.value;

  const debitNonZero = Number(debit) > 0;
  const creditNonZero = Number(credit) > 0;

  if (debitNonZero && creditNonZero) {
    return { bothAmountsSet: true };
  }

  if (!debitNonZero && !creditNonZero) {
    return { noAmountSet: true };
  }

  return null;
}
