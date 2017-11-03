import {Component} from '@angular/core';
import { GoogleMap, LatLng, GoogleMapsEvent} from "@ionic-native/google-maps";
import { Geolocation } from '@ionic-native/geolocation';
import {Platform} from "ionic-angular";
// http://www.joshmorony.com/integrating-native-google-maps-into-an-ionic-2-application/
@Component({
    selector   : 'photo-map',
    templateUrl: 'photo-map.html'
})
export class PhotoMapComponent {
    _map: GoogleMap;
    _currentPosition: LatLng;

    constructor(private platform: Platform, private geolocation: Geolocation) {
        platform.ready().then(() => {
            this.startMap();
        });
    }


    startMap() {
        if (this._currentPosition) {
            this.loadMap(this._currentPosition);
        } else {
            this.geolocation.getCurrentPosition().then(position => {
                this._currentPosition = new LatLng(position.coords.latitude, position.coords.longitude);
                this.loadMap(this._currentPosition);
            })
        }
    }

    loadMap(location: LatLng): void {

        this._map = new GoogleMap('map', {
          
            controls       : {
                compass         : true,
                myLocationButton: true,
                indoorPicker    : true,
                zoom            : true,
            },
            gestures       : {
                scroll: true,
                tilt  : true,
                rotate: true,
                zoom  : true,
            },
            camera         : {
                target : location,
                tilt   : 30,
                zoom   : 15,
                bearing: 50
            }, 
       

        });

        this._map.on(GoogleMapsEvent.MAP_READY).subscribe(() => {
            console.log('Mais is ready!');
        });
    }
}
