'use client';

import { BibleBook, BibleVersion, BIBLE_VERSIONS, BibleVerse } from '@/lib/bible';
import { Language, FontSize, ReadingHistory } from '@/lib/storage';
import { translations } from '@/lib/translations';
import LanguageSelector from './LanguageSelector';
import { useState, useMemo } from 'react';

interface ControlPanelProps {
  books: BibleBook[];
  selectedBookId: string;
  selectedChapter: number;
  languages: Language[];
  selectedVersion: string;
  fontSize: FontSize;
  verses: BibleVerse[];
  readingHistory: ReadingHistory[];
  onBookChange: (bookId: string) => void;
  onChapterChange: (chapter: number) => void;
  onLanguageToggle: (language: Language) => void;
  onVersionChange: (version: string) => void;
  onFontSizeChange: (size: FontSize) => void;
  onOpenPopup: () => void;
  onHistoryClick: (bookId: string, chapter: number) => void;
}

export default function ControlPanel({
  books,
  selectedBookId,
  selectedChapter,
  languages,
  selectedVersion,
  fontSize,
  verses,
  readingHistory,
  onBookChange,
  onChapterChange,
  onLanguageToggle,
  onVersionChange,
  onFontSizeChange,
  onOpenPopup,
  onHistoryClick,
}: ControlPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const selectedBook = books.find((b) => b.id === selectedBookId);
  const chapters = selectedBook
    ? Array.from({ length: selectedBook.chapters }, (_, i) => i + 1)
    : [];
  const t = translations['en']; // Always use English for control panel

  // Handle verse reference search (e.g., "mat 1", "mat 1:12")
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = searchQuery.trim();

      // Check if query matches verse reference pattern (e.g., "mat 1", "mat 1:12")
      const versePattern = /^([a-z]+)\s+(\d+)(?::(\d+))?$/i;
      const match = query.match(versePattern);

      if (match) {
        const [, bookQuery, chapterStr, verseStr] = match;
        const chapter = parseInt(chapterStr);
        const targetVerse = verseStr ? parseInt(verseStr) : 1;

        // Find book by abbreviation or name (partial match)
        const foundBook = books.find(b =>
          b.abbreviation.toLowerCase().startsWith(bookQuery.toLowerCase()) ||
          b.name.toLowerCase().startsWith(bookQuery.toLowerCase()) ||
          b.id.toLowerCase().startsWith(bookQuery.toLowerCase())
        );

        if (foundBook && chapter >= 1 && chapter <= foundBook.chapters) {
          onBookChange(foundBook.id);
          onChapterChange(chapter);
          setSearchQuery(''); // Clear search after navigation

          // Store target verse in sessionStorage for popup to use
          if (targetVerse > 1) {
            sessionStorage.setItem('scrollToVerse', JSON.stringify({
              bookId: foundBook.id,
              chapter: chapter,
              verse: targetVerse
            }));

            // Scroll preview to target verse after a delay
            setTimeout(() => {
              const verseElement = document.getElementById(`preview-verse-${targetVerse}`);
              if (verseElement) {
                // Scroll the verse into view within its container
                verseElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

                // Highlight briefly
                verseElement.style.backgroundColor = '#fef08a';
                verseElement.style.transition = 'background-color 0.3s';
                setTimeout(() => {
                  verseElement.style.backgroundColor = '';
                }, 2000);
              }
            }, 800); // Increased delay to ensure content is loaded
          }
        }
      }
    }
  };

  // Fuzzy search for books (supports English, Chinese, and Pinyin)
  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return books;

    const query = searchQuery.toLowerCase().trim();
    const queryNoSpaces = query.replace(/\s/g, ''); // Remove spaces for pinyin matching

    return books.filter((book) => {
      // Search in name, nameLong, abbreviation, ID, Chinese name, pinyin, and pinyin abbreviation
      return (
        book.name.toLowerCase().includes(query) ||
        book.nameLong.toLowerCase().includes(query) ||
        book.abbreviation.toLowerCase().includes(query) ||
        book.id.toLowerCase().includes(query) ||
        (book.nameChinese && book.nameChinese.includes(searchQuery.trim())) ||
        (book.pinyin && book.pinyin.toLowerCase().includes(queryNoSpaces)) ||
        (book.pinyinAbbr && book.pinyinAbbr.toLowerCase().includes(queryNoSpaces))
      );
    });
  }, [books, searchQuery]);

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-lg shadow my-3 p-4">
      {/* Header */}
      <div className="mb-3">
        <h1 className="font-bold text-xl text-gray-900">Bible Reader Control</h1>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Languages and Project Button */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Lang: <span className="font-bold text-blue-600">{languages.join('+').toUpperCase()}</span>
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <LanguageSelector selectedLanguages={languages} onLanguageToggle={onLanguageToggle} />
            </div>
            <button
              onClick={onOpenPopup}
              className="px-4 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700 transition text-sm whitespace-nowrap"
            >
              🪟 Project
            </button>
          </div>
        </div>

        {/* Version Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Version</label>
          <select
            value={selectedVersion}
            onChange={(e) => onVersionChange(e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded bg-white text-gray-900 text-sm"
          >
            {BIBLE_VERSIONS.map((version) => (
              <option key={version.id} value={version.id}>
                {version.name}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Font: <span className="font-bold text-blue-600">{fontSize.toUpperCase()}</span>
          </label>
          <input
            type="range"
            min="0"
            max="12"
            step="1"
            value={
              fontSize === 'xs' ? 0 :
              fontSize === 'sm' ? 1 :
              fontSize === 'base' ? 2 :
              fontSize === 'lg' ? 3 :
              fontSize === 'xl' ? 4 :
              fontSize === '2xl' ? 5 :
              fontSize === '3xl' ? 6 :
              fontSize === '4xl' ? 7 :
              fontSize === '5xl' ? 8 :
              fontSize === '6xl' ? 9 :
              fontSize === '7xl' ? 10 :
              fontSize === '8xl' ? 11 : 12
            }
            onChange={(e) => {
              const value = parseInt(e.target.value);
              const sizes: FontSize[] = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl'];
              onFontSizeChange(sizes[value]);
            }}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Book Selection */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Book / Search (e.g., "mat 1:12" + Enter)</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Type 'mat 1:12' + Enter to jump..."
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm mb-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <select
            value={selectedBookId}
            onChange={(e) => onBookChange(e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded bg-white text-gray-900 text-sm"
            size={4}
          >
            {filteredBooks.map((book) => (
              <option key={book.id} value={book.id}>
                {book.name}
              </option>
            ))}
          </select>
        </div>

        {/* Chapter Selection */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Chapter</label>
          <select
            value={selectedChapter}
            onChange={(e) => onChapterChange(parseInt(e.target.value))}
            className="w-full px-2 py-1.5 border border-gray-300 rounded bg-white text-gray-900 text-sm mb-1"
          >
            {chapters.map((chapter) => (
              <option key={chapter} value={chapter}>
                Ch {chapter}
              </option>
            ))}
          </select>
          {/* Quick Chapter Buttons - Inline */}
          {chapters.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {chapters.slice(0, Math.min(12, chapters.length)).map((chapter) => (
                <button
                  key={chapter}
                  onClick={() => onChapterChange(chapter)}
                  className={`px-2 py-0.5 rounded text-xs ${
                    selectedChapter === chapter
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {chapter}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview and History - Full Width Side by Side */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        {/* Preview Panel */}
        <div>
          <h3 className="text-xs font-semibold text-gray-700 mb-1">
            Preview: {selectedBook?.name} {selectedChapter} ({verses.length} verses)
          </h3>
          <div
            id="preview-panel"
            className="bg-gray-50 border border-gray-300 rounded p-2 h-48 overflow-y-auto text-xs"
          >
            {verses.length > 0 ? (
              <>
                {verses.map((verse) => (
                  <div
                    key={verse.id}
                    id={`preview-verse-${verse.verse}`}
                    className="mb-1 last:mb-0"
                  >
                    <span className="font-semibold text-blue-600">{verse.verse}.</span>{' '}
                    <span className="text-gray-700">{verse.text.substring(0, 100)}{verse.text.length > 100 ? '...' : ''}</span>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-gray-500 italic">Select chapter to preview</p>
            )}
          </div>
        </div>

        {/* Reading History Panel */}
        <div>
          <h3 className="text-xs font-semibold text-gray-700 mb-1">
            History ({readingHistory.length} items)
          </h3>
          <div className="bg-gray-50 border border-gray-300 rounded p-2 h-48 overflow-y-auto">
            {readingHistory.length > 0 ? (
              readingHistory.slice(0, 15).map((entry, index) => {
                const book = books.find(b => b.id === entry.bookId);
                const verseNum = entry.verse || 1;
                return (
                  <button
                    key={index}
                    onClick={() => {
                      onHistoryClick(entry.bookId, entry.chapter);
                      // If verse is specified and not 1, scroll to it
                      if (verseNum > 1) {
                        sessionStorage.setItem('scrollToVerse', JSON.stringify({
                          bookId: entry.bookId,
                          chapter: entry.chapter,
                          verse: verseNum
                        }));
                      }
                    }}
                    className="w-full text-left text-xs px-1.5 py-0.5 rounded hover:bg-blue-100 transition mb-0.5 last:mb-0 block"
                  >
                    <span className="font-medium text-blue-600">
                      {book?.name || entry.bookId} {entry.chapter}:{verseNum}
                    </span>
                    <span className="text-[10px] text-gray-500 ml-2">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="text-gray-500 italic text-xs">No history yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
