import { AuthenticationGuard } from './../services/authentication.guard';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { SharedModule } from './../shared/shared.module';
import { NgModule } from '@angular/core';
import { CartComponent } from './cart/cart.component';
import { RestaurantComponent } from './restaurant/restaurant.component';
import { ChargeDetailComponent } from './charge-detail/charge-detail.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { RestaurantDetailComponent } from './restaurant-detail/restaurant-detail.component';
import { DishesComponent } from './dishes/dishes.component';
import { OffersComponent } from './offers/offers.component';
import { OrdersComponent } from './orders/orders.component';



@NgModule({
  declarations: [
    CartComponent,
    RestaurantComponent,
    ChargeDetailComponent,
    CheckoutComponent,
    RestaurantDetailComponent,
    DishesComponent,
    OffersComponent,
    OrdersComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild([
      {path:'restaurant/:id/:name', component:RestaurantComponent, canActivate:[AuthenticationGuard]},
      //{path:'cart', component:CartComponent, canActivate:[AuthenticationGuard]},
      {path:'user/:id/checkout', component:CheckoutComponent, canActivate:[AuthenticationGuard]},
      {path:'user/:id/orders', component:OrdersComponent, canActivate:[AuthenticationGuard]}
      //{path:'welcome', component:WelcomeComponent, canActivate:[ComponentAccessGuard]}
    ]),
    NgbNavModule
  ],
  exports : [CartComponent]
})
export class ProcessModule { }
