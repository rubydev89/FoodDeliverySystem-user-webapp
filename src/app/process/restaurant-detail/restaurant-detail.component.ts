import { ActivatedRoute } from '@angular/router';
import { RestaurantService } from './../../services/restaurant.service';
import { Restaurant } from './../../model/restaurant';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-restaurant-detail',
  templateUrl: './restaurant-detail.component.html',
  styleUrls: ['./restaurant-detail.component.css']
})
export class RestaurantDetailComponent implements OnInit {

  //@Input() data!:Restaurant;
  constructor(private _restService : RestaurantService, private _route:ActivatedRoute) { }

  selectedRestaurant : Restaurant|undefined;

  ngOnInit(): void {
    let restId:number = 0;
    this._route.params.subscribe(params => {
      restId = +params['id'];
    });
    this._restService.setSelectedRestaurantId(restId);
    //this.selectedRestaurant = this._restService.getOrderFromRestaurant();
    //console.log(`${this._restService.selectedRestaurantId$} : ${restId}`)
    this._restService.selectedRestaurantData$.subscribe({
      next: restData => {
        //console.log(category);
        this.selectedRestaurant = restData;
          /* category.find(rest => {
          console.log(rest.id === restId);
          return rest.id === restId});*/
      }
    });
    //console.log(this.selectedRestaurant);
  }

}
