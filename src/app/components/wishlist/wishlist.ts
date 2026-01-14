import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WishlistService } from '../../services/wishlist-service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './wishlist.html',
  styleUrls: ['./wishlist.css']
})
export class WishlistComponent implements OnInit {
  items: any[] = [];

  constructor(private wishlist: WishlistService) {}

  ngOnInit(): void {
    this.wishlist.changes$.subscribe(items => this.items = items);
  }

  remove(item: any) {
    this.wishlist.remove(item);
  }

  clear() {
    this.wishlist.clear();
  }
}