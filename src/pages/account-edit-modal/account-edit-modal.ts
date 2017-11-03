import {Component} from "@angular/core";
import {ViewController, Events} from "ionic-angular";
import {FormBuilder, Validators} from "@angular/forms";
import {UserProvider} from "../../providers/user.provider";
import {IonicUtilProvider} from "../../providers/ionic-util.provider";
import {ParseFileProvider} from "../../providers/parse-file.provider";
import {AnalyticsProvider} from "../../providers/analytics.provider";
import * as _ from "underscore";


declare const Parse: any;

@Component({
    selector:    'page-account-edit-modal',
    templateUrl: 'account-edit-modal.html'
})
export class AccountEditModalPage {

    form: any;
    photo: any;
    _user: any;
    _eventName: string = 'photoprofile';
    errors = {
        nameRequired:          null,
        emailRequired:         null,
        emailInvalid:          null,
        usernameRequired:      null,
        passwordRequired:      null,
        passwordRequiredMin:   null,
        passwordRequiredMatch: null,
    };

    constructor(private viewCtrl: ViewController,
                private ionic: IonicUtilProvider,
                private User: UserProvider,
                private events: Events,
                private util: IonicUtilProvider,
                private ParseFile: ParseFileProvider,
                private analytics: AnalyticsProvider,
                private formBuilder: FormBuilder) {
        this._user = new Parse.User.current().attributes;

        console.log(Parse.User.current());

        if (this._user.photo) {
            this.photo = this._user.photo._url;
        }

        // Translate Strings
        this.util.translate('Name is required').then((res: string) => this.errors.nameRequired = res);
        this.util.translate('Email is required').then((res: string) => this.errors.emailRequired = res);
        this.util.translate('Email invalid').then((res: string) => this.errors.emailInvalid = res);
        this.util.translate('Username is required').then((res: string) => this.errors.usernameRequired = res);
        this.util.translate('Password is required').then((res: string) => this.errors.passwordRequired = res);
        this.util.translate('Password should be at least 6 characters').then((res: string) => this.errors.passwordRequiredMin = res);
        this.util.translate("Password doesn't match").then((res: string) => this.errors.passwordRequiredMatch = res);
    }


    ionViewWillLoad() {
        // Validate user registration form
        this.form = this.formBuilder.group({
            first_name: ['', Validators.required],
            last_name: ['', Validators.required],
            email:    ['', Validators.required],
          username            : ['', Validators.compose([Validators.required, Validators.minLength(4)])],
            website:  [''],
            gender:   ['male', Validators.required],
            birthday: [''],
            phone:    [''],
        });

        _.each(this._user, (value, key) => {
            console.log(key, value);
            if (this.form.controls[key]) {
                this.form.controls[key].setValue(value);
            }
        });

        console.log(this.form.controls);
    }

    changePhoto(photo) {
        this.util.onLoading('Uploading image...');
        this.ParseFile.upload({base64: photo.image})
            .then(this.User.updatePhoto)
            .then(user => {
                this._user = user;
                this.photo = photo.image;
                this.util.endLoading();
                this.util.toast('Avatar updated')
            }).catch(error => {
            this.util.toast('Error: Not upload image')
        });
    }

    submitProfile(rForm: any) {

        let newForm = this.form.value;
        this.analytics.event('Auth', 'create user');

        if (!newForm['first_name']) {
            return this.util.toast(this.errors['nameRequired']);
        }

        if (!newForm['last_name']) {
            return this.util.toast(this.errors['nameRequired']);
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

        if (rForm.valid) {
            this.ionic.onLoading();
            this.User.update(this.form.value).then(result => {
                console.log(result);
                this.ionic.endLoading();
                this.dismiss();
            }).catch(error => {
                console.log(error);
                this.dismiss();
                this.ionic.endLoading();
            });
        }
    }

    dismiss() {
        this.events.publish('profile:reload');
        this.viewCtrl.dismiss();
    }

}
