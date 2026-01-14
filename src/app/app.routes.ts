import { Routes } from '@angular/router';
import { BookListComponent } from './components/book-list/book-list';
import { BookDetailsComponent } from './components/book-details/book-details';
import { WishlistComponent } from './components/wishlist/wishlist';

export const routes: Routes = [
  { path: '', component: BookListComponent },
  { path: 'books/:id', component: BookDetailsComponent },
  { path: 'wishlist', component: WishlistComponent },
];
