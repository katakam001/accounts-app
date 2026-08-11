import { AbstractControl, ValidationErrors } from '@angular/forms';

export function minArrayLengthValidator(min: number): (control: AbstractControl) => ValidationErrors | null {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (Array.isArray(value) && value.length < min) {
      return { minArrayLength: { requiredLength: min, actualLength: value.length } };
    }
    return null;
  };
}
