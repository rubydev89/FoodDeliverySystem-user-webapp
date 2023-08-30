import { NgbCollapseModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OrdersService } from './../../services/orders.service';
import { Orders } from './../../model/orders';
import { OrderItems } from './../../model/order-items';
import { Address } from './../../model/address';
import { User } from './../../model/user';
import { NumberValidator } from './../../shared/NumberValidator';
import { FormGroup, Validators, FormBuilder, FormControlName } from '@angular/forms';
import { GenericValidator } from './../../shared/generic-validator';
import { Router, ActivatedRoute } from '@angular/router';
import { RestaurantService } from './../../services/restaurant.service';
import { Cart } from './../../model/cart';
import { Subject, Subscription, takeUntil, Observable, merge, debounceTime, fromEvent, switchMap, combineLatest } from 'rxjs';
import { Component, OnInit, ViewChild, ElementRef, ViewChildren, TemplateRef } from '@angular/core';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  @ViewChildren(FormControlName, { read: ElementRef }) formInputElements!: ElementRef[];
  @ViewChild('cartHeadingElement') cartHeadingElement!: ElementRef;
  @ViewChild('addressHeadingElement') addressHeadingElement!: ElementRef;
  @ViewChild('paymentHeadingElement') paymentHeadingElement!: ElementRef;
  @ViewChild('placeOrderHeadingElement') placeOrderHeadingElement!: ElementRef;
  @ViewChild('orderPlaced') orderPlaced!: TemplateRef<any>;
  

  private _destroy$ = new Subject<void>();
  private _cartSubscription!: Subscription;

  loggedInUserData!:User;
  loggedInUserAddress:Address[] = [];
  selectedAddressForOrder!:Address;
  addressUpdated:boolean = false;

  cartItems! : Cart[];
  cartSubTotalPrice!:number;

  newOrderData!:Orders|null;

  //Charges
  deliverCharge:number = 5;
  driverTipAmount:number = 0;
  tax:number = 0.1;
  taxAmount!:number;
  serviceFee:number = 0.15;
  serviceFeeAmount!:number;
  totalFinalAmount!:number;

  // For validations
  displayMessage: { [key: string]: string } = {};
  private _genericValidator: GenericValidator;
  private _validationMessages : { [key: string]: { [key: string]: string } };

  //restaurantInfo:Address | undefined | null;
  addressListForm!: FormGroup;

  paymentCardDetail!:FormGroup;
  paymentMethodSelected:string = '';
  paymentDetail!:any;
  addressToDeliver!:any;

  constructor(private _restService : RestaurantService, private _router : Router, private _fb : FormBuilder, private _userService : UserService, private _route : ActivatedRoute, private _orderService : OrdersService, private _checkoutModal : NgbModal) {
    this._cartSubscription = this._restService.cartwithCRUD$
      .pipe(takeUntil(this._destroy$))
      .subscribe(data => {
        this.cartItems = data;
        //console.log('Checkout component - cartItems:', this.cartItems);
        this.cartSubTotalPrice = data.reduce((acc, item) => acc + (item.dishes.price * item.quantity), 0);
        // Handle the data emitted by the observable
        //console.log('Checkout component - cartSubTotalPrice:', this.cartSubTotalPrice);
        this.taxAmount = this.cartSubTotalPrice * this.tax;
        this.serviceFeeAmount = this.cartSubTotalPrice * this.serviceFee;
        this.totalFinalAmount = this.cartSubTotalPrice + this.taxAmount + this.serviceFeeAmount + this.deliverCharge + this.driverTipAmount;
      });
    this._validationMessages = {
      street : {
        required : 'Please enter your street address',
      },
      city : {
        required : 'Please enter your city'
      },
      pincode : {
        required : 'Please enter the zip code',
        pincodeLength : 'Enter 5 digit Zip Code'
      },
      phone : {
        required : 'Please enter the phone number',
        pattern : 'Please provide 10 digit phone number.'
      },
      state : {
        required : 'Please enter your state'
        //pattern : 'Please provide 10 digit phone number.'
      },
      country : {
        required : 'Please enter your country'
      },
      nameOnCard :{
        required : 'Please enter the name on file'
      },
      cardNumber :{
        required : 'Please enter 12 digit card number',
        cardNumberLength : 'Please enter 12 digit card number'
      },
      cardExpirationDate :{
        required : 'Please enter card expiration date',
        pattern : 'Please enter date as MM/YY'
      },
      cvv :{
        required : 'Please enter your country',
        cvvLength : 'Please enter 3 digit cvv number'
      }
    };
    this._genericValidator = new GenericValidator(this._validationMessages);
  }

  ngOnInit(): void {
    //console.log(`user data :${this._userService.getLoggedInUserId()}`);
    this.initializeNewAddressForm();
    this.initializeNewCardForm();
    let userId:number = 0;
    this._route.params.subscribe(params => {
      userId = +params['id'];
    });

    if(userId != +localStorage.getItem('userId')!){
      this._router.navigate([`/user/${+localStorage.getItem('userId')!}/checkout`]);
    }

    this._userService.setLoggedInUserId(+localStorage.getItem('userId')!);
    combineLatest([this._userService.userDetails$,this._userService.addressData$])  
    .subscribe({
      next: data => {
        if(data.length>0)
        {
          this.loggedInUserData = data[0];
          this.loggedInUserAddress = data[1];
          this.selectedAddressForOrder = data[1][0];
          this.populateNewAddressForm();
        }
      }
    });
  }

  ngAfterViewInit(): void {
    // Watch for the blur event from any input element on the form.
    // This is required because the valueChanges does not provide notification on blur
    const controlBlurs: Observable<any>[] = this.formInputElements
      .map((formControl: ElementRef) => fromEvent(formControl.nativeElement, 'blur'));

    // Merge the blur event observable with the valueChanges observable
    // so we only need to subscribe once.

    merge(this.paymentCardDetail.valueChanges, ...controlBlurs).pipe(
      debounceTime(800)
    ).subscribe(value => {
      this.displayMessage = this._genericValidator.processMessages(this.paymentCardDetail);
    });

    merge(this.addressListForm.valueChanges, ...controlBlurs).pipe(
      debounceTime(800)
    ).subscribe(value => {
      this.displayMessage = this._genericValidator.processMessages(this.addressListForm);
    });
  }

  ngOnDestroy() {
    // Unsubscribe from the subscription to prevent memory leaks
    this._cartSubscription.unsubscribe();
    this._destroy$.next();
    this._destroy$.complete();
  }

  initializeNewAddressForm():void{
    this.addressListForm = this._fb.group({
      id : [0],
      street : ['', Validators.required],
      city : ['', Validators.required],
      pincode : ['', [Validators.required,NumberValidator.zipLengthValidator(5)]],
      state : ['', Validators.required],
      country : ['',[Validators.required]],
      phone : ['',[Validators.required, Validators.pattern('^[1-9][0-9]{9}$')]],
      type : [''],
      instruction : ['']
    });
    this.addressUpdated = false;
  }

  populateNewAddressForm():void{
    if(this.loggedInUserAddress.length > 0)
    {
      this.addressListForm.patchValue({
        id : this.loggedInUserAddress[0].id,
        street : this.loggedInUserAddress[0].street,
        city : this.loggedInUserAddress[0].city,
        pincode : this.loggedInUserAddress[0].pincode,
        state : this.loggedInUserAddress[0].state,
        country : this.loggedInUserAddress[0].country,
        phone : this.loggedInUserAddress[0].phone,
        type : this.loggedInUserAddress[0].type,
        instruction : this.loggedInUserAddress[0].instruction ? this.loggedInUserAddress[0].instruction : ''
      });
    }
  }

  initializeNewCardForm():void{
    this.paymentCardDetail = this._fb.group({
      nameOnCard : ['', Validators.required],
      cardNumber : ['', [Validators.required, NumberValidator.cardLengthValidator(12)]],
      cardExpirationDate : ['', [Validators.required,Validators.pattern('^(0[1-9]|1[012])\/(2[3-9]|[3-9][0-9])$')]],
      cvv : ['', [Validators.required,NumberValidator.cvvLengthValidator(3)]]
    });
  }

  increaseDishQuantityToBeAddedToCart(cartItem:Cart) {
    cartItem.quantity += 1;
    this._restService.updateCartItem(cartItem);
  }

  decreaseDishQuantityToBeAddedToCart(cartItem:Cart) {
    if(cartItem.quantity > 1){
      cartItem.quantity -= 1;
      this._restService.updateCartItem(cartItem);
    }else if(cartItem.quantity == 1){
      this._restService.deleteCartItem(cartItem);
    }
  }

  removeDishFromCart(cartItemToBeRemoved:Cart){
    this._restService.deleteCartItem(cartItemToBeRemoved);
  }

  toggleAccordion(fromElement:HTMLHeadingElement,toElement:HTMLHeadingElement): void {
    //console.log('Value from template reference:', fromElement);
    fromElement!.children[0].children[0]!.ariaExpanded = 'false'; // when element closed || accordion-item -> h2 -> button - aria-expanded :false & class added - 'collapsed'
    fromElement!.children[0].children[0]!.classList.add('collapsed');
    fromElement.children[1].classList.remove('show'); // when element closed || accordion-item ->  -> div - false & class remove - 'show'

    toElement!.children[0].children[0]!.ariaExpanded = 'true'; // when element closed || accordion-item -> h2 -> button - aria-expanded :true & class remove - 'collapsed'
    toElement!.children[0].children[0]!.classList.remove('collapsed');
    toElement.children[1].classList.add('show'); // when element closed || accordion-item ->  -> div -  class add - 'show'

  }

  /* openAllAccordion(){
    const item1Header = this.cartHeadingElement.nativeElement.querySelector('.accordion-button');
    const item2Header = this.addressHeadingElement.nativeElement.querySelector('.accordion-button');
    const item3Header = this.paymentHeadingElement.nativeElement.querySelector('.accordion-button');
    const item4Header = this.placeOrderHeadingElement.nativeElement.querySelector('.accordion-button');
  
    item1Header.click();
    item2Header.click();
    item3Header.click();
    item4Header.click();
  }
 */

  updateDriversTip(driverTipAmount:any){
    //console.log(isNaN(driverTipAmount.valueAsNumber));
    if(isNaN(driverTipAmount.valueAsNumber))
    {
      this.driverTipAmount = 0;
    }else
      this.driverTipAmount = driverTipAmount.valueAsNumber;
    this.totalFinalAmount = this.cartSubTotalPrice + this.taxAmount + this.serviceFeeAmount + this.deliverCharge + this.driverTipAmount;
    //this.driverTipAmount + this.cartSubTotalPrice + this.taxAmount + this.serviceFeeAmount;
  }

  addressSelect(address: Address){
    this.selectedAddressForOrder = address;
    //console.log(`on change selected address : ${this.selectedAddressForOrder}`)
  }

  updateAddress(){
    //let address:Address|null = this.selectedAddressForOrder;
    this.selectedAddressForOrder.users = {id : this.loggedInUserData.id};
    //console.log(`address is : ${JSON.stringify(this.selectedAddressForOrder)}`);
    if(this.loggedInUserAddress.length > 0)
      this._userService.updateAddress(this.selectedAddressForOrder!,this.selectedAddressForOrder!.id!,'update').subscribe({ 
        next : (data) => {
          const index = this.loggedInUserAddress.findIndex((obj) => obj.id === data.id);
          this.addressUpdated = true;
          this.loggedInUserAddress.splice(index,1,data);
          //console.log(`updated address is: ${this.loggedInUserAddress}`);
        },
        error : err => {
          this.addressUpdated = false;
          console.log(err);
        }
      });
    else {
      this.selectedAddressForOrder!.id = null;
        this._userService.updateAddress(this.selectedAddressForOrder,this.loggedInUserData.id!,'add').subscribe({ 
          next : (data) => {
            this.loggedInUserAddress.push(data);
            //console.log(`updated address is: ${this.loggedInUserAddress}`);
            this.addressUpdated = true;
          //this._userService.setLoggedInUserId()
          },
          error : err => {
            console.log(err);
            this.addressUpdated = false;
          //this.errorMessage = err.error.message;
          }
        });
      }

  }

  placeOrder(){
    /*********** Need to think of an address, currently we are not using address associated with delivery ****** */
    /* const address = this.selectedAddressForOrder;
    console.log(address); */
    //console.log(JSON.stringify(this.cartItems));
    let order : Orders = {
      orderId : null,
      totalItems : this.cartItems.length,
      itemsSubTotal : this.cartSubTotalPrice,
      taxNFees : this.taxAmount + this.serviceFee,
      deliveryCharges : this.deliverCharge,
      driverTip : this.driverTipAmount,
      totalAmount : this.totalFinalAmount,
      paymentStatus : 1,
      paymentStatusTitle : 'Payment successful'.toLocaleLowerCase(),
      paymentMethod : this.paymentMethodSelected === "PayPal" ? 1 : 2,
      paymentMethodTitle : this.paymentMethodSelected,
      instruction : this.selectedAddressForOrder.instruction,
      address : {id : this.selectedAddressForOrder.id},
      user : {id : this.loggedInUserData.id}, //+localStorage.getItem('userId')!},
      delivery : null
    }

    this._orderService.addOrderData(order).subscribe({
      next: (dataAction) => {
        //console.log(`order created is: ${JSON.stringify(dataAction)}`)
        this.newOrderData = dataAction.item;
        let order_items :OrderItems[] = [];
        this.cartItems.forEach(cartItem => {
          let item : OrderItems = {
            orderItemId : null,
            quantity : cartItem.quantity,
            itemTotalPrice : (cartItem.dishes.price * cartItem.quantity),
            instruction : cartItem.instruction!,
            order : dataAction.item!,
            dish : cartItem.dishes
          };
          order_items.push(item);
        });
        this._orderService.createNewOrderItem(order_items,dataAction.item?.orderId!).subscribe({
          next : (data) => {
            this._checkoutModal.open(this.orderPlaced);
            this._restService.emptyCart(this.cartItems[0]);
            //console.log(`order item created is: ${JSON.stringify(data)}`);
          },
          error : err => console.log(err)
        });
      },
      error: err => {
        console.log(err);
      }
    });

  }

  orderMore(){
    this._checkoutModal.dismissAll(this.orderPlaced);
    this._router.navigate([`/welcome`]);
  }

  trackOrder(){
    this._checkoutModal.dismissAll(this.orderPlaced);
    this._router.navigate([`/user/${this.loggedInUserData.id}/orders`]);
  }

  viewProfile(){
    this._router.navigate([`/user/${this.loggedInUserData.id}/profile`]);
  }

}
