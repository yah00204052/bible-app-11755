'use client';

import { BibleBook, BibleVersion, BIBLE_VERSIONS } from '@/lib/bible';
import { Language, FontSize } from '@/lib/storage';
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
  onBookChange: (bookId: string) => void;
  onChapterChange: (chapter: number) => void;
  onLanguageToggle: (language: Language) => void;
  onVersionChange: (version: string) => void;
  onFontSizeChange: (size: FontSize) => void;
  onOpenPopup: () => void;
}

export default function ControlPanel({
  books,
  selectedBookId,
  selectedChapter,
  languages,
  selectedVersion,
  fontSize,
  onBookChange,
  onChapterChange,
  onLanguageToggle,
  onVersionChange,
  onFontSizeChange,
  onOpenPopup,
}: ControlPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const selectedBook = books.find((b) => b.id === selectedBookId);
  const chapters = selectedBook
    ? Array.from({ length: selectedBook.chapters }, (_, i) => i + 1)
    : [];
  const t = translations[languages.includes('zh') ? 'zh' : 'en'];

  // Fuzzy search for books (supports both English and Chinese)
  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return books;

    const query = searchQuery.toLowerCase().trim();
    return books.filter((book) => {
      // Search in name, nameLong, abbreviation, ID, and Chinese name
      return (
        book.name.toLowerCase().includes(query) ||
        book.nameLong.toLowerCase().includes(query) ||
        book.abbreviation.toLowerCase().includes(query) ||
        book.id.toLowerCase().includes(query) ||
        (book.nameChinese && book.nameChinese.includes(searchQuery.trim()))
      );
    });
  }, [books, searchQuery]);

  return (
    <div className="w-full max-w-4xl mx-auto bg-white border border-gray-300 rounded-lg shadow-lg my-4 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-bold text-2xl text-gray-900">{t.books}</h1>
        <p className="text-sm text-gray-600 mt-1">Bible Reader Control Panel</p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Languages */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
          <LanguageSelector selectedLanguages={languages} onLanguageToggle={onLanguageToggle} />
        </div>

        {/* Font Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
          <div className="flex gap-2">
            {(['small', 'medium', 'large'] as FontSize[]).map((size) => (
              <button
                key={size}
                onClick={() => onFontSizeChange(size)}
                className={`flex-1 px-3 py-2 rounded text-xs font-medium ${
                  fontSize === size
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {size === 'small' ? 'A' : size === 'medium' ? 'A' : 'A'}
                <span className="ml-1 text-xs">{size[0].toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Version Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Version</label>
          <select
            value={selectedVersion}
            onChange={(e) => onVersionChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm"
          >
            {BIBLE_VERSIONS.map((version) => (
              <option key={version.id} value={version.id}>
                {version.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {languages.includes('zh') ? '搜索书卷' : 'Search Books'}
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={languages.includes('zh') ? '输入书名...' : 'Type book name...'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <p className="text-xs text-gray-500 mt-1">
              {filteredBooks.length} {languages.includes('zh') ? '卷' : 'book(s)'} found
            </p>
          )}
        </div>

        {/* Book Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.books}</label>
          <select
            value={selectedBookId}
            onChange={(e) => onBookChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm"
            size={6}
          >
            {filteredBooks.map((book) => (
              <option key={book.id} value={book.id}>
                {book.name}
              </option>
            ))}
          </select>
        </div>

        {/* Chapter Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.chapter}</label>
          <select
            value={selectedChapter}
            onChange={(e) => onChapterChange(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm"
          >
            {chapters.map((chapter) => (
              <option key={chapter} value={chapter}>
                {languages.includes('zh') ? `第 ${chapter} 章` : `Chapter ${chapter}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Chapter Buttons */}
      {chapters.length > 0 && (
        <div className="mt-6">
          <p className="text-sm text-gray-600 mb-2">Quick Jump:</p>
          <div className="flex gap-1 flex-wrap">
            {chapters.slice(0, Math.min(12, chapters.length)).map((chapter) => (
              <button
                key={chapter}
                onClick={() => onChapterChange(chapter)}
                className={`px-3 py-1 rounded text-sm ${
                  selectedChapter === chapter
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {chapter}
              </button>
            ))}
            {chapters.length > 12 && (
              <span className="px-3 py-1 text-sm text-gray-600">+{chapters.length - 12} more</span>
            )}
          </div>
        </div>
      )}

      {/* Open Popup Button */}
      <div className="mt-6 border-t border-gray-200 pt-6">
        <button
          onClick={onOpenPopup}
          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition shadow-md"
        >
          🪟 Open Popup Window
        </button>

        <div className="text-center text-sm text-gray-600 mt-3">
          Current: <span className="font-semibold text-gray-800">{selectedBook?.name} {selectedChapter}</span>
        </div>
      </div>
    </div>
  );
}
