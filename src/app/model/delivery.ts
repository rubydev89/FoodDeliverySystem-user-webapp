import { Driver } from './driver';
export interface Delivery {
    id : number,
    /*
	 * 	
	 * 	1 - Driver assigned
	 * 	2 - Order Picked up
	 * 	3 - Delivered
	 * 	4 - Delivery Attempt Failed
	 * */
	deliveryStatus : number,
    deliveryTitle? : string,
    deliveryDate? : Date,
    deliveryInstruction? : string,
    createdOn : Date,
    driver : Driver
    
}
