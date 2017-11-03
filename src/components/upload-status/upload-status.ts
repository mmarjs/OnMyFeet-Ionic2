import {Component} from "@angular/core";
import {Events} from "ionic-angular";
import {ParseFileProvider} from "../../providers/parse-file.provider";
import {GalleryProvider} from "../../providers/gallery.provider";
import {IonicUtilProvider} from "../../providers/ionic-util.provider";
import _ from "underscore";
import {IUpload} from "../../models/upload.model";
declare var AWS: any;

@Component({
    selector: 'upload-status',
    //templateUrl: 'upload-status.html',
    template: `<ion-item  *ngFor="let item of uploads; let i=index; " >
                <ion-avatar item-left><img [src]="item.form.image"></ion-avatar>
                <h2>{{item.form.title}}</h2>
                <ion-spinner *ngIf="item.loading" item-right></ion-spinner>
                <button (click)="retry(i)" ion-button *ngIf="!item.loading" color="primary" outline item-right>Retry</button>
                <button (click)="cancel(i)" ion-button *ngIf="!item.loading" color="primary" outline item-right>Cancel</button>
                </ion-item>`
})
export class UploadStatusComponent {

    uploads: any[]   = [];
    loading: boolean = false;
    cordova: boolean = false;

    constructor(private ParseFile: ParseFileProvider,
                private provider: GalleryProvider,
                private events: Events,
                private util: IonicUtilProvider,
    ) {
        this.cordova = this.util.cordova;
        this.events.subscribe('upload:gallery', item => this.add(item));
    }

    add(item: IUpload) {
        console.log('uploadProccess', item);
        if (item.form.image_type == 'video')
        {
           let mediaTagsArray: any = item.form.title.split(/[\s,]+/);
           console.log('uploading video');
          console.log(mediaTagsArray);
          let that = this;
          let newItem = {loading: true, form: item.form, status: 'sending', code: new Date().getTime()};
          this.uploads.push(newItem);
           (<any>window).OnymosMedia.upload('1', mediaTagsArray, function uploadMediaSuccess(status) {
             (<any>window).OnymosMedia.search(mediaTagsArray, function (resultsArray) {
               for (var i = 0; i < resultsArray.length; i++) {
                 let single_file = resultsArray[i];
                 item.form.video_url = single_file.mediaUrl;
               }
               let newItem = {loading: true, form: item.form, status: 'sending', code: new Date().getTime()};
               that.uploads.pop();
               that.uploads.push(newItem);
               this.events.publish('tabHome');
               let index = _.findIndex(that.uploads, {code: newItem.code});
               if (this.cordova)
                (<any>window).OnymosMedia.cancelSelect('1');
               that.process(index);

             }, function (error) {
               console.log(error);
             }, {
               resultsValidityTime: 2592000,
               searchResultsLimit: 5
             })
           }, function uploadMediaFailure(error) {

           console.log(error);
           }, {
           mediaResizeFactor: 80,
           optimizeBySourceSize: true,
           thumbnailResizeFactor: 80,
           uploadSizeLimit: 15
           });
        } else {
          let newItem = {loading: true, form: item.form, status: 'sending', code: new Date().getTime()};
          this.uploads.push(newItem);
          let index = _.findIndex(this.uploads, {code: newItem.code});
          if (this.cordova)
            (<any>window).OnymosMedia.cancelSelect('1');
          this.process(index);
        }

    }

    process(index: number): void {
        let newItem                 = this.uploads[index];
        this.uploads[index].loading = true;

        this.provider.createGallery(newItem.form).then(item => {
            console.log(item);
            newItem.loading = false;
            this.uploads.splice(index, 1);
            this.events.publish('home:reload',null);
        }).catch(error => {
            console.log(error);
            this.uploads[index].loading = false;
        });
    }

    retry(index): void {
        this.process(index);
    }

    cancel(index, item): void {
        console.log(index, item);
        this.uploads.splice(index, 1);
    }

    getRandomInt(min: number = 0, max: number = 9999) {
        return Math.floor(Math.random() * (max - min)) + min;
    }


}
