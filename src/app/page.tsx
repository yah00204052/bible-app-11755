'use client';
import { useState, useEffect } from 'react';
import { getBooks, getChapter, BibleBook, BibleVerse } from '@/lib/bible';
import { getLastRead, addToReadingHistory, getLanguages, toggleLanguage, Language, getFontSize, setFontSize, FontSize } from '@/lib/storage';
import ControlPanel from '@/components/ControlPanel';

export default function Home() {
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [selectedBookId, setSelectedBookId] = useState('GEN');
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [languages, setLanguagesState] = useState<Language[]>(['en']);
  const [translationMap, setTranslationMap] = useState<{ [key: string]: string }>({});
  const [selectedVersion, setSelectedVersion] = useState('kjv');
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);

  useEffect(() => {
    const langs = getLanguages();
    setLanguagesState(langs);
    const savedFontSize = getFontSize();
    setFontSizeState(savedFontSize);

    const loadBooks = async () => {
      try {
        const data = await getBooks();
        setBooks(data);
        setBooksLoading(false);
        const lastRead = getLastRead();
        if (lastRead) {
          setSelectedBookId(lastRead.bookId);
          setSelectedChapter(lastRead.chapter);
        }
      } catch (err) {
        setError('Failed to load books');
        console.error(err);
        setBooksLoading(false);
      }
    };

    loadBooks();
  }, []);

  useEffect(() => {
    if (!selectedBookId || selectedChapter === null) return;

    const loadChapter = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getChapter(selectedBookId, selectedChapter, selectedVersion);
        setVerses(data);
        addToReadingHistory(selectedBookId, selectedChapter);

        if (languages.includes('zh')) {
          const chineseData = await getChapter(selectedBookId, selectedChapter, 'cus');
          const map: { [key: string]: string } = {};
          chineseData.forEach((verse) => {
            map[verse.id] = verse.text;
          });
          setTranslationMap(map);
        }
      } catch (err) {
        setError('Failed to load chapter');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadChapter();
  }, [selectedBookId, selectedChapter, languages, selectedVersion]);

  const handleLanguageToggle = (language: Language) => {
    const updated = toggleLanguage(language);
    setLanguagesState(updated);
  };

  const handleFontSizeChange = (size: FontSize) => {
    setFontSize(size);
    setFontSizeState(size);
  };

  const selectedBook = books.find((b) => b.id === selectedBookId);

  const openPopupWindow = () => {
    if (popupWindow && !popupWindow.closed) {
      popupWindow.focus();
    } else {
      // Store current data in localStorage first
      if (selectedBook) {
        localStorage.setItem('bible_popup_bookId', selectedBookId);
        localStorage.setItem('bible_popup_chapter', selectedChapter.toString());
        localStorage.setItem('bible_popup_bookName', selectedBook.name);
        localStorage.setItem('bible_popup_version', selectedVersion);
        localStorage.setItem('bible_popup_languages', JSON.stringify(languages));
        localStorage.setItem('bible_popup_fontSize', fontSize);
      }
      
      const newWindow = window.open('/popup', 'biblereader_popup', 'width=900,height=700,resizable=yes,scrollbars=yes');
      setPopupWindow(newWindow);
      
      // Send data via BroadcastChannel after a short delay to ensure popup is ready
      if (newWindow) {
        setTimeout(() => {
          try {
            const channel = new BroadcastChannel('bible_app');
            channel.postMessage({
              bookId: selectedBookId,
              chapter: selectedChapter,
              bookName: selectedBook?.name,
              version: selectedVersion,
              languages: languages,
              fontSize: fontSize,
            });
            channel.close();
          } catch (err) {
            console.warn('Could not send via BroadcastChannel:', err);
          }
        }, 500);
      }
    }
  };

  // Update popup window when selections change
  useEffect(() => {
    if (selectedBook && popupWindow && !popupWindow.closed) {
      try {
        const channel = new BroadcastChannel('bible_app');
        channel.postMessage({
          bookId: selectedBookId,
          chapter: selectedChapter,
          bookName: selectedBook.name,
          version: selectedVersion,
          languages: languages,
          fontSize: fontSize,
        });
        channel.close();
      } catch (err) {
        // Fallback to localStorage if BroadcastChannel not available
        localStorage.setItem('bible_popup_bookId', selectedBookId);
        localStorage.setItem('bible_popup_chapter', selectedChapter.toString());
        localStorage.setItem('bible_popup_bookName', selectedBook.name);
        localStorage.setItem('bible_popup_version', selectedVersion);
        localStorage.setItem('bible_popup_languages', JSON.stringify(languages));
        localStorage.setItem('bible_popup_fontSize', fontSize);
      }
    }
  }, [selectedBookId, selectedChapter, selectedBook, selectedVersion, languages, fontSize, popupWindow]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Controls */}
      {!booksLoading && books.length > 0 ? (
        <ControlPanel
          books={books}
          selectedBookId={selectedBookId}
          selectedChapter={selectedChapter}
          languages={languages}
          selectedVersion={selectedVersion}
          onBookChange={(id) => {
            setSelectedBookId(id);
            setSelectedChapter(1);
          }}
          onChapterChange={setSelectedChapter}
          onLanguageToggle={handleLanguageToggle}
          onVersionChange={setSelectedVersion}
          onOpenPopup={openPopupWindow}
        />
      ) : (
        <aside className="w-80 bg-white border-r border-gray-300 flex flex-col h-screen overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <p className="text-gray-600">Loading...</p>
          </div>
        </aside>
      )}

      {/* Main Content Area - Instructions */}
      <main className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Bible Reader</h1>
          <p className="text-xl text-gray-600 mb-8">Click "Popup Window" in the sidebar to open the verses display</p>
          
          {selectedBook && (
            <div className="mb-8 p-6 bg-white rounded-lg shadow-lg">
              <p className="text-gray-700 text-lg">
                Current Selection: <span className="font-bold text-blue-600">{selectedBook.name} {selectedChapter}</span>
              </p>
              <p className="text-gray-600 text-sm mt-2">
                Languages: {languages.join(' + ')} | Version: {selectedVersion.toUpperCase()}
              </p>
            </div>
          )}

          <div className="text-gray-600 text-sm">
            <p>Use the left sidebar to:</p>
            <ul className="mt-3 space-y-2">
              <li>✓ Select language (EN, ZH, or both)</li>
              <li>✓ Choose Bible version</li>
              <li>✓ Select book and chapter</li>
              <li>✓ Navigate with Previous/Next buttons</li>
              <li>✓ Click "Popup Window" to display verses</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
