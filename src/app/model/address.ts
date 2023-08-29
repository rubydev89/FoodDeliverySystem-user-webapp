import { User } from './user';
export interface Address {
    id:number|null,
    street? : string,
    city? : string,
    state? : string,
    country? : string,
    pincode? : number,
    phone? : number,
    type? : string,
    instruction? : string,
    users? : User
}
