import {Component} from '@angular/core';
import {ViewController} from "ionic-angular";
import {IonicUtilProvider} from "../../providers/ionic-util.provider";
import {TranslateService} from "ng2-translate";
import {languages} from "../../config";

@Component({
    selector   : 'location-modal',
    templateUrl: 'location-modal.html'
})
export class LocationModalComponent {

    _languages: any;
    _placeholder: string;
    _words: string = '';

    constructor(private viewCtrl: ViewController,
                private util: IonicUtilProvider,
                private translate: TranslateService
    ) {
        this._languages = languages;
        this.startTranslate();
    }

    doSearch() {
        this._languages = languages.filter(item => item.name.toLowerCase().indexOf(this._words.toLowerCase()) > -1);
    }

    startTranslate() {
        // Translate Search Bar Placeholder
        this.util.translate('Search').then((res: string) => this._placeholder = res);
    }

    selectLanguage(lang: any) {
        this.util.onLoading();
        this.translate.use(lang.code);
        setTimeout(() => {
            this.startTranslate();
            this.util.endLoading();
            this.dismiss();
        }, 1000);
    }

    doCancel(): void {
        this._words = '';
    }

    dismiss() {
        this.viewCtrl.dismiss();
    }


}
