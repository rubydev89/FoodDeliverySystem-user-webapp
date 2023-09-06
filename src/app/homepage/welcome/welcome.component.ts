import { OrdersService } from './../../services/orders.service';
import { Restaurant } from './../../model/restaurant';
import { Router } from '@angular/router';
import { RestaurantService } from './../../services/restaurant.service';
import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, catchError, combineLatest, EMPTY, map, Subject, shareReplay, tap, Subscription } from 'rxjs';
import { NgbCarousel } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent implements OnInit {
  @ViewChild('carousel', { static: true }) carousel!: NgbCarousel; // Reference to the carousel component
  
  carouselItemNo:number = 2;
  activeCarouselIndex: number = 0; // Store the index of the active carousel item

  errorMessage : string = '';

  private _sub1! : Subscription | null;
  private _sub2! : Subscription | null;

  defaultRestaurantImgUrl = '../../../assets/img/logo.png';
  
  constructor(private _restService : RestaurantService, private _router : Router, private _orderService : OrdersService) {
    this.updateItemsPerCarouselItem(window.innerWidth);
  }

  get status(): boolean {
    return localStorage.getItem('status') ? true : false;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.updateItemsPerCarouselItem(event.target.innerWidth);
  }
  
  restaurantSearchValue:string = '';
  restCategories:string[] = [];
  //restCategorySelected!:string;

  ngOnInit(): void {
    this._restService.setLoggedInUserId(+localStorage.getItem('userId')!);
    this._orderService.setLoggedInUserId(+localStorage.getItem('userId')!);
    if(this.status){
      this._sub1 = this._restService.cartwithCRUD$.subscribe();
      this._restService.allCartItems$.subscribe();
    }

    //this.restaurantSearchValue = this._restService.getSearchRestaurantinHeader();
    this._sub2 = this._restService.allRestCategfories$.subscribe({
      next: category => {
        this.restCategories = (category);
        this.restCategories.unshift('All');
      },
      error: err => {
        this.errorMessage = err.error.message;
        this._errorMessageSubject.next(err.message);
        //this.errorMessage = err.error.message
      }
    });
    //console.log(`All Categories is : ${this.restCategories}`);
  }

  ngOnDestroy() : void{
    this._sub1!.unsubscribe();
    this._sub2!.unsubscribe();
  }

  restWithDishes$ = this._restService.restaurantWithDishes$;

  private _filterRestNameSubject = new BehaviorSubject<string>('');
  filterRestNameAction$ = this._filterRestNameSubject.asObservable();

  private _errorMessageSubject = new Subject<string>();
  errorMessage$ = this._errorMessageSubject.asObservable();

  allRestaurants$ = this._restService.allFilteredRestaurants$;
  /* combineLatest([this._restService.allRestaurant$,this.filterRestNameAction$]).pipe(
    map(([restaurants, filterRestName]) => {
      return restaurants.filter(rest => 
        {
          //console.log(restaurants);
          return filterRestName ? rest.name.toLocaleLowerCase().includes(filterRestName.toLocaleLowerCase()) : true
        })
    }),
    catchError(
      err => {
      //console.log(`restaurant list error handler : ${(this.errorMessage$)}`);
      this._errorMessageSubject.next(err.message);
      return EMPTY;
    }),
    shareReplay(1)
  );  */

  categorySelected(category:string):void{
    if(category==='All')
      this._restService.setFilterRestaurantBy('');
    else
      this._restService.setFilterRestaurantBy(category);
    //this.carousel.select('0'); // Select the first carousel item
    this.activeCarouselIndex = 0;
    //console.log(`restCategorySelected : ${this.restCategorySelected}`);
    
  }

  updateItemsPerCarouselItem(screenWidth: number) {
    if (screenWidth <= 200) {
      this.carouselItemNo = 1; // Show 1 item on small screens
    }else if (screenWidth <= 350) {
      this.carouselItemNo = 2; // Show 1 item on small screens
    } else if (screenWidth <= 576) {
      this.carouselItemNo = 3; // Show 1 item on small screens
    } else if(screenWidth <= 768){
      // Calculate how many items can fit in a single carousel item on larger screens
      this.carouselItemNo = 5; // Show 5 items on medium screens
      //console.log(screenWidth);
    }else if(screenWidth <= 950) {
      // Calculate how many items can fit in a single carousel item on larger screens
      this.carouselItemNo = 7; // Show 6 items on larger screens
      //console.log(screenWidth);
    }else {
      // Calculate how many items can fit in a single carousel item on larger screens
      this.carouselItemNo = 9; // Show 6 items on larger screens
      //console.log(screenWidth);
    }
    //console.log(this.carouselItemNo);
  }

  chunkArray(arr: any[], size: number): any[] {
    const chunkedArr = [];
    for (let i = 0; i < arr.length; i += size) {
      chunkedArr.push(arr.slice(i, i + size));
    }
    return chunkedArr;
  }

  viewDishes(rest:Restaurant){
    this._restService.setSelectedRestaurantId(rest.id);
    //console.log(this._restService.getOrderFromRestaurant());
    this._router.navigate([`/restaurant/${rest.id}/${rest.name}`]);
  }

}
