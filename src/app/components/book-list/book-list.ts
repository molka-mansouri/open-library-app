import { Component, OnInit, OnDestroy } from '@angular/core';
import { BookService } from '../../services/book-service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { WishlistService } from '../../services/wishlist-service';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './book-list.html',
  styleUrls: ['./book-list.css']
})
export class BookListComponent implements OnInit, OnDestroy {
  booksList: any[] = [];
  filteredBooks: any[] = [];
  loading = false;
  error?: string;

  private subs = new Subscription();
  private titleFilter = '';
  private yearFilter: number | null = null;

  // Track fetch state to avoid duplicate edition requests
  private fetchingYearsFor: number | null = null;

  // Local cache of wishlist keys for fast lookup and to trigger change detection
  wishKeys: Set<string> = new Set();

  constructor(private bookService: BookService, private wishlist: WishlistService) {}

  ngOnInit(): void {
    this.getBooksList();

    this.subs.add(
      this.bookService.titleFilter.subscribe(q => {
        this.titleFilter = q || '';
        this.applyFilters();
      })
    );

    this.subs.add(
      this.bookService.yearFilter.subscribe(y => {
        this.yearFilter = y;
        this.applyFilters();
      })
    );

    // Subscribe to wishlist updates so buttons update visually
    this.subs.add(
      this.wishlist.changes$.subscribe(items => {
        this.wishKeys = new Set((items || []).map((i: any) => i.key));
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  get isYearFetching(): boolean {
    return this.fetchingYearsFor != null;
  }

  getBooksList(): void {
    this.loading = true;
    this.bookService.getBooks().subscribe({
      next: (data) => {
        // Store works and precompute a _computedYear where possible
        this.booksList = (data.works || []).map((w: any) => ({
          ...w,
          _computedYear: w.first_publish_year || (w.first_publish_date ? this.parseYearFromString(w.first_publish_date) : null)
        }));

        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.error = 'Erreur lors du chargement des livres.';
        this.loading = false;
      }
    });
  }

  // Wishlist helpers used by template
  toggleWishlist(book: any) {
    this.wishlist.toggle(book);
  }

  isInWishlist(book: any): boolean {
    return !!(book && book.key && this.wishKeys.has(book.key));
  }

  private parseYearFromString(s: string | undefined): number | null {
    if (!s) return null;
    const m = String(s).match(/(\d{4})/);
    return m ? Number(m[1]) : null;
  }

  applyFilters(): void {
    const titleQ = this.titleFilter.toLowerCase();
    const yearQ = this.yearFilter;

    // Basic filtering using available _computedYear; if some books lack computed years and a year filter is active,
    // trigger edition fetches to compute accurate years and re-run filtering.
    this.filteredBooks = this.booksList.filter(book => {
      // Title filter
      const title = String(book.title || '').toLowerCase();
      const subtitle = String(book.subtitle || '').toLowerCase();
      const matchesTitle = !titleQ || title.includes(titleQ) || subtitle.includes(titleQ);

      // Year filter
      if (yearQ == null) return matchesTitle;

      const bookYear = book._computedYear;
      if (bookYear != null) return matchesTitle && bookYear === yearQ;

      // bookYear unknown: conservatively exclude until we fetch editions; trigger fetch
      this.fetchMissingYearsForFilter(yearQ);
      return false;
    });

    // Ensure wishlist state doesn't cause visual confusion (no effect on filtering)
    // (wishlist buttons reflect real-time wishlist via the service)
  }

  private fetchMissingYearsForFilter(year: number): void {
    if (this.fetchingYearsFor === year) return; // already fetching for this year
    this.fetchingYearsFor = year;

    // Fetch for books that either have no computed year OR haven't been fetched for this year yet and might match
    const toFetch = this.booksList.filter(b => (b._lastFetchedForYear !== year) && (b._computedYear == null || b._computedYear !== year));
    if (!toFetch.length) {
      this.fetchingYearsFor = null;
      return;
    }

    let remaining = toFetch.length;
    for (const book of toFetch) {
      const id = (book.key || '').split('/').pop();
      if (!id) {
        book._computedYear = null;
        book._lastFetchedForYear = year;
        remaining -= 1;
        if (remaining === 0) { this.fetchingYearsFor = null; this.applyFilters(); }
        continue;
      }

      this.bookService.getEditions(id, 100).subscribe({
        next: (data) => {
          const entries = data?.entries || [];
          const years: number[] = [];
          for (const e of entries) {
            if (Array.isArray(e.publish_year)) {
              for (const y of e.publish_year) if (typeof y === 'number') years.push(y);
            } else if (e.publish_year && typeof e.publish_year === 'number') {
              years.push(e.publish_year);
            } else if (e.publish_date) {
              const mm = String(e.publish_date).match(/(\d{4})/);
              if (mm) years.push(Number(mm[1]));
            }
          }
          if (years.length) book._computedYear = Math.min(...years);
          else book._computedYear = null;
          book._lastFetchedForYear = year;
        },
        error: () => {
          book._computedYear = null;
          book._lastFetchedForYear = year;
        },
        complete: () => {
          remaining -= 1;
          if (remaining === 0) {
            this.fetchingYearsFor = null;
            this.applyFilters();
          }
        }
      });
    }
  }
}