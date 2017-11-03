import {Component} from "@angular/core";
import {App} from "ionic-angular";
import {FacebookService} from "ng2-facebook-sdk";
import {UserProvider} from "../../providers/user.provider";
import {AnalyticsProvider} from "./../../providers/analytics.provider";
import {ExternalLibProvider} from "./../../providers/external-lib.provider";
import {IonicUtilProvider} from "../../providers/ionic-util.provider";
import {TabsPage} from "./../../pages/tabs/tabs";
import {AuthAvatarPage} from "../../pages/auth-avatar/auth-avatar";
import {ParsePushProvider} from "../../providers/parse-push.provider";

declare const Parse: any;

@Component({
  selector   : 'button-facebook-login',
  templateUrl: 'button-facebook-login.html'
})
export class ButtonFacebookLoginComponent {

  constructor(private util: IonicUtilProvider,
              private app: App,
              private fb: FacebookService,
              private lib: ExternalLibProvider,
              private analytics: AnalyticsProvider,
              private provider: UserProvider,
              private Push: ParsePushProvider) {
    // Define Facebook Browser and Native

  }
  onFacebookLogin(): void {
    this.analytics.event('Auth', 'Login with Facebook');

    this.util.onLoading();

    console.log("asdfasdf", this.lib.facebook)
    this.lib.facebook.getLoginStatus().then(response => {
      if (response.status === 'connected') {
        this.processFacebookLogin(response);
      } else {
        this.lib.facebook.login(['public_profile'])
          .then((authData) => this.processFacebookLogin(authData))
          .catch(this.onError);
      }
    }).catch(this.onError);
  }

  processFacebookLogin(authData): void {
    this.lib.facebook
      .api('/me?fields=id,last_name,first_name,gender,email', ['public_profile','email'])
      .then((fbData) => {
        console.log('fbData', fbData);

        let facebookAuthData = {
          id             : authData['authResponse']['userID'],
          access_token   : authData['authResponse']['accessToken'],
          expiration_date: (new Date().getTime() + 1000).toString()
        };

        this.util.translate('Updating Facebook Profile').then(text => this.util.onLoading(text))

        Parse.FacebookUtils.logIn(facebookAuthData, {
          success: (user) => {
            if (!user.existed()) {
              // New user
              console.warn('UserProvider signed up and logged in through Facebook!', user);
              this.provider.facebookSyncProfile(fbData)
                .then(this.provider.updateWithFacebookData())
                .then(() => this.onPageAvatar())
                .catch(this.onError);
            } else {
              // Old UserProvider
              console.info('UserProvider logged in through Facebook!', user);
              this.provider.facebookSyncProfile(fbData)
                .then(this.provider.updateWithFacebookData())
                .then(() => this.onPageTabs())
                .catch(this.onError);
            }
          },
          error  : (user, error) => {
            console.error('UserProvider cancelled the Facebook login or did not fully authorize.', user, error);
            this.util.endLoading();
            this.util.translate('User cancelled the Facebook login or did not fully authorize').then(text => this.util.toast(text))

          }
        });

      });
  }

  onError(error): void {
    this.util.endLoading();
    this.util.toast(error['message'] || error);
  }

  onPageTabs(): void {
    console.log('Page tabs');
    this.util.endLoading();
    this.Push.init();
    this.app.getRootNav().setRoot(TabsPage);
  }

  onPageAvatar(): void {
    console.log('Page avatar');
    this.util.endLoading();
    this.app.getRootNav().setRoot(AuthAvatarPage);
  }

}
