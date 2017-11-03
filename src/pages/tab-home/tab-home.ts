import {Component, ViewChild} from "@angular/core";
import {Http} from "@angular/http";
import {Events, Content, App} from "ionic-angular";
import {IParams} from "../../models/parse.params.model";
import {ChatChannelPage} from "../chat-channel/chat-channel";
import {APP_NAME} from "../../config";
import {AnalyticsProvider} from "../../providers/analytics.provider";
import {IonicUtilProvider} from "../../providers/ionic-util.provider";
import {InAppBrowser} from 'ionic-native';
import {UserDataProvider} from "../../providers/user-data.provider";
declare const Parse: any;

@Component({
    selector   : 'page-tab-home',
    templateUrl: 'tab-home.html',
})
export class TabHomePage {
    @ViewChild(Content) content: Content;

    appName: string = APP_NAME;

    params: IParams = {
        limit    : 18,
        page     : 1,
        privacity: 'followers',
    };

    eventName: string = 'home';
    privacity: string = 'followers';
    moreItem: boolean = false;
    isIOS: boolean = false;
    cordova: boolean   = false;
    user: any;
    username: string;
    email: string;
    name: string;

    constructor(private events: Events,
                private app: App,
                private analytics: AnalyticsProvider,
                private util: IonicUtilProvider,
                private userData: UserDataProvider,
                private http: Http,
    ) {
        // Google Analytics
        this.analytics.view('TabHomePage');
        this.eventName = 'home';
        this.isIOS = this.util.isIOS;
        this.cordova = this.util.cordova;
        this.user            = new Parse.User.current();
        this.username        = this.user.get('username');
        this.email           = this.user.get('email');
        this.name            = this.user.get('name');
    }

    ionViewDidLoad() {
        //console.log('ionViewDidLoad home');

        // Load Cache
        this.params.page = 1;
        this.events.publish(this.eventName + ':reload', this.params);
    }


    ionViewWillEnter() {
        //console.info('ionViewWillEnter home');
        // More Item
        this.events.subscribe(this.eventName + ':moreItem', moreItem => this.moreItem = moreItem);
        this.events.subscribe('scroll:up', () => this.scrollTop());
        this.http.post('https://www.onmyfeet.shoes/api/add-member/', {email: this.email, name: this.name, username: this.username}).toPromise().then((data) => {console.log(data)});
    }

    ionViewDidLeave() {
        //console.warn('ionViewDidLeave home');
        this.events.unsubscribe(this.eventName + ':moreItem');
        this.events.unsubscribe('scroll:up');
    }

    public onPageChat() {
        this.app.getRootNav().push(ChatChannelPage);
    }

    scrollTop() {
        this.content.scrollToTop(1000);
    }

    public doInfinite(event) {
        this.params.page++;
        this.events.unsubscribe(this.eventName + ':complete');
        this.events.subscribe(this.eventName + ':complete', () => event.complete());
        this.sendParams();
    }

    ionSelected() {
        this.scrollTop();
    }

    public doRefresh(event?) {
        if (event) {
            event.complete();
        }
        this.params.page = 1;
        this.events.publish(this.eventName + ':reload', this.params);
    }

    private sendParams(): void {
        this.events.publish(this.eventName + ':params', this.params);
    }

    openStore(): void {
        if (this.cordova)
        {
            let options = {
              location: 'no',
              clearcache: 'yes',
              toolbar: 'no'
            };
            let browser = new InAppBrowser('https://www.onmyfeet.shoes/store?username=' + this.username, 'yes','location=false,cache=false,toolbar=true');
        } else {
            window.open('https://www.onmyfeet.shoes/store?username=' + this.username, '_blank');
        }
    }

    openSouls(): void {
        if (this.cordova)
        {
            let options = {
              location: 'no',
              clearcache: 'yes',
              toolbar: 'no'
            };
            let browser = new InAppBrowser('https://www.onmyfeet.shoes/soles?username=' + this.username, 'yes','location=false,cache=false,toolbar=true');
        } else {
            window.open('https://www.onmyfeet.shoes/soles?username=' + this.username, '_blank');
        }
    }
}
