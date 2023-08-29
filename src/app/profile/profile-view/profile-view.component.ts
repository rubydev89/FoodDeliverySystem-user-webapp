import { NumberValidator } from './../../shared/NumberValidator';
import { Address } from './../../model/address';
import { User } from './../../model/user';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControlName, FormGroup, Validators, FormBuilder } from '@angular/forms';
import { Subject, Subscription, Observable, merge, debounceTime, takeUntil, fromEvent, combineLatest } from 'rxjs';
import { GenericValidator } from './../../shared/generic-validator';
import { UserService } from 'src/app/services/user.service';
import { Component, OnInit, ElementRef, ViewChildren, ChangeDetectorRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-profile-view',
  templateUrl: './profile-view.component.html',
  styleUrls: ['./profile-view.component.css']
})
export class ProfileViewComponent implements OnInit {
  @ViewChildren(FormControlName, { read: ElementRef }) formInputElements!: ElementRef[];

  private _destroy$ = new Subject<void>();
  private _userSubscription!: Subscription;

  // For validations
  displayMessage: { [key: string]: string } = {};
  private _genericValidator: GenericValidator;
  private _validationMessages : { [key: string]: { [key: string]: string } };

  userDataForm! : FormGroup;
  addressListForm! : FormGroup;
  loggedInUserData!:User|null;
  loggedInUserAddress!:Address[];
  addressToBeDeleted!:Address;
  userInfoUpdateSuccess:boolean = false;
  addressUpdateSuccess:boolean = false;

  defaultProfileImgUrl = '../../../assets/img/profile-new-user.png';

  constructor(private _userService : UserService, private _route : ActivatedRoute, private _router : Router, private _fb : FormBuilder, private _datePipe: DatePipe, private _modalService : NgbModal, private _cdRef: ChangeDetectorRef) {
    //this._userService.setLoggedInUserId(+localStorage.getItem('userId')!);
    /* this._userSubscription = this._userService.userwithCRUD$
    .pipe(takeUntil(this._destroy$))
    .subscribe({
      next : data => {
        this.loggedInUserData = data;
        console.log(`View Profile - data is : ${JSON.stringify(data)}`);
      },
      error : err => {
        console.log(`View Profile - err is : ${JSON.stringify(err)}`);}
    }); */


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
      password : {
        required : 'Password cannot be blank'
      },
      first_name : {
        required : 'First name cannot be blank'
      }
    };
    this._genericValidator = new GenericValidator(this._validationMessages);
   }

  ngOnInit(): void {
    this.initializeNewAddressForm();
    this.initializeUserDataForm();
    this.addressUpdateSuccess = false;
    this.userInfoUpdateSuccess = false;
    let userId:number = 0;
    this._route.params.subscribe(params => {
      userId = +params['id'];
    });

    if(userId != +localStorage.getItem('userId')!){
      this._router.navigate([`/user/${+localStorage.getItem('userId')!}/profile`]);
    }

    this._userService.setLoggedInUserId(+localStorage.getItem('userId')!);
    this._userSubscription = combineLatest([this._userService.userwithCRUD$,this._userService.addressData$])  
    .subscribe({
      next: data => {
        if(data.length>0)
        {
          //console.log(`combined user and address data is : ${JSON.stringify(data)}`)
          this.loggedInUserData = data[0];
          this.loggedInUserAddress = data[1];
          this.populateUserDataForm();
          //this.populateNewAddressForm();
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

    merge(this.userDataForm.valueChanges, ...controlBlurs).pipe(
      debounceTime(800)
    ).subscribe(() => {
      this.displayMessage = this._genericValidator.processMessages(this.userDataForm);
    });

    merge(this.addressListForm.valueChanges, ...controlBlurs).pipe(
      debounceTime(800)
    ).subscribe(() => {
      this.displayMessage = this._genericValidator.processMessages(this.addressListForm);
    });
  }

  ngOnDestroy() {
    // Unsubscribe from the subscription to prevent memory leaks
    this._userSubscription.unsubscribe();
    this._destroy$.next();
    this._destroy$.complete();
  }

  initializeNewAddressForm(){
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
    //this.addressUpdated = false;
  }

  initializeUserDataForm(){
    this.userDataForm = this._fb.group({
      id : [0],
      first_name : ['', Validators.required],
      last_name : [''],
      email : ['', [Validators.required,Validators.email]],
      password : ['', Validators.required],
      status: [''],
      imgUrl : [''],
      created_on : ['',Validators.required]
      /* address : this._fb.group({
        id: '',
        street: '',
        city: '',
        state: '',
        country: '',
        pincode: '',
        type : ''
      }) */
    });
  }

  populateNewAddressForm(address:Address){
    if(this.addressListForm){
      this.addressListForm.reset();
    }
    this.addressListForm = this._fb.group({
        id : address.id,
        street : address.street,
        city : address.city,
        pincode : address.pincode,
        state : address.state,
        country : address.country,
        phone : address.phone,
        type : address.type,
        instruction : address.instruction ? address.instruction : ''
      });
  }

  populateUserDataForm(){
    if(this.userDataForm){
      this.userDataForm.reset();
    }
    
    if(this.loggedInUserData){
      this.userDataForm.patchValue({
      id : this.loggedInUserData.id,
      first_name : this.loggedInUserData.first_name,
      last_name : this.loggedInUserData.last_name,
      email : this.loggedInUserData.email,
      password : this.loggedInUserData.password,
      status: this.loggedInUserData.status,
      imgUrl : this.loggedInUserData.imgUrl,
      created_on : this._datePipe.transform(this.loggedInUserData!.created_on!, 'MMM d,y')
    });}
  }

  scrollToSection(sectionId: string) {
    const section = document.getElementById(sectionId);
    //console.log(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }

  updateUserData(){
    if(this.userDataForm.valid){
      let user:User = {...this.userDataForm.value};
      user.created_on = this.loggedInUserData!.created_on;
      //console.log(`address is : ${JSON.stringify(user)}`);
      this._userService.updateUserItem(user);
      //this._userService.setLoggedInUserId(this.loggedInUserData.id);
      this._cdRef.detectChanges();
      this.loggedInUserData = user;
      this.populateUserDataForm();
      this.userInfoUpdateSuccess = true;
    }
    /* if(this.addressListForm.dirty && this.addressListForm.valid)
      this.updateAddress(); */
  }

  openAddressUpdateModal(modalRef:any,address:Address|null){
    this._modalService.open(modalRef);
    if(address)
      this.populateNewAddressForm(address);
    else 
      this.initializeNewAddressForm();
    
    const controlBlurs: Observable<any>[] = this.formInputElements
    .map((formControl: ElementRef) => fromEvent(formControl.nativeElement, 'blur'));
    merge(this.addressListForm.valueChanges, ...controlBlurs).pipe(
      debounceTime(800)
    ).subscribe(() => {
      this.displayMessage = this._genericValidator.processMessages(this.addressListForm);
    });
  }

  openAddressDeleteModal(modalRef:any,address:Address){
    this.addressToBeDeleted = address;
    this._modalService.open(modalRef);
    //this.populateNewAddressForm(address);
  }

  updateAddress(modal:any){
    let address:Address = {...this.addressListForm.value};
    address.users = {id : this.loggedInUserData!.id};
    if(this.addressListForm.valid)
    {
      if(address.id == 0){
        address = {...address, id:null}
        console.log(`address is : ${JSON.stringify(address)}`);
        this._userService.updateAddress(address,this.loggedInUserData!.id!,'add').subscribe({ 
          next : (data) => {
            //this.addressUpdated = true;
            this.loggedInUserAddress.push(data);
            //console.log(`updated address is: ${this.loggedInUserAddress}`);
          },
          error : err => {
            //this.addressUpdated = false;
            console.log(err);
          }
        });
      }
      else{
        this._userService.updateAddress(address,address.id!,'update').subscribe({ 
          next : (data) => {
            const index = this.loggedInUserAddress.findIndex((obj) => obj.id === data.id);
            this.addressUpdateSuccess = true;
            this.loggedInUserAddress.splice(index,1,data);
            //console.log(`updated address is: ${this.loggedInUserAddress}`);
          },
          error : err => {
            //this.addressUpdated = false;
            console.log(err);
          }
        });
      }
    }
      
    this._userService.setLoggedInUserId(this.loggedInUserData!.id);
    this._modalService.dismissAll(modal);
  }

  deleteAddressForUser(modal:any){
    let address:Address = {...this.addressToBeDeleted};
    //address.users = {id : this.loggedInUserData.id};
    //console.log(`address is : ${JSON.stringify(address)}`);
    this._userService.deleteAddress(address).subscribe({ 
      next : (data) => {
        const index = this.loggedInUserAddress.findIndex((obj) => obj.id === data.id);
        //this.addressUpdated = true;
        this.loggedInUserAddress.splice(index,1);
        //console.log(`updated address is: ${this.loggedInUserAddress}`);
      },
      error : err => {
        //this.addressUpdated = false;
        console.log(err);
      }
    }); 
    this._userService.setLoggedInUserId(this.loggedInUserData!.id);
    this._modalService.dismissAll(modal);
  }

}
