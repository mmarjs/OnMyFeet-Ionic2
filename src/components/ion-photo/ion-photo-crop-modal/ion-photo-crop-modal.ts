import { Component } from '@angular/core';
import { NavParams, ViewController, Events, Platform } from 'ionic-angular';
import { IonicUtilProvider } from "../../../providers/ionic-util.provider";
declare const Cropper: any;
declare const document: any;

@Component({
    selector: 'ion-photo-crop-modal',
    templateUrl: 'ion-photo-crop-modal.html',
})
export class IonPhotoCropModal {

    img: any;
    type: any;
    image: any;
    cropper: any;
    _eventName: string;
    class: any;
    filters: any;
    cameraPic: any;
    base64: any;
    canvas: any;
    htmlValue: any;
    cropIcon: string = 'crop';
    selectTypeTimeout: any = null;
    cordova: boolean = false;

    constructor(private navParams: NavParams,
        private viewCtrl: ViewController,
        private events: Events,
        private platform: Platform,
        private util: IonicUtilProvider,
    ) {
        this._eventName = this.navParams.get('eventName')
        this.img = this.navParams.get('base64');
        this.type = this.navParams.get('type');
        this.filters = ["sutro", "willow", "toaster", "xpro2", "walden", "valencia", "sierra", "rise", "nashville", "mayfair", "lofi", "kelvin", "inkwell", "hudson", "earlybird", "brannan", "amaro", "1977"];
        this.cordova = this.util.cordova;
        this.events.subscribe('photocrop:close', () => this.dismiss());
        this.platform.registerBackButtonAction(() => this.dismiss());
    }

    ionViewDidLoad() {
        this.imageLoaded();
    }

    getClass(c) {
        this.class = c;
    }

    // image Crop Method
    imageLoaded() {
        let image = document.getElementById('image');
        this.cropper = new Cropper(image, {
            dragMode: 'move',
            autoCropArea: 1,
            viewMode: 1,
            restore: true,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            responsive: true,
        });
    }

    crop() {

        if (this.selectTypeTimeout) {
            try {
                clearTimeout(this.selectTypeTimeout);
            } catch (error) { }
        }
        this.selectTypeTimeout = setTimeout(() => {
            if (this.cropIcon == 'crop') {
                let image = this.cropper.getCroppedCanvas().toDataURL('image/jpeg');
                this.img = image;
                this.cropper.destroy();
                this.cropIcon = 'checkmark';
            } else {
                let image = this.getBase64Image();
                //console.log('image', this.img);
                this.events.publish(this._eventName, { image: image, type: this.type });
                this.dismiss();
            }
            this.selectTypeTimeout = null;
        }, 500);
    }

    rotate(value: number): void {
        this.cropper.rotate(value);
    }

    dismiss(): void {
        this.viewCtrl.dismiss();
        if (this.cordova) {
            (<any>window).OnymosMedia.cancelSelect('1');
        }

    }

    getBase64Image() {

        let canvas = <HTMLCanvasElement>document.createElement("canvas");

        let image = new Image();
        image.src = this.img;
        image.setAttribute('crossOrigin', 'anonymous');
        canvas.width = image.width;
        canvas.height = image.height;
        let ctx: CanvasRenderingContext2D;
        ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        var dataURL = canvas.toDataURL("image/jpeg");
        return dataURL;
    }
}
