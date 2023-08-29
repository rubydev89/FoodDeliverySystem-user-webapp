export interface User {
    id : number | null,
    first_name? : string,
    last_name? : string,
    email? : string,
    password? : string,
    status? : string,
    imgUrl? : string,
    created_on? : Date
}
