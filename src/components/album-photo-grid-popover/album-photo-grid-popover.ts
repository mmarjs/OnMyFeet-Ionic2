import {Component} from "@angular/core";
import {ViewController, NavParams, ModalController, AlertController, Events} from 'ionic-angular';
import {AlbumFormModalComponent} from '../album-form-modal/album-form-modal';
import {IonicUtilProvider} from '../../providers/ionic-util.provider';
import {GalleryAlbumProvider} from '../../providers/gallery-album.provider';

@Component({
    selector: 'album-photo-grid-popover',
    template: `
              <ion-list>
                  <button ion-item (click)="upload()">{{_translateUploadTitle}}</button>
                  <button ion-item (click)="edit()">Edit Locker</button>
                  <button ion-item (click)="destroy()">Delete Locker</button>
            </ion-list>`
})
export class AlbumPhotoGridPopoverComponent {


    cordova: boolean   = false;
    _eventName: string = 'albumUpload';

    id: string;
    _translateEditTitle: string;
    _translateUploadTitle: string;
    _translateDestroyTitle: string;
    _translateDestroyMessage: string;
    _translateCancel: string;
    _translateYes: string;

    constructor(private viewCtrl: ViewController,
                private navParams: NavParams,
                private alertCtrl: AlertController,
                private ionicUtil: IonicUtilProvider,
                private provider: GalleryAlbumProvider,
                private events: Events,
                private modalCtrl: ModalController,
                private util: IonicUtilProvider,
    ) {
        this.id = this.navParams.get('id');
        this.cordova = this.util.cordova;
        console.log(this.id);
        this.util.translate('Upload image').then((res: string) => this._translateUploadTitle = res);
        this.util.translate('Edit album').then((res: string) => this._translateEditTitle = res);
        this.util.translate('Destroy album').then((res: string) => this._translateDestroyTitle = res);
        this.util.translate('You are sure destroy this locker and photos?').then((res: string) => this._translateDestroyMessage = res);
        this.util.translate('Cancel').then((res: string) => this._translateCancel = res);
        this.util.translate('Yes').then((res: string) => this._translateYes = res);


    }

    close() {
        this.viewCtrl.dismiss();
    }

    upload(){
        this.events.publish('photoGrid:upload');
        this.close();
    }

    edit() {
        this.close();
        this.modalCtrl.create(AlbumFormModalComponent, {id: this.id}).present();
    }

    destroy() {
        this.close();

        this.alertCtrl.create({
            title  : 'Delete?',
            message: 'Are you sure that you want to delete this locker and photos?',
            buttons: [
                {
                    text: this._translateCancel,
                    role: 'cancel'
                },
                {
                    text   : this._translateYes,
                    handler: () => {
                        this.ionicUtil.onLoading();
                        this.provider.get(this.id).then(gallery => {
                            this.provider.destroy(gallery).then(() => {
                                this.ionicUtil.endLoading();

                                // Event Emit
                                this.events.publish('albumgrid:destroy');
                            });
                        });
                    }
                }
            ]
        }).present();


        console.log('confirm destroy album');
    }
}
