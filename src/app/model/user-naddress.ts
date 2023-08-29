import { Address } from './address';
import { User } from './user';
export interface UserNAddress {
    user : User,
    addresses? : Address[]
}
