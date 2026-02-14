// localStorage utilities for bookmarks, reading history, and preferences

export interface Bookmark {
  bookId: string;
  chapter: number;
  verse: number;
  text: string;
  timestamp: number;
}

export interface ReadingHistory {
  bookId: string;
  chapter: number;
  timestamp: number;
}

const BOOKMARKS_KEY = 'bible_bookmarks';
const HISTORY_KEY = 'bible_reading_history';
const LANGUAGES_KEY = 'bible_languages';
const VERSION_KEY = 'bible_version';
const FONT_SIZE_KEY = 'bible_font_size';

export type Language = 'en' | 'zh';
export type FontSize = 'small' | 'medium' | 'large';

/**
 * Get selected languages
 */
export function getLanguages(): Language[] {
  if (typeof window === 'undefined') return ['en'];
  const stored = localStorage.getItem(LANGUAGES_KEY);
  return stored ? JSON.parse(stored) : ['en'];
}

/**
 * Set selected languages
 */
export function setLanguages(languages: Language[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LANGUAGES_KEY, JSON.stringify(languages));
}

/**
 * Toggle a language on/off
 */
export function toggleLanguage(language: Language): Language[] {
  if (typeof window === 'undefined') return ['en'];
  const current = getLanguages();
  const index = current.indexOf(language);
  
  if (index === -1) {
    // Add language
    const updated = [...current, language].sort();
    setLanguages(updated);
    return updated;
  } else {
    // Remove language (but keep at least one)
    if (current.length === 1) return current;
    const updated = current.filter((l) => l !== language);
    setLanguages(updated);
    return updated;
  }
}

/**
 * Get current Bible version
 */
export function getVersion(): string {
  if (typeof window === 'undefined') return 'kjv';
  return localStorage.getItem(VERSION_KEY) || 'kjv';
}

/**
 * Set Bible version
 */
export function setVersion(version: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VERSION_KEY, version);
}

/**
 * Get font size preference
 */
export function getFontSize(): FontSize {
  if (typeof window === 'undefined') return 'medium';
  return (localStorage.getItem(FONT_SIZE_KEY) as FontSize) || 'medium';
}

/**
 * Set font size preference
 */
export function setFontSize(size: FontSize): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FONT_SIZE_KEY, size);
}

/**
 * Get all bookmarks
 */
export function getBookmarks(): Bookmark[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(BOOKMARKS_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Add a bookmark
 */
export function addBookmark(bookmark: Bookmark): void {
  if (typeof window === 'undefined') return;
  const bookmarks = getBookmarks();
  const exists = bookmarks.some(
    (b) => b.bookId === bookmark.bookId && b.chapter === bookmark.chapter && b.verse === bookmark.verse
  );
  if (!exists) {
    bookmarks.push(bookmark);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  }
}

/**
 * Remove a bookmark
 */
export function removeBookmark(bookId: string, chapter: number, verse: number): void {
  if (typeof window === 'undefined') return;
  const bookmarks = getBookmarks();
  const filtered = bookmarks.filter(
    (b) => !(b.bookId === bookId && b.chapter === chapter && b.verse === verse)
  );
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(filtered));
}

/**
 * Check if a verse is bookmarked
 */
export function isBookmarked(bookId: string, chapter: number, verse: number): boolean {
  const bookmarks = getBookmarks();
  return bookmarks.some(
    (b) => b.bookId === bookId && b.chapter === chapter && b.verse === verse
  );
}

/**
 * Get reading history
 */
export function getReadingHistory(): ReadingHistory[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(HISTORY_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Add to reading history
 */
export function addToReadingHistory(bookId: string, chapter: number): void {
  if (typeof window === 'undefined') return;
  const history = getReadingHistory();
  
  // Remove if already exists (to avoid duplicates)
  const filtered = history.filter((h) => !(h.bookId === bookId && h.chapter === chapter));
  
  // Add to beginning with current timestamp
  filtered.unshift({
    bookId,
    chapter,
    timestamp: Date.now(),
  });
  
  // Keep only last 30 entries
  localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered.slice(0, 30)));
}

/**
 * Get last read chapter
 */
export function getLastRead(): ReadingHistory | null {
  const history = getReadingHistory();
  return history.length > 0 ? history[0] : null;
}

/**
 * Clear all data (bookmarks and history)
 */
export function clearAllData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(BOOKMARKS_KEY);
  localStorage.removeItem(HISTORY_KEY);
}
