import { Dish } from './dish';
import { User } from './user';
export interface Cart {
    id : number,
    quantity : number,
    instruction? : String,
    users : User,
    dishes : Dish
}
