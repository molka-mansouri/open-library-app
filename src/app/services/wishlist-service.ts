import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private items: any[] = [];
  private subject = new BehaviorSubject<any[]>([]);
  readonly changes$ = this.subject.asObservable();

  add(book: any) {
    if (!this.items.find(i => i.key === book.key)) {
      this.items.push(book);
      this.subject.next([...this.items]);
    }
  }

  remove(book: any) {
    this.items = this.items.filter(i => i.key !== book.key);
    this.subject.next([...this.items]);
  }

  toggle(book: any) {
    if (this.items.find(i => i.key === book.key)) this.remove(book);
    else this.add(book);
  }

  has(book: any): boolean {
    return !!this.items.find(i => i.key === book.key);
  }

  clear() {
    this.items = [];
    this.subject.next([]);
  }
}