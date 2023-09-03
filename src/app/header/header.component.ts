import { Cart } from './../model/cart';
import { RestaurantService } from './../services/restaurant.service';
import { Router } from '@angular/router';
import { UserService } from './../services/user.service';
import { Component, OnInit } from '@angular/core';
import { Subscription, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  private _companyName : string = 'Eat Out';
  //private _subscribeObject;
  errorMessage:string = '';
  
  searchValue:string = '';

  //navBarList! : any;
  //adminId! : number;

  cartItems:Cart[] = [];
  cartItemNumber! : number;
  private _destroy$ = new Subject<void>();
  private _cartSubscription!: Subscription;

  private _sub! : Subscription | null;
   
  constructor(public _loginService:UserService, private _router:Router, private _resService : RestaurantService) { 
  }

  //userNameDisplayed:string = this._loginService.loginUser;
  //baseUrl:string = window.location.pathname;
  isUserLoggedIn = false;

  get status(): boolean {
    return localStorage.getItem('status') ? true : false;
  }

  ngOnInit(): void {
    if(this.status){
      this._resService.setLoggedInUserId(+localStorage.getItem('userId')!);
      this._cartSubscription = this._resService.cartwithCRUD$
      .pipe(takeUntil(this._destroy$))
      .subscribe(data => {
        this.cartItems = data;
        this.cartItemNumber = this.cartItems.length;
      });
    }
    
  }

  ngOnDestroy() : void{
    this._sub!.unsubscribe();
    this._cartSubscription.unsubscribe();
    this._destroy$.next();
    this._destroy$.complete();
  }

  get companyName():string{
    return this._companyName;
  }

  onLogout(){
    this._sub = this._loginService.onLogOut(+localStorage.getItem('userId')!).subscribe({
      next : (data) => {
        //console.log(`logout data is: ${data}`);
        
      },
      error : err => {
        this.errorMessage = err.error.message;
      }
    });
    localStorage.clear();
    this.isUserLoggedIn = false;
    this._router.navigate(['/login']);
  }

  updateSearchValue(){
    //console.log(`inside updateSearchValue : search value is: ${this.searchValue}`);
    this._router.navigate(['/welcome']);
    this._resService.setFilterRestaurantBy(this.searchValue);
  }

  viewMyOrders(){
    this._router.navigate([`user/${+localStorage.getItem('userId')!}/orders`]);
  }

  viewMyProfile(){
    this._router.navigate([`user/${+localStorage.getItem('userId')!}/profile`]);
  }

}
