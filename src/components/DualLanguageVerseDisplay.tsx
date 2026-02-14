'use client';

import { BibleVerse } from '@/lib/bible';
import { Language, FontSize } from '@/lib/storage';

interface DualLanguageVerseDisplayProps {
  verse: BibleVerse;
  bookName: string;
  languages: Language[];
  translationMap: { [key: string]: string }; // Map of verse ID to other language translation
  fontSize?: FontSize;
  primaryLanguage?: 'en' | 'zh'; // Which language is in verse.text
}

export default function DualLanguageVerseDisplay({
  verse,
  bookName,
  languages,
  translationMap,
  fontSize = 'base',
  primaryLanguage = 'en',
}: DualLanguageVerseDisplayProps) {
  const isDualLanguage = languages.length === 2;

  // Determine which text goes where based on primaryLanguage
  // In single language mode, verse.text always contains the correct language
  const chineseText = primaryLanguage === 'zh'
    ? verse.text
    : (translationMap[verse.id] || verse.text);
  const englishText = primaryLanguage === 'en'
    ? verse.text
    : (translationMap[verse.id] || verse.text);

  // Map font size to Tailwind classes
  const fontSizeClasses: Record<FontSize, string> = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
    '6xl': 'text-6xl',
    '7xl': 'text-7xl',
    '8xl': 'text-8xl',
    '9xl': 'text-9xl',
  };

  const textSizeClass = fontSizeClasses[fontSize] || 'text-base';

  return (
    <div
      id={`verse-${verse.bookId}-${verse.chapter}-${verse.verse}`}
      className="border-b border-gray-300 py-2 hover:bg-yellow-50 transition-colors duration-150 scroll-mt-4"
    >
      {isDualLanguage ? (
        <div className="grid grid-cols-[auto_1fr_1fr] gap-3">
          {/* Verse Reference Column */}
          <div className="text-xs font-semibold text-blue-600 pt-1 whitespace-nowrap">
            {verse.chapter}:{verse.verse}
          </div>

          {/* Chinese Column (Left) */}
          <div className="border-r border-gray-300 pr-3">
            <p className={`text-gray-800 leading-relaxed ${textSizeClass}`}>
              {chineseText}
            </p>
          </div>

          {/* English Column (Right) */}
          <div>
            <p className={`text-gray-800 leading-relaxed ${textSizeClass}`}>
              {englishText}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[auto_1fr] gap-3">
          {/* Verse Reference Column */}
          <div className="text-xs font-semibold text-blue-600 pt-1 whitespace-nowrap">
            {verse.chapter}:{verse.verse}
          </div>

          {/* Content Column - show based on primary language */}
          <div>
            <p className={`text-gray-800 leading-relaxed ${textSizeClass}`}>
              {languages.includes('zh') && !languages.includes('en') ? chineseText : englishText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
