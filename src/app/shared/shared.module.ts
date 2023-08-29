import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { StarComponent } from './star/star.component';
import { HiddenNumberPipe } from './hidden-number.pipe';



@NgModule({
  declarations: [
    StarComponent,
    HiddenNumberPipe
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgxPaginationModule
  ],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgxPaginationModule,
    StarComponent,
    HiddenNumberPipe
  ]
})
export class SharedModule { }
