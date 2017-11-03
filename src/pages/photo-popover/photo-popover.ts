import {Component} from "@angular/core";
import {IonicPage, NavController, NavParams, ViewController} from "ionic-angular";

@IonicPage()
@Component({
  selector   : 'page-photo-popover',
  templateUrl: 'photo-popover.html',
})
export class PhotoPopoverPage {

  constructor(public navCtrl: NavController,
              private viewCtrl: ViewController,
              public navParams: NavParams) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad PhotoPopover');
    document.getElementsByTagName("ion-app").item(0).classList.add("disable-scroll");
  }

  ionViewWillLeave() {
    if ( document.getElementsByTagName("ion-app").item(0).classList.contains("disable-scroll") )
            document.getElementsByTagName("ion-app").item(0).classList.remove("disable-scroll");
  }

  blockPhoto() {
    this.close();
  }

  close() {
    this.viewCtrl.dismiss();
  }

}
