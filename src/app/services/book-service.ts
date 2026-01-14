import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private baseUrl = 'https://openlibrary.org';

  // Filters exposed as observables for components to subscribe
  private titleFilter$ = new BehaviorSubject<string>('');
  private yearFilter$ = new BehaviorSubject<number | null>(null);

  readonly titleFilter = this.titleFilter$.asObservable();
  readonly yearFilter = this.yearFilter$.asObservable();

  constructor(private http: HttpClient) {}

  setTitleFilter(q: string) {
    this.titleFilter$.next(q);
  }

  setYearFilter(y: number | null) {
    this.yearFilter$.next(y);
  }

  getBooks(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/subjects/computers.json`);
  }

  getBookById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/works/${id}.json`);
  }

  // Fetch editions for a work to compute realistic publish years
  getEditions(id: string, limit = 50): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/works/${id}/editions.json?limit=${limit}`);
  }

  searchByTitle(title: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/search.json?title=${encodeURIComponent(title)}`);
  }

  searchByYear(year: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/search.json?first_publish_year=${year}`);
  }
}
