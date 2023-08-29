import { Restaurant } from './restaurant';
export interface Dish {
    dishId:number,
    dish_name:string,
    price:number,
    description?:string,
    category:string,
    dishImageUrl?:string,
    added_on? : Date,
    restaurant:Restaurant
}