import {Component} from "@angular/core";
import {App, NavController} from "ionic-angular";
import {UserProvider} from "../../providers/user.provider";
import {TabsPage} from "../tabs/tabs";
import {AnalyticsProvider} from "../../providers/analytics.provider";
import {IonicUtilProvider} from "../../providers/ionic-util.provider";
import {ParseFileProvider} from "../../providers/parse-file.provider";
import {FormBuilder, Validators} from "@angular/forms";
import * as _ from "underscore";
import {TermsPage} from "../terms/terms";
import {UserDataProvider} from "../../providers/user-data.provider";

declare const Parse: any;

@Component({
  selector   : 'auth-avatar',
  templateUrl: 'auth-avatar.html'
})
export class AuthAvatarPage {

  form: any;
  photo: any;
  submitted: boolean = false;
  _user: any;
  errors             = {
    nameRequired         : null,
    emailRequired        : null,
    emailInvalid         : null,
    usernameRequired     : null,
    passwordRequired     : null,
    passwordRequiredMin  : null,
    passwordRequiredMatch: null,
  };

  constructor(private navCtrl: NavController,
              private app: App,
              private User: UserProvider,
              private analytics: AnalyticsProvider,
              private util: IonicUtilProvider,
              private ParseFile: ParseFileProvider,
              private UserData: UserDataProvider,
              private formBuilder: FormBuilder) {
    // Google Analytics
    this.analytics.view('AuthAvatarPage');

    this._user = new Parse.User.current()['attributes'];

    // Translate Strings
    this.util.translate('Name is required').then((res: string) => this.errors.nameRequired = res);
    this.util.translate('Email is required').then((res: string) => this.errors.emailRequired = res);
    this.util.translate('Email invalid').then((res: string) => this.errors.emailInvalid = res);
    this.util.translate('Username is required').then((res: string) => this.errors.usernameRequired = res);
    this.util.translate('Password is required').then((res: string) => this.errors.passwordRequired = res);
    this.util.translate('Password should be at least 6 characters').then((res: string) => this.errors.passwordRequiredMin = res);
    this.util.translate("Password doesn't match").then((res: string) => this.errors.passwordRequiredMatch = res);

    // Validate user registration form
    this.form = this.formBuilder.group({
      first_name    : ['', Validators.required],
      last_name     : ['', Validators.required],
      email   : ['', Validators.required],
      username: ['', Validators.compose([Validators.required, Validators.minLength(4)])],
      website : [''],
      gender  : [''],
      birthday: ['', Validators.required],
      phone   : [''],
    });

  }

  ionViewDidLoad() {

    console.log('didload ', this._user)

    _.each(this._user, (value,
                        key) => {
      if (this.form.controls[key]) {
        this.form.controls[key].setValue(value);
      }
    });
    // Clear Username
    this.form.controls['username'].setValue('');

    console.log(this.form.controls);
    this.util.onLoading();
    setTimeout(() => this.loadPhoto(), 1000);
  }

  private loadPhoto() {
    this.UserData.profile(this._user['username']).then(
      profile => {
        this.photo = profile.photo ? profile.photo : 'assets/img/user.png';
        this.util.endLoading();
      });
  }

  changePhoto(photo) {
    this.util.onLoading('Uploading image...');
    this.photo = photo;
    this.ParseFile.upload({base64: photo})
      .then(
        image => this.User.updatePhoto(image))
      .then(
        user => this._user = user)
      .then(() => this.util.endLoading())
      .then(() => this.util.toast('Avatar updated'))
      .catch(this.onError);
  }


  public submitForm(rForm: any): void {
    this.submitted = true;
    let newForm    = this.form.value;
    this.analytics.event('Auth', 'create user');

    if (!newForm['first_name']) {
      return this.util.toast('First name is required');
    }

    if (!newForm['last_name']) {
      return this.util.toast('Last name is required');
    }

    if (!newForm['birthday']) {
      return this.util.toast('Birthday is required');
    }

    if (!newForm['email']) {
      return this.util.toast(this.errors['emailRequired']);
    }

    if (!this.util.validEmail(newForm['email'])) {
      return this.util.toast(this.errors['emailInvalid']);
    }

    if (!newForm['username']) {
      return this.util.toast(this.errors['usernameRequired']);
    }

    //if (!newForm['password']) {
    //    return this.util.toast(this.errors['passwordRequired']);
    //}
    //
    //if (newForm['password'].length < 6) {
    //    return this.util.toast(this.errors['passwordRequiredMin']);
    //}
    //
    //if (newForm['password'] !== newForm['passwordConfirmation']) {
    //    return this.util.toast(this.errors['passwordRequiredMatch']);
    //}

    //if (this.util.validPassword(newForm.password, newForm.passwordConfirmation)) {
    //
    //}
    if (rForm.valid) {
      this.util.onLoading();
      this.User.update(this.form.value)
        .then(result => this.util.endLoading())
        .then(() => this.app.getRootNav().setRoot(TabsPage))
        .catch(error=> this.onError(error.message));
    }

  }

  private onError(error) {
    console.log(error)
    this.util.endLoading();
    this.util.toast(error)
  }

  public onTerms(): void {
    this.navCtrl.push(TermsPage);
  }

}
