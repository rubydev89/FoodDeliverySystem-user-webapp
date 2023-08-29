import { RequestInterceptor } from './interceptor/request.interceptor';
import { LoginComponent } from './authentication/login/login.component';
import { RouterModule } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthenticationModule } from './authentication/authentication.module';
import { SharedModule } from './shared/shared.module';
import { HeaderComponent } from './header/header.component';
import { HomepageModule } from './homepage/homepage.module';
import { ProcessModule } from './process/process.module';
import { ProfileModule } from './profile/profile.module';
import { ResponseInterceptor } from './interceptor/response.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    AuthenticationModule,
    SharedModule,
    RouterModule.forChild([
      {path: 'login' , component: LoginComponent},
      {path: '' , redirectTo: 'login', pathMatch:'full'},
      {path: '**' , redirectTo: 'login', pathMatch:'full'}
    ]),
    HomepageModule,
    ProcessModule,
    ProfileModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RequestInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ResponseInterceptor,
      multi: true,
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
