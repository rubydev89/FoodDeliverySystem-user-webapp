import { Dish } from './../model/dish';
import { Cart } from './../model/cart';
import { environment } from './../../environments/environment';
import { Restaurant } from './../model/restaurant';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject, merge, concatMap, Observable, map, tap, of, scan, shareReplay, BehaviorSubject, combineLatest, catchError, switchMap, EMPTY } from 'rxjs';
import { Action } from '../model/action';

@Injectable({
  providedIn: 'root'
})
export class RestaurantService {

  constructor(private _httpClient:HttpClient) { }

  private _headers = new HttpHeaders({'Content-Type' : 'application/json'});

  cartElement!:Cart[];
  cartItemNumber!:number;

  /** variable for search restaurant in header */
  private _filterRestaurantBy: string = '';
  setFilterRestaurantBy(value: string) {
    this._filterRestaurantBy = value;
    this._filterRestNameSubject.next(value.toLocaleLowerCase());
  }
  getFilterRestaurantBy(): string {
    return this._filterRestaurantBy;
  }

  allRestaurant$ = this._httpClient.get<Restaurant[]>(`${environment.baseUrl}/v1/restaurant`,{headers:this._headers});

  private _filterRestNameSubject = new BehaviorSubject<string>('');
  filterRestNameAction$ = this._filterRestNameSubject.asObservable();
  allFilteredRestaurants$ = combineLatest([this.allRestaurant$,this.filterRestNameAction$]).pipe(
    map(([restaurants, filterRestName]) => {
      return restaurants.filter(rest => 
        {
          //console.log(filterRestName ? rest.description?.toLocaleLowerCase().includes(filterRestName.toLocaleLowerCase()) || rest.category?.toLocaleLowerCase().includes(filterRestName.toLocaleLowerCase()) : true);
          return filterRestName ? rest.name.toLocaleLowerCase().includes(filterRestName.toLocaleLowerCase()) || rest.description?.toLocaleLowerCase().includes(filterRestName.toLocaleLowerCase()) || rest.category?.toLocaleLowerCase().includes(filterRestName.toLocaleLowerCase()) : true
        })
    }),
    shareReplay(1)
  ); 

  loggedInUserId!:number;
  setLoggedInUserId(userId: number | null) {
    //console.log(`userId : ${userId}`);
    if(userId && userId > 0){
      this._loggedInUserSubject.next(userId);
      this.loggedInUserId = userId;
    }
    //this._filterRestNameSubject.next(value.toLocaleLowerCase());
  }

  getLoggedInUserId():number{
    return this.loggedInUserId;
  }

  private _loggedInUserSubject = new BehaviorSubject<number | null>(null);
  userCartAction$ = this._loggedInUserSubject.asObservable();

  allCartItems$ = this.userCartAction$.pipe(
    switchMap(userId => {
      if(userId === null){
        return EMPTY;
      }
      return this._httpClient.get<Cart[]>(`${environment.baseUrl}/v1/user/${+localStorage.getItem('userId')!}/cartitems`,{headers:this._headers})
      .pipe(
        shareReplay(1)
        ,map(
          cartItem => {
            this.cartElement = cartItem;
            this.cartItemNumber = cartItem.length;
            return cartItem;
          }
        )
      );
    })
  );
  //.pipe(tap(data => console.log(`Order Data : ${JSON.stringify(data)}`)));

  /* allCartItems$ = this._httpClient.get<Cart[]>(`${environment.baseUrl}/v1/user/${+localStorage.getItem('userId')!}/cartitems`,{headers:this._headers}).
    pipe(
      shareReplay(1),
      //tap(data => console.log(`allCartItems : ${JSON.stringify(data)}`))
    ); */

  private cartModifiedSubject = new Subject<Action<Cart>>();
  cartModifiedAction$ = this.cartModifiedSubject.asObservable();

  cartwithCRUD$ = merge(
    this.allCartItems$,
    this.cartModifiedAction$
    .pipe(
      concatMap(operation => this.saveCart(operation))
    )).pipe(
      scan((acc, value) => 
        (value instanceof Array) ? [...value] : this.modifyCart(acc, value), [] as Cart[])
      ,shareReplay(1)
      //,tap(data => console.log(`cartwithCRUD : ${JSON.stringify(data)}`))
  );

  addCartItem(newCartItem: Cart): void {
    //newCartItem = newCartItem;
    //console.log(`inside addCartItem() ${newCartItem}`);
    this.cartModifiedSubject.next({
      item: newCartItem,
      action: 'add'
    });
    this.setLoggedInUserId(newCartItem.users.id);
  }

  deleteCartItem(selectedCartItem: Cart): void {
    this.cartModifiedSubject.next({
      item: selectedCartItem,
      action: 'delete'
    });
    this.setLoggedInUserId(selectedCartItem.users.id);
  }

  emptyCart(selectedCartItem: Cart): void {
    this.cartModifiedSubject.next({
      item: selectedCartItem,
      action: 'empty'
    });
    this.setLoggedInUserId(selectedCartItem.users.id);
  }

  updateCartItem(selectedCartItem: Cart): void {
    // Update a copy of the selected cartItem
    this.cartModifiedSubject.next({
      item: selectedCartItem,
      action: 'update'
    });
    this.setLoggedInUserId(selectedCartItem.users.id);
  }
  
  saveCart(operation: Action<Cart>): Observable<Action<Cart>> {
    const cart = operation.item;
    if (operation.action === 'add') {
      // Assigning the id to null is required for the inmemory Web API
      // Return the cartItem from the server
      return this._httpClient.post<Cart>(`${environment.baseUrl}/v1/user/${+localStorage.getItem('userId')!}/cartitems`, { ...cart, id: null }, { headers: this._headers })
        .pipe(
          map(cart => ({ item: cart, action: operation.action }))
        );
    }
    if (operation.action === 'delete') {
      const url = `${environment.baseUrl}/v1/cartitems/${cart!.id}`;
      return this._httpClient.delete<Cart>(url, { headers: this._headers })
        .pipe(
          // Return the original cartItem so it can be removed from the array
          map(() => ({ item: cart, action: operation.action }))
        );
    }
    if (operation.action === 'update') {
      const url = `${environment.baseUrl}/v1/cartitems/${cart!.id}`;
      return this._httpClient.put<Cart>(url, cart, { headers: this._headers })
        .pipe(
          //tap(data => console.log('Updated cartItem: ' + JSON.stringify(data))),
          // Return the original cartItem so it can replace the cartItem in the array
          map(() => ({ item: cart, action: operation.action }))
        );
    }
    if (operation.action === 'empty') {
      const url = `${environment.baseUrl}/v1/user/${+localStorage.getItem('userId')!}/cartitems`;
      return this._httpClient.delete<Cart>(url, { headers: this._headers })
        .pipe(
          // Return the original cartItem so it can be removed from the array
          map(() => ({ item: cart, action: operation.action }))
        );
    }
    // If there is no operation, return the cartItem
    return of(operation);
  }

  modifyCart(cart: Cart[], operation: Action<Cart>): Cart[] {
    if (operation.action === 'add') {
      // Return a new array with the added cartItem pushed to it
      return [...cart, operation.item!];
    } else if (operation.action === 'update') {
      // Return a new array with the updated cartItem replaced
      //console.log('after modify', operation.item);
      return cart.map(cart => cart!.id === operation.item!.id ? operation.item! : cart)
    } else if (operation.action === 'delete') {
      // Filter out the deleted cartItem
      return cart.filter(cart => cart.id !== operation.item!.id);
    }else if (operation.action === 'empty') {
      // Filter out the deleted cartItem
      //console.log(`cart : ${cart}`);
      let emptyCart:Cart[] = [];
      return emptyCart;
    }
    return [...cart];
  }

  allRestCategfories$ = this._httpClient.get<string[]>(`${environment.baseUrl}/v1/restaurant/categories`,{headers:this._headers}).pipe(
    //tap(d => console.log(`restCategory is : ${d}`))
  );

  /** variable for search Dish in header */
  private _filterDishBy: string = '';
  setFilterDishBy(value: string) {
    this._filterDishBy = value;
    this._filterDishNameSubject.next(value.toLocaleLowerCase());
  }
  getFilterDishBy(): string {
    return this._filterDishBy;
  }

  selectedRestaurantId!:number;
  private _selectedRestaurantSubject = new BehaviorSubject<number | null>(null);
  selectedRestaurantId$ = this._selectedRestaurantSubject.asObservable();

  allDish$ = this.selectedRestaurantId$.pipe(
    switchMap(restId => {
      if(restId === null){
        return EMPTY;
      }
      return this._httpClient.get<Dish[]>(`${environment.baseUrl}/v1/restaurant/${restId}/dishes`,{headers:this._headers});
    })
  );

  restaurantWithDishes$ = combineLatest([
    this.allRestaurant$,
    this.allDish$
  ]).pipe(
    map(([restaurants, dishes]) =>
      restaurants.map(restaurant => ({
        restaurant : {...restaurant},
        //price: restaurant.price ? restaurant.price * 1.5 : 0,
        dish: dishes.find(c => restaurant.id === c.restaurant.id)
       //, searchKey: [restaurant.name]
      } as {restaurant:Restaurant, dish:Dish}))
    ),
    shareReplay(1)
    ,tap(c => console.log(JSON.stringify(c)))
  );

  selectedRestaurantData$ = this.selectedRestaurantId$.pipe(
    switchMap(restId => {
      if(restId === null){
        return EMPTY;
      }
      return this._httpClient.get<Restaurant>(`${environment.baseUrl}/v1/restaurant/${restId}`,{headers:this._headers});
      //this._httpClient.get<Dish[]>(`${environment.baseUrl}/v1/restaurant/${restId}/dishes`,{headers:this._headers});
    })
  );

  setSelectedRestaurantId(restId: number | null) {
    this._selectedRestaurantSubject.next(restId);
    if(restId)
      this.selectedRestaurantId = restId;
    //this._filterRestNameSubject.next(value.toLocaleLowerCase());
  }

  getSelectedRestaurantId():number{
    return this.selectedRestaurantId;
  }
  
  //this._httpClient.get<Dish[]>(`${environment.baseUrl}/v1/restaurant/${this.getOrderFromRestaurant() ? this.getOrderFromRestaurant().id : 0}/dishes`,{headers:this._headers});

  private _filterDishNameSubject = new BehaviorSubject<string>('');
  filterDishNameAction$ = this._filterDishNameSubject.asObservable();
  allFilteredDishes$ = combineLatest([this.allDish$,this.filterDishNameAction$]).pipe(
    map(([dishes, filterDishName]) => {
      return dishes.filter(dish => 
        {
          //console.log(filterDishName ? dish.description?.toLocaleLowerCase().includes(filterDishName.toLocaleLowerCase()) || dish.category?.toLocaleLowerCase().includes(filterDishName.toLocaleLowerCase()) : true);
          return filterDishName ? dish.dish_name.toLocaleLowerCase().includes(filterDishName.toLocaleLowerCase()) || dish.description?.toLocaleLowerCase().includes(filterDishName.toLocaleLowerCase()) || dish.category?.toLocaleLowerCase().includes(filterDishName.toLocaleLowerCase()) : true
        })
    }),
    shareReplay(1)
  ); 

  /* Get Dishes By Restaurant Id*/
  getDishesByRestaurantId(restId:number):Observable<Dish[]> {
    return this._httpClient.get<Dish[]>(`${environment.baseUrl}/v1/restaurant/${restId}/dishes`,{headers:this._headers});
  }

  /* Get Categories of Dishes By Restaurant Id*/
  getDishCategoryByRestaurantId(restId:number):Observable<string[]> {
    return this._httpClient.get<string[]>(`${environment.baseUrl}/v1/restaurant/${restId}/dishes/categories`,{headers:this._headers});
  }
}
