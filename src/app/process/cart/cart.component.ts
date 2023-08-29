import { Router } from '@angular/router';
import { Cart } from './../../model/cart';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { RestaurantService } from './../../services/restaurant.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  private _destroy$ = new Subject<void>();
  private _cartSubscription!: Subscription;

  cartItems! : Cart[];
  dishQuantityToBeAddedToCart: number = 1;
  cartTotalPrice!:number;

  get status(): boolean {
    return localStorage.getItem('status') ? true : false;
  }

  constructor(private _restService : RestaurantService, private _router : Router) {
    //this.adminId = 7;
    if(this.status){
      this._cartSubscription = this._restService.cartwithCRUD$
      .pipe(takeUntil(this._destroy$))
      .subscribe(data => {
        this.cartItems = data;
        //console.log('Cart component - cartItems:', this.cartItems);
        this.cartTotalPrice = data.reduce((acc, item) => acc + (item.dishes.price * item.quantity), 0);
        // Handle the data emitted by the observable
        //console.log('Cart component - cartTotalPrice:', this.cartTotalPrice);
      });
    }
   }

  ngOnInit(): void {
  }

  ngOnDestroy() {
    // Unsubscribe from the subscription to prevent memory leaks
    this._cartSubscription.unsubscribe();
    this._destroy$.next();
    this._destroy$.complete();
  }

  increaseDishQuantityToBeAddedToCart(cartItem:Cart) {
    cartItem.quantity += 1;
    this._restService.updateCartItem(cartItem);
  }

  decreaseDishQuantityToBeAddedToCart(cartItem:Cart) {
    if (this.dishQuantityToBeAddedToCart > 1) {
      this.dishQuantityToBeAddedToCart--;
    }

    if(cartItem.quantity > 1){
      cartItem.quantity -= 1;
      this._restService.updateCartItem(cartItem);
    }else if(cartItem.quantity == 1){
      this._restService.deleteCartItem(cartItem);
    }
  }

  checkout(){
    this._router.navigate([`/user/${+localStorage.getItem('userId')!}/checkout`]);
  }

  exploreMore(){
    const url = `/restaurant/${this.cartItems[0].dishes.restaurant.id}/${this.cartItems[0].dishes.restaurant.name}`;
    //console.log(`url is: ${encodeURI(url)}`);
    this._router.navigateByUrl(encodeURI(url));
  }

}
