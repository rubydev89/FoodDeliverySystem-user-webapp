import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService implements OnDestroy {

  constructor() { }

  private _destroy$ = new Subject<void>();

  add(subscription: any): void {
    this._destroy$.subscribe(subscription);
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
