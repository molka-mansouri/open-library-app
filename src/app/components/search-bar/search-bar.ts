import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BookService } from '../../services/book-service';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.html',
  styleUrls: ['./search-bar.css'],
})
export class SearchBar {
  titleQuery: string = '';
  yearQuery?: number | null;

  @Output() searchTitle = new EventEmitter<string>();
  @Output() searchYear = new EventEmitter<number | null>();

  constructor(private bookService: BookService) {}

  onSearchTitle() {
    const q = this.titleQuery.trim();
    this.searchTitle.emit(q);
    this.bookService.setTitleFilter(q);
  }

  onSearchYear() {
    const y = this.yearQuery ? Number(this.yearQuery) : null;
    this.searchYear.emit(y);
    this.bookService.setYearFilter(y);
  }

  clearFilters() {
    this.titleQuery = '';
    this.yearQuery = null;
    this.searchTitle.emit('');
    this.searchYear.emit(null);
    this.bookService.setTitleFilter('');
    this.bookService.setYearFilter(null);
  }
}
