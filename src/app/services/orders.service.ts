import { OrderItems } from './../model/order-items';
import { Action } from './../model/action';
import { environment } from './../../environments/environment';
import { Orders } from './../model/orders';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, switchMap, EMPTY, shareReplay, tap, merge, Subject, concatMap, scan, Observable, map, of, toArray, forkJoin } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {

  constructor(private _httpClient : HttpClient) { }

  private _headers = new HttpHeaders({'Content-Type' : 'application/json'});

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
  loggedInUserId$ = this._loggedInUserSubject.asObservable();

  orderItemsOfOrder$!:OrderItems[];

  orderData$ = this.loggedInUserId$.pipe(
    switchMap(userId => {
      if(userId === null){
        return EMPTY;
      }
      return this._httpClient.get<Orders[]>(`${environment.baseUrl}/v1/user/${this.getLoggedInUserId()}/orders`, { headers: this._headers }).pipe(
        switchMap(orders => {
          const orderItemsObservables: Observable<OrderItems[]>[] = [];
  
          orders.forEach(orderData => {
            const orderItemsObservable = this._httpClient.get<OrderItems[]>(`${environment.baseUrl}/v1/orders/${orderData.orderId}/orderitems`, { headers: this._headers });
            orderItemsObservables.push(orderItemsObservable);
          });
  
          return forkJoin(orderItemsObservables).pipe(
            map(orderItemsArrays => {
              // Now you have an array of order items arrays, where each array corresponds to order items for a specific order
              // You can associate the order items with their respective orders here and return the result
              // For example:
              return orders.map((order, index) => ({ ...order, orderItems: orderItemsArrays[index] }));
            })
          );
        })
      )
      .pipe(
        shareReplay(1)
      )
    })
  )
  .pipe(tap(data => console.log(`Order Data : ${JSON.stringify(data)}`)));

  allOrderswithItems$ = this.loggedInUserId$.pipe(
    switchMap(userId => {
      if(userId === null){
        return EMPTY;
      }
      return this._httpClient.get<OrderItems[]>(`${environment.baseUrl}/v1/user/${this.getLoggedInUserId()}/orderitems`,{headers:this._headers})
      .pipe(
        shareReplay(1)
      );
    })
  )
  //.pipe(tap(data => console.log(`Order Data with Items: ${JSON.stringify(data)}`)));

  private ordersModifiedSubject = new Subject<Action<Orders>>();
  ordersModifiedAction$ = this.ordersModifiedSubject.asObservable();

  orderDataCRUD$ = merge(
    this.orderData$,
    this.ordersModifiedAction$
    .pipe(
      concatMap(operation => this.saveOrders(operation))
    ).pipe(
      scan((acc, value) => 
        (value instanceof Array) ? [...value] : this.modifyOrders(acc, value), [] as Orders[])
      ,shareReplay(1)
      //,tap(data => console.log(`orderDataCRUD : ${JSON.stringify(data)}`))
  ));

  addOrderData(newOrderData: Orders): Observable<Action<Orders>> {
    //newOrderData = newOrderData;
    console.log(`inside addOrderData() ${newOrderData}`);
    return this.saveOrders({
      item: newOrderData,
      action: 'add'
    });
  }

  updateOrderData(selectedOrderData: Orders): void {
    // Update a copy of the selected OrderData
    this.ordersModifiedSubject.next({
      item: selectedOrderData,
      action: 'update'
    });
  }
  
  saveOrders(operation: Action<Orders>): Observable<Action<Orders>> {
    const orders = operation.item;
    if (operation.action === 'add') {
      // Assigning the id to null is required for the inmemory Web API
      // Return the OrderData from the server
      return this._httpClient.post<Orders>(`${environment.baseUrl}/v1/user/${+localStorage.getItem('userId')!}/orders`, { ...orders, orderId: null }, { headers: this._headers })
        .pipe(
          map(orders => ({ item: orders, action: operation.action }))
        );
    }
    if (operation.action === 'update') {
      const url = `${environment.baseUrl}/v1/orders/${orders!.orderId}`;
      return this._httpClient.put<Orders>(url, orders, { headers: this._headers })
        .pipe(
          //tap(data => console.log('Updated OrderData: ' + JSON.stringify(data))),
          // Return the original OrderData so it can replace the OrderData in the array
          map(() => ({ item: orders, action: operation.action }))
        );
    }
    // If there is no operation, return the OrderData
    return of(operation);
  }

  modifyOrders(orders: Orders[], operation: Action<Orders>): Orders[] {
    if (operation.action === 'add') {
      // Return a new array with the added OrderData pushed to it
      return [...orders, operation.item!];
    } else if (operation.action === 'update') {
      // Return a new array with the updated OrderData replaced
      console.log('after modify', operation.item);
      return orders.map(orders => orders!.orderId === operation.item!.orderId ? operation.item! : orders)
    } 
    return [...orders];
  }

  getOrderItems(orderId:number):Observable<OrderItems[]>{
    return this._httpClient.get<OrderItems[]>(`${environment.baseUrl}/v1/orders/${orderId}/orderitems`, { headers: this._headers });
  }

  createNewOrderItem(orderItemData : OrderItems[], orderId:number):Observable<OrderItems[]>{
    return this._httpClient.post<OrderItems[]>(`${environment.baseUrl}/v1/orders/${orderId}/orderitems`, orderItemData, { headers: this._headers });
  }

}
