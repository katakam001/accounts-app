import { AbstractControl, ValidationErrors } from '@angular/forms';

export function notZeroValidator(control: AbstractControl): ValidationErrors | null {
  const rawValue = control.value;

  // Handle empty or non-numeric cases early
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return null;
  }

  const value = parseFloat(rawValue);

  // Check if value is effectively zero within 4 decimal places
  const isZero = Math.abs(value) < 0.0001;

  return isZero ? { notZero: true } : null;
}
