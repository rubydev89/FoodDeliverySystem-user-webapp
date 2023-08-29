import { AbstractControl, ValidatorFn } from '@angular/forms';

export class NumberValidator {

  static zipLengthValidator(len: number): ValidatorFn {
    return (c: AbstractControl): { [key: string]: boolean } | null => {
      //console.log(c.value);
      if (c.value && (isNaN(c.value) || c.value.toString().length!=len)) {
        return { pincodeLength: true };
      }
      return null;
    };
  }

  static cardLengthValidator(len: number): ValidatorFn {
    return (c: AbstractControl): { [key: string]: boolean } | null => {
      if (c.value && (isNaN(c.value) || c.value!.toString().length!=len)) {
        return { cardNumberLength: true };
      }
      return null;
    };
  }

  static cvvLengthValidator(len: number): ValidatorFn {
    return (c: AbstractControl): { [key: string]: boolean } | null => {
      if (c.value && (isNaN(c.value) || c.value!.toString().length!=len)) {
        return { cvvLength: true };
      }
      return null;
    };
  }
}