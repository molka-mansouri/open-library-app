import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeadBar } from "./components/head-bar/head-bar";
import { SearchBar } from "./components/search-bar/search-bar";


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeadBar, SearchBar],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
  title = 'open-library-app';
}