import {Component} from "@angular/core";
import {IonicPage, NavController, NavParams, ViewController} from "ionic-angular";


@IonicPage()
@Component({
  selector   : 'page-profile-popover',
  templateUrl: 'profile-popover.html',
})
export class ProfilePopoverPage {

  constructor(public navCtrl: NavController,
              private viewCtrl: ViewController,
              public navParams: NavParams) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ProfilePopover');
  }

  blockUser() {
    this.close();
  }

  close() {
    this.viewCtrl.dismiss();
  }

}
