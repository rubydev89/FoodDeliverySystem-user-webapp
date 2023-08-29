import { ChunkPipe } from './../services/chunk.pipe';
import { AuthenticationGuard } from './../services/authentication.guard';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { SharedModule } from './../shared/shared.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WelcomeComponent } from './welcome/welcome.component';



@NgModule({
  declarations: [
    WelcomeComponent,
    ChunkPipe
  ],
  imports: [
    SharedModule,
    RouterModule.forChild([
      {path:'welcome', component:WelcomeComponent, canActivate:[AuthenticationGuard]}
      //{path:'welcome', component:WelcomeComponent, canActivate:[ComponentAccessGuard]}
    ]),
    NgbNavModule

  ]
})
export class HomepageModule { }
