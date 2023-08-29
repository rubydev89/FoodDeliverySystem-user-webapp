import { RouterModule } from '@angular/router';
import { SharedModule } from './../shared/shared.module';
import { NgModule } from '@angular/core';
import { LoginComponent } from './login/login.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';



@NgModule({
  declarations: [
    LoginComponent,
    ForgotPasswordComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild([
      {path:'login', component:LoginComponent}
      //{path:'welcome', component:WelcomeComponent, canActivate:[ComponentAccessGuard]}
    ]),
    NgbNavModule
  ]
})
export class AuthenticationModule { }
