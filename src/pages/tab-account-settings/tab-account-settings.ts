import {PhoneContactPage} from "./../phone-contact/phone-contact";
import {Component} from "@angular/core";
import {App, ModalController, NavController} from "ionic-angular";
import {IntroPage} from "../intro/intro";
import {UserPasswordPage} from "../user-password/user-password";
import {AccountEditModalPage} from "../account-edit-modal/account-edit-modal";
import {IonicUtilProvider} from "../../providers/ionic-util.provider";
import {AboutPage} from "../about/about";
import {LanguageModalComponent} from "../../components/language-modal/language-modal";
import {UserProvider} from "../../providers/user.provider";
import {AnalyticsProvider} from "../../providers/analytics.provider";
import {TermsPage} from "../terms/terms";
import {FacebookUserListComponent} from "../facebook-user-list/facebook-user-list";
import {InAppBrowser} from 'ionic-native';
declare const Parse: any;

@Component({
  selector   : 'page-tab-account-settings',
  templateUrl: 'tab-account-settings.html'
})
export class TabAccountSettingsPage {

  cordova: boolean   = false;
  user: any;
  username: string;
  email: string;
  name: string;

  constructor(private User: UserProvider,
              private app: App,
              private navCtrl: NavController,
              private modalCtrl: ModalController,
              private util: IonicUtilProvider,
              private analytics: AnalyticsProvider,
  ) {
    // Google Analytics
    this.analytics.view('TabAccountSettingsPage');
    this.cordova = this.util.cordova;
    this.user            = new Parse.User.current();
    this.username        = this.user.get('username');
    this.email           = this.user.get('email');
    this.name            = this.user.get('name');
  }

  onInviteFriends() {
    this.navCtrl.push(PhoneContactPage);
  }

  onFacebookFriends() {
    this.navCtrl.push(FacebookUserListComponent)
  }

  aboutPage(): void {
    if (this.cordova)
    {
      let browser = new InAppBrowser('https://www.onmyfeet.shoes/about-us', 'yes', 'location=false,cache=false,toolbar=true');
    } else {
      window.open('https://www.onmyfeet.shoes/about-us', '_blank');
    }
  }

  modalLanguage() {
    this.modalCtrl.create(LanguageModalComponent).present();
  }

  href(url): void {
    this.util.href(url);
  }

  public onTerms(): void {
    if (this.cordova)
    {
      let browser = new InAppBrowser('https://www.onmyfeet.shoes/legal/terms-and-conditions', 'yes', 'location=false,cache=false,toolbar=true');
    } else {
      window.open('https://www.onmyfeet.shoes/legal/terms-and-conditions', '_blank');
    }
  }

  changePassword(): void {
    this.modalCtrl.create(UserPasswordPage).present();
  }

  editModal(): void {
    this.modalCtrl.create(AccountEditModalPage).present();
  }

  logout(): void {
    this.User.logout();
    this.app.getRootNav().setRoot(IntroPage);
  }

  storePage(): void {
    if (this.cordova)
    {
      let browser = new InAppBrowser('https://www.onmyfeet.shoes/store?username=' + this.username, 'yes', 'location=false,cache=false,toolbar=true');
    } else {
      window.open('https://www.onmyfeet.shoes/store?username=' + this.username, '_blank');
    }
  }

  soulPage(): void {
    if (this.cordova)
    {
      let browser = new InAppBrowser('https://www.onmyfeet.shoes/soles?username=' + this.username,'yes','location=false,cache=false,toolbar=true');
    } else {
      window.open('https://www.onmyfeet.shoes/soles?username=' + this.username, '_blank');
    }
  }
}
