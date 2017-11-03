import { Component, ViewChild, ElementRef, Renderer } from "@angular/core";
import { Events, ModalController } from "ionic-angular";
import { IonPhotoService } from "../../components/ion-photo/ion-photo-service";
import { IonicUtilProvider } from "../../providers/ionic-util.provider";
import { PhotoShareModal } from "../../components/photo-share-modal/photo-share-modal";
import { IonPhotoCropModal } from "../../components/ion-photo/ion-photo-crop-modal/ion-photo-crop-modal";
import { AnalyticsProvider } from "../../providers/analytics.provider";

// declare var OnymosMediaConstants: any;

@Component({
  selector: 'page-tab-capture',
  templateUrl: 'tab-capture.html'
})
export class TabCapturePage {

  @ViewChild('inputFile') input: ElementRef;

  cordova: boolean = false;
  _eventName: string = 'photoshare';
  selectTypeTimeout: any = null;
  private photoServiceOpened: boolean = false;
  constructor(private photoService: IonPhotoService,
    private util: IonicUtilProvider,
    private modalCtrl: ModalController,
    private events: Events,
    private render: Renderer,
    private analytics: AnalyticsProvider,
  ) {
    // Google Analytics
    this.analytics.view('TabCapturePage');
    this.cordova = this.util.cordova;

    // Open Share Modal
    this.events.subscribe(this._eventName, _imageCroped => {
      console.log('Open share modal');
      let modal = this.modalCtrl.create(PhotoShareModal, { base64: _imageCroped.image, type: _imageCroped.type });
      modal.onDidDismiss(response => {
        console.log(response);
        if (response) {
          this.events.publish('upload:gallery', response);
        }
      });
      modal.present();
    });

    if (!this.cordova) {
      if (this.selectTypeTimeout) {
        try {
          clearTimeout(this.selectTypeTimeout);
        } catch (error) { }
      }
      this.selectTypeTimeout = setTimeout(() => {
        this.render.invokeElementMethod(this.input.nativeElement, 'click');
        this.selectTypeTimeout = null;
      }, 500);
    }
  }

  ionViewWillEnter() {
    console.log('[ionViewWillEnter]');
    this.openCapture();
    this.events.publish('tabHome');
  }

  openCapture() {
    console.log(this.photoServiceOpened);
    if (!this.photoServiceOpened) {
      this.photoServiceOpened = true;
      if (this.cordova) {
        this.photoService.open()
          .then(image => {
            this.photoServiceOpened = false;
            this.cropImage(image)
          })
          .catch(error => {
            console.log('image error');
            this.photoServiceOpened = false;
            this.util.toast(error)
          });
      } else {
        this.render.invokeElementMethod(this.input.nativeElement, 'click');
      }
    }

  }

  cropImage(image: any) {
    console.log(image);
    if (image.type == 'image') {
      console.log('call modal crop');
      this.modalCtrl.create(IonPhotoCropModal, { base64: image.image, eventName: this._eventName, type: 'image' }).present();
    }
    else if (image.type == 'video') {
      let that = this;
      /*let tags = ['test','test2'];
      console.log('uploading video');
      (<any>window).OnymosMedia.upload('1', tags, function uploadMediaSuccess(status) {
        console.log(status);
      }, function uploadMediaFailure(error) {
        console.log(error);
      }, {
        mediaResizeFactor: 80,
        optimizeBySourceSize: true,
        thumbnailResizeFactor: 80,
        uploadSizeLimit: 15
      });*/
      (<any>window).OnymosMedia.getThumbnailData('1', function uploadMediaSuccess(mediaDataObj) {
        console.log(mediaDataObj);
        that.modalCtrl.create(IonPhotoCropModal, { base64: mediaDataObj.mediaData, eventName: that._eventName, type: 'video' }).present();
        //that.events.publish(that._eventName, {image: mediaDataObj.mediaData, type: 'video'});
      }, function uploadMediaFailure(error) {
        console.log(error);
      }, {
          thumbnailResizeFactor: 80,
        });
    }
  }

  onChange(event) {
    let files = event.srcElement.files;
    let image = files[0];
    let reader = new FileReader();
    if (image) {
      reader.onload = (evt) => {
        if (evt) {
          let image = evt.srcElement['result'];
          let src = image;
          image = { image: src, type: 'image' };
          console.log('222222222222');
          this.cropImage(image);
        }
      };
      console.log('Image', image);
      reader.readAsDataURL(image);
    }
  }

  // getBase64Image(base64_srcimage) {

  //   let canvas = <HTMLCanvasElement>document.createElement("canvas");

  //   let image = new Image();
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
