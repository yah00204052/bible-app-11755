'use client';

import { useState, useEffect } from 'react';
import { getChapter, BibleVerse } from '@/lib/bible';
import { Language, FontSize } from '@/lib/storage';
import DualLanguageVerseDisplay from '@/components/DualLanguageVerseDisplay';

interface BibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  chapter: number;
  bookName: string;
  languages: Language[];
  version: string;
  fontSize: FontSize;
}

export default function BibleModal({
  isOpen,
  onClose,
  bookId,
  chapter,
  bookName,
  languages,
  version,
  fontSize,
}: BibleModalProps) {
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [translationMap, setTranslationMap] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [primaryLanguage, setPrimaryLanguage] = useState<'en' | 'zh'>('en');

  // Load verses when book/chapter/version changes
  useEffect(() => {
    if (!isOpen || !bookId || chapter === 0) {
      return;
    }

    const loadVerses = async () => {
      setLoading(true);
      try {
        const isDualLanguage = languages.length === 2;
        const selectedVersionLang = ['cus', 'cns'].includes(version) ? 'zh' : 'en';

        setPrimaryLanguage(selectedVersionLang);

        const data = await getChapter(bookId, chapter, version);
        setVerses(data);

        // In dual language mode, load the other language
        if (isDualLanguage && languages.includes('zh') && languages.includes('en')) {
          try {
            const otherVersion = selectedVersionLang === 'zh' ? 'kjv' : 'cus';
            const otherData = await getChapter(bookId, chapter, otherVersion);
            const map: { [key: string]: string } = {};
            otherData.forEach((verse) => {
              map[verse.id] = verse.text;
            });
            setTranslationMap(map);
          } catch (err) {
            console.warn('Failed to load other language:', err);
            setTranslationMap({});
          }
        } else {
          setTranslationMap({});
        }
      } catch (err) {
        console.error('Failed to load verses:', err);
        setVerses([]);
      } finally {
        setLoading(false);
      }
    };

    loadVerses();
  }, [isOpen, bookId, chapter, languages, version]);

  // Scroll to target verse if specified
  useEffect(() => {
    if (isOpen && verses.length > 0) {
      const scrollTarget = sessionStorage.getItem('scrollToVerse');
      if (scrollTarget) {
        try {
          const { bookId: targetBookId, chapter: targetChapter, verse: targetVerse } = JSON.parse(scrollTarget);

          if (targetBookId === bookId && targetChapter === chapter) {
            sessionStorage.removeItem('scrollToVerse');

            setTimeout(() => {
              const verseElement = document.getElementById(`modal-verse-${targetBookId}-${targetChapter}-${targetVerse}`);
              if (verseElement) {
                verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                verseElement.style.backgroundColor = '#fef08a';
                setTimeout(() => {
                  verseElement.style.backgroundColor = '';
                }, 2000);
              }
            }, 300);
          }
        } catch (err) {
          console.error('Failed to parse scroll target:', err);
          sessionStorage.removeItem('scrollToVerse');
        }
      }
    }
  }, [isOpen, verses, bookId, chapter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-2xl w-[90vw] h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-300 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">
            {bookName} {chapter}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none px-2"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50">
          {!bookId || chapter === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-lg text-gray-600">No chapter selected</div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-lg text-gray-600">Loading {bookName} {chapter}...</div>
            </div>
          ) : verses.length > 0 ? (
            <div className="space-y-0 max-w-4xl mx-auto">
              {verses.map((verse) => (
                <DualLanguageVerseDisplay
                  key={verse.id}
                  verse={verse}
                  bookName={bookName}
                  languages={languages}
                  translationMap={translationMap}
                  fontSize={fontSize}
                  primaryLanguage={primaryLanguage}
                  idPrefix="modal-"
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-20">
              <div className="text-lg text-gray-600">No verses found.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
