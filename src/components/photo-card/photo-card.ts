import {Component, Input, OnInit} from "@angular/core";
import {Http} from "@angular/http";
import {ModalController, PopoverController, App, Events} from "ionic-angular";
import {GalleryProvider} from "../../providers/gallery.provider";
import {ProfilePage} from "../../pages/profile/profile";
import {PhotoCommentModalComponent} from "../photo-comment-modal/photo-comment-modal";
import {PhotoListPopoverComponent} from "../photo-list-popover/photo-list-popover";
import {ChatSharePhotoPage} from "../../pages/chat-share-photo/chat-share-photo";
import {AlbumPhotoGridComponent} from "../album-photo-grid/album-photo-grid";
import {IonicUtilProvider} from "../../providers/ionic-util.provider";
import {InAppBrowser} from 'ionic-native';
declare const Parse: any;

@Component({
    selector   : 'photo-card',
    templateUrl: 'photo-card.html'
})
export class PhotoCardComponent implements OnInit {

    @Input() item: any;

    username: any;
    loadingLike: boolean = false;
    storeUrl: string = "";
    cordova: boolean   = false;
    selectTypeTimeout: any = null;

    constructor(private provider: GalleryProvider,
                private app: App,
                private modalCtrl: ModalController,
                private popoverCtrl: PopoverController,
                private events: Events,
                private http: Http,
                private util: IonicUtilProvider,
    ) {
        this.cordova = this.util.cordova;
        this.username = Parse.User.current().get('username');
        this.events.subscribe('double:click', (item) => {this.onLike(item)});
    }

    ngOnInit() {
        if (this.item.items != undefined && this.item.items.length > 0)
            console.log("asdfasdf", this.item.items)
        {
            let tags = [];
            this.item.items.forEach(function(tag) {
                tags.push(tag.value);
            })
            this.http.post('https://www.onmyfeet.shoes/api/tag-search/', {"tags": tags}).subscribe((data) => {
            data = data.json();
                if (data.url != undefined && data.url != null)
                {
                    this.storeUrl = data.url + '/?username=' + this.username;
                }
            });
        }
    }

    openPopover(ev):void {
        this.popoverCtrl.create(PhotoListPopoverComponent, {item: this.item}).present({ev: ev});
    }

    sharePhoto(item):void {
        console.log("SharePhoto", item);
        this.modalCtrl.create(ChatSharePhotoPage, {image: item.obj}).present();
    }

    openComments(item):void {
        console.log("Comments", item);
        this.modalCtrl.create(PhotoCommentModalComponent, {galleryId: item.id}).present();
    }

    openProfile(username: string):void {
        this.app.getRootNav().push(ProfilePage, {username: username})
    }

    openAlbum(item): void {
        this.app.getRootNav().push(AlbumPhotoGridComponent, {id: item.id});
    }

    onLike(item):void {
        if (this.selectTypeTimeout) {
          try {
            clearTimeout(this.selectTypeTimeout);
          } catch (error) { }
        } 
        this.selectTypeTimeout = setTimeout(() => {
            item.loadingLike = true;
            console.log('Click like');
            this.provider.likeGallery(item.id).then(data => {
                if (item.isLiked) {
                    item.isLiked = false;
                    item.likesTotal--;
                } else {
                    item.isLiked = true;
                    item.likesTotal++;
                }
                item.loadingLike = false;
            });
            this.selectTypeTimeout = null;
        }, 1000);
    }

    onBookmark(item):void {
        item.loadingBookmark = true;
        this.provider.bookmarkGallery(item.id).then(data=>{
            item.isBookmark = !item.isBookmark;
            item.loadingBookmark = false;
        });
    }

    openStore() {
        if (this.cordova)
        {
            if (this.selectTypeTimeout) {
                try {
                    clearTimeout(this.selectTypeTimeout);
                } catch (error) { }
            }
            this.selectTypeTimeout = setTimeout(() => {
                let browser = new InAppBrowser(this.storeUrl, 'yes', 'location=false,cache=false,toolbar=true');
                this.selectTypeTimeout = null;
            }, 1000);
        } else {
            window.open(this.storeUrl, '_blank');
        }
    }

}
