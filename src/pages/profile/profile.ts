import {Component} from "@angular/core";
import {Events, ModalController, PopoverController, NavParams} from "ionic-angular";
import {AccountEditModalPage} from "../account-edit-modal/account-edit-modal";
import {UserProvider} from "../../providers/user.provider";
import {IonicUtilProvider} from "../../providers/ionic-util.provider";
import {IParams} from "../../models/parse.params.model";
import {AnalyticsProvider} from "../../providers/analytics.provider";
import {ProfilePopoverPage} from "../profile-popover/profile-popover";

declare const Parse: any;

@Component({
  selector   : 'page-profile',
  templateUrl: 'profile.html'
})
export class ProfilePage {

  user: any;
  username: string;
  loading: boolean  = true;
  type: string      = 'list';
  moreItem: boolean = true;
  eventName: string;
  canEdit: boolean  = false;
  selectTypeTimeout: any = null;

  profile: any = {
    id             : '',
    name           : '',
    username       : '',
    photo          : null,
    status         : '',
    galleriesTotal : 0,
    followersTotal : 0,
    followingsTotal: 0,
  };

  params: IParams = {
    limit    : 12,
    page     : 1,
    privacity: 'public',
    username : null
  };

  constructor(private User: UserProvider,
              private events: Events,
              private navParams: NavParams,
              private modalCtrl: ModalController,
              private popoverCtrl: PopoverController,
              private util: IonicUtilProvider,
              private analytics: AnalyticsProvider,) {
    // Google Analytics
    this.analytics.view('ProfilePage');

    this.username        = this.navParams.get('username');
    this.params.username = this.username;
    this.eventName       = this.username;

    let user = Parse.User.current();

    if (this.username == user.get('username')) {
      this.canEdit = true;
    }

    this.loadProfile();
  }


  loadProfile() {
    this.loading         = true;
    this.profile.loading = true;
    this.User.getProfile(this.username).then(profile => {
      this.profile         = profile;
      this.profile.loading = false;
      this.loading         = false;
      this.onSelectType();
    }).catch(this.util.toast);
  }

  openPopover(ev):void {
    this.popoverCtrl.create(ProfilePopoverPage, {username: this.username}).present({ev: ev});
  }

  onEditProfile(): void {
    this.modalCtrl.create(AccountEditModalPage).present();
  }

  onSelectType(type: string = 'list') {
    this.type = type;
    if (this.selectTypeTimeout) {
      try {
        clearTimeout(this.selectTypeTimeout);
      } catch (error) { }
    }
    this.selectTypeTimeout = setTimeout(() => {
      this.params.page = 1;
      this.events.publish(this.eventName + ':reload', this.params);
      this.selectTypeTimeout = null;
    }, 500);
  }

  follow(item): void {
    console.log('user', item);
    item.loading = true;
    if (this.selectTypeTimeout) {
      try {
        clearTimeout(this.selectTypeTimeout);
      } catch (error) { }
    }
    this.selectTypeTimeout = setTimeout(() => {
      this.User.follow({userId: item.id}).then(resp => {
      console.log('Follow result', resp);
      item.isFollow = (resp === 'follow') ? true : false;
      if (resp == 'follow') {
        item.followersTotal += 1;
      }
      if (resp == 'unfollow') {
        item.followersTotal -= 1;
      }
      item.loading = false;
    });  
    }, 500);
  }

  public doInfinite(event) {
    this.params.page++;
    this.events.unsubscribe(this.eventName + ':complete');
    this.events.subscribe(this.eventName + ':complete', () => event.complete());
    this.sendParams();
  }

  public doRefresh(event?) {
    if (event) {
      event.complete();
    }
    this.params.page = 1;
    this.events.publish(this.eventName + ':reload', this.params);
    this.loadProfile();
  }

  private sendParams(): void {
    console.log('sendParams', this.params);
    this.events.publish(this.eventName + ':params', this.params);
  }

}
