import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BookService } from '../../services/book-service';

@Component({
  selector: 'app-book-details',
  standalone: true,
  imports: [CommonModule, NgIf, RouterModule],
  templateUrl: './book-details.html',
  styleUrls: ['./book-details.css']
})
export class BookDetailsComponent implements OnInit {
  bookId!: string;
  book: any;
  bookComputedYear?: number | null;
  loading = false;
  error?: string;

  constructor(
    private route: ActivatedRoute,
    private bookService: BookService
  ) {}

  ngOnInit(): void {
    this.bookId = this.route.snapshot.paramMap.get('id')!;
    this.getBookDetails();
  }

  getBookDetails(): void {
    this.loading = true;
    this.bookService.getBookById(this.bookId).subscribe({
      next: (data) => {
        this.book = data;
        this.resolvePublishYear();
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger les détails du livre';
        this.loading = false;
      }
    });
  }

  getSubtitle(): string | null {
    if (!this.book) return null;
    if (this.book.subtitle) return String(this.book.subtitle);

    // Try to derive subtitle from title if it contains ':' or ' - '
    const title = String(this.book.title || '');
    const colonIdx = title.indexOf(':');
    if (colonIdx > -1 && colonIdx < title.length - 1) {
      return title.slice(colonIdx + 1).trim();
    }
    const dashMatch = title.match(/\s[-–—]\s(.+)$/);
    if (dashMatch) return dashMatch[1].trim();

    return null;
  }

  private resolvePublishYear(): void {
    // Prefer explicit first_publish_year
    if (this.book?.first_publish_year) {
      this.bookComputedYear = Number(this.book.first_publish_year);
      return;
    }

    // Try parsing first_publish_date string
    if (this.book?.first_publish_date) {
      const m = String(this.book.first_publish_date).match(/(\d{4})/);
      if (m) {
        this.bookComputedYear = Number(m[1]);
        return;
      }
    }

    // Fallback: fetch editions and compute earliest publish year
    this.bookService.getEditions(this.bookId, 100).subscribe({
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
        if (years.length) {
          this.bookComputedYear = Math.min(...years);
        } else {
          this.bookComputedYear = null;
        }
      },
      error: () => {
        this.bookComputedYear = null;
      }
    });
  }
}
