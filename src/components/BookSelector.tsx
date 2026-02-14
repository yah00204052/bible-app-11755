'use client';

import { BibleBook } from '@/lib/bible';
import { useState } from 'react';
import { Language } from '@/lib/storage';
import { translations } from '@/lib/translations';

interface BookSelectorProps {
  books: BibleBook[];
  selectedBookId: string;
  selectedChapter: number;
  onBookChange: (bookId: string) => void;
  onChapterChange: (chapter: number) => void;
  language?: Language;
}

export default function BookSelector({
  books,
  selectedBookId,
  selectedChapter,
  onBookChange,
  onChapterChange,
  language = 'en',
}: BookSelectorProps) {
  const selectedBook = books.find((b) => b.id === selectedBookId);
  const chapters = selectedBook ? Array.from({ length: selectedBook.chapters }, (_, i) => i + 1) : [];
  const t = translations[language];

  return (
    <div className="bg-white p-4 border-b border-gray-200 sticky top-0 z-10 shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Book Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.books}</label>
          <select
            value={selectedBookId}
            onChange={(e) => onBookChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
          >
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.name}
              </option>
            ))}
          </select>
        </div>

        {/* Chapter Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.chapter}</label>
          <select
            value={selectedChapter}
            onChange={(e) => onChapterChange(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
          >
            {chapters.map((chapter) => (
              <option key={chapter} value={chapter}>
                {language === 'zh' ? `第 ${chapter} 章` : `Chapter ${chapter}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Chapter Navigation */}
      <div className="flex gap-1 flex-wrap">
        {chapters.slice(0, Math.min(10, chapters.length)).map((chapter) => (
          <button
            key={chapter}
            onClick={() => onChapterChange(chapter)}
            className={`px-2 py-1 rounded text-sm ${
              selectedChapter === chapter
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {chapter}
          </button>
        ))}
        {chapters.length > 10 && (
          <span className="px-2 py-1 text-sm text-gray-600">... +{chapters.length - 10}</span>
        )}
      </div>
    </div>
  );
}
