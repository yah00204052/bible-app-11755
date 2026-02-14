'use client';
import { useState, useEffect } from 'react';
import { getBooks, getChapter, BibleBook, BibleVerse } from '@/lib/bible';
import { getLastRead, addToReadingHistory, getLanguages, toggleLanguage, Language, getFontSize, setFontSize, FontSize, getReadingHistory, ReadingHistory, getVersion, setVersion } from '@/lib/storage';
import ControlPanel from '@/components/ControlPanel';

// Validate version before component initialization
const getValidVersion = (): string => {
  if (typeof window === 'undefined') return 'kjv';
  const savedVersion = getVersion();
  const validVersions = ['kjv', 'niv', 'cus', 'cns'];
  if (validVersions.includes(savedVersion)) {
    return savedVersion;
  }
  // Reset to default if invalid
  setVersion('kjv');
  return 'kjv';
};

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
  const [selectedVersion, setSelectedVersion] = useState(getValidVersion());
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
      setVerses([]); // Clear previous verses immediately
      try {
        const isDualLanguage = languages.length === 2;
        const selectedVersionLang = ['cus', 'cns'].includes(selectedVersion) ? 'zh' : 'en';

        setPrimaryLanguage(selectedVersionLang);

        console.log('Loading chapter:', selectedBookId, selectedChapter, 'version:', selectedVersion);

        // Load the primary version
        const data = await getChapter(selectedBookId, selectedChapter, selectedVersion);

        // Check if we got an error message instead of real verses
        if (data.length === 1 && data[0].text.includes('[Unable to load chapter')) {
          console.error('Failed to load chapter:', data[0].text);
          setError(data[0].text);
          setVerses([]);
          setLoading(false);
          return;
        }

        setVerses(data);

        // Check if there's a target verse from search
        const scrollTarget = sessionStorage.getItem('scrollToVerse');
        let targetVerse = 1;
        if (scrollTarget) {
          try {
            const parsed = JSON.parse(scrollTarget);
            if (parsed.bookId === selectedBookId && parsed.chapter === selectedChapter) {
              targetVerse = parsed.verse;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }

        addToReadingHistory(selectedBookId, selectedChapter, targetVerse);
        setReadingHistory(getReadingHistory()); // Refresh history after adding

        // In dual language mode, load the other language
        if (isDualLanguage && languages.includes('zh') && languages.includes('en')) {
          // Load the opposite language
          const otherVersion = selectedVersionLang === 'zh' ? 'kjv' : 'cus';

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

  const selectedBook = books.find((b) => b.id === selectedBookId);

  // Listen for popup ready message and respond with initial state
  useEffect(() => {
    if (!popupWindow || popupWindow.closed) return;

    try {
      const channel = new BroadcastChannel('bible_app');

      channel.onmessage = (event) => {
        if (event.data.type === 'popup_ready' && selectedBook) {
          console.log('Popup is ready, sending initial state');
          channel.postMessage({
            bookId: selectedBookId,
            chapter: selectedChapter,
            bookName: selectedBook.name,
            version: selectedVersion,
            languages: languages,
            fontSize: fontSize,
          });
        }
      };

      return () => {
        channel.close();
      };
    } catch (err) {
      console.warn('BroadcastChannel not available:', err);
    }
  }, [popupWindow, selectedBookId, selectedChapter, selectedBook, selectedVersion, languages, fontSize]);

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
        console.warn('BroadcastChannel not available:', err);
      }
    }
  }, [selectedBookId, selectedChapter, selectedBook, selectedVersion, languages, fontSize, popupWindow]);

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

  const handleVersionChange = (version: string) => {
    setSelectedVersion(version);
    setVersion(version); // Save to localStorage
  };

  const openPopupWindow = () => {
    if (popupWindow && !popupWindow.closed) {
      popupWindow.focus();
    } else {
      const newWindow = window.open('/popup', 'biblereader_popup', 'width=900,height=700,resizable=yes,scrollbars=yes');
      setPopupWindow(newWindow);
      // Initial state will be sent when popup sends "popup_ready" message
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      {!booksLoading && books.length > 0 ? (
        <>
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
            onVersionChange={handleVersionChange}
            onFontSizeChange={handleFontSizeChange}
            onOpenPopup={openPopupWindow}
            onHistoryClick={handleHistoryClick}
          />

        </>
      ) : (
        <div className="w-full max-w-4xl mx-auto bg-white border border-gray-300 rounded-lg shadow-lg p-6">
          <p className="text-gray-600">Loading...</p>
        </div>
      )}
    </div>
  );
}
