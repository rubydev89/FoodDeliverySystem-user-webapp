import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'hiddenNumber'
})
export class HiddenNumberPipe implements PipeTransform {

  transform(value: number): string {
    const numberString = value.toString();
    const hiddenDigits = '********';
    const visibleDigits = numberString.slice(-4);

    return hiddenDigits + visibleDigits;
  }

}
