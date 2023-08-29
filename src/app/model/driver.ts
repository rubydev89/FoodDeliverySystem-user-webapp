export interface Driver {
    id : number,
    first_name : string,
    last_name? : string,
    email : string,
    phone : string,
    vehicalNumber : string,
    created_on? : Date,
    status? : string,
    rating? : number,
    imgUrl? : string
}
