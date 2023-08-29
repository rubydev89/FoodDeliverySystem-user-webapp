import { Address } from './address';
import { User } from './user';
import { Delivery } from './delivery';
export interface Orders {
    orderId : number | null,
    orderDate? : Date,
    /**
     * Order Created
     * Accepted By Restaurant
     * Picked up by Driver
     * Completed
     * Cancelled
     */
    orderStatus? : string,
    totalItems? : number,
    itemsSubTotal? : number,
    taxNFees? : number,
    deliveryCharges? : number,
    driverTip? : number,
    totalAmount? : number,
    /*
        1 - Payment Successful
        2 - Payment Declined
    */
    paymentStatus? : number,
    paymentStatusTitle? : string,
    /*
        1 - Paypal
        2 - Credit/Debit
    */
    paymentMethod? : number,
    paymentMethodTitle? : string,
    instruction? :string,
    address : Address,
    user? : User,
    delivery? : Delivery | null
}
