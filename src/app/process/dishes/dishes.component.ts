import { Subject, Subscription, switchMap, takeUntil, catchError } from 'rxjs';
import { Cart } from './../../model/cart';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from '@angular/router';
import { RestaurantService } from './../../services/restaurant.service';
import { Component, OnInit, TemplateRef, ViewChild, ElementRef } from '@angular/core';
import { Dish } from 'src/app/model/dish';

@Component({
  selector: 'app-dishes',
  templateUrl: './dishes.component.html',
  styleUrls: ['./dishes.component.css']
})
export class DishesComponent implements OnInit {
  @ViewChild('removeRestaurantFromCartModal') removeRestaurantFromCartModal!: TemplateRef<any>;
  //@ViewChild('specialInstruction') specialInstruction!: ElementRef<HTMLTextAreaElement>;

  private _destroy$ = new Subject<void>();
  private _cartSubscription!: Subscription;

  cartItems!:Cart[];
  //myCartDishes:any[] = [];

  allDishes: Dish[] = [];
  allDishCategoryForRestaurant : string[] = [];
  errorMessage:string = '';

  dishQuantityToBeAddedToCart: number = 1;
  dishSelected!:Dish;
  
  constructor(private _restService : RestaurantService, private _route:ActivatedRoute, private _restModalService : NgbModal) {
    /* this._cartSubscription = this._restService.cartwithCRUD$
      .pipe(takeUntil(this._destroy$))
      .subscribe(data => {
        this.cartItems = data;
        // Handle the data emitted by the observable
        //console.log('Cart data:', this.cartItems);
      }); */
   }
  
  /***** for filter with dish name *******/
  filteredDishes: Dish[] = [];
  private _listFilter = '';
  get listFilter(): string {
    return this._listFilter;
  }
  set listFilter(value: string) {
    this._listFilter = value;
    this.filteredDishes = this.listFilter ? this.performFilter(this.listFilter) : this.allDishes;
  }

  ngOnInit(): void {
    let restId:number = 0;
    this._route.params.subscribe(params => {
      restId = +params['id'];
    });

    this._cartSubscription = this._restService.allFilteredDishes$.pipe(
      takeUntil(this._destroy$),
      catchError(error => {
        this.errorMessage = 'This restaurant currently doesn\'t have any dish. Try some other restaurant.';
        // Handle the error as needed, you can return an empty array or rethrow the error
        return [];
      }),
      switchMap(
        dishes => {
          //console.log(`all dishes is : ${JSON.stringify(dishes)}`);
          this.allDishes = dishes;
          this.filteredDishes = dishes;
          return this._restService.cartwithCRUD$  //getDishesByRestaurantId(restId);
        })
    ).subscribe({
      next: cartData => {
        this.cartItems = cartData || [];
      },
      error: err => {
        this.errorMessage = 'This restaurant currently doesn\'t have any dish. Try some other restaurant';
      }
    });

    this._restService.getDishCategoryByRestaurantId(restId).subscribe({
      next : categories => {
        //console.log(`Dishes data fetched from backend for restaurant Id : ${restId} : \n${JSON.stringify(categories)}`);
        this.allDishCategoryForRestaurant = categories;
      },
      error : err => {
        this.errorMessage = 'This restaurant currently doesn\'t have any dish. Try some other restaurant';//err.error.message;
        //console.log(this.errorMessage);
      }
    });
    
    //console.log(`finally all dish is : ${this.filteredDishes}`);
  }

  ngOnDestroy() {
    // Unsubscribe from the subscription to prevent memory leaks
    this._cartSubscription.unsubscribe();
    this._destroy$.next();
    this._destroy$.complete();
  }

  // Code for Filter dish list with dish name
  performFilter(filterBy: string): Dish[] {
    filterBy = filterBy.toLocaleLowerCase();
    //console.log(`filterBy : ${JSON.stringify(this.allRestaurants)}`);
    return this.allDishes.filter((rest) => {
      return rest.dish_name.toLocaleLowerCase().includes(filterBy)// !== -1
    });
  }

  scrollToSection(sectionId: string) {
    const section = document.getElementById(sectionId);
    //console.log(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }

  openAddDishModal(content:any, data:Dish){
    //this.dishInfo = data;
    const modalRef = this._restModalService.open(content);
    this.dishSelected = data;
  }

  increaseDishQuantityToBeAddedToCart() {
    this.dishQuantityToBeAddedToCart++;
  }

  decreaseDishQuantityToBeAddedToCart() {
    if (this.dishQuantityToBeAddedToCart > 1) {
      this.dishQuantityToBeAddedToCart--;
    }
  }

  addToCart(dish:Dish){
    this._restModalService.dismissAll('addDishModal');
    if(this.cartItems!.length > 0 && this.cartItems[0].dishes.restaurant.id != dish.restaurant.id){
      this._restModalService.open(this.removeRestaurantFromCartModal);
    }else{
      //console.log((<HTMLInputElement>document.getElementById('specialInstruction')).value);
      const cartItem:Cart = {
        id : 0,
        quantity : this.dishQuantityToBeAddedToCart,
        users : {id : +localStorage.getItem('userId')!},
        dishes : dish,
        instruction : (<HTMLInputElement>document.getElementById('specialInstruction')).value
      }
      this._restService.addCartItem(cartItem);
      this.dishQuantityToBeAddedToCart = 1; //reset to 1 for other dishes
    }
    //console.log(this._restService.cartwithCRUD$.subscribe({}));
  }

  increaseDishQuantityInCart(dish:Dish) {
    let yesDish = this.cartItems.find(cart => JSON.stringify(cart.dishes) === JSON.stringify(dish));
    if(yesDish){
      yesDish.quantity += 1;
      this._restService.updateCartItem(yesDish);
    }
  }

  decreaseDishQuantityInCart(dish:Dish) {
    if (this.dishQuantityToBeAddedToCart > 1) {
      this.dishQuantityToBeAddedToCart--;
    }

    let yesDish = this.cartItems.find(cart => JSON.stringify(cart.dishes) === JSON.stringify(dish));
    if(yesDish && yesDish.quantity > 1){
      yesDish.quantity -= 1;
      this._restService.updateCartItem(yesDish);
    }else if(yesDish && yesDish.quantity == 1){
      this._restService.deleteCartItem(yesDish);
    }
  }

  /* updateCart(){
    //this._restService.updateCartItem()
  }

  deleteCartItem(dishToBeDeleted:Dish){
    //this._restService.emptyCart(dishToBeDeleted);
    this._restModalService.dismissAll('addDishModal');
  } */

  emptyCart(){
    let yesDish = this.cartItems[0];
    this._restService.emptyCart(yesDish!);
    this._restModalService.dismissAll(this.removeRestaurantFromCartModal);
    //this._restModalService.dismissAll('addDishModal');
  }

  verifyIfDishInCart(dish:Dish):boolean{
    const yesDish = this.cartItems.find(cart => JSON.stringify(cart.dishes) === JSON.stringify(dish));
    return yesDish ? true : false;
  }

  getDishQuantityFromCart(dish:Dish):number{
    const yesDish = this.cartItems.find(cart => JSON.stringify(cart.dishes) === JSON.stringify(dish));
    return yesDish?.quantity ? yesDish?.quantity : 0;
  }
  
  /* addToFavorites(dish : Dish){
    let favoriteELement = document.getElementById(`favorite${dish.dishId}`);
    //console.log(favoriteELement!.innerHTML);
    favoriteELement!.innerHTML = `<i class="fa fa-heart fa-xl" style="color: #e66b28;font-size: xx-large;"></i>`;
  } */

}
