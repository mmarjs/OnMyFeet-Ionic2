import {Component, OnInit} from "@angular/core";
import {Platform} from "ionic-angular";
import {Device, Splashscreen} from "ionic-native";
import {TabsPage} from "../pages/tabs/tabs";
import {IntroPage} from "../pages/intro/intro";
import {GOOGLE_ANALYTICS, PARSE_APP_ID, PARSE_JAVASCRIPT_KEY, PARSE_SERVER_URL} from "../config";
import {AnalyticsProvider} from "../providers/analytics.provider";
import {UserProvider} from "../providers/user.provider";
import {ExternalLibProvider} from "../providers/external-lib.provider";
import {PressDirective} from '../directives/press.gesture.directive';
import {IonicUtilProvider} from "../providers/ionic-util.provider";
declare const Parse: any;
declare var OnymosMedia:any;
declare var AWS: any;

@Component({
  template: `<ion-nav [root]="rootPage" #content></ion-nav>`
})

export class MyApp implements OnInit {
  rootPage: any;
  cordova: boolean = false;

  ngOnInit() {
    Parse.initialize(PARSE_APP_ID, PARSE_JAVASCRIPT_KEY);
    Parse.serverURL = PARSE_SERVER_URL;
  }

  constructor(private platform: Platform,
              private Analytics: AnalyticsProvider,
              private lib: ExternalLibProvider,
              private util: IonicUtilProvider,
              private User: UserProvider) {

              this.cordova = this.util.cordova;
    platform.ready().then(() => {
      // Define Facebook Browser and Native
      this.lib.initFacebook();
      if (this.cordova)
      {
        this.initializeOnymosComponents();
      }
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      // StatusBar.styleDefault();
      Splashscreen.hide();

      // Google Analytics
      Analytics.init(GOOGLE_ANALYTICS);
      Analytics.appVersion(Device['version']);

      // Start Parse User
      if (!User.current()) {
        this.rootPage = IntroPage;
      } else {
        this.rootPage = TabsPage;
      }
    });
  }

  initializeOnymosComponents()
  {
    let onymosConnectObj = {
      customerId : 'O1000002298', // Obtain at Account > Settings > Access Keys
      onymosAuthToken : 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2MDk0ODc5OTksInYiOjAsImQiOnsidWlkIjoiTzEwMDAwMDIyOTgifSwiaWF0IjoxNDk5MDU4MTAwfQ.72a2A-tlgAvRXjGapRS0Z9z28ajoMK0Ngp3mW34j7rQ',  // Obtain at Account > Settings > Access Keys
      envType : 'PRD',
      awsAccessKey : 'AKIAJWJKYKNZZ7FI3YKQ',
      awsSecretKey : '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',
      awsBucketFolder : 'omf-bucket'
    };

    (<any>window).OnymosMedia.onymosInitialize (
      onymosConnectObj,

      function onymosInitializeSuccess (status) {
        console.log('app.component.ts : OnymosMedia.onymosInitialize status - ' + status);
      },

      function onymosInitializeFailure (error) {
        console.log('app.component.ts : OnymosMedia.onymosInitialize error - ' + error);
      });
  }
}
