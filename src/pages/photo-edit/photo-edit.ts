import {Component} from '@angular/core';
import {NavController, NavParams, ViewController, Events} from 'ionic-angular';
import {GalleryProvider} from '../../providers/gallery.provider';
import {AnalyticsProvider} from '../../providers/analytics.provider';
import {IonicUtilProvider} from '../../providers/ionic-util.provider';
import {Http} from "@angular/http";
@Component({
    selector:    'page-photo-edit',
    templateUrl: 'photo-edit.html'
})
export class PhotoEditPage {
    item: any;
    form: any = {
        id:        null,
        title:     '',
        privacity: '',
        albumId:   null,
        address:   null,
        items: [],
    };
    image: any;
    autoCompleteTags: any;

    constructor(public navCtrl: NavController,
                private navParams: NavParams,
                private provider: GalleryProvider,
                private viewCtrl: ViewController,
                private events: Events,
                private analytics: AnalyticsProvider,
                private util: IonicUtilProvider,
                private http: Http,
    ) {
        // Google Analytics
        this.analytics.view('PhotoEditPage');
        this.http.get('https://www.onmyfeet.shoes/api/tag-list').subscribe((data) => {
            data = data.json();
            this.autoCompleteTags = data;
        });
    }

    ionViewWillLoad() {
        let item            = this.navParams.get('item');
        this.item           = item;
        this.form.id        = item.id;
        this.form.title     = item.title;
        this.form.privacity = item.privacity;
        this.form.items     = item.items;
        this.events.subscribe('album:selected', album => this.form.albumId = album['id']);
        this.events.subscribe('address:selected', address => this.form.address  = address);
    }

    ngOnDestroy() {
        this.events.unsubscribe('album:selected');
        this.events.unsubscribe('address:selected');
    }

    submit(form) {
        if (form.valid) {
            this.util.onLoading('Updating....');
            this.provider.updatedGallery(this.form).then(() => {
                this.events.publish('home:reload', null);
                this.util.endLoading();
                this.viewCtrl.dismiss();
            });

        }
    }

    dismiss(cancel?) {
        this.viewCtrl.dismiss();
    }
}
