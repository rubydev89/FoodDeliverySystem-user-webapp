import { OrderItems } from './../../model/order-items';
import { Orders } from './../../model/orders';
import { OrdersService } from './../../services/orders.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit {

  private _destroy$ = new Subject<void>();
  private _orderSubscription!: Subscription;

  /* ******** For Pagination ******* */
  page: number = 1;
  count: number = 0;
  tableSize: number = 3;
  //tableSizes: any = [3, 6, 9, 12];

  allOrderswithItem:any[] = [];
  
  get status(): boolean {
    return localStorage.getItem('status') ? true : false;
  }

  constructor(private _orderService : OrdersService) {

    this._orderService.setLoggedInUserId(+localStorage.getItem('userId')!);

  }

  ngOnInit(): void {
    if(this.status){
      this._orderSubscription = this._orderService.orderData$
      .pipe(takeUntil(this._destroy$))
      .subscribe(data => {
        this.allOrderswithItem = data;
        console.log('Orders component - data:', JSON.stringify(this.allOrderswithItem));
      });
    }
  }

  ngOnDestroy() {
    // Unsubscribe from the subscription to prevent memory leaks
    this._orderSubscription.unsubscribe();
    this._destroy$.next();
    this._destroy$.complete();
  }

  cancelOrder(){
    console.log(`inside cancelOrder()`);
  }

}
