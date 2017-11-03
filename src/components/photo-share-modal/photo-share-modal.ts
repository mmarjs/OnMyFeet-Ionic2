import {Component, OnInit} from '@angular/core';
import {NavParams, ViewController, Events} from 'ionic-angular';
import {AnalyticsProvider} from '../../providers/analytics.provider';
import {IonicUtilProvider} from "../../providers/ionic-util.provider";
import {Http} from "@angular/http";
@Component({
    selector:    'photo-share-modal',
    templateUrl: 'photo-share-modal.html'
})

export class PhotoShareModal implements OnInit {
    form         = {
        title:     '',
        privacity: 'public',
        image:     null,
        address:   {},
        albumId:   null,
        location:  null,
        items: [],
        image_type: ''
    };
    location: any;
    address: any = {};

    album: any;
    eventName: string;

    autoCompleteTags: any;

    cordova: boolean = false;

    _eventName: string = 'photoshare:crop';

    constructor(private navparams: NavParams,
                private viewCtrl: ViewController,
                private events: Events,
                private analytics: AnalyticsProvider,
                private util: IonicUtilProvider,
                private http: Http,
    ) {
        // Google Analytics
        this.analytics.view('PhotoShareModalPage');

        this.form.image = this.navparams.get('base64');
        this.eventName  = this.navparams.get('eventName');
        this.album      = this.navparams.get('album');
        this.form.image_type = this.navparams.get('type');
        this.cordova = this.util.cordova;

        if (this.album) {
            this.form.albumId = this.album.id;
        }

        this.http.get('https://www.onmyfeet.shoes/api/tag-list').subscribe((data) => {
            data = data.json();
            this.autoCompleteTags = data;
            console.log(data);
        });

        this.events.subscribe('album:selected', album => this.form.albumId = album['id']);
        this.events.subscribe('address:selected', address => this.form.address  = address);
    }

    ngOnInit() {

    }


    ngOnDestroy() {
        this.events.unsubscribe(this._eventName);
        this.events.unsubscribe('album:selected');
        this.events.unsubscribe('address:selected');
    }

    submit(form) {
        if (form.valid) {
            this.events.unsubscribe(this.eventName);
            this.viewCtrl.dismiss({form: this.form});
        }
    }

    dismiss() {
        if (this.cordova)
            (<any>window).OnymosMedia.cancelSelect('1');
        this.viewCtrl.dismiss();
    }
}
