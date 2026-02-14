'use client';
import { useState, useEffect } from 'react';
import { getBooks, getChapter, BibleBook, BibleVerse } from '@/lib/bible';
import { getLastRead, addToReadingHistory, getLanguages, toggleLanguage, Language, getFontSize, setFontSize, FontSize, getReadingHistory, ReadingHistory } from '@/lib/storage';
import ControlPanel from '@/components/ControlPanel';
import BibleModal from '@/components/BibleModal';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
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
        const isDualLanguage = languages.length === 2;
        const selectedVersionLang = ['cus', 'cns'].includes(selectedVersion) ? 'zh' : 'en';

        // Determine which version to load based on language selection
        let versionToLoad = selectedVersion;
        let versionLang = selectedVersionLang;

        // If only Chinese is selected but current version is English, use Chinese version
        if (languages.includes('zh') && !languages.includes('en') && selectedVersionLang === 'en') {
          versionToLoad = 'cus'; // Default Chinese version
          versionLang = 'zh';
        }
        // If only English is selected but current version is Chinese, use English version
        else if (languages.includes('en') && !languages.includes('zh') && selectedVersionLang === 'zh') {
          versionToLoad = 'kjv'; // Default English version
          versionLang = 'en';
        }

        setPrimaryLanguage(versionLang);

        // Load the primary version
        const data = await getChapter(selectedBookId, selectedChapter, versionToLoad);
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
          const otherVersion = versionLang === 'zh' ? 'kjv' : 'cus';

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

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
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
            onVersionChange={setSelectedVersion}
            onFontSizeChange={handleFontSizeChange}
            onOpenPopup={openModal}
            onHistoryClick={handleHistoryClick}
          />

          <BibleModal
            isOpen={isModalOpen}
            onClose={closeModal}
            bookId={selectedBookId}
            chapter={selectedChapter}
            bookName={selectedBook?.name || ''}
            languages={languages}
            version={selectedVersion}
            fontSize={fontSize}
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
