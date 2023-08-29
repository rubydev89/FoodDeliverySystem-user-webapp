import { AuthenticationGuard } from './../services/authentication.guard';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { SharedModule } from './../shared/shared.module';
import { NgModule } from '@angular/core';
import { ProfileViewComponent } from './profile-view/profile-view.component';
import { DatePipe } from '@angular/common';



@NgModule({
  declarations: [
    ProfileViewComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild([
      {path:'user/:id/profile', component:ProfileViewComponent, canActivate:[AuthenticationGuard]},
      //{path:'user/:id/orders', component:OrdersComponent, canActivate:[AuthenticationGuard]}
      //{path:'welcome', component:WelcomeComponent, canActivate:[ComponentAccessGuard]}
    ]),
    NgbNavModule
  ],
  providers: [DatePipe]
})
export class ProfileModule { }
