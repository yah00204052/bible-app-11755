'use client';

import { BibleVerse } from '@/lib/bible';
import { isBookmarked, addBookmark, removeBookmark, Language, FontSize } from '@/lib/storage';
import { useState, useEffect } from 'react';

interface DualLanguageVerseDisplayProps {
  verse: BibleVerse;
  bookName: string;
  languages: Language[];
  translationMap: { [key: string]: string }; // Map of verse ID to Chinese translation
  fontSize?: FontSize;
}

export default function DualLanguageVerseDisplay({
  verse,
  bookName,
  languages,
  translationMap,
  fontSize = 'medium',
}: DualLanguageVerseDisplayProps) {
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

  const isDualLanguage = languages.length === 2;

  // Map font size to Tailwind classes
  const fontSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  const textSizeClass = fontSizeClasses[fontSize];

  return (
    <div className="group mb-4 p-4 bg-gray-50 rounded border border-gray-200 hover:bg-yellow-100 hover:border-yellow-400 hover:shadow-md hover:scale-[1.01] transition-all duration-150 cursor-default">
      <div className="flex justify-between items-start mb-2">
        <span className="font-semibold text-blue-600 group-hover:text-yellow-700 transition-colors duration-150">
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

      {isDualLanguage ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {languages.includes('en') && (
            <div className="pr-2 border-r md:border-r border-gray-300">
              <p className={`text-gray-800 leading-relaxed ${textSizeClass}`}>{verse.text}</p>
            </div>
          )}
          {languages.includes('zh') && (
            <div className="pl-2">
              <p className={`text-gray-800 leading-relaxed ${textSizeClass}`}>
                {translationMap[verse.id] || '(Translation not available)'}
              </p>
            </div>
          )}
        </div>
      ) : languages.includes('zh') ? (
        <p className={`text-gray-800 leading-relaxed ${textSizeClass}`}>
          {translationMap[verse.id] || verse.text}
        </p>
      ) : (
        <p className={`text-gray-800 leading-relaxed ${textSizeClass}`}>{verse.text}</p>
      )}
    </div>
  );
}
