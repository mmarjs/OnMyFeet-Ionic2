### OMF - Shoe/Footwear Instagram Clone with Ionic 2 - Final Release and Parse Server with Image Resize and Push Notification

OMF is an Instagram inspired application version developed in Ionic 2 with Parse Platform, with the purchase you will receive all source codes and instructions to customize the application and create your own Parse server.


## Features

 - OMF1 [Ionic](http://ionicframework.com/docs/) - Old version
 - OMF [Ionic2](http://ionicframework.com/docs/v2/) - RC3 
 - Multi Language - include 12 languages
 - [Angular](https://angular.io/) 2.x
 - [TypeScript2](https://www.typescriptlang.org/) 2.06 
 - [NodeJS 6.9.1](https://nodejs.org/en/) 
 - [Parse Server](https://github.com/ParsePlatform/parse-server) 
 - [Parse Dashboard](https://github.com/ParsePlatform/parse-dashboard) 
 - Google Maps 
 - Facebook Web Version
 - Check Connection
 - Crop Image with [CropperJS](https://fengyuanchen.github.io/cropperjs/)
 - [Camera Native](http://blog.ionic.io/10-minutes-with-ionic-2-using-the-camera-with-ionic-native/) 
 - [Cache images](https://github.com/paveisistemas/ionic-image-lazy-load)
 - [Facebook Native Login](https://ionicframework.com/docs/v2/native/facebook/) 
 - [In App Browser](https://ionicframework.com/docs/v2/native/inappbrowser/)
 - [Push Notification with Parse Server and Firebase](https://github.com/OMF/parse-push-plugin)  
 - [MultiTheme Platform](http://ionicframework.com/docs/v2/theming/) (iOS,
   Android Material and Windows Phone)

## Features in development


- [Google Analytics Native](http://ionicframework.com/docs/v2/native/google-analytics/)
- [Deep Links](http://ionicframework.com/docs/v2/native/ionic-deeplinks/) 
- [Social Sharing](http://ionicframework.com/docs/v2/native/social-sharing/)
- Web Version with Angular 2


## Try before buy
[Download Ionic View](http://view.ionic.io/) 

Scan Code with Ionic View [51e2e836]

![Scan Code](https://lh3.googleusercontent.com/--o3-o-kdI3c/WCRKrjMULRI/AAAAAAAB-GA/b8hGwFiROUcPjX_GTAl-hjFNAYtTDlMvQCLcB/s0/Screen+Shot+2016-11-10+at+08.22.55.png "Screen Shot 2016-11-10 at 08.22.55.png")

**Obs:** Facebook Login not work in Ionic View


## Server Requirement

 - Git
 - [Heroku Command Line](https://devcenter.heroku.com/articles/heroku-command-line) 

## Getting Starter Parse Server with Dashboard in Heroku
After receiving access to Github, create a folder of your project and enter the following commands in the terminal


```bash
git clone git@github.com:OMF/server.git myAppName-server
cd myAppName-server
npm install
```
From the terminal, you want to use the Heroku toolbelt I mentioned before step 1 to download your Heroku’d Parse server and make changes.

Login into heroku using the Heroku toolbelt:

```bash
heroku login
```

Finally, you can clone your new heroku app

```bash
heroku create myAppName-server
git push heroku master
``` 

Now access [Heroku Dashboard,](https://dashboard.heroku.com/) select your myAppServer and click em Resources tab

![MongoLab](https://lh3.googleusercontent.com/uGQBgRl6zBTTFa-57i51FKNa8t8585XLRwhpbZ25s5Y4ojef5MHPMWG1rad-SQocWvWfHMqmJg=s0 "MongoLab.png")

Click in Settings tab and Reveal Config Var button, and add Convig Var SERVER_URL with your Heroku Server URL with /parse/ example

#### Create Admin User
https://OMF-server.herokuapp.com/#/auth/install

### Parse Dashboard 
To access the Parse Dashboard, simply put in site address /dashboard after the address of your server, then just fill with the default user **admin**, password **admin123**

### Parse Server Configuration
By default the server comes with some settings, but you can change them by changing the Config Vars of Heroku or your server

```json
// Mount path for the server. Defaults to /parse.
"PARSE_MOUNT": "/parse",
// (required) - The connection string for your database, i.e. mongodb://user:pass@host.com/dbname.
// Be sure to URL encode your password if your password has special characters.
"DATABASE_URI": "mongodb://localhost:27017/OMF",
// URL to your Parse Server (don't forget to specify http:// or https://).
// This URL will be used when making requests to Parse Server from Cloud Code.
"SERVER_URL": "http://localhost:1337/parse",
// Your apps name. This will appear in the subject and body of the emails that are sent.
"APP_NAME": "OMF",
// (required) - The application id to host with this server instance.
// You can use any arbitrary string. For migrated
"APP_ID": "myAppId",
// (required) - The master key to use for overriding ACL security.
// You can use any arbitrary string. Keep it secret! For migrated apps, this should match your hosted Parse app.
"MASTER_KEY": "myMasterKey",
"MASTER_REST_KEY": "myMasterRestKey",

// Files save in Folder
//"UPLOAD_LOCAL_PATH": "/tmp",

// Parse Dashboard
"DASHBOARD_URL": "/dashboard",
"DASHBOARD_USER": "admin",
"DASHBOARD_PASSWORD": "admin123",


// (optional) - S3 for Storage Files
// Files are hosted via automaticamentes GridStore Adapter in MongoDB
// If you want to host the files on S3 fill in the form below
"AWS_ACCESS_KEY_ID": "",
"AWS_SECRET_ACCESS_KEY": "",
"BUCKET_NAME": "",

// (optional) - MAILGUN for send Email
"MAILGUN_API_KEY": "",
"MAILGUN_DOMAIN": "",
"MAILGUN_FROM_ADDRESS": "",

// Firebase free Push Notification
"PUSH": {
  "android": {
    "senderId": "",
    "apiKey": ""
  }
}
}
```


## Getting Starter OMF Ionic 2
After receiving access to Github, create a folder of your project and enter the following commands in the terminal

## Requirement

 - [NodeJS v6.9.1](https://nodejs.org/en/)
 - Git
 - [WebStorm](https://www.jetbrains.com/webstorm/) or [Visual Code](https://code.visualstudio.com/) for Edit Codes
 - Ionic (npm install -g ionic)
 - Cordova ( npm install -g cordova )
 
```bash
git clone git@github.com:OMF/OMF.git myAppName
cd myAppName
npm install
```

For start Ionic Server
```bash
 ionic serve
```

[Ionic 2 Official Documentation](http://ionicframework.com/docs/v2/getting-started/)

### Parse Server Configuration
Abra o arquivo src/config.ts e edit as linhas 2 e 3 com as configurações do seu Server criado no Heroku, exemplo
```js
export const PARSE_APP_ID: string         = 'myAppId';
export const PARSE_SERVER_URL: string     = 'https://app-server.herokuapp.com/parse/';
```
# Running Parse Server elsewhere

Once you have a better understanding of how the project works, please refer to the [Parse Server wiki](https://github.com/ParsePlatform/parse-server/wiki) for in-depth guides to deploy Parse Server to major infrastructure providers. Read on to learn more about additional ways of running Parse Server.

### Parse Server Sample Application

We have provided a basic [Node.js application](https://github.com/ParsePlatform/parse-server-example) that uses the Parse Server module on Express and can be easily deployed to various infrastructure providers:

* [Heroku and mLab](https://devcenter.heroku.com/articles/deploying-a-parse-server-to-heroku)
* [AWS and Elastic Beanstalk](http://mobile.awsblog.com/post/TxCD57GZLM2JR/How-to-set-up-Parse-Server-on-AWS-using-AWS-Elastic-Beanstalk)
* [Google App Engine](https://medium.com/@justinbeckwith/deploying-parse-server-to-google-app-engine-6bc0b7451d50)
* [Microsoft Azure](https://azure.microsoft.com/en-us/blog/azure-welcomes-parse-developers/)
* [SashiDo](https://blog.sashido.io/tag/migration/)
* [Digital Ocean](https://www.digitalocean.com/community/tutorials/how-to-run-parse-server-on-ubuntu-14-04)
* [NodeChef](https://nodechef.com/blog/post/6/migrate-from-parse-to-nodechef%E2%80%99s-managed-parse-server)
* [Pivotal Web Services](https://github.com/cf-platform-eng/pws-parse-server)
* [Back4app](http://blog.back4app.com/2016/03/01/quick-wizard-migration/)
* [HyperDev](https://hyperdev.com/blog/use-parse-server-apps-backend-hyperdev/)

[Click in Here for More details about Parse Server Platform](https://github.com/ParsePlatform/parse-server/blob/master/README.md)

# Easy App Customize

### Logo
For a better resolution I recommend that you export your logo in SVG and replace the file src/assets/img/logo.svg

### Color theme
With the Ionic 2 version it was much easier to change the theme of the app, for this, just edit line 17 in **src/theme/variables.scss** file

### Translations
For translate for new laguange, follow this steps

1) Add new language in src/config.ts file

2) Duplicate **src/i18n/en.json** for new translate, sample: **de.json** and translate file

