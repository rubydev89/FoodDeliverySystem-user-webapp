import { UserNAddress } from './../model/user-naddress';
import { Action } from './../model/action';
import { Address } from './../model/address';
import { environment } from './../../environments/environment.prod';
import { User } from './../model/user';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, switchMap, BehaviorSubject, EMPTY, shareReplay, Subject, merge, concatMap, scan, map, tap, of, combineLatest } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private _httpClient:HttpClient) { }

  private _headers = new HttpHeaders({'Content-Type' : 'application/json'});

  loggedInUserData!:User; 
  registeredUser!:User;

  loggedInUserId!:number;
  private _loggedInUserSubject = new BehaviorSubject<number | null>(null);
  loggedInUserId$ = this._loggedInUserSubject.asObservable();
  
  setLoggedInUserId(userId: number | null) {
    //console.log(`userId : ${userId}`);
    if(userId && userId > 0){
      this.loggedInUserId = userId;
      this._loggedInUserSubject.next(userId);
    }
    //console.log(`userId : ${this.loggedInUserId}`);
  }

  getLoggedInUserId():number{
    return this.loggedInUserId;
  }

  userDetails$ = this.loggedInUserId$.pipe(
    switchMap(userId => {
      if(userId === null){
        return EMPTY;
      }
      return this._httpClient.get<User>(`${environment.baseUrl}/v1/user/${this.loggedInUserId}`)
      .pipe(
        shareReplay(1)
      );
    })
  );

  addressData$ = this.loggedInUserId$.pipe(
    switchMap(userId => {
      if(userId === null){
        return EMPTY;
      }
      return this._httpClient.get<Address[]>(`${environment.baseUrl}/v1/user/${this.loggedInUserId}/address`)
      .pipe(
        shareReplay(1)
      )
      //.pipe(tap (data => console.log(`address data from service is: ${JSON.stringify(data)}`)));
    })
  );

  private _userModifiedSubject = new Subject<Action<User>>();
  userModifiedAction$ = this._userModifiedSubject.asObservable();

  userwithCRUD$ = merge(
    this.userDetails$,
    this.userModifiedAction$
    .pipe(
      concatMap(operation => this.saveUser(operation))
    )).pipe(
      /* scan((acc, value) => 
        (value instanceof Object) ? { ...acc, ...value } : value, {} as User), */
      //shareReplay(1),
      //tap(data => console.log(`userwithCRUD : ${JSON.stringify(data)}`))
  );

  addUserItem(newUserItem: User): Observable<User|null> {
    //newUserItem = newUserItem;
    //console.log(`inside addUserItem() ${JSON.stringify(newUserItem)}`);
    return this.saveUser({
      item: newUserItem,
      action: 'add'
    });
  }

  deleteUserItem(selectedUserItem: User): void {
    //console.log(`inside addUserItem() ${JSON.stringify(newUserItem)}`);
    this._userModifiedSubject.next({
      item: selectedUserItem,
      action: 'delete'
    });
  }

  updateUserItem(selectedUserItem: User): void {
    // Update a copy of the selected UserItem
    //console.log(`inside updateUserItem() ${JSON.stringify(selectedUserItem)}`);
    this._userModifiedSubject.next({
      item: selectedUserItem,
      action: 'update'
    });
  }
  
  saveUser(operation: Action<User>): Observable<User|null> {
    const user = operation.item;
    //console.log('saveUser', JSON.stringify(operation.item));
    if (operation.action === 'add') {
      
      return this._httpClient.post<User>(`${environment.baseUrl}/v1/user/register`, user, { headers: this._headers })
      /* .pipe(
        map(user => ({ item: user, action: operation.action }))
      ) */;
    }
    if (operation.action === 'update') {
      const url = `${environment.baseUrl}/v1/user/${user!.id}`;
      return this._httpClient.put<User>(url, user, { headers: this._headers })
        /* .pipe(
          //tap(data => console.log('Updated UserItem: ' + JSON.stringify(data))),
          // Return the original UserItem so it can replace the UserItem in the array
          map(() => ({ item: user, action: operation.action }))
        ) */;
    }
    // If there is no operation, return the UserItem
    return of(operation.item);
  }

  userLogin(userReq:any):Observable<any> {
    return this._httpClient.post<any>(`${environment.baseUrl}/v1/user/login`, userReq, {headers: this._headers})
    /* .pipe(
      switchMap((data) => {
        //console.log(JSON.stringify(data));
        return this._httpClient.get<User>(`${environment.baseUrl}/v1/user/${data.id}`);
      })
    ); */
  }

  userAddressRegister(userReq:Address,userId:number|null):Observable<Address[]>{
    return this._httpClient.post<Address[]>(`${environment.baseUrl}/v1/user/${userId}/register/address`, userReq);
  }

  isLoggedIn():boolean {
    let user = localStorage.getItem('userId');
    let status = localStorage.getItem('status');
    return !(!user && !status);
  }

  updateAddress(addressData : Address,id : number, action:string):Observable<Address>{
    if(action === 'update')
      return this._httpClient.put<Address>(`${environment.baseUrl}/v1/address/${id}`, addressData)
    else
      return this._httpClient.post<Address>(`${environment.baseUrl}/v1/user/${id}/address`, addressData);
  }

  deleteAddress(addressData : Address){
    return this._httpClient.delete<Address>(`${environment.baseUrl}/v1/address/${addressData.id}`,{headers:this._headers});
  }

  onLogOut(userId:number){
    //console.log(`inside logout- id : ${userId}`);
    return this._httpClient.post<any>(`${environment.baseUrl}/v1/user/${userId}/logout`,{id:userId},{headers:this._headers})
    //.pipe(tap(data => console.log(`logout response : ${data}`)));
  }
}
