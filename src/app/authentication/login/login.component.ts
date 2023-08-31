import { NumberValidator } from './../../shared/NumberValidator';

import { Address } from './../../model/address';
import { UserService } from './../../services/user.service';
import { GenericValidator } from '../../shared/generic-validator';
import { User } from './../../model/user';
import { Component, ElementRef, OnInit, ViewChildren } from '@angular/core';
import { FormBuilder, FormControlName, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { debounceTime, fromEvent, merge, Observable, Subject, Subscription } from 'rxjs';
import { SubscriptionService } from 'src/app/services/subscription.service';

function emailMatcher(c : AbstractControl) : ValidationErrors | null {
  const emailControl = c.get('regEmail');
  const confirmEmailControl = c.get('confirmEmail');

  if(emailControl?.pristine || confirmEmailControl?.pristine){
    return null;
  }
  if(emailControl?.value === confirmEmailControl?.value)
    return null;
  
  return {'match':true};
}
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  @ViewChildren(FormControlName, { read: ElementRef }) formInputElements!: ElementRef[];

  activeId = 'login';

  loginForm!: FormGroup;
  registerForm!: FormGroup;
  validationErrMessage:string ="";
  cEmailvalidationErrMessage = "";

  userData:User| null = null;
  //addressData!:Address;

  /***** post login and register ***/
  errLoginMessage = '';
  errRegisterMessage = '';
  registerSuccess : boolean = false;
  
  private _validationMessages : { [key: string]: { [key: string]: string } };
  displayMessage: { [key: string]: string } = {};
  private genericValidator: GenericValidator;

  private _loginSub! : Subscription | null;
  private _registerSub! : Subscription | null;
  private _addSub! : Subscription | null;

  constructor(private _subscriptionService: SubscriptionService, private _forgotPasswordModal : NgbModal, private _router: Router , private _userService : UserService, private _formBuilder : FormBuilder) {
    this._validationMessages = {
      email : {
        required : 'Please enter your email',
        email : 'Please enter a valid email'
      },
      password : {
        required : 'Please enter your password'
      },
      confirmEmail : {
        match : 'Confirmation email does not match'
      },
      fullName : {
        required : 'Please enter your full name'
      },
      regEmail : {
        required : 'Please enter your email',
        email : 'Please enter a valid email'
      },
      regPassword : {
        required : 'Please enter your password'
      },
      street : {
        required : 'Please enter the street'
      },
      city : {
        required : 'Please enter the city'
      },
      state : {
        required : 'Please enter the state'
      },
      country : {
        required : 'Please enter the country'
      },
      pincode : {
        required : 'Please enter the pincode',
        pincodeLength : 'Please enter 5 digit pincode'
      },
      phone : {
        required : 'Please enter your phone',
        pattern : 'Please provide 10 digit phone number.'
      }
    };

    this.genericValidator = new GenericValidator(this._validationMessages);
   }

  active = 'login';

  ngOnInit(): void {
    this.errLoginMessage = '';
    this.errRegisterMessage = '';
    this.loginForm = this._formBuilder.group({
      email : ['',[Validators.required, Validators.email]],
      password : ['',Validators.required],
      rememberCheck : false
    });

    this.registerForm = this._formBuilder.group({
      first_name : ['',[Validators.required/* , Validators.pattern('^[a-zA-Z ]*$') */]],
      last_name : [''],
      email: this._formBuilder.group({
        regEmail : ['',[Validators.required, Validators.email]],
        confirmEmail : ['',[Validators.required]]
      },{ validators : emailMatcher}),
      password : ['',Validators.required],
      phone : ['',[Validators.required, Validators.pattern('^[1-9][0-9]{9}$')]],
      imgUrl : [''],
      address : this._formBuilder.group({
        street: ['',Validators.required],
        city: ['',Validators.required],
        state: ['',Validators.required],
        country: ['',Validators.required],
        pincode: ['',[Validators.required, NumberValidator.zipLengthValidator(5)]],
        type : ''
      })
    });
  }

  ngAfterViewInit(): void {
    // Watch for the blur event from any input element on the form.
    // This is required because the valueChanges does not provide notification on blur
    const controlBlurs: Observable<any>[] = this.formInputElements!
      .map((formControl: ElementRef) => fromEvent(formControl.nativeElement, 'blur'));

    // Merge the blur event observable with the valueChanges observable
    // so we only need to subscribe once.
    merge(this.loginForm.valueChanges, ...controlBlurs).pipe(
      debounceTime(800)
    ).subscribe(() => {
      this.displayMessage = this.genericValidator.processMessages(this.loginForm);
    });

    merge(this.registerForm.valueChanges, ...controlBlurs).pipe(
      debounceTime(800)
    ).subscribe(() => {
      this.displayMessage = this.genericValidator.processMessages(this.registerForm);
    });
  }

  ngOnDestroy() : void{
    this._loginSub!.unsubscribe();
    if(this._registerSub != null)this._registerSub!.unsubscribe();
    if(this._addSub != null)this._addSub!.unsubscribe();
  }

  onLogin(){
    ////console.log(`---- validateInput() : nav active id is : ${onLoginInputData.loginName}`);
    ////console.log(`---- onLogin() : formData is : ${this.loginForm}`);

    const userDataLogin = {
      "email" : this.loginForm.value.email,
      "password" : this.loginForm.value.password
    };

    /* this._userService.userLogin(userDataLogin)
      .subscribe({ 
        next : (response:any) => { 
          console.log(JSON.stringify(response.headers.get('Set-Cookie')));
          let responseHeaders = response.headers.keys().reduce((acc, key) => {
             //acc[key] = response.headers.get(key);
            return acc;
          }, {});
          
          // if(response.adminId != null) {
          //   localStorage.setItem('adminId', response.adminId.toLocaleString());
          //   localStorage.setItem('user', response.email);
          //   localStorage.setItem('status', 'loggedIn');
          //   this._router.navigateByUrl('/restaurants');
          // }
       }, 
       error : err => {
        this.errLoginMessage = err.error.message;
       }
      }); */

    this._loginSub = this._userService.userLogin(userDataLogin)
      .subscribe({ 
        next : (response:User) => { 
          
          
          if(response.id != null) {
            //localStorage.setItem('loggedInuserData', response.toString());
            //localStorage.setItem('user', response.email!);
            localStorage.setItem('userId', response.id.toLocaleString());
            localStorage.setItem('status', 'loggedIn');
            this._userService.setLoggedInUserId(response.id);
            this._router.navigateByUrl('/welcome');
          }
       }, 
       error : err => {
        this.errLoginMessage = err.error.message;
       }
      });

      this._subscriptionService.add(this._loginSub);
  }

  onRegister(){
    if (this.registerForm.valid) {
      if (this.registerForm.dirty) {
        ////console.log(this.registerForm.value);

        let addressData:Address = this.registerForm.value.address ? { ...this.registerForm.value.address } : null;
        addressData.phone = this.registerForm.value.phone ? this.registerForm.value.phone : null;
        ////console.log(addressData);

        this.registerForm.value.address = null;
        this.registerForm.value.phone = null;
        let user:User = {
          id : null,
          first_name : this.registerForm.value.first_name,
          last_name : this.registerForm.value.last_name,
          email : this.registerForm.value.email.regEmail,
          password : this.registerForm.value.password,
          status : 'active',
          imgUrl : '../../../assets/img/profile-new-user.png'
        };
        ////console.log(`user to be added is : ${JSON.stringify(user)}`);
        this._registerSub = this._userService.addUserItem(user).subscribe({
          next: (data) => {
            this.registerSuccess = true;
            this.onSaveComplete();
            //console.log(`registered data is: ${JSON.stringify(data)}`);
            addressData.users = {id : data!.id};
            this._addSub = this._userService.userAddressRegister(addressData,data!.id).subscribe({
              next : () => {
                //console.log(`registered address data is: ${JSON.stringify(data)}`);
              },
              error : err => this.errRegisterMessage = err.error.message
            });
            this._subscriptionService.add(this._addSub);
          },
          error: err => {
            this.registerSuccess = false;
            this.errRegisterMessage = err.error.message;
          }
        });
        this._subscriptionService.add(this._registerSub);
      } else {
        this.onSaveComplete();
      }
    } else {
      this.errRegisterMessage = 'Please correct the validation errors.';
    }
  }

  onSaveComplete(): void {
    // Reset the form to clear the flags
    this.registerForm.reset();
  }

  forgotPassword(modalRef:any){
    ////console.log(`----------- ${clientObject}`);    
    this._forgotPasswordModal.open(modalRef);
  }

  closeModel(modelRef:any) {
    this._forgotPasswordModal.dismissAll(modelRef);
  }
}
