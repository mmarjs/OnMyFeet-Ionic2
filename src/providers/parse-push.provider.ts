import {Injectable} from "@angular/core";
import {Platform} from "ionic-angular";

declare var Parse: any;

@Injectable()
export class ParsePushProvider {
    private _installationId;
    private current: any;
    private cordova: boolean = false;

    constructor(private platform: Platform) {
        this.cordova = this.platform.is('cordova') ? true : false;
    }

    init() {
        if (this.cordova) {
            plugins.OneSignal.startInit("dd7e35ef-1a98-4cc1-95bc-532aa92e1345", "690741331720")
            .endInit();
        }
    }

    unsubscribe() {
        if (this.cordova)
        {
            plugins.OneSignal.setSubscription(false);
        }
    }
}
