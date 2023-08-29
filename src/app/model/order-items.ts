import { Dish } from './dish';
import { Orders } from './orders';
export interface OrderItems {
    orderItemId : number | null,
    quantity : number,
    itemTotalPrice : number,
    instruction : String,
    order : Orders,
    dish : Dish
}
