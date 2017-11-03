import {Component} from "@angular/core";
import {Events, NavController, ViewController} from "ionic-angular";
import {UserProvider} from "../../providers/user.provider";
import _ from "underscore";
import {ChatChannelProvider} from "../../providers/chat-channel.provider";
import {IonicUtilProvider} from "../../providers/ionic-util.provider";
import {AnalyticsProvider} from "../../providers/analytics.provider";

declare const Parse: any;

@Component({
  selector   : 'page-chat-form',
  templateUrl: 'chat-form.html'
})
export class ChatFormPage {

  errorIcon: string      = 'ios-images-outline';
  errorText: string      = '';
  data                   = [];
  _cache                 = [];
  loading: boolean       = true;
  showEmptyView: boolean = false;
  showErrorView: boolean = false;
  moreItem: boolean      = false;
  words: string          = '';
  search: string         = '';

  params = {
    limit : 20,
    page  : 1,
    search: ''
  }

  form: any = {
    text: ''
  };
  username: string;

  constructor(public navCtrl: NavController,
              private User: UserProvider,
              private Channel: ChatChannelProvider,
              private viewCtrl: ViewController,
              private util: IonicUtilProvider,
              private events: Events,
              private analytics: AnalyticsProvider,) {
    // Google Analytics
    this.analytics.view('ChatChannel page');

    this.username = Parse.User.current().get('username');
    console.log(this.username);

    this.feed();
  }


  feed(): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log('Load Feed', this.params, this.loading);

      if (this.params.page == 1) {
        this.data = [];
      }

      this.User.getFollowing(this.username).then(data => {
        console.log(data);
        if (data && data.length) {
          _.sortBy(data, 'createdAt').reverse().map(item => this.data.push(item));
          this._cache = this.data;

          this.showErrorView = false;
          this.showEmptyView = false;
          this.moreItem      = true;
        } else {
          if (!this.data.length) {
            this.showEmptyView = false;
          }
          this.moreItem = false;
        }

        this.loading = false;
        resolve(this.data);
      }).catch(error => {
        this.errorText     = error.message;
        this.showErrorView = true;
        this.loading       = false;
        reject(this.errorText);
      });
    });
  }

  parseResult(data) {
    this.data = [];
    data.map(item => {
      item.checked = false;
      this.data.push(item);
    });
    this.loading = false;
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

  onCreateChannel() {
    console.log(this.form);
    let users = this.data.filter(item => item.checked).map(item => item._id);
    console.log(users);
    if (users.length) {

      this.util.onLoading();
      this.Channel.create({users: users}).then(data => {
        console.log('saved', data);
        this.util.endLoading();
        this.dismiss();
        this.events.publish('channel:reload')
        this.events.publish('channel:open', data.id)
      });
    } else {
      console.log('Select user first');
    }
  }

  // Search
  doSearch() {
    let filter = this._cache.filter(item => item.name.toLowerCase().indexOf(this.words.toLowerCase()) > -1);
    this.data  = _.sortBy(filter, 'name');
  }

  doCancel() {
    this.data = this._cache;
  }

  doInfinite(event) {
    this.feed().then(() => event.complete()).catch(() => event.complete());
  }

  doRefresh(event) {
    this.data = [];
    this.feed().then(() => event.complete()).catch(() => event.complete());
  }

  doTry() {
    this.loading = true;
    this.doRefresh(null);
  }

}
