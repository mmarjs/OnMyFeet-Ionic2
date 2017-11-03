import {Component} from "@angular/core";
import {MenuController, ModalController, NavController} from "ionic-angular";
import {TermsPage} from "./../terms/terms";
import {AuthRegisterPage} from "./../auth-register/auth-register";
import {AuthLoginPage} from "./../auth-login/auth-login";
import {LanguageModalComponent} from "../../components/language-modal/language-modal";
import {AnalyticsProvider} from "../../providers/analytics.provider";
// const SLIDES = require('./intro.slides').SLIDES;
import {Http} from "@angular/http";

@Component({
  selector   : 'page-intro',
  templateUrl: 'intro.html'
})

export class IntroPage {
  slides: any;
  showSkip              = true;
  device                = 'android';
  currentSlider: number = 0;

  constructor(public navCtrl: NavController,
              public menu: MenuController,
              public modalCtrl: ModalController,
              private analytics: AnalyticsProvider,
              private http: Http) {
    // Google Analytics
    this.analytics.view('IntroPage');
    this.http.get('https://www.onmyfeet.shoes/api/tour').subscribe((data) => {
            data = data.json();
            this.slides = data;
    });
  }

  modalLanguage(): void {
    this.modalCtrl.create(LanguageModalComponent).present();
  }

  onSkip(slide) {
    slide.slideTo(this.slides.length + 1, 1000);
    this.showSkip = false;
  }

  onLogin() {
    this.navCtrl.push(AuthLoginPage);
  }

  onRegister() {
    this.navCtrl.push(AuthRegisterPage);
  }

  onTerms() {
    this.navCtrl.push(TermsPage);
  }

  onSlideChangeStart(event) {
    this.currentSlider = event.getActiveIndex();
    this.showSkip      = (this.currentSlider == this.slides.length) ? false : true;
  }

}
