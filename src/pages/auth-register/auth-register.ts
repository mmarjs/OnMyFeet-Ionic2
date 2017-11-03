import {TermsPage} from "./../terms/terms";
import {Component} from "@angular/core";
import {Validators, FormBuilder} from "@angular/forms";
import {App, NavController} from "ionic-angular";
import {TabsPage} from "../tabs/tabs";
import {IonicUtilProvider} from "../../providers/ionic-util.provider";
import {UserProvider} from "../../providers/user.provider";
import {AnalyticsProvider} from "../../providers/analytics.provider";

declare const Parse: any;
declare const FB: any;

@Component({
    selector   : 'page-auth-register',
    templateUrl: 'auth-register.html'
})
export class AuthRegisterPage {

    error: string;

    formSignup: any;
    photo: any;

    alertTranslate: any        = {};
    cordova: boolean           = false;
    inputPasswordType: string  = 'password';
    inputPasswordIcon: string  = 'eye-off';
    inputPasswordShow: boolean = false;
    errors = {
        nameRequired: null,
        emailRequired: null,
        emailInvalid:null,
        usernameRequired:null,
        passwordRequired:null,
        passwordRequiredMin:null,
        passwordRequiredMatch:null,
        birthdayRequired: null
    };

    constructor(private provider: UserProvider,
                private util: IonicUtilProvider,
                private app: App,
                private formBuilder: FormBuilder,
                private analytics: AnalyticsProvider,
                private navCtrl: NavController
    ) {
        // Google Analytics
        this.analytics.view('AuthPage');


        // Translate Search Bar Placeholder
        this.util.translate('Enter your email so we can send you a link to reset your password').then((res: string) => this.alertTranslate.message = res);
        this.util.translate('Open your email and also check the spam box').then((res: string) => { this.alertTranslate.emailRecoverySend = res; });
        this.util.translate('Email is required').then((res: string) => { this.alertTranslate.emailRequired = res; });
        this.util.translate('Recovery your password').then((res: string) => { this.alertTranslate.title = res; });
        this.util.translate('Email').then((res: string) => { this.alertTranslate.email = res; });
        this.util.translate('Cancel').then((res: string) => { this.alertTranslate.cancel = res; });
        this.util.translate('Submit').then((res: string) => { this.alertTranslate.submit = res; });

        // Translate Strings
        this.util.translate('Name is required').then((res: string) => this.errors.nameRequired = res);
        this.util.translate('Email is required').then((res: string) => this.errors.emailRequired = res);
        this.util.translate('Email invalid').then((res: string) => this.errors.emailInvalid = res);
        this.util.translate('Username is required').then((res: string) => this.errors.usernameRequired = res);
        this.util.translate('Birthday is required').then((res: string) => this.errors.birthdayRequired = res);
        this.util.translate('Password is required').then((res: string) => this.errors.passwordRequired = res);
        this.util.translate('Password should be at least 6 characters').then((res: string) => this.errors.passwordRequiredMin = res);
        this.util.translate("Password doesn't match").then((res: string) => this.errors.passwordRequiredMatch = res);
    }

    ionViewWillLoad() {
        // Validate user registration form
        this.formSignup = this.formBuilder.group({
            first_name          : ['', Validators.required],
            last_name           : ['', Validators.required],
            email               : ['', Validators.required],
            username            : ['', Validators.compose([Validators.required, Validators.minLength(4)])],
            birthday            : ['', Validators.required],
            terms               : ['', Validators.required],
            gender              : ['', Validators.required],
            password            : ['', Validators.compose([Validators.required, Validators.minLength(6)])],
            passwordConfirmation: ['', Validators.compose([Validators.required, Validators.minLength(6)])]
        });
    }

    toggleInputPassword() {
        this.inputPasswordShow = !this.inputPasswordShow;
        this.inputPasswordType = this.inputPasswordShow ? 'text' : 'password';
        this.inputPasswordIcon = this.inputPasswordShow ? 'eye' : 'eye-off';
    }


    submitForm(): void {
        let newForm = this.formSignup.value;
        this.analytics.event('Auth', 'create user');

        if (!newForm['first_name']) {
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

        if (!newForm['password']) {
            return this.util.toast(this.errors['passwordRequired']);
        }

        if (!newForm['gender']) {
            return this.util.toast("Gender is required!");
        }

        if (newForm['password'].length < 6) {
            return this.util.toast(this.errors['passwordRequiredMin']);
        }

        if (newForm['password'] !== newForm['passwordConfirmation']) {
            return this.util.toast(this.errors['passwordRequiredMatch']);
        }
        if(!newForm['birthday']){
            return this.util.toast(this.errors['birthdayRequired']);
        }

        if (this.util.validPassword(newForm.password, newForm.passwordConfirmation)) {
            this.util.onLoading();

            delete newForm['passwordConfirmation'];
            this.provider.signUp(newForm).then(user => {
                if (this.photo) {
                    this.util.onLoading('Sending photo avatar');
                    this.provider.updateAvatar(this.photo).then(user => {
                        this.provider.current = user;
                        this.util.endLoading();
                        this.onPageTabs();
                    });
                } else {
                    this.provider.current = user;
                    this.util.endLoading();
                    this.onPageTabs();
                }
            }).catch(error => {
                this.util.endLoading();
                this.util.toast(error.message);
            });

        } else {
            this.util.toast('Password not confirm');
        }
    }

    onPageTabs(): void {
        this.app.getRootNav().setRoot(TabsPage);
    }

    changePhoto(photo) {
        console.log('Photo', photo);
        this.photo = photo.image;
    }

    onTerms() {
        this.navCtrl.push(TermsPage);
    }
}
