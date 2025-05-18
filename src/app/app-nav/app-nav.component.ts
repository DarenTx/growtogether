import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterModule],
  template: `
    <nav class="app-nav">
      <ul>
        <li><a routerLink="/list">My Data</a></li>
        <li><a href="#">Year To Date</a></li>
      </ul>
    </nav>
  `,
  styleUrls: ['./app-nav.component.css'],
})
export class AppNavComponent {}
