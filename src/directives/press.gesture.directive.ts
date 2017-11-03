import {Directive, ElementRef, Input, OnInit, OnDestroy} from '@angular/core';
import {Gesture} from 'ionic-angular/gestures/gesture';
import {Events} from 'ionic-angular';
declare var Hammer: any;
@Directive({
  selector: '[dbPress]'
})

export class PressDirective implements OnInit, OnDestroy {
  el: HTMLElement;
  pressGesture: Gesture;
  @Input() dbPress: any;

  constructor(el: ElementRef, private events: Events,) {
    this.el = el.nativeElement;
  }

  ngOnInit() {
    this.pressGesture = new Gesture(this.el, {
    recognizers: [
      [Hammer.Tap, {taps: 2}]
    ]
  });
  this.pressGesture.listen();
  this.pressGesture.on('tap', e => {
    this.events.publish('double:click', this.dbPress);
  });
  }

  ngOnDestroy() {
    this.pressGesture.destroy();
  }
}