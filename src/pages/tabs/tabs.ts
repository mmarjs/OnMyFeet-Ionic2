import {PhotoShareModal} from './../../components/photo-share-modal/photo-share-modal';
import {IonPhotoService} from './../../components/ion-photo/ion-photo-service';
import {Component, ViewChild, ElementRef, Renderer} from "@angular/core";
import {TabHomePage} from "../tab-home/tab-home";
import {TabSearchPage} from "../tab-search/tab-search";
import {TabCapturePage} from "../tab-capture/tab-capture";
import {TabActivityPage} from "../tab-activity/tab-activity";
import {TabAccountPage} from "../tab-account/tab-account";
import {Tabs, Events, ModalController} from "ionic-angular";
import {IonicUtilProvider} from "../../providers/ionic-util.provider";
import {AnalyticsProvider} from "../../providers/analytics.provider";
import {IonPhotoCropModal} from "../../components/ion-photo/ion-photo-crop-modal/ion-photo-crop-modal";
import { StatusBar } from '@ionic-native/status-bar';
declare const Parse: any;

@Component({
    selector: 'page-tabs',
    templateUrl: 'tabs.html'
})

export class TabsPage {
    // this tells the tabs component which Pages
    // should be each tab's root Page
    tabHome: any = TabHomePage;
    tabSearch: any = TabSearchPage;
    tabCapture: any = TabCapturePage;
    tabActivity: any = TabActivityPage;
    tabProfile: any = TabAccountPage;

    query: any;

    tabActivityBadge: number = 0;

    @ViewChild('myTabs') tabRef: Tabs;
    @ViewChild('inputFile') input: ElementRef;

    cordova: boolean = false;
    _eventName: string = 'photoshare';
    private photoServiceOpened: boolean = false;

    constructor(private events: Events,
                private util: IonicUtilProvider,
                private photoService: IonPhotoService,
                private modalCtrl: ModalController,
                private render: Renderer,
                private analytics: AnalyticsProvider,
                private statusBar: StatusBar) {
        this.statusBar.backgroundColorByName('black');
        this.events.subscribe('tabHome', () => setTimeout(() => this.tabRef.select(0), 100));
        this.events.subscribe('clearActivity', () => {this.tabActivityBadge = 0; console.log('this event was called')});

        // Activities for User
        let chatMessage = Parse.Object.extend('GalleryActivity');
        this.query = new Parse.Query(chatMessage)
            .equalTo('toUser', Parse.User.current())
            .equalTo('isRead', false);
        // count activity
        this.query.count().then(
            tabCount => this.tabActivityBadge = tabCount);
        // subscribe activity
        this.query.subscribe().on('create',
            activity => {
                this.util.toast(activity.get('fromUser').get('username') + ' ' + activity.get('action'))
                this.tabActivityBadge++
            });
    }

    // openCapture() {
    //   if (this.cordova) {
    //         if (!this.photoServiceOpened) {
    //             this.photoServiceOpened = true;
    //             this.photoService.open()
    //                 .then(image => {
    //                     this.photoServiceOpened = false;
    //                     if (image) {
    //                         this.cropImage(image)
    //                     }
    //                 })
    //                 .catch(error => {
    //                     this.photoServiceOpened = false;
    //                     this.util.toast(error)
    //                 });
    //         }
    //     } else {
    //       this.render.invokeElementMethod(this.input.nativeElement, 'click');
    //     }
    // }

    // cropImage(image: any) {
    //     console.log(image);
    //     if (image.type == 'image') {
    //       console.log('call modal crop');
    //       this.modalCtrl.create(IonPhotoCropModal, {base64: image.image, eventName: this._eventName, type: 'image'}).present();
    //     }
    //     else if (image.type == 'video')
    //     {
    //       let that = this;
    //       /*let tags = ['test','test2'];
    //       console.log('uploading video');
    //       (<any>window).OnymosMedia.upload('1', tags, function uploadMediaSuccess(status) {
    //         console.log(status);
    //       }, function uploadMediaFailure(error) {
    //         console.log(error);
    //       }, {
    //         mediaResizeFactor: 80,
    //         optimizeBySourceSize: true,
    //         thumbnailResizeFactor: 80,
    //         uploadSizeLimit: 15
    //       });*/
    //       (<any>window).OnymosMedia.getThumbnailData('1', function uploadMediaSuccess (mediaDataObj) {
    //         console.log(mediaDataObj);
    //         that.modalCtrl.create(IonPhotoCropModal, {base64: mediaDataObj.mediaData, eventName: that._eventName, type: 'video'}).present();
    //         //that.events.publish(that._eventName, {image: mediaDataObj.mediaData, type: 'video'});
    //       }, function uploadMediaFailure(error) {
    //         console.log(error);
    //       }, {
    //         thumbnailResizeFactor: 80,
    //       });
    //     }
    // }

    // onChange(event) {
    //     let files  = event.srcElement.files;
    //     let image  = files[0];
    //     let reader = new FileReader();
    //     if (image) {
    //         reader.onload = (evt) => {
    //             if (evt) {
    //                 let image = evt.srcElement['result'];
    //                 this.cropImage(image)
    //             }
    //         };
    //         reader.readAsDataURL(image);
    //     }
    // }

    // getBase64Image(base64_srcimage) {

    //   let canvas = <HTMLCanvasElement>document.createElement("canvas");

    //   let image  = new Image();
    //   image.src = base64_srcimage;
    //   image.setAttribute('crossOrigin', 'anonymous');
    //   canvas.width = image.width;
    //   canvas.height = image.height;
    //   let ctx: CanvasRenderingContext2D;
    //   ctx = canvas.getContext('2d');
    //   ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    //   var dataURL = canvas.toDataURL("image/jpeg");
    //   return dataURL;
    // }

}
