import {Injectable} from '@angular/core';
import {ActionSheetController, Platform} from "ionic-angular";
import {Camera} from 'ionic-native';
import {TranslateService} from "ng2-translate";

declare var OnymosMediaConstants:any;

@Injectable()
export class IonPhotoService {

    _base64Image: any;
    _cordova: boolean = false;
    _setting          = {
        quality           : 70,
        width             : 1024,
        height            : 1024,
        saveToPhotoAlbum  : false,
        allowEdit         : true,
        correctOrientation: true,
        allowRotation     : true,
        aspectRatio       : 0
    };

    _translateOption: string;
    _translateCamera: string;
    _translateLibrary: string;
    _translateCancel: string;
    _translateNotCordova: string;

    constructor(private actionSheetCtrl: ActionSheetController,
                private platform: Platform,
                private translateService: TranslateService
    ) {
        this._cordova = this.platform.is('cordova') ? true : false;
        // Translate
        this.translate('Chose Option').then(result => this._translateOption = result);
        this.translate('Camera').then(result => this._translateCamera = result);
        this.translate('Photo library').then(result => this._translateLibrary = result);
        this.translate('Cancel').then(result => this._translateCancel = result);
        this.translate('Browser not supported').then(result => this._translateNotCordova = result);
    }

    translate(text: string): Promise<any> {
        return new Promise(resolve => {
            this.translateService.get(text).subscribe((res: string) => resolve(res));
        });
    }

    open() {
        return new Promise((resolve, reject) => {
            this.actionSheetCtrl.create({
                title  : this._translateOption,
                buttons: [
                    {
                        text   : this._translateCamera,
                        icon   : 'camera',
                        handler: () => {
                            if (this._cordova) {
                                this.camera().then(image => resolve({image:image,type:'image'})).catch(error => reject(error));
                            } else {
                                reject(this._translateNotCordova);
                            }
                        }
                    },
                    {
                        text    : 'Video',
                        icon    : 'videocam',
                        handler : () => {
                            if (this._cordova) {
                                this.video().then(image => resolve({image:image,type:'video'})).catch(error => reject(error));
                            } else {
                                reject(this._translateNotCordova);
                            }
                        }
                    },
                    {
                        text   : this._translateLibrary,
                        icon   : 'images',
                        handler: () => {
                            if (this._cordova) {
                                this.photoLibrary().then(image => resolve({image:image,type:'image'})).catch(error => reject(error));
                            } else {
                                reject(this._translateNotCordova);
                            }
                        }
                    },
                    {
                        text: this._translateCancel,
                        handler: () => {
                          resolve(false);
                        }
                    }
                ]
            }).present();
        });
    }

    video() {
        return new Promise((resolve, reject) => {

          (<any>window).OnymosMedia.select(
            '1',
            OnymosMediaConstants.PictureSourceType.PHOTOLIBRARY,
            OnymosMediaConstants.MediaType.VIDEO,

            function mediaSelectionSuccess (mediaURI, mediaObject) {
              console.log('video data', mediaURI);
              resolve(mediaURI);
            },
            function mediaSelectionFailure (error) {
              console.log(error);
              reject(error);
            },

            );
            /*let _options = {
                quality: 50,
                destinationType: Camera.DestinationType.FILE_URI,
                sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
                mediaType:Camera.MediaType.VIDEO
            }

            Camera.getPicture(_options).then((imageData) => {
                console.log('video data', imageData);
                resolve(imageData);
            }, (err) => {
                console.log(err);
                reject(err);
            });*/
        })
    }

    camera() {
        return new Promise((resolve, reject) => {
          (<any>window).OnymosMedia.select(
            '1',
            OnymosMediaConstants.PictureSourceType.CAMERA,
            OnymosMediaConstants.MediaType.PICTURE,

            function mediaSelectionSuccess (mediaURI, mediaObject) {
              (<any>window).OnymosMedia.getThumbnailData('1', function uploadMediaSuccess (mediaDataObj) {
                resolve(mediaDataObj.mediaData);
              }, function uploadMediaFailure(error) {
                console.log(error);
              }, {
                thumbnailResizeFactor: 80,
              });
            },
            function mediaSelectionFailure (error) {
              console.log(error);
              reject(error);
            },

          );

            /*let _options = {
                targetWidth : this._setting.width,
                targetHeight: this._setting.height,
                quality     : this._setting.quality,
                sourceType  : Camera.PictureSourceType.CAMERA
            }

            Camera.getPicture(_options).then((imageData) => {
                // imageData is a base64 encoded string
                this._base64Image = imageData;
                resolve(this._base64Image);
            }, (err) => {
                console.log(err);
                reject(err);
            });*/
        });
    }

    photoLibrary() {
        return new Promise((resolve, reject) => {
          (<any>window).OnymosMedia.select(
            '1',
            OnymosMediaConstants.PictureSourceType.PHOTOLIBRARY,
            OnymosMediaConstants.MediaType.PICTURE,

            function mediaSelectionSuccess (mediaURI, mediaObject) {
              (<any>window).OnymosMedia.getThumbnailData('1', function uploadMediaSuccess (mediaDataObj) {
                resolve(mediaDataObj.mediaData);
              }, function uploadMediaFailure(error) {
                console.log(error);
              }, {
                thumbnailResizeFactor: 80,
              });
            },
            function mediaSelectionFailure (error) {
              console.log(error);
              reject(error);
            },

          );
            /*let _options = {
                targetWidth       : this._setting.width,
                targetHeight      : this._setting.height,
                quality           : this._setting.quality,
                sourceType        : Camera.PictureSourceType.PHOTOLIBRARY,
                maximumImagesCount: 1,
            };

            Camera.getPicture(_options).then(imageData => {
                // imageData is a base64 encoded string
                this._base64Image = imageData;
                resolve(this._base64Image);
            }, (err) => {
                console.log(err);
                reject(err);
            });*/
        });
    }

}
