'use client';
import { useState, useEffect, useRef } from 'react';
import { getChapter, BibleVerse } from '@/lib/bible';
import { Language, FontSize } from '@/lib/storage';
import DualLanguageVerseDisplay from '@/components/DualLanguageVerseDisplay';

export default function PopupPage() {
  const [bookId, setBookId] = useState('');
  const [chapter, setChapter] = useState(0);
  const [bookName, setBookName] = useState('');
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [languages, setLanguages] = useState<Language[]>(['en']);
  const [translationMap, setTranslationMap] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState('kjv');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const channelRef = useRef<BroadcastChannel | null>(null);
  const initialized = useRef(false);

  // Setup BroadcastChannel for cross-window communication
  useEffect(() => {
    try {
      const channel = new BroadcastChannel('bible_app');
      channelRef.current = channel;

      channel.onmessage = (event) => {
        const { bookId: newBookId, chapter: newChapter, bookName: newBookName, version: newVersion, languages: newLanguages, fontSize: newFontSize } = event.data;

        console.log('Popup received message:', { newBookId, newChapter, newBookName, newVersion, newLanguages, newFontSize });

        if (newBookId) setBookId(newBookId);
        if (newChapter !== undefined) setChapter(newChapter);
        if (newBookName) setBookName(newBookName);
        if (newVersion) setVersion(newVersion);
        if (newLanguages) setLanguages(newLanguages);
        if (newFontSize) setFontSize(newFontSize);
      };

      console.log('BroadcastChannel opened');
      return () => {
        channel.close();
      };
    } catch (err) {
      console.warn('BroadcastChannel not supported, using localStorage fallback');
      
      // Fallback: listen to storage changes
      const handleStorageChange = () => {
        const savedBookId = localStorage.getItem('bible_popup_bookId');
        const savedChapter = localStorage.getItem('bible_popup_chapter');
        const savedBookName = localStorage.getItem('bible_popup_bookName');
        const savedVersion = localStorage.getItem('bible_popup_version');
        const savedLanguages = localStorage.getItem('bible_popup_languages');
        const savedFontSize = localStorage.getItem('bible_popup_fontSize');

        console.log('Popup received storage change:', { savedBookId, savedChapter, savedBookName });

        if (savedBookId) setBookId(savedBookId);
        if (savedChapter) setChapter(parseInt(savedChapter));
        if (savedBookName) setBookName(savedBookName);
        if (savedVersion) setVersion(savedVersion);
        if (savedLanguages) setLanguages(JSON.parse(savedLanguages));
        if (savedFontSize) setFontSize(savedFontSize as FontSize);
      };

      window.addEventListener('storage', handleStorageChange);
      
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  // Load verses when book/chapter/version changes
  useEffect(() => {
    if (!bookId || chapter === 0) {
      console.log('Skipping verse load: bookId or chapter not set', { bookId, chapter });
      return;
    }

    const loadVerses = async () => {
      setLoading(true);
      try {
        console.log('Loading verses:', { bookId, chapter, version });
        const data = await getChapter(bookId, chapter, version);
        console.log('Verses loaded:', data.length);
        setVerses(data);

        if (languages.includes('zh')) {
          try {
            console.log('Loading Chinese translation for:', { bookId, chapter });
            const chineseData = await getChapter(bookId, chapter, 'cus');
            const map: { [key: string]: string } = {};
            chineseData.forEach((verse) => {
              map[verse.id] = verse.text;
            });
            setTranslationMap(map);
            console.log('Chinese translation loaded:', Object.keys(map).length, 'verses');
          } catch (err) {
            console.warn('Failed to load Chinese translation:', err);
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
  }, [bookId, chapter, languages, version]);

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{bookName || 'Loading...'}</h1>
          {chapter > 0 && <p className="text-blue-100">Chapter {chapter}</p>}
          {languages.length > 0 && <p className="text-blue-100 text-sm mt-1">Languages: {languages.join(' + ')} | Version: {version.toUpperCase()}</p>}
        </div>
        <button
          onClick={() => window.close()}
          className="text-2xl font-bold text-white hover:bg-blue-700 rounded-full w-10 h-10 flex items-center justify-center"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {!bookId || chapter === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-lg text-gray-600">Waiting for selection from control panel...</div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-lg text-gray-600">Loading {bookName} {chapter}...</div>
          </div>
        ) : verses.length > 0 ? (
          <div className="space-y-6 max-w-4xl">
            {verses.map((verse) => (
              <DualLanguageVerseDisplay
                key={verse.id}
                verse={verse}
                bookName={bookName}
                languages={languages}
                translationMap={translationMap}
                fontSize={fontSize}
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
  );
}
