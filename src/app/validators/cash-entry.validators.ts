import { AbstractControl, ValidationErrors } from '@angular/forms';

export function exclusiveCashAmountValidator(control: AbstractControl): ValidationErrors | null {
  const debit = control.get('cash_debit')?.value;
  const credit = control.get('cash_credit')?.value;

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
