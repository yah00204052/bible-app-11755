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
  const [fontSize, setFontSize] = useState<FontSize>('base');
  const [primaryLanguage, setPrimaryLanguage] = useState<'en' | 'zh'>('en');
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
        if (newLanguages && Array.isArray(newLanguages)) {
          // Remove duplicates and ensure valid languages
          const uniqueLanguages = Array.from(new Set(newLanguages.filter((lang: Language) => lang === 'en' || lang === 'zh')));
          setLanguages(uniqueLanguages.length > 0 ? uniqueLanguages : ['en']);
        }
        if (newFontSize) setFontSize(newFontSize);
      };

      console.log('BroadcastChannel opened');

      // Send "ready" message to main window to request initial state
      channel.postMessage({ type: 'popup_ready' });
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
        if (savedLanguages) {
          try {
            const parsed = JSON.parse(savedLanguages);
            if (Array.isArray(parsed)) {
              // Remove duplicates and ensure valid languages
              const uniqueLanguages = Array.from(new Set(parsed.filter((lang: Language) => lang === 'en' || lang === 'zh')));
              setLanguages(uniqueLanguages.length > 0 ? uniqueLanguages : ['en']);
            }
          } catch (e) {
            console.error('Failed to parse languages:', e);
            setLanguages(['en']);
          }
        }
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
        const isDualLanguage = languages.length === 2;
        const selectedVersionLang = ['cus', 'cns'].includes(version) ? 'zh' : 'en';

        // Determine which version to load based on language selection
        let versionToLoad = version;
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

        setPrimaryLanguage(versionLang as 'en' | 'zh');

        console.log('Loading verses:', { bookId, chapter, versionToLoad, versionLang });
        const data = await getChapter(bookId, chapter, versionToLoad);
        console.log('Verses loaded:', data.length);
        setVerses(data);

        // In dual language mode, load the other language
        if (isDualLanguage && languages.includes('zh') && languages.includes('en')) {
          try {
            // Load the opposite language
            const otherVersion = versionLang === 'zh' ? 'kjv' : 'cus';

            console.log('Loading other language translation for:', { bookId, chapter, otherVersion });
            const otherData = await getChapter(bookId, chapter, otherVersion);
            const map: { [key: string]: string } = {};
            otherData.forEach((verse) => {
              map[verse.id] = verse.text;
            });
            setTranslationMap(map);
            console.log('Other language loaded:', Object.keys(map).length, 'verses');
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
  }, [bookId, chapter, languages, version]);

  // Scroll to target verse if specified
  useEffect(() => {
    if (verses.length > 0) {
      const scrollTarget = sessionStorage.getItem('scrollToVerse');
      if (scrollTarget) {
        try {
          const { bookId: targetBookId, chapter: targetChapter, verse: targetVerse } = JSON.parse(scrollTarget);

          // Check if this is the target chapter
          if (targetBookId === bookId && targetChapter === chapter) {
            // Clear the target
            sessionStorage.removeItem('scrollToVerse');

            // Scroll to verse after a delay to ensure DOM is ready
            setTimeout(() => {
              const verseElement = document.getElementById(`verse-${targetBookId}-${targetChapter}-${targetVerse}`);
              if (verseElement) {
                verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Highlight briefly
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
  }, [verses, bookId, chapter]);

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {!bookId || chapter === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-lg text-gray-600">Waiting for selection from control panel...</div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-lg text-gray-600">Loading {bookName} {chapter}...</div>
          </div>
        ) : verses.length > 0 ? (
          <div className="space-y-0 max-w-4xl">
            {verses.map((verse) => (
              <DualLanguageVerseDisplay
                key={verse.id}
                verse={verse}
                bookName={bookName}
                languages={languages}
                translationMap={translationMap}
                fontSize={fontSize}
                primaryLanguage={primaryLanguage}
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
