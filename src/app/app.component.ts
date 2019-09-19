import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <button>123</button>
    <app-spotlight active></app-spotlight>
  `,
  styles: []
})
export class AppComponent {
  title = 'spotlight';
}
