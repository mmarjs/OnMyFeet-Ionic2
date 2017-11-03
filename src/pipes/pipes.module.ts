import {NgModule} from '@angular/core';
import {CommonModule} from "@angular/common";

// Pipes

import {AscPipe} from "./asc";
import {DescPipe} from "./desc";
import {CapitalizePipe} from "./capitalize";
import {OrderByPipe} from "./order-by";
import {AbsolutePipe} from "./absolute";


export const sharedPipes = [
    CapitalizePipe,
    OrderByPipe,
    AscPipe,
    DescPipe,
    AbsolutePipe,
];

@NgModule({
    imports     : [CommonModule],
    exports     : [sharedPipes],
    declarations: [sharedPipes],
})
export class PipesModule {
}
