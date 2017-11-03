import { Injectable, Pipe } from '@angular/core';

@Pipe({
    name: 'absolute'
})
@Injectable()
export class AbsolutePipe {
    /*
     Takes a value and makes it lowercase.
     */
    transform(value, args) {
        return Math.abs(value);
    }
}
