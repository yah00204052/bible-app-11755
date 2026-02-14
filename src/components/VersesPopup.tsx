'use client';

import { BibleVerse } from '@/lib/bible';
import { Language } from '@/lib/storage';
import DualLanguageVerseDisplay from './DualLanguageVerseDisplay';

interface VersesPopupProps {
  isOpen: boolean;
  onClose: () => void;
  verses: BibleVerse[];
  bookName: string;
  chapter: number;
  languages: Language[];
  translationMap: { [key: string]: string };
  loading: boolean;
  error: string;
}

export default function VersesPopup({
  isOpen,
  onClose,
  verses,
  bookName,
  chapter,
  languages,
  translationMap,
  loading,
  error,
}: VersesPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-4xl max-h-screen flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 flex justify-between items-center border-b border-gray-200">
          <div>
            <h2 className="text-3xl font-bold">{bookName}</h2>
            <p className="text-blue-100">Chapter {chapter}</p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl font-bold text-white hover:bg-blue-700 rounded-full w-10 h-10 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-lg text-gray-600">Loading verses...</div>
            </div>
          ) : verses.length > 0 ? (
            <div className="space-y-4 max-w-3xl">
              {verses.map((verse) => (
                <DualLanguageVerseDisplay
                  key={verse.id}
                  verse={verse}
                  bookName={bookName}
                  languages={languages}
                  translationMap={translationMap}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-20">
              <div className="text-lg text-gray-600">No verses found for this chapter.</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
