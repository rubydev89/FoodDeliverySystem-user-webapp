export interface Restaurant {
    id : number;
    name : string;
    description? : string;
    address : string;
    phone : number;
    email : string;
    category? : string;
    contact_person : string;
    rating? : number;
    restaurantImageUrl? : string;
    added_on? : Date
}
