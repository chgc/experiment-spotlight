import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Renderer2,
  ViewEncapsulation,
  Input
} from '@angular/core';
import { WCL } from './wcl';

@Component({
  selector: 'app-spotlight',
  templateUrl: './spotlight.component.html',
  styleUrls: ['./spotlight.component.css'],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class SpotlightComponent implements OnInit {
  @ViewChild('spotlight', { static: true, read: ElementRef })
  spotlightRef: ElementRef;

  @Input() mode = 'auto';
  @Input() scale = 2;
  @Input() radius = 50;

  private hostElement;
  private styleElement;
  private readonly escapeFlag = 'esc-spotlight';
  private isActive: boolean = true;
  private readonly defaultData = {
    oX: 0,
    oY: 0
  };
  private wcl: any = WCL;

  private readonly defaults = {
    active: false,
    radius: 50, //unit pixel, for type: Manual
    scale: 2.5,
    mode: 'auto'
  };
  private config;
  private data;

  constructor(private hostRef: ElementRef, private renderer: Renderer2) {
    this.hostElement = this.hostRef.nativeElement;
    this.config = { ...this.defaults };
  }

  ngOnInit() {
    this.styleElement = this.hostElement.shadowRoot.querySelector('style');
    this.renderer.listen(
      this.spotlightRef.nativeElement,
      'transitionend',
      this.onTransitionend.bind(this)
    );

    this.renderer.listen(
      this.spotlightRef.nativeElement,
      'click',
      this.curtainCall.bind(this)
    );

    this.renderer.listen(document.body, 'click', this.onAnchor.bind(this));
  }

  private onTransitionend(evt) {
    const { propertyName } = evt;
    if (
      propertyName !== 'opacity' ||
      this.hostElement.classList.contains('on')
    ) {
      return;
    }
  }

  private curtainCall(evt) {
    if (this.show) {
      this.renderer.removeClass(this.hostRef.nativeElement, 'on');
    }
  }

  private onAnchor(evt) {
    const { target } = evt;
    if (
      !this.active ||
      this.show ||
      target.classList.contains(this.escapeFlag)
    ) {
      return;
    }

    evt.stopImmediatePropagation();
    evt.preventDefault();

    // basic data plug
    this.data = { ...this.defaultData };
    this.config.radius = this.defaults.radius;

    if (this.type === 'auto') {
      const { x, y, width, height } = this.getBoundingClientRect(target);

      this.data.oX = Math.floor(x + width / 2);
      this.data.oY = Math.floor(y + height / 2);
      this.config.radius = Math.floor(Math.max(width, height) / 2);
    } else {
      const { x: coordX, y: coordY } = this.wcl.pointer(evt);
      const { x: scrollX, y: scrollY } = this.wcl.getScroll();

      this.data.oX = coordX - scrollX;
      this.data.oY = coordY - scrollY;
    }

    this.setVars();
    this.active = true;

    setTimeout(() => this.display(), 200);
  }

  private display() {
    this.hostElement.dispatchEvent(
      new CustomEvent('spotlight-viewed', {
        bubbles: true,
        composed: true
      })
    );

    this.renderer.addClass(this.hostElement, 'on');
    this.wcl.scrollLock(true);
  }

  private getPolygon({ oX, oY, r }) {
    const { width, height } = this.wcl.getViewportSize();
    let points = [];

    points.push('0% 0%');
    points.push('0% 100%');
    points.push(`${(oX / width) * 100}% 100%`);
    points.push(`${(oX / width) * 100}% ${((oY + r) / height) * 100}%`);

    for (let i = -1, l = 361; ++i < l; ) {
      let x1, y1, b;

      b = i * -1 * (Math.PI / 180); // clockwise
      x1 = r * Math.sin(b) + oX;
      y1 = r * Math.cos(b) + oY;

      x1 = (x1 / width) * 100;
      y1 = (y1 / height) * 100;

      points.push(`${x1}% ${y1}%`);
    }

    points.push(`${(oX / width) * 100}% ${((oY + r) / height) * 100}%`);
    points.push(`${(oX / width) * 100}% 100%`);
    points.push(`100% 100%`);
    points.push(`100% 0%`);

    return `polygon(${points.join()})`;
  }

  private setVars() {
    const { oX, oY } = this.data;
    let { radius, scale, r } = this.config;

    r = radius * scale;
    this.wcl.addStylesheetRules(
      ':host([active]) .msc-spotlight__ens',
      {
        '--clip-path-start': this.getPolygon({ oX, oY, r: 0.1 }),
        '--clip-path-end': this.getPolygon({ oX, oY, r })
      },
      this.styleElement
    );
  }

  private getBoundingClientRect(element) {
    let rect = element.getBoundingClientRect();

    if (typeof rect.x === 'undefined') {
      let { x, y } = this.wcl.getPosition(element);
      let { x: scrollX, y: scrollY } = this.wcl.getScroll();

      rect = {
        ...rect,
        x: x - scrollX,
        y: y - scrollY
      };
    }

    return rect;
  }

  get show() {
    return this.active && this.hostElement.classList.contains('on');
  }

  set type(value) {
    if (value) {
      this.renderer.setAttribute(this.hostElement, 'type', value);
    } else {
      this.renderer.removeAttribute(this.hostElement, 'type');
    }
  }

  get type() {
    return this.config.type;
  }

  set active(value) {
    if (value) {
      this.renderer.setAttribute(this.hostElement, 'active', '');
    } else {
      this.renderer.removeAttribute(this.hostElement, 'active');
    }
  }
  get active() {
    return this.isActive;
  }
}
