'use client';
import { useState, useEffect } from 'react';
import { getBooks, getChapter, BibleBook, BibleVerse } from '@/lib/bible';
import { getLastRead, addToReadingHistory, getLanguages, toggleLanguage, Language, getFontSize, setFontSize, FontSize, getReadingHistory, ReadingHistory } from '@/lib/storage';
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
  const [fontSize, setFontSizeState] = useState<FontSize>('base');
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);
  const [readingHistory, setReadingHistory] = useState<ReadingHistory[]>([]);
  const [primaryLanguage, setPrimaryLanguage] = useState<'en' | 'zh'>('en');

  useEffect(() => {
    const langs = getLanguages();
    setLanguagesState(langs);
    const savedFontSize = getFontSize();
    setFontSizeState(savedFontSize);
    const history = getReadingHistory();
    setReadingHistory(history);

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
        // Determine the language of the selected version
        const versionLang = ['cus', 'cut', 'cns'].includes(selectedVersion) ? 'zh' : 'en';
        setPrimaryLanguage(versionLang);

        // Use the selected version
        const data = await getChapter(selectedBookId, selectedChapter, selectedVersion);
        setVerses(data);
        addToReadingHistory(selectedBookId, selectedChapter);
        setReadingHistory(getReadingHistory()); // Refresh history after adding

        // In dual language mode, load the other language
        const isDualLanguage = languages.length === 2;
        if (isDualLanguage && languages.includes('zh') && languages.includes('en')) {
          // Load the opposite language
          const otherVersion = versionLang === 'zh' ? 'kjv' : 'cus'; // Default other language version

          const otherData = await getChapter(selectedBookId, selectedChapter, otherVersion);
          const map: { [key: string]: string } = {};
          otherData.forEach((verse) => {
            map[verse.id] = verse.text;
          });
          setTranslationMap(map);
        } else {
          setTranslationMap({});
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

  const handleHistoryClick = (bookId: string, chapter: number) => {
    setSelectedBookId(bookId);
    setSelectedChapter(chapter);
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
      
      const newWindow = window.open('/popup', 'biblereader_popup', 'width=900,height=700,resizable=yes,scrollbars=yes,location=no,toolbar=no,menubar=no,status=no');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      {!booksLoading && books.length > 0 ? (
        <ControlPanel
          books={books}
          selectedBookId={selectedBookId}
          selectedChapter={selectedChapter}
          languages={languages}
          selectedVersion={selectedVersion}
          fontSize={fontSize}
          verses={verses}
          readingHistory={readingHistory}
          onBookChange={(id) => {
            setSelectedBookId(id);
            setSelectedChapter(1);
          }}
          onChapterChange={setSelectedChapter}
          onLanguageToggle={handleLanguageToggle}
          onVersionChange={setSelectedVersion}
          onFontSizeChange={handleFontSizeChange}
          onOpenPopup={openPopupWindow}
          onHistoryClick={handleHistoryClick}
        />
      ) : (
        <div className="w-full max-w-4xl mx-auto bg-white border border-gray-300 rounded-lg shadow-lg p-6">
          <p className="text-gray-600">Loading...</p>
        </div>
      )}
    </div>
  );
}
