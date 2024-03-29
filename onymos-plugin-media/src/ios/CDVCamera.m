/*
 * Copyright 2015-2017 Onymos Inc
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 */

#import "CDVCamera.h"
#import "CDVJpegHeaderWriter.h"
#import "UIImage+CropScaleOrientation.h"
#import <ImageIO/CGImageProperties.h>
#import <AssetsLibrary/ALAssetRepresentation.h>
#import <AssetsLibrary/AssetsLibrary.h>
#import <AVFoundation/AVFoundation.h>
#import <ImageIO/CGImageSource.h>
#import <ImageIO/CGImageProperties.h>
#import <ImageIO/CGImageDestination.h>
#import <MobileCoreServices/UTCoreTypes.h>
#import <objc/message.h>
#import "CDVFile.h"
#import <Cordova/CDVAvailability.h>
#import <Cordova/CDV.h>

#ifndef __CORDOVA_4_0_0
		#import <Cordova/NSData+Base64.h>
#endif

#define CDV_PHOTO_PREFIX @"cdv_photo_"
#define svlt(v) ([[[UIDevice currentDevice] systemVersion] compare:v options:NSNumericSearch] == NSOrderedAscending)

static NSSet* org_apache_cordova_validArrowDirections;

static NSString* toBase64(NSData* data) {
		SEL s1 = NSSelectorFromString(@"cdv_base64EncodedString");
		SEL s2 = NSSelectorFromString(@"base64EncodedString");
		SEL s3 = NSSelectorFromString(@"base64EncodedStringWithOptions:");
		
		if ([data respondsToSelector:s1]) {
				NSString* (*func)(id, SEL) = (void *)[data methodForSelector:s1];
				return func(data, s1);
		} else if ([data respondsToSelector:s2]) {
				NSString* (*func)(id, SEL) = (void *)[data methodForSelector:s2];
				return func(data, s2);
		} else if ([data respondsToSelector:s3]) {
				NSString* (*func)(id, SEL, NSUInteger) = (void *)[data methodForSelector:s3];
				return func(data, s3, 0);
		} else {
				return nil;
		}
}

@implementation NSBundle (PluginExtensions)

+ (NSBundle*) pluginBundle:(CDVPlugin*)plugin {
    NSBundle* bundle = [NSBundle bundleWithPath: [[NSBundle mainBundle] pathForResource:NSStringFromClass([plugin class]) ofType: @"bundle"]];
    return bundle;
}
@end

#define PluginLocalizedString(plugin, key, comment) [[NSBundle pluginBundle:(plugin)] localizedStringForKey:(key) value:nil table:nil]

@implementation CDVImagePicker

@synthesize quality;
@synthesize callbackId;
@synthesize mimeType;

- (uint64_t)accessibilityTraits
{
  NSString* systemVersion = [[UIDevice currentDevice] systemVersion];

  if (([systemVersion compare:@"4.0" options:NSNumericSearch] != NSOrderedAscending)) { // this means system version is not less than 4.0
    return UIAccessibilityTraitStartsMediaSession;
  }

  return UIAccessibilityTraitNone;
}

- (BOOL)prefersStatusBarHidden {
  return YES;
}
    
- (UIViewController*)childViewControllerForStatusBarHidden {
  return nil;
}
    
- (void)viewWillAppear:(BOOL)animated {
  SEL sel = NSSelectorFromString(@"setNeedsStatusBarAppearanceUpdate");
  if ([self respondsToSelector:sel]) {
      [self performSelector:sel withObject:nil afterDelay:0];
  }
  
  [super viewWillAppear:animated];
}

@end

@implementation CDVPictureOptions

+ (instancetype) createFromTakePictureArguments:(CDVInvokedUrlCommand*)command
{
		CDVPictureOptions* pictureOptions = [[CDVPictureOptions alloc] init];

		pictureOptions.quality = [command argumentAtIndex:0 withDefault:@(50)];
		pictureOptions.destinationType = [[command argumentAtIndex:1 withDefault:@(DestinationTypeFileUri)] unsignedIntegerValue];
		pictureOptions.sourceType = [[command argumentAtIndex:2 withDefault:@(UIImagePickerControllerSourceTypeCamera)] unsignedIntegerValue];
		
		NSNumber* targetWidth = [command argumentAtIndex:3 withDefault:nil];
		NSNumber* targetHeight = [command argumentAtIndex:4 withDefault:nil];
		pictureOptions.targetSize = CGSizeMake(0, 0);
		if ((targetWidth != nil) && (targetHeight != nil)) {
				pictureOptions.targetSize = CGSizeMake([targetWidth floatValue], [targetHeight floatValue]);
		}

		pictureOptions.encodingType = [[command argumentAtIndex:5 withDefault:@(EncodingTypeJPEG)] unsignedIntegerValue];
		pictureOptions.mediaType = [[command argumentAtIndex:6 withDefault:@(MediaTypePicture)] unsignedIntegerValue];
		pictureOptions.allowsEditing = [[command argumentAtIndex:7 withDefault:@(NO)] boolValue];
		pictureOptions.correctOrientation = [[command argumentAtIndex:8 withDefault:@(NO)] boolValue];
		pictureOptions.saveToPhotoAlbum = [[command argumentAtIndex:9 withDefault:@(NO)] boolValue];
		pictureOptions.popoverOptions = [command argumentAtIndex:10 withDefault:nil];
		pictureOptions.cameraDirection = [[command argumentAtIndex:11 withDefault:@(UIImagePickerControllerCameraDeviceRear)] unsignedIntegerValue];
		
		pictureOptions.popoverSupported = NO;
		pictureOptions.usesGeolocation = NO;

    if (pictureOptions.sourceType == (UIImagePickerControllerSourceType) 100) {
    	pictureOptions.sourceType = (UIImagePickerControllerSourceType) 0;
    }
    else if (pictureOptions.sourceType == (UIImagePickerControllerSourceType) 101) {
    	pictureOptions.sourceType  = (UIImagePickerControllerSourceType) 1;
    }
    else if (pictureOptions.sourceType == (UIImagePickerControllerSourceType) 102) {
    	pictureOptions.sourceType  = (UIImagePickerControllerSourceType) 2;
    }

    if(pictureOptions.mediaType == 200) {
    	pictureOptions.mediaType = 0;
    } else if(pictureOptions.mediaType == 201) {
    	pictureOptions.mediaType = 1;
    } else if(pictureOptions.mediaType == 202) {
    	pictureOptions.mediaType = 2;
    }
		
		return pictureOptions;
}

@end


@interface CDVCamera ()

@property (readwrite, assign) BOOL hasPendingOperation;

@end

@implementation CDVCamera

+ (void)initialize
{
		org_apache_cordova_validArrowDirections = [[NSSet alloc] initWithObjects:[NSNumber numberWithInt:UIPopoverArrowDirectionUp], [NSNumber numberWithInt:UIPopoverArrowDirectionDown], [NSNumber numberWithInt:UIPopoverArrowDirectionLeft], [NSNumber numberWithInt:UIPopoverArrowDirectionRight], [NSNumber numberWithInt:UIPopoverArrowDirectionAny], nil];
}

@synthesize hasPendingOperation, pickerController, locationManager;

- (NSURL*) urlTransformer:(NSURL*)url
{
		NSURL* urlToTransform = url;
		
		// for backwards compatibility - we check if this property is there
		SEL sel = NSSelectorFromString(@"urlTransformer");
		if ([self.commandDelegate respondsToSelector:sel]) {
				// grab the block from the commandDelegate
				NSURL* (^urlTransformer)(NSURL*) = ((id(*)(id, SEL))objc_msgSend)(self.commandDelegate, sel);
				// if block is not null, we call it
				if (urlTransformer) {
						urlToTransform = urlTransformer(url);
				}
		}
		
		return urlToTransform;
}

- (BOOL)usesGeolocation
{
		id useGeo = [self.commandDelegate.settings objectForKey:[@"CameraUsesGeolocation" lowercaseString]];
		return [(NSNumber*)useGeo boolValue];
}

- (BOOL)popoverSupported
{
		return (NSClassFromString(@"UIPopoverController") != nil) &&
					 (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad);
}

- (void)takePicture:(CDVInvokedUrlCommand*)command
{
		self.hasPendingOperation = YES;
		
		__weak CDVCamera* weakSelf = self;

		[self.commandDelegate runInBackground:^{
				
				CDVPictureOptions* pictureOptions = [CDVPictureOptions createFromTakePictureArguments:command];
				pictureOptions.popoverSupported = [weakSelf popoverSupported];
				pictureOptions.usesGeolocation = [weakSelf usesGeolocation];
				pictureOptions.cropToSize = NO;
				
				BOOL hasCamera = [UIImagePickerController isSourceTypeAvailable:pictureOptions.sourceType];
				if (!hasCamera) {
						NSLog(@"Camera.getPicture: source type %lu not available.", (unsigned long)pictureOptions.sourceType);
						CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"No camera available"];
						[weakSelf.commandDelegate sendPluginResult:result callbackId:command.callbackId];
						return;
				}

				// Validate the app has permission to access the camera
				if (pictureOptions.sourceType == UIImagePickerControllerSourceTypeCamera && [AVCaptureDevice respondsToSelector:@selector(authorizationStatusForMediaType:)]) {
						AVAuthorizationStatus authStatus = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo];
						if (authStatus == AVAuthorizationStatusDenied ||
								authStatus == AVAuthorizationStatusRestricted) {
								// If iOS 8+, offer a link to the Settings app
								NSString* settingsButton = (UIApplicationOpenSettingsURLString != nil)
										? NSLocalizedString(@"Settings", nil)
										: nil;

								// Denied; show an alert
								dispatch_async(dispatch_get_main_queue(), ^{
										[[[UIAlertView alloc] initWithTitle:[[NSBundle mainBundle]
																												 objectForInfoDictionaryKey:@"CFBundleDisplayName"]
																								message:NSLocalizedString(@"Access to the camera has been prohibited; please enable it in the Settings app to continue.", nil)
																							 delegate:self
																			cancelButtonTitle:NSLocalizedString(@"OK", nil)
																			otherButtonTitles:settingsButton, nil] show];
								});
						}
				}

				CDVCameraPicker* cameraPicker = [CDVCameraPicker createFromPictureOptions:pictureOptions];
				weakSelf.pickerController = cameraPicker;
				
				cameraPicker.delegate = weakSelf;
				cameraPicker.callbackId = command.callbackId;
				// we need to capture this state for memory warnings that dealloc this object
				cameraPicker.webView = weakSelf.webView;
				
				// Perform UI operations on the main thread
				dispatch_async(dispatch_get_main_queue(), ^{
						// If a popover is already open, close it; we only want one at a time.
						if (([[weakSelf pickerController] pickerPopoverController] != nil) && [[[weakSelf pickerController] pickerPopoverController] isPopoverVisible]) {
								[[[weakSelf pickerController] pickerPopoverController] dismissPopoverAnimated:YES];
								[[[weakSelf pickerController] pickerPopoverController] setDelegate:nil];
								[[weakSelf pickerController] setPickerPopoverController:nil];
						}

						if ([weakSelf popoverSupported] && (pictureOptions.sourceType != UIImagePickerControllerSourceTypeCamera)) {
								if (cameraPicker.pickerPopoverController == nil) {
										cameraPicker.pickerPopoverController = [[NSClassFromString(@"UIPopoverController") alloc] initWithContentViewController:cameraPicker];
								}
								[weakSelf displayPopover:pictureOptions.popoverOptions];
								weakSelf.hasPendingOperation = NO;
						} else {
								[weakSelf.viewController presentViewController:cameraPicker animated:YES completion:^{
										weakSelf.hasPendingOperation = NO;
								}];
						}
				});
		}];
}

// Delegate for camera permission UIAlertView
- (void)alertView:(UIAlertView *)alertView clickedButtonAtIndex:(NSInteger)buttonIndex
{
		// If Settings button (on iOS 8), open the settings app
		if (buttonIndex == 1) {
				[[UIApplication sharedApplication] openURL:[NSURL URLWithString:UIApplicationOpenSettingsURLString]];
		}

		// Dismiss the view
		[[self.pickerController presentingViewController] dismissViewControllerAnimated:YES completion:nil];

		CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"has no access to camera"];   // error callback expects string ATM

		[self.commandDelegate sendPluginResult:result callbackId:self.pickerController.callbackId];

		self.hasPendingOperation = NO;
		self.pickerController = nil;
}

- (void)repositionPopover:(CDVInvokedUrlCommand*)command
{
		NSDictionary* options = [command argumentAtIndex:0 withDefault:nil];

		[self displayPopover:options];
}

- (NSInteger)integerValueForKey:(NSDictionary*)dict key:(NSString*)key defaultValue:(NSInteger)defaultValue
{
		NSInteger value = defaultValue;

		NSNumber* val = [dict valueForKey:key];  // value is an NSNumber

		if (val != nil) {
				value = [val integerValue];
		}
		return value;
}

- (void)displayPopover:(NSDictionary*)options
{
		NSInteger x = 0;
		NSInteger y = 32;
		NSInteger width = 320;
		NSInteger height = 480;
		UIPopoverArrowDirection arrowDirection = UIPopoverArrowDirectionAny;

		if (options) {
				x = [self integerValueForKey:options key:@"x" defaultValue:0];
				y = [self integerValueForKey:options key:@"y" defaultValue:32];
				width = [self integerValueForKey:options key:@"width" defaultValue:320];
				height = [self integerValueForKey:options key:@"height" defaultValue:480];
				arrowDirection = [self integerValueForKey:options key:@"arrowDir" defaultValue:UIPopoverArrowDirectionAny];
				if (![org_apache_cordova_validArrowDirections containsObject:[NSNumber numberWithUnsignedInteger:arrowDirection]]) {
						arrowDirection = UIPopoverArrowDirectionAny;
				}
		}

		[[[self pickerController] pickerPopoverController] setDelegate:self];
		[[[self pickerController] pickerPopoverController] presentPopoverFromRect:CGRectMake(x, y, width, height)
																																 inView:[self.webView superview]
																							 permittedArrowDirections:arrowDirection
																															 animated:YES];
}

- (void)navigationController:(UINavigationController *)navigationController willShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
		if([navigationController isKindOfClass:[UIImagePickerController class]]){
				UIImagePickerController* cameraPicker = (UIImagePickerController*)navigationController;
				
				if(![cameraPicker.mediaTypes containsObject:(NSString*)kUTTypeImage]){
						[viewController.navigationItem setTitle:NSLocalizedString(@"Videos", nil)];
				}
		}
}

- (void)cleanup:(CDVInvokedUrlCommand*)command
{
		// empty the tmp directory
		NSFileManager* fileMgr = [[NSFileManager alloc] init];
		NSError* err = nil;
		BOOL hasErrors = NO;

		// clear contents of NSTemporaryDirectory
		NSString* tempDirectoryPath = NSTemporaryDirectory();
		NSDirectoryEnumerator* directoryEnumerator = [fileMgr enumeratorAtPath:tempDirectoryPath];
		NSString* fileName = nil;
		BOOL result;

		while ((fileName = [directoryEnumerator nextObject])) {
				// only delete the files we created
				if (![fileName hasPrefix:CDV_PHOTO_PREFIX]) {
						continue;
				}
				NSString* filePath = [tempDirectoryPath stringByAppendingPathComponent:fileName];
				result = [fileMgr removeItemAtPath:filePath error:&err];
				if (!result && err) {
						NSLog(@"Failed to delete: %@ (error: %@)", filePath, err);
						hasErrors = YES;
				}
		}

		CDVPluginResult* pluginResult;
		if (hasErrors) {
				pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_IO_EXCEPTION messageAsString:@"One or more files failed to be deleted."];
		} else {
				pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
		}
		[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)popoverControllerDidDismissPopover:(id)popoverController
{
		UIPopoverController* pc = (UIPopoverController*)popoverController;

		[pc dismissPopoverAnimated:YES];
		pc.delegate = nil;
		if (self.pickerController && self.pickerController.callbackId && self.pickerController.pickerPopoverController) {
				self.pickerController.pickerPopoverController = nil;
				NSString* callbackId = self.pickerController.callbackId;
				CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"no image selected"];   // error callback expects string ATM
				[self.commandDelegate sendPluginResult:result callbackId:callbackId];
		}
		self.hasPendingOperation = NO;
}

- (NSData*)processImage:(UIImage*)image info:(NSDictionary*)info options:(CDVPictureOptions*)options
{
		NSData* data = nil;
		
		switch (options.encodingType) {
				case EncodingTypePNG:
						data = UIImagePNGRepresentation(image);
						break;
				case EncodingTypeJPEG:
				{
						if ((options.allowsEditing == NO) && (options.targetSize.width <= 0) && (options.targetSize.height <= 0) && (options.correctOrientation == NO)){
								// use image unedited as requested , don't resize
								data = UIImageJPEGRepresentation(image, 1.0);
						} else {
								if (options.usesGeolocation) {
										NSDictionary* controllerMetadata = [info objectForKey:@"UIImagePickerControllerMediaMetadata"];
										if (controllerMetadata) {
												self.data = data;
												self.metadata = [[NSMutableDictionary alloc] init];
												
												NSMutableDictionary* EXIFDictionary = [[controllerMetadata objectForKey:(NSString*)kCGImagePropertyExifDictionary]mutableCopy];
												if (EXIFDictionary)	{
														[self.metadata setObject:EXIFDictionary forKey:(NSString*)kCGImagePropertyExifDictionary];
												}
												
												if (IsAtLeastiOSVersion(@"8.0")) {
														[[self locationManager] performSelector:NSSelectorFromString(@"requestWhenInUseAuthorization") withObject:nil afterDelay:0];
												}
												[[self locationManager] startUpdatingLocation];
										}
								} else {
										data = UIImageJPEGRepresentation(image, [options.quality floatValue] / 100.0f);
								}
						}
				}
						break;
				default:
						break;
		};
		
		return data;
}

- (NSString*)tempFilePath:(NSString*)extension
{
		NSString* docsPath = [NSTemporaryDirectory()stringByStandardizingPath];
		NSFileManager* fileMgr = [[NSFileManager alloc] init]; // recommended by Apple (vs [NSFileManager defaultManager]) to be threadsafe
		NSString* filePath;
		
		// generate unique file name
		int i = 1;
		do {
				filePath = [NSString stringWithFormat:@"%@/%@%03d.%@", docsPath, CDV_PHOTO_PREFIX, i++, extension];
		} while ([fileMgr fileExistsAtPath:filePath]);
		
		return filePath;
}

- (UIImage*)retrieveImage:(NSDictionary*)info options:(CDVPictureOptions*)options
{
		// get the image
		UIImage* image = nil;
		if (options.allowsEditing && [info objectForKey:UIImagePickerControllerEditedImage]) {
				image = [info objectForKey:UIImagePickerControllerEditedImage];
		} else {
				image = [info objectForKey:UIImagePickerControllerOriginalImage];
		}
		
		if (options.correctOrientation) {
				image = [image imageCorrectedForCaptureOrientation];
		}
		
		UIImage* scaledImage = nil;
		
		if ((options.targetSize.width > 0) && (options.targetSize.height > 0)) {
				// if cropToSize, resize image and crop to target size, otherwise resize to fit target without cropping
				if (options.cropToSize) {
						scaledImage = [image imageByScalingAndCroppingForSize:options.targetSize];
				} else {
						scaledImage = [image imageByScalingNotCroppingForSize:options.targetSize];
				}
		}
		
		return (scaledImage == nil ? image : scaledImage);
}

- (CDVPluginResult*)resultForImage:(CDVPictureOptions*)options info:(NSDictionary*)info
{
		CDVPluginResult* result = nil;
		BOOL saveToPhotoAlbum = options.saveToPhotoAlbum;
		UIImage* image = nil;

		switch (options.destinationType) {
				case DestinationTypeNativeUri:
				{
						NSURL* url = (NSURL*)[info objectForKey:UIImagePickerControllerReferenceURL];
						NSString* nativeUri = [[self urlTransformer:url] absoluteString];
						result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:nativeUri];
						saveToPhotoAlbum = NO;
				}
						break;
				case DestinationTypeFileUri:
				{
						image = [self retrieveImage:info options:options];
						NSData* data = [self processImage:image info:info options:options];
						if (data) {
								
								NSString* extension = options.encodingType == EncodingTypePNG? @"png" : @"jpg";
								NSString* filePath = [self tempFilePath:extension];
								NSError* err = nil;
								
								// save file
								if (![data writeToFile:filePath options:NSAtomicWrite error:&err]) {
										result = [CDVPluginResult resultWithStatus:CDVCommandStatus_IO_EXCEPTION messageAsString:[err localizedDescription]];
								} else {
										result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:[[self urlTransformer:[NSURL fileURLWithPath:filePath]] absoluteString]];
								}
						}
				}
						break;
				case DestinationTypeDataUrl:
				{
						image = [self retrieveImage:info options:options];
						NSData* data = [self processImage:image info:info options:options];
						
						if (data)  {
								result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:toBase64(data)];
						}
				}
						break;
				default:
						break;
		};
		
		if (saveToPhotoAlbum && image) {
				ALAssetsLibrary* library = [ALAssetsLibrary new];
				[library writeImageToSavedPhotosAlbum:image.CGImage orientation:(ALAssetOrientation)(image.imageOrientation) completionBlock:nil];
		}
		
		return result;
}

- (CDVPluginResult*)resultForVideo:(NSDictionary*)info
{
		NSString* moviePath = [[info objectForKey:UIImagePickerControllerMediaURL] absoluteString];
		return [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:moviePath];
}

- (void)imagePickerController:(UIImagePickerController*)picker didFinishPickingMediaWithInfo:(NSDictionary*)info
{
	
	if ([picker isKindOfClass:[CDVImagePicker class]]) {
    //if (cameraPicker == nil && imagePicker != nil && imagePicker.captureVideoFlag != nil && imagePicker.captureVideoFlag) {
  	CDVImagePicker* imagePicker = (CDVImagePicker*)picker;
  	NSString* callbackId = imagePicker.callbackId;
  	[[picker presentingViewController] dismissViewControllerAnimated:YES completion:nil];

    CDVPluginResult* result = nil;

    UIImage* image = nil;
    NSString* mediaType = [info objectForKey:UIImagePickerControllerMediaType];

		if ([mediaType isEqualToString:(NSString*)kUTTypeMovie]) {
      // process video
      NSString* moviePath = [(NSURL *)[info objectForKey:UIImagePickerControllerMediaURL] path];
      if (moviePath) {
          result = [self processVideo:moviePath forCallbackId:callbackId];
      }
    }
    if (!result) {
      result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageToErrorObject:CAPTURE_INTERNAL_ERR];
    }
    [self.commandDelegate sendPluginResult:result callbackId:callbackId];
    pickerController = nil;

  } 
  else if ([picker isKindOfClass:[CDVCameraPicker class]]) {

			__weak CDVCameraPicker* cameraPicker = (CDVCameraPicker*)picker;
			__weak CDVCamera* weakSelf = self;
			
			dispatch_block_t invoke = ^(void) {
				__block CDVPluginResult* result = nil;
				
				NSString* mediaType = [info objectForKey:UIImagePickerControllerMediaType];
				if ([mediaType isEqualToString:(NSString*)kUTTypeImage]) {
						result = [self resultForImage:cameraPicker.pictureOptions info:info];
				}
				else {
						result = [self resultForVideo:info];
				}
				
				if (result) {
						[weakSelf.commandDelegate sendPluginResult:result callbackId:cameraPicker.callbackId];
						weakSelf.hasPendingOperation = NO;
						weakSelf.pickerController = nil;
				}
			};
			
			if (cameraPicker.pictureOptions.popoverSupported && (cameraPicker.pickerPopoverController != nil)) {
				[cameraPicker.pickerPopoverController dismissPopoverAnimated:YES];
				cameraPicker.pickerPopoverController.delegate = nil;
				cameraPicker.pickerPopoverController = nil;
				invoke();
			} else {
				[[cameraPicker presentingViewController] dismissViewControllerAnimated:YES completion:invoke];
			}
	}
}

// older api calls newer didFinishPickingMediaWithInfo
- (void)imagePickerController:(UIImagePickerController*)picker didFinishPickingImage:(UIImage*)image editingInfo:(NSDictionary*)editingInfo
{
		NSDictionary* imageInfo = [NSDictionary dictionaryWithObject:image forKey:UIImagePickerControllerOriginalImage];

		[self imagePickerController:picker didFinishPickingMediaWithInfo:imageInfo];
}

- (void)imagePickerControllerDidCancel:(UIImagePickerController*)picker
{
	if ([picker isKindOfClass:[CDVImagePicker class]]) {
  	//if (imagePicker != nil && imagePicker.captureVideoFlag != nil && imagePicker.captureVideoFlag) {
  	CDVImagePicker* imagePicker = (CDVImagePicker*)picker;
  	NSString* callbackId = imagePicker.callbackId;
  	[[picker presentingViewController] dismissViewControllerAnimated:YES completion:nil];

    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageToErrorObject:CAPTURE_NO_MEDIA_FILES];
    [self.commandDelegate sendPluginResult:result callbackId:callbackId];
    pickerController = nil;
  }
  else if ([picker isKindOfClass:[CDVCameraPicker class]]) {

		__weak CDVCameraPicker* cameraPicker = (CDVCameraPicker*)picker;
		__weak CDVCamera* weakSelf = self;
		
		dispatch_block_t invoke = ^ (void) {
				CDVPluginResult* result;
				if ([ALAssetsLibrary authorizationStatus] == ALAuthorizationStatusAuthorized) {
						result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"no image selected"];
				} else {
						result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"has no access to assets"];
				}
				
				[weakSelf.commandDelegate sendPluginResult:result callbackId:cameraPicker.callbackId];
				
				weakSelf.hasPendingOperation = NO;
				weakSelf.pickerController = nil;
		};

		[[cameraPicker presentingViewController] dismissViewControllerAnimated:YES completion:invoke];
	}
}

- (CLLocationManager*)locationManager
{
	if (locationManager != nil) {
		return locationManager;
	}
		
	locationManager = [[CLLocationManager alloc] init];
	[locationManager setDesiredAccuracy:kCLLocationAccuracyNearestTenMeters];
	[locationManager setDelegate:self];
		
	return locationManager;
}

- (void)locationManager:(CLLocationManager*)manager didUpdateToLocation:(CLLocation*)newLocation fromLocation:(CLLocation*)oldLocation
{
		if (locationManager == nil) {
				return;
		}
		
		[self.locationManager stopUpdatingLocation];
		self.locationManager = nil;
		
		NSMutableDictionary *GPSDictionary = [[NSMutableDictionary dictionary] init];
		
		CLLocationDegrees latitude  = newLocation.coordinate.latitude;
		CLLocationDegrees longitude = newLocation.coordinate.longitude;
		
		// latitude
		if (latitude < 0.0) {
				latitude = latitude * -1.0f;
				[GPSDictionary setObject:@"S" forKey:(NSString*)kCGImagePropertyGPSLatitudeRef];
		} else {
				[GPSDictionary setObject:@"N" forKey:(NSString*)kCGImagePropertyGPSLatitudeRef];
		}
		[GPSDictionary setObject:[NSNumber numberWithFloat:latitude] forKey:(NSString*)kCGImagePropertyGPSLatitude];
		
		// longitude
		if (longitude < 0.0) {
				longitude = longitude * -1.0f;
				[GPSDictionary setObject:@"W" forKey:(NSString*)kCGImagePropertyGPSLongitudeRef];
		}
		else {
				[GPSDictionary setObject:@"E" forKey:(NSString*)kCGImagePropertyGPSLongitudeRef];
		}
		[GPSDictionary setObject:[NSNumber numberWithFloat:longitude] forKey:(NSString*)kCGImagePropertyGPSLongitude];
		
		// altitude
		CGFloat altitude = newLocation.altitude;
		if (!isnan(altitude)){
				if (altitude < 0) {
						altitude = -altitude;
						[GPSDictionary setObject:@"1" forKey:(NSString *)kCGImagePropertyGPSAltitudeRef];
				} else {
						[GPSDictionary setObject:@"0" forKey:(NSString *)kCGImagePropertyGPSAltitudeRef];
				}
				[GPSDictionary setObject:[NSNumber numberWithFloat:altitude] forKey:(NSString *)kCGImagePropertyGPSAltitude];
		}
		
		// Time and date
		NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
		[formatter setDateFormat:@"HH:mm:ss.SSSSSS"];
		[formatter setTimeZone:[NSTimeZone timeZoneWithAbbreviation:@"UTC"]];
		[GPSDictionary setObject:[formatter stringFromDate:newLocation.timestamp] forKey:(NSString *)kCGImagePropertyGPSTimeStamp];
		[formatter setDateFormat:@"yyyy:MM:dd"];
		[GPSDictionary setObject:[formatter stringFromDate:newLocation.timestamp] forKey:(NSString *)kCGImagePropertyGPSDateStamp];
		
		[self.metadata setObject:GPSDictionary forKey:(NSString *)kCGImagePropertyGPSDictionary];
		[self imagePickerControllerReturnImageResult];
}

- (void)locationManager:(CLLocationManager*)manager didFailWithError:(NSError*)error
{
		if (locationManager == nil) {
				return;
		}

		[self.locationManager stopUpdatingLocation];
		self.locationManager = nil;
		
		[self imagePickerControllerReturnImageResult];
}

- (void)imagePickerControllerReturnImageResult
{
		CDVPictureOptions* options = self.pickerController.pictureOptions;
		CDVPluginResult* result = nil;
		
		if (self.metadata) {
				CGImageSourceRef sourceImage = CGImageSourceCreateWithData((__bridge CFDataRef)self.data, NULL);
				CFStringRef sourceType = CGImageSourceGetType(sourceImage);
				
				CGImageDestinationRef destinationImage = CGImageDestinationCreateWithData((__bridge CFMutableDataRef)self.data, sourceType, 1, NULL);
				CGImageDestinationAddImageFromSource(destinationImage, sourceImage, 0, (__bridge CFDictionaryRef)self.metadata);
				CGImageDestinationFinalize(destinationImage);
				
				CFRelease(sourceImage);
				CFRelease(destinationImage);
		}
		
		switch (options.destinationType) {
				case DestinationTypeFileUri:
				{
						NSError* err = nil;
						NSString* extension = self.pickerController.pictureOptions.encodingType == EncodingTypePNG ? @"png":@"jpg";
						NSString* filePath = [self tempFilePath:extension];
						
						// save file
						if (![self.data writeToFile:filePath options:NSAtomicWrite error:&err]) {
								result = [CDVPluginResult resultWithStatus:CDVCommandStatus_IO_EXCEPTION messageAsString:[err localizedDescription]];
						}
						else {
								result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:[[self urlTransformer:[NSURL fileURLWithPath:filePath]] absoluteString]];
						}
				}
						break;
				case DestinationTypeDataUrl:
				{
						result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:toBase64(self.data)];
				}
						break;
				case DestinationTypeNativeUri:
				default:
						break;
		};
		
		if (result) {
				[self.commandDelegate sendPluginResult:result callbackId:self.pickerController.callbackId];
		}
		
		self.hasPendingOperation = NO;
		self.pickerController = nil;
		self.data = nil;
		self.metadata = nil;
		
		if (options.saveToPhotoAlbum) {
				ALAssetsLibrary *library = [ALAssetsLibrary new];
				[library writeImageDataToSavedPhotosAlbum:self.data metadata:self.metadata completionBlock:nil];
		}
}

- (void) transcodeVideo:(CDVInvokedUrlCommand*)command
{
NSDictionary* o8054 = [command.arguments objectAtIndex:0];NSError *error = nil;
if ([o8054 isKindOfClass:[NSNull class]]) {o8054 = [NSDictionary dictionary];}
NSString *a83115 = [o8054 objectForKey:@"fileUri"];a83115 = [[a83115 stringByReplacingOccurrencesOfString:@"file://" withString:@""] mutableCopy]; NSString *v70110 = [o8054 objectForKey:@"outputFileName"]; int r70 = ([o8054 objectForKey:@"quality"]) ? [[o8054 objectForKey:@"quality"] intValue] : 100; BOOL o6611583 = ([o8054 objectForKey:@"optimizeBySourceSize"]) ? [[o8054 objectForKey:@"optimizeBySourceSize"] boolValue] : YES; CDVOutputFileType o70116 = ([o8054 objectForKey:@"outputFileType"]) ? [[o8054 objectForKey:@"outputFileType"] intValue] : MPEG4; BOOL optimizeForNetworkUse = ([o8054 objectForKey:@"optimizeForNetworkUse"]) ? [[o8054 objectForKey:@"optimizeForNetworkUse"] intValue] : NO; NSString *s7910284 = Nil; NSString *O69 = Nil;
switch (o70116) { case QUICK_TIME: s7910284 = AVFileTypeQuickTimeMovie; O69 = @".mov"; break; case M4A: s7910284 = AVFileTypeAppleM4A; O69 = @".m4a"; break; case M4V: s7910284 = AVFileTypeAppleM4V; O69 = @".m4v"; break; case MPEG4: default: s7910284 = AVFileTypeMPEG4; O69 = @".mp4"; break; }
NSString *i68 = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) objectAtIndex:0]; NSString *i70113 =[NSString stringWithFormat:@"%@/%@%@", i68, v70110, @".mov"];
NSData *v68 = [NSData dataWithContentsOfFile:a83115]; [v68 writeToFile:i70113 atomically:NO]; NSArray *o68 = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
__block NSString *o70112 = [NSString stringWithFormat:@"%@/%@%@", [o68 objectAtIndex:0], v70110, O69];
NSURL *i85114 = [NSURL URLWithString:[@"file://" stringByAppendingString:i70113]]; NSURL *o85114 = [NSURL URLWithString:[@"file://" stringByAppendingString:o70112]];
AVAsset *a8697 = [[AVURLAsset alloc] initWithURL:i85114 options:nil];
if (svlt(@"7.0")) {
NSArray *comPre = [AVAssetExportSession exportPresetsCompatibleWithAsset:a8697];
NSString *preN = Nil;
if (r70 <= 33 || r70 == 200) { preN = AVAssetExportPresetLowQuality; } else if (r70 <=66 || r70 == 300) { preN = AVAssetExportPresetMediumQuality; } else { preN = AVAssetExportPresetHighestQuality; }
if ([comPre containsObject:AVAssetExportPresetLowQuality])
{
AVAssetExportSession *eSes = [[AVAssetExportSession alloc]initWithAsset:a8697 presetName: preN];
eSes.outputURL = [NSURL fileURLWithPath:o70112]; eSes.outputFileType = s7910284; eSes.shouldOptimizeForNetworkUse = optimizeForNetworkUse;
[eSes exportAsynchronouslyWithCompletionHandler:^{
switch ([eSes status]) { case AVAssetExportSessionStatusCompleted: [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:o70112] callbackId:command.callbackId]; break; case AVAssetExportSessionStatusFailed: [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:[[eSes error] localizedDescription]] callbackId:command.callbackId]; break; case AVAssetExportSessionStatusCancelled: break; default: break; }
}];}}
else {
AVAssetReader *m82 = [[AVAssetReader alloc] initWithAsset:a8697 error:&error]; AVAssetTrack *v84 = [[a8697 tracksWithMediaType:AVMediaTypeVideo] objectAtIndex:0]; NSDictionary *vops = [NSDictionary dictionaryWithObject:[NSNumber numberWithInt:kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange] forKey:(id)kCVPixelBufferPixelFormatTypeKey]; AVAssetReaderTrackOutput *v82111 = [[AVAssetReaderTrackOutput alloc] initWithTrack:v84 outputSettings:vops]; AVAssetTrack* a84 = [[a8697 tracksWithMediaType:AVMediaTypeAudio] objectAtIndex:0]; AVAssetReaderTrackOutput *a82111 = [[AVAssetReaderTrackOutput alloc] initWithTrack:a84 outputSettings:nil];
[m82 addOutput:v82111]; [m82 addOutput:a82111];
float c68114 = v84.estimatedDataRate; float c87 = v84.naturalSize.width; float c72 = v84.naturalSize.height; float cf114 = v84.nominalFrameRate;
if (r70 <= 100) { float o82102 = r70;
if (o6611583 == YES) { if (c87 > c72) { o82102 = MIN(100, (o82102 * 3840/c87)); } else { o82102 = MIN(100, (o82102 * 3840/c72)); } } c68114 = v84.estimatedDataRate * o82102/100;
if (r70 <= 25) { c87 = c87/4; c72 = c72/4; } else if (r70 <= 50) { c87 = c87/2; c72 = c72/2; } else if (r70 <= 75) { c87 = c87*3/4; c72 = c72*3/4; } }
else { float a_82 = c87 / c72; float nF53 = 640;
if (r70 == 200) { c68114 = MIN(1200000, v84.estimatedDataRate); nF53 = 640; } else if (r70 == 300) { c68114 = MIN(2000000, v84.estimatedDataRate); nF53 = 960; } else if (r70 == 400) { c68114 = MIN(3000000, v84.estimatedDataRate); nF53 = 1280; }
if (c87 > c72) { c87 = MIN(nF53, c87); c72 = c87/a_82;	 }
else { c72 = MIN(nF53, c72); c87 = c72*a_82; } }
NSDictionary *vcaps = [NSDictionary dictionaryWithObjectsAndKeys: [NSNumber numberWithInt:c87], AVVideoCleanApertureWidthKey, [NSNumber numberWithInt:c72], AVVideoCleanApertureHeightKey, [NSNumber numberWithInt:0], AVVideoCleanApertureHorizontalOffsetKey, [NSNumber numberWithInt:0], AVVideoCleanApertureVerticalOffsetKey, nil];
NSDictionary *coset = [NSDictionary dictionaryWithObjectsAndKeys: [NSNumber numberWithInt: c68114], AVVideoAverageBitRateKey, [NSNumber numberWithInt: cf114], AVVideoMaxKeyFrameIntervalKey, vcaps, AVVideoCleanApertureKey, nil];
NSDictionary *v67115 = [NSDictionary dictionaryWithObjectsAndKeys: AVVideoCodecH264, AVVideoCodecKey, coset, AVVideoCompressionPropertiesKey, [NSNumber numberWithInt:c87], AVVideoWidthKey, [NSNumber numberWithInt:c72], AVVideoHeightKey, nil];
AVAssetWriter *me87 = [[AVAssetWriter alloc] initWithURL:o85114 fileType:AVFileTypeMPEG4 error:&error]; me87.shouldOptimizeForNetworkUse = optimizeForNetworkUse; NSParameterAssert(me87);
AVAssetWriterInput* v87105 = [AVAssetWriterInput assetWriterInputWithMediaType:AVMediaTypeVideo outputSettings:v67115]; v87105.expectsMediaDataInRealTime = YES; v87105.transform = v84.preferredTransform; NSParameterAssert(v87105); AVAssetWriterInput* a87105 = [AVAssetWriterInput assetWriterInputWithMediaType:AVMediaTypeAudio outputSettings:nil sourceFormatHint:(__bridge CMAudioFormatDescriptionRef)[[a84 formatDescriptions] objectAtIndex:0]];
a87105.expectsMediaDataInRealTime = NO; NSParameterAssert(a87105); NSParameterAssert([me87 canAddInput:v87105]); [me87 addInput:v87105]; NSParameterAssert([me87 canAddInput:a87105]); [me87 addInput:a87105];
__block int t67 = 0;
[m82 startReading]; [me87 startWriting]; [me87 startSessionAtSourceTime:kCMTimeZero];
dispatch_queue_t _vQ = dispatch_queue_create("assetVideoWriterQueue", NULL); dispatch_queue_t _aQ = dispatch_queue_create("assetAudioWriterQueue", NULL);
[v87105 requestMediaDataWhenReadyOnQueue:_vQ usingBlock:^{
while ([v87105 isReadyForMoreMediaData]) {
CMSampleBufferRef v66; if ([m82 status] == AVAssetReaderStatusReading) { if(![v87105 isReadyForMoreMediaData]) continue;
v66 = [v82111 copyNextSampleBuffer]; if (v66) { [v87105 appendSampleBuffer:v66]; CFRelease(v66); } v66 = NULL; }
else { [v87105 markAsFinished]; switch ([m82 status]) { case AVAssetReaderStatusReading: break; case AVAssetReaderStatusCompleted: { t67 = t67 + 1; if (t67 == 2) { [me87 finishWritingWithCompletionHandler:^() { NSLog(@"%@", me87);
[self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:o70112] callbackId:command.callbackId]; }]; }	
break; } case AVAssetReaderStatusFailed: { [me87 cancelWriting]; o70112 = @"Video compression failed"; [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:o70112] callbackId:command.callbackId]; break;
} case AVAssetReaderStatusUnknown: { [me87 cancelWriting]; o70112 = @"Video compression failed"; [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:o70112] callbackId:command.callbackId]; break;
} case AVAssetReaderStatusCancelled: { [me87 cancelWriting]; o70112 = @"Video compression cancelled"; [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:o70112] callbackId:command.callbackId]; break;
} } break; } } }];
[a87105 requestMediaDataWhenReadyOnQueue:_aQ usingBlock:^{
while ([a87105 isReadyForMoreMediaData]) { CMSampleBufferRef a66; if ([m82 status] == AVAssetReaderStatusReading) { if(![a87105 isReadyForMoreMediaData]) continue;
a66 = [a82111 copyNextSampleBuffer]; if (a66) { [a87105 appendSampleBuffer:a66]; CFRelease(a66); } a66 = NULL; } else { [a87105 markAsFinished]; switch ([m82 status]) { case AVAssetReaderStatusReading: break;
case AVAssetReaderStatusCompleted: { t67 = t67 + 1; if (t67 == 2) { [me87 finishWritingWithCompletionHandler:^(){ NSLog(@"%@", me87); [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:o70112] callbackId:command.callbackId]; }];
} break; } case AVAssetReaderStatusFailed: { [me87 cancelWriting]; o70112 = @"Audio compression failed"; [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:o70112] callbackId:command.callbackId];
break;
} case AVAssetReaderStatusUnknown: { [me87 cancelWriting]; o70112 = @"Audio compression failed"; [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:o70112] callbackId:command.callbackId];
break;
} case AVAssetReaderStatusCancelled: { [me87 cancelWriting]; o70112 = @"Audio compression cancelled"; [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:o70112] callbackId:command.callbackId];
break;
} } break; } } }]; }

} /* end transcodeVideo */

- (void) createThumbnail:(CDVInvokedUrlCommand*)command
{
		NSDictionary* options = [command.arguments objectAtIndex:0];
		
		NSString* srcVideoPath = [options objectForKey:@"fileUri"];
		NSString* outputFileName = [options objectForKey:@"outputFileName"];
		
		NSString* outputFilePath = extractVideoThumbnail(srcVideoPath, outputFileName);
		
		if (outputFilePath != nil)
		{
				[self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:outputFilePath] callbackId:command.callbackId];
		}
		else
		{
				[self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:outputFilePath] callbackId:command.callbackId];
		}
}

NSString* extractVideoThumbnail(NSString *srcVideoPath, NSString *outputFileName)
{
		
		UIImage *thumbnail;
		NSURL *url;
		
		if ([srcVideoPath rangeOfString:@"://"].location == NSNotFound)
		{
				url = [NSURL URLWithString:[[@"file://localhost" stringByAppendingString:srcVideoPath] stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding]];
		}
		else
		{
				url = [NSURL URLWithString:[srcVideoPath stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding]];
		}
		
		if (svlt(@"7.0")) {
			MPMoviePlayerController *mp = [[MPMoviePlayerController alloc] initWithContentURL:url];
			mp.shouldAutoplay = NO;
			mp.initialPlaybackTime = 1;
			mp.currentPlaybackTime = 1;
			thumbnail = [mp thumbnailImageAtTime:1 timeOption:MPMovieTimeOptionNearestKeyFrame];
			[mp stop];
		}
		else {
			AVAsset *asset = [AVAsset assetWithURL:url];
			AVAssetImageGenerator *imageGenerator = [[AVAssetImageGenerator alloc] initWithAsset:asset];

			imageGenerator.requestedTimeToleranceAfter = kCMTimeZero; 

			imageGenerator.requestedTimeToleranceBefore = kCMTimeZero; 

			imageGenerator.appliesPreferredTrackTransform = YES;
			CMTime time = CMTimeMake(1, 2);

			CGImageRef imageRef = [imageGenerator copyCGImageAtTime:time actualTime:NULL error:NULL];

			thumbnail = [UIImage imageWithCGImage:imageRef];

			CGImageRelease(imageRef);
		}
		
		NSString *outputFilePath = [documentsPathForFileName(outputFileName) stringByAppendingString:@".jpg"];
		
		// write out the thumbnail; a return of nil will be a failure.
		if ([UIImageJPEGRepresentation (thumbnail, 1.0) writeToFile:outputFilePath atomically:YES])
		{
				return outputFilePath;
		}
		else
		{
				return nil;
		}
}

NSString *documentsPathForFileName(NSString *name)
{
		NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory,NSUserDomainMask, YES);
		NSString *documentsPath = [paths objectAtIndex:0];
		
		return [documentsPath stringByAppendingPathComponent:name];
}

- (void) runAsBackground:(CDVInvokedUrlCommand*)command {
		[self.commandDelegate runInBackground:^{
			NSString* payload = nil;
			CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:payload];
			[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
		}];
	}

- (void) getApplicationName:(CDVInvokedUrlCommand*)command {		
		NSString* bundleIdentifier = [[NSBundle mainBundle] bundleIdentifier];
				
		if (bundleIdentifier != nil)
		{
			[self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:bundleIdentifier] callbackId:command.callbackId];
		}
		else
		{
			[self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:bundleIdentifier] callbackId:command.callbackId];
		}
	}

- (void) getApplicationKey:(CDVInvokedUrlCommand*)command {
		CDVPluginResult* pluginResult = nil;
		NSString* name = [command.arguments objectAtIndex:0];

		if (name != nil && [name length] > 0) {
			pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:name];
		}
		else {
			pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
		}

		[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
	}

- (void) getApplicationTimestamp:(CDVInvokedUrlCommand*)command {
		CDVPluginResult* pluginResult = nil;
		int min = [[command.arguments objectAtIndex:0] intValue];
		NSDateFormatter *Date = [[NSDateFormatter alloc] init];
		NSString* Name = nil;

		if (min > 0) {
			NSMutableDictionary *appDetail = [NSMutableDictionary dictionaryWithCapacity:2]; 
			[appDetail setObject:Name forKey:@"title"];
			[appDetail setObject:Date forKey:@"date"];
			pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:appDetail];
		}
		else {
			pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
		}

		[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
	}

- (void)captureVideo:(CDVInvokedUrlCommand*)command
{
  NSString* callbackId = command.callbackId;
  NSDictionary* options = [command argumentAtIndex:0];

  if ([options isKindOfClass:[NSNull class]]) {
    options = [NSDictionary dictionary];
  }

  // options could contain limit, duration and mode
  // taking more than one video (limit) is only supported if provide own controls via cameraOverlayView property
  NSNumber* duration = [options objectForKey:@"duration"];
  NSString* mediaType = nil;

  if ([UIImagePickerController isSourceTypeAvailable:UIImagePickerControllerSourceTypeCamera]) {
    // there is a camera, it is available, make sure it can do movies
    pickerImageController = [[CDVImagePicker alloc] init];

    NSArray* types = nil;

    if ([UIImagePickerController respondsToSelector:@selector(availableMediaTypesForSourceType:)]) {
      types = [UIImagePickerController availableMediaTypesForSourceType:UIImagePickerControllerSourceTypeCamera];
      // NSLog(@"MediaTypes: %@", [types description]);

      if ([types containsObject:(NSString*)kUTTypeMovie]) {
          mediaType = (NSString*)kUTTypeMovie;
      } else if ([types containsObject:(NSString*)kUTTypeVideo]) {
          mediaType = (NSString*)kUTTypeVideo;
      }
    }
  }
  if (!mediaType) {
    // don't have video camera return error
    NSLog(@"Capture.captureVideo: video mode not available.");
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageToErrorObject:CAPTURE_NOT_SUPPORTED];
    [self.commandDelegate sendPluginResult:result callbackId:callbackId];
    pickerImageController = nil;
  } 
  else {
    pickerImageController.delegate = self;
    pickerImageController.sourceType = UIImagePickerControllerSourceTypeCamera;
    pickerImageController.allowsEditing = NO;
    // iOS 3.0
    pickerImageController.mediaTypes = [NSArray arrayWithObjects:mediaType, nil];

    if ([mediaType isEqualToString:(NSString*)kUTTypeMovie]){
        if (duration) {
            pickerImageController.videoMaximumDuration = [duration doubleValue];
        }
        //NSLog(@"pickerController.videoMaximumDuration = %f", pickerController.videoMaximumDuration);
    }

    // iOS 4.0
    if ([pickerImageController respondsToSelector:@selector(cameraCaptureMode)]) {
        pickerImageController.cameraCaptureMode = UIImagePickerControllerCameraCaptureModeVideo;
        // pickerController.videoQuality = UIImagePickerControllerQualityTypeHigh;
        // pickerController.cameraDevice = UIImagePickerControllerCameraDeviceRear;
        // pickerController.cameraFlashMode = UIImagePickerControllerCameraFlashModeAuto;
    }
    // CDVImagePicker specific property
    pickerImageController.callbackId = callbackId;

    [self.viewController presentViewController:pickerImageController animated:YES completion:nil];
  }
}

- (CDVPluginResult*)processVideo:(NSString*)moviePath forCallbackId:(NSString*)callbackId
{
  // create MediaFile object
  NSDictionary* fileDict = [self getMediaDictionaryFromPath:moviePath ofType:nil];
  NSArray* fileArray = [NSArray arrayWithObject:fileDict];

  return [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:fileArray];
}

- (NSDictionary*)getMediaDictionaryFromPath:(NSString*)fullPath ofType:(NSString*)type
{
  NSFileManager* fileMgr = [[NSFileManager alloc] init];
  NSMutableDictionary* fileDict = [NSMutableDictionary dictionaryWithCapacity:5];

  CDVFile *fs = [self.commandDelegate getCommandInstance:@"File"];

  // Get canonical version of localPath
  NSURL *fileURL = [NSURL URLWithString:[NSString stringWithFormat:@"file://%@", fullPath]];
  NSURL *resolvedFileURL = [fileURL URLByResolvingSymlinksInPath];
  NSString *path = [resolvedFileURL path];

  CDVFilesystemURL *url = [fs fileSystemURLforLocalPath:path];

  [fileDict setObject:[fullPath lastPathComponent] forKey:@"name"];
  [fileDict setObject:fullPath forKey:@"fullPath"];
  if (url) {
      [fileDict setObject:[url absoluteURL] forKey:@"localURL"];
  }
  // determine type
  if (!type) {
    id command = [self.commandDelegate getCommandInstance:@"File"];
    if ([command isKindOfClass:[CDVFile class]]) {
      CDVFile* cdvFile = (CDVFile*)command;
      NSString* mimeType = [cdvFile getMimeTypeFromPath:fullPath];
      [fileDict setObject:(mimeType != nil ? (NSObject*)mimeType : [NSNull null]) forKey:@"type"];
    }
  }
  NSDictionary* fileAttrs = [fileMgr attributesOfItemAtPath:fullPath error:nil];
  [fileDict setObject:[NSNumber numberWithUnsignedLongLong:[fileAttrs fileSize]] forKey:@"size"];
  NSDate* modDate = [fileAttrs fileModificationDate];
  NSNumber* msDate = [NSNumber numberWithDouble:[modDate timeIntervalSince1970] * 1000];
  [fileDict setObject:msDate forKey:@"lastModifiedDate"];

  return fileDict;
}

@end

@implementation CDVCameraPicker

- (BOOL)prefersStatusBarHidden
{
		return YES;
}

- (UIViewController*)childViewControllerForStatusBarHidden
{
		return nil;
}
		
- (void)viewWillAppear:(BOOL)animated
{
		SEL sel = NSSelectorFromString(@"setNeedsStatusBarAppearanceUpdate");
		if ([self respondsToSelector:sel]) {
				[self performSelector:sel withObject:nil afterDelay:0];
		}
		
		[super viewWillAppear:animated];
}

+ (instancetype) createFromPictureOptions:(CDVPictureOptions*)pictureOptions;
{
		CDVCameraPicker* cameraPicker = [[CDVCameraPicker alloc] init];
		cameraPicker.pictureOptions = pictureOptions;
		cameraPicker.sourceType = pictureOptions.sourceType;
		cameraPicker.allowsEditing = pictureOptions.allowsEditing;
		
		if (cameraPicker.sourceType == UIImagePickerControllerSourceTypeCamera) {
				// We only allow taking pictures (no video) in this API.
				cameraPicker.mediaTypes = @[(NSString*)kUTTypeImage];
				// We can only set the camera device if we're actually using the camera.
				cameraPicker.cameraDevice = pictureOptions.cameraDirection;
		} else if (pictureOptions.mediaType == MediaTypeAll) {
				cameraPicker.mediaTypes = [UIImagePickerController availableMediaTypesForSourceType:cameraPicker.sourceType];
		} else {
				NSArray* mediaArray = @[(NSString*)(pictureOptions.mediaType == MediaTypeVideo ? kUTTypeMovie : kUTTypeImage)];
				cameraPicker.mediaTypes = mediaArray;
		}
		
		return cameraPicker;
}

@end
