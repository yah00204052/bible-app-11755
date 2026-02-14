'use client';

import { BibleVerse } from '@/lib/bible';
import { isBookmarked, addBookmark, removeBookmark } from '@/lib/storage';
import { useState, useEffect } from 'react';

interface VerseDisplayProps {
  verse: BibleVerse;
  bookName: string;
}

export default function VerseDisplay({ verse, bookName }: VerseDisplayProps) {
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    setBookmarked(isBookmarked(verse.bookId, verse.chapter, verse.verse));
  }, [verse]);

  const toggleBookmark = () => {
    if (bookmarked) {
      removeBookmark(verse.bookId, verse.chapter, verse.verse);
    } else {
      addBookmark({
        bookId: verse.bookId,
        chapter: verse.chapter,
        verse: verse.verse,
        text: verse.text,
        timestamp: Date.now(),
      });
    }
    setBookmarked(!bookmarked);
  };

  return (
    <div className="mb-4 p-4 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition">
      <div className="flex justify-between items-start mb-2">
        <span className="font-semibold text-blue-600">
          {bookName} {verse.chapter}:{verse.verse}
        </span>
        <button
          onClick={toggleBookmark}
          className={`px-3 py-1 rounded text-sm ${
            bookmarked
              ? 'bg-yellow-400 text-yellow-900'
              : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
          }`}
        >
          {bookmarked ? '★' : '☆'}
        </button>
      </div>
      <p className="text-gray-800 leading-relaxed">{verse.text}</p>
    </div>
  );
}
