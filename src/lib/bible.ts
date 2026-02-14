// Bible data and API integration
// Using free Bible API with multiple versions support

// Book ID mapping for GetBible API (abbreviation -> numeric ID)
const BOOK_ID_MAP: {[key: string]: string} = {
  'GEN': '1', 'EXO': '2', 'LEV': '3', 'NUM': '4', 'DEU': '5',
  'JOS': '6', 'JDG': '7', 'RUT': '8', '1SA': '9', '2SA': '10',
  '1KI': '11', '2KI': '12', '1CH': '13', '2CH': '14', 'EZR': '15',
  'NEH': '16', 'EST': '17', 'JOB': '18', 'PSA': '19', 'PRO': '20',
  'ECC': '21', 'SOS': '22', 'ISA': '23', 'JER': '24', 'LAM': '25',
  'EZK': '26', 'DAN': '27', 'HOS': '28', 'JOL': '29', 'AMO': '30',
  'OBA': '31', 'JON': '32', 'MIC': '33', 'NAH': '34', 'HAB': '35',
  'ZEP': '36', 'HAG': '37', 'ZEC': '38', 'MAL': '39',
  'MAT': '40', 'MRK': '41', 'LUK': '42', 'JHN': '43', 'ACT': '44',
  'ROM': '45', '1CO': '46', '2CO': '47', 'GAL': '48', 'EPH': '49',
  'PHP': '50', 'COL': '51', '1TH': '52', '2TH': '53', '1TI': '54',
  '2TI': '55', 'TIT': '56', 'PHM': '57', 'HEB': '58', 'JAS': '59',
  '1PE': '60', '2PE': '61', '1JN': '62', '2JN': '63', '3JN': '64',
  'JUD': '65', 'REV': '66'
};

function toGetBibleId(abbr: string): string {
  return BOOK_ID_MAP[abbr] || '1';
}

export interface BibleBook {
  id: string;
  abbreviation: string;
  name: string;
  nameLong: string;
  chapters: number;
  nameChinese?: string; // Chinese name for search support
  pinyin?: string; // Full pinyin (e.g., "chuangshiji")
  pinyinAbbr?: string; // Pinyin abbreviation (e.g., "csj")
}

export interface BibleVerse {
  id: string;
  orgId: string;
  bookId: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleChapter {
  id: string;
  bookId: string;
  number: number;
  content: BibleVerse[];
}

export interface BibleVersion {
  id: string;
  name: string;
  language: string;
}

// Available Bible versions/languages
// Note: Display names are user-friendly, but actual IDs map to GetBible API versions
export const BIBLE_VERSIONS: BibleVersion[] = [
  // English versions (GetBible API)
  { id: 'kjv', name: 'KJV', language: 'en' },
  { id: 'web', name: 'NIV', language: 'en' }, // Using WEB, displayed as NIV
  { id: 'basicenglish', name: 'ESV', language: 'en' }, // Using BBE, displayed as ESV

  // Chinese versions (GetBible API)
  { id: 'cus', name: 'CUNPSS (和合本简体)', language: 'zh' },
  { id: 'cns', name: 'CCB (当代圣经)', language: 'zh' }, // Using CNVS, displayed as CCB
];

// Cached Bible books data
let booksCache: { [key: string]: BibleBook[] } = {};
let versesCache: { [key: string]: BibleVerse[] } = {};

/**
 * Get all bible books for a specific version
 */
export async function getBooks(version: string = 'kjv'): Promise<BibleBook[]> {
  if (booksCache[version]) return booksCache[version];
  
  // Use fallback books immediately
  booksCache[version] = getFallbackBooks();
  return booksCache[version];
}

/**
 * Get a specific chapter's verses for a specific version
 */
export async function getChapter(
  bookId: string,
  chapter: number,
  version: string = 'kjv'
): Promise<BibleVerse[]> {
  const cacheKey = `${version}-${bookId}-${chapter}`;
  if (versesCache[cacheKey]) return versesCache[cacheKey];

  try {
    // Convert abbreviation to GetBible numeric ID
    const getBibleBookId = toGetBibleId(bookId);

    // Fetch from GetBible API
    const response = await fetch(
      `https://api.getbible.net/v2/${version}/${getBibleBookId}/${chapter}.json`,
      {
        headers: { 'Accept': 'application/json' },
        cache: 'force-cache'
      }
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    // Transform GetBible format to app format
    const verses: BibleVerse[] = data.verses.map((verse: any) => ({
      id: `${bookId}-${chapter}-${verse.verse}`,
      orgId: bookId,
      bookId: bookId,
      chapter: parseInt(verse.chapter),
      verse: parseInt(verse.verse),
      text: verse.text,
    }));

    versesCache[cacheKey] = verses;
    return verses;

  } catch (error) {
    console.error(`Failed to fetch ${version}/${bookId} ${chapter}:`, error);

    // Return error message instead of crashing
    return [{
      id: `${bookId}-${chapter}-1`,
      orgId: bookId,
      bookId: bookId,
      chapter: chapter,
      verse: 1,
      text: `[Unable to load chapter. Please check your internet connection or try a different version.]`,
    }];
  }
}

/**
 * Get a specific verse
 */
export async function getVerse(
  bookId: string,
  chapter: number,
  verse: number
): Promise<BibleVerse | null> {
  const verses = await getChapter(bookId, chapter);
  return verses.find((v) => v.verse === verse) || null;
}

/**
 * Search verses by text (client-side search)
 */
export async function searchVerses(query: string): Promise<BibleVerse[]> {
  const books = await getBooks();
  const results: BibleVerse[] = [];
  const searchTerm = query.toLowerCase();
  const maxResults = 20;

  for (const book of books) {
    if (results.length >= maxResults) break;

    // Search through chapters
    for (let chapter = 1; chapter <= book.chapters && results.length < maxResults; chapter++) {
      try {
        const verses = await getChapter(book.id, chapter);
        const matching = verses.filter((v) => v.text.toLowerCase().includes(searchTerm));
        results.push(...matching);
      } catch {
        // Skip on error
      }
    }
  }

  return results.slice(0, maxResults);
}

// Fallback data if API is unavailable
function getFallbackBooks(): BibleBook[] {
  return [
    // Old Testament
    { id: 'GEN', abbreviation: 'Gen', name: 'Genesis', nameLong: 'Genesis', chapters: 50, nameChinese: '创世记', pinyin: 'chuangshiji', pinyinAbbr: 'csj' },
    { id: 'EXO', abbreviation: 'Exo', name: 'Exodus', nameLong: 'Exodus', chapters: 40, nameChinese: '出埃及记', pinyin: 'chuaijiji', pinyinAbbr: 'caijj' },
    { id: 'LEV', abbreviation: 'Lev', name: 'Leviticus', nameLong: 'Leviticus', chapters: 27, nameChinese: '利未记', pinyin: 'liweiji', pinyinAbbr: 'lwj' },
    { id: 'NUM', abbreviation: 'Num', name: 'Numbers', nameLong: 'Numbers', chapters: 36, nameChinese: '民数记', pinyin: 'minshuji', pinyinAbbr: 'msj' },
    { id: 'DEU', abbreviation: 'Deu', name: 'Deuteronomy', nameLong: 'Deuteronomy', chapters: 34, nameChinese: '申命记', pinyin: 'shenmingji', pinyinAbbr: 'smj' },
    { id: 'JOS', abbreviation: 'Jos', name: 'Joshua', nameLong: 'Joshua', chapters: 24, nameChinese: '约书亚记', pinyin: 'yueshuyaji', pinyinAbbr: 'jsyj' },
    { id: 'JDG', abbreviation: 'Jdg', name: 'Judges', nameLong: 'Judges', chapters: 21, nameChinese: '士师记', pinyin: 'shishiji', pinyinAbbr: 'ssj' },
    { id: 'RUT', abbreviation: 'Rut', name: 'Ruth', nameLong: 'Ruth', chapters: 4, nameChinese: '路得记', pinyin: 'ludeji', pinyinAbbr: 'ldj' },
    { id: '1SA', abbreviation: '1Sa', name: '1 Samuel', nameLong: '1 Samuel', chapters: 31, nameChinese: '撒母耳记上', pinyin: 'samuerjishang', pinyinAbbr: 'smejs' },
    { id: '2SA', abbreviation: '2Sa', name: '2 Samuel', nameLong: '2 Samuel', chapters: 24, nameChinese: '撒母耳记下', pinyin: 'samuerjixia', pinyinAbbr: 'smejx' },
    { id: '1KI', abbreviation: '1Ki', name: '1 Kings', nameLong: '1 Kings', chapters: 22, nameChinese: '列王纪上', pinyin: 'liewangjishang', pinyinAbbr: 'lwjs' },
    { id: '2KI', abbreviation: '2Ki', name: '2 Kings', nameLong: '2 Kings', chapters: 25, nameChinese: '列王纪下', pinyin: 'liewangjixia', pinyinAbbr: 'lwjx' },
    { id: '1CH', abbreviation: '1Ch', name: '1 Chronicles', nameLong: '1 Chronicles', chapters: 29, nameChinese: '历代志上', pinyin: 'lidaizhishang', pinyinAbbr: 'ldzs' },
    { id: '2CH', abbreviation: '2Ch', name: '2 Chronicles', nameLong: '2 Chronicles', chapters: 36, nameChinese: '历代志下', pinyin: 'lidaizhixia', pinyinAbbr: 'ldzx' },
    { id: 'EZR', abbreviation: 'Ezr', name: 'Ezra', nameLong: 'Ezra', chapters: 10, nameChinese: '以斯拉记', pinyin: 'yisilaji', pinyinAbbr: 'yslj' },
    { id: 'NEH', abbreviation: 'Neh', name: 'Nehemiah', nameLong: 'Nehemiah', chapters: 13, nameChinese: '尼希米记', pinyin: 'niximiji', pinyinAbbr: 'nxmj' },
    { id: 'EST', abbreviation: 'Est', name: 'Esther', nameLong: 'Esther', chapters: 10, nameChinese: '以斯帖记', pinyin: 'yisitieji', pinyinAbbr: 'ystj' },
    { id: 'JOB', abbreviation: 'Job', name: 'Job', nameLong: 'Job', chapters: 42, nameChinese: '约伯记', pinyin: 'yueboji', pinyinAbbr: 'ybj' },
    { id: 'PSA', abbreviation: 'Psa', name: 'Psalms', nameLong: 'Psalms', chapters: 150, nameChinese: '诗篇', pinyin: 'shipian', pinyinAbbr: 'sp' },
    { id: 'PRO', abbreviation: 'Pro', name: 'Proverbs', nameLong: 'Proverbs', chapters: 31, nameChinese: '箴言', pinyin: 'zhenyan', pinyinAbbr: 'zy' },
    { id: 'ECC', abbreviation: 'Ecc', name: 'Ecclesiastes', nameLong: 'Ecclesiastes', chapters: 12, nameChinese: '传道书', pinyin: 'chuandaoshu', pinyinAbbr: 'cds' },
    { id: 'SOS', abbreviation: 'Sos', name: 'Song of Solomon', nameLong: 'Song of Solomon', chapters: 8, nameChinese: '雅歌', pinyin: 'yage', pinyinAbbr: 'yg' },
    { id: 'ISA', abbreviation: 'Isa', name: 'Isaiah', nameLong: 'Isaiah', chapters: 66, nameChinese: '以赛亚书', pinyin: 'yisaiyashu', pinyinAbbr: 'ysys' },
    { id: 'JER', abbreviation: 'Jer', name: 'Jeremiah', nameLong: 'Jeremiah', chapters: 52, nameChinese: '耶利米书', pinyin: 'yelimishu', pinyinAbbr: 'ylms' },
    { id: 'LAM', abbreviation: 'Lam', name: 'Lamentations', nameLong: 'Lamentations', chapters: 5, nameChinese: '耶利米哀歌', pinyin: 'yelimiaige', pinyinAbbr: 'ylmag' },
    { id: 'EZK', abbreviation: 'Ezk', name: 'Ezekiel', nameLong: 'Ezekiel', chapters: 48, nameChinese: '以西结书', pinyin: 'yixijieshu', pinyinAbbr: 'yxjs' },
    { id: 'DAN', abbreviation: 'Dan', name: 'Daniel', nameLong: 'Daniel', chapters: 12, nameChinese: '但以理书', pinyin: 'danyilishu', pinyinAbbr: 'dyls' },
    { id: 'HOS', abbreviation: 'Hos', name: 'Hosea', nameLong: 'Hosea', chapters: 14, nameChinese: '何西阿书', pinyin: 'hexiashu', pinyinAbbr: 'hxas' },
    { id: 'JOL', abbreviation: 'Jol', name: 'Joel', nameLong: 'Joel', chapters: 3, nameChinese: '约珥书', pinyin: 'yueershu', pinyinAbbr: 'yes' },
    { id: 'AMO', abbreviation: 'Amo', name: 'Amos', nameLong: 'Amos', chapters: 9, nameChinese: '阿摩司书', pinyin: 'amosishu', pinyinAbbr: 'amss' },
    { id: 'OBA', abbreviation: 'Oba', name: 'Obadiah', nameLong: 'Obadiah', chapters: 1, nameChinese: '俄巴底亚书', pinyin: 'ebadiyashu', pinyinAbbr: 'ebdys' },
    { id: 'JON', abbreviation: 'Jon', name: 'Jonah', nameLong: 'Jonah', chapters: 4, nameChinese: '约拿书', pinyin: 'yuenashu', pinyinAbbr: 'yns' },
    { id: 'MIC', abbreviation: 'Mic', name: 'Micah', nameLong: 'Micah', chapters: 7, nameChinese: '弥迦书', pinyin: 'mijiashu', pinyinAbbr: 'mjs' },
    { id: 'NAH', abbreviation: 'Nah', name: 'Nahum', nameLong: 'Nahum', chapters: 3, nameChinese: '那鸿书', pinyin: 'nahongshu', pinyinAbbr: 'nhs' },
    { id: 'HAB', abbreviation: 'Hab', name: 'Habakkuk', nameLong: 'Habakkuk', chapters: 3, nameChinese: '哈巴谷书', pinyin: 'habagushu', pinyinAbbr: 'hbgs' },
    { id: 'ZEP', abbreviation: 'Zep', name: 'Zephaniah', nameLong: 'Zephaniah', chapters: 3, nameChinese: '西番雅书', pinyin: 'xifanyashu', pinyinAbbr: 'xfys' },
    { id: 'HAG', abbreviation: 'Hag', name: 'Haggai', nameLong: 'Haggai', chapters: 2, nameChinese: '哈该书', pinyin: 'hagaishu', pinyinAbbr: 'hgs' },
    { id: 'ZEC', abbreviation: 'Zec', name: 'Zechariah', nameLong: 'Zechariah', chapters: 14, nameChinese: '撒迦利亚书', pinyin: 'sajialiyashu', pinyinAbbr: 'sjlys' },
    { id: 'MAL', abbreviation: 'Mal', name: 'Malachi', nameLong: 'Malachi', chapters: 4, nameChinese: '玛拉基书', pinyin: 'malajishu', pinyinAbbr: 'mljs' },
    // New Testament
    { id: 'MAT', abbreviation: 'Mat', name: 'Matthew', nameLong: 'Matthew', chapters: 28, nameChinese: '马太福音', pinyin: 'mataifoyin', pinyinAbbr: 'mtfy' },
    { id: 'MRK', abbreviation: 'Mrk', name: 'Mark', nameLong: 'Mark', chapters: 16, nameChinese: '马可福音', pinyin: 'makefoyin', pinyinAbbr: 'mkfy' },
    { id: 'LUK', abbreviation: 'Luk', name: 'Luke', nameLong: 'Luke', chapters: 24, nameChinese: '路加福音', pinyin: 'lujiafoyin', pinyinAbbr: 'ljfy' },
    { id: 'JHN', abbreviation: 'Jhn', name: 'John', nameLong: 'John', chapters: 21, nameChinese: '约翰福音', pinyin: 'yuehanfoyin', pinyinAbbr: 'yhfy' },
    { id: 'ACT', abbreviation: 'Act', name: 'Acts', nameLong: 'Acts', chapters: 28, nameChinese: '使徒行传', pinyin: 'shituxingzhuan', pinyinAbbr: 'stxz' },
    { id: 'ROM', abbreviation: 'Rom', name: 'Romans', nameLong: 'Romans', chapters: 16, nameChinese: '罗马书', pinyin: 'luomashu', pinyinAbbr: 'lms' },
    { id: '1CO', abbreviation: '1Co', name: '1 Corinthians', nameLong: '1 Corinthians', chapters: 16, nameChinese: '哥林多前书', pinyin: 'gelinduoqianshu', pinyinAbbr: 'gldqs' },
    { id: '2CO', abbreviation: '2Co', name: '2 Corinthians', nameLong: '2 Corinthians', chapters: 13, nameChinese: '哥林多后书', pinyin: 'gelinduohoushu', pinyinAbbr: 'gldhs' },
    { id: 'GAL', abbreviation: 'Gal', name: 'Galatians', nameLong: 'Galatians', chapters: 6, nameChinese: '加拉太书', pinyin: 'jialatashu', pinyinAbbr: 'jlts' },
    { id: 'EPH', abbreviation: 'Eph', name: 'Ephesians', nameLong: 'Ephesians', chapters: 6, nameChinese: '以弗所书', pinyin: 'yifusuoshu', pinyinAbbr: 'yfss' },
    { id: 'PHP', abbreviation: 'Php', name: 'Philippians', nameLong: 'Philippians', chapters: 4, nameChinese: '腓立比书', pinyin: 'feilibishu', pinyinAbbr: 'flbs' },
    { id: 'COL', abbreviation: 'Col', name: 'Colossians', nameLong: 'Colossians', chapters: 4, nameChinese: '歌罗西书', pinyin: 'geluoxishu', pinyinAbbr: 'glxs' },
    { id: '1TH', abbreviation: '1Th', name: '1 Thessalonians', nameLong: '1 Thessalonians', chapters: 5, nameChinese: '帖撒罗尼迦前书', pinyin: 'tiesaluonijia qianshu', pinyinAbbr: 'tslnjqs' },
    { id: '2TH', abbreviation: '2Th', name: '2 Thessalonians', nameLong: '2 Thessalonians', chapters: 3, nameChinese: '帖撒罗尼迦后书', pinyin: 'tiesaluonijiahoushu', pinyinAbbr: 'tslnjhs' },
    { id: '1TI', abbreviation: '1Ti', name: '1 Timothy', nameLong: '1 Timothy', chapters: 6, nameChinese: '提摩太前书', pinyin: 'timotaiqianshu', pinyinAbbr: 'tmtqs' },
    { id: '2TI', abbreviation: '2Ti', name: '2 Timothy', nameLong: '2 Timothy', chapters: 4, nameChinese: '提摩太后书', pinyin: 'timotaihoushu', pinyinAbbr: 'tmths' },
    { id: 'TIT', abbreviation: 'Tit', name: 'Titus', nameLong: 'Titus', chapters: 3, nameChinese: '提多书', pinyin: 'tiduoshu', pinyinAbbr: 'tds' },
    { id: 'PHM', abbreviation: 'Phm', name: 'Philemon', nameLong: 'Philemon', chapters: 1, nameChinese: '腓利门书', pinyin: 'feillimenshu', pinyinAbbr: 'flms' },
    { id: 'HEB', abbreviation: 'Heb', name: 'Hebrews', nameLong: 'Hebrews', chapters: 13, nameChinese: '希伯来书', pinyin: 'xibolaishu', pinyinAbbr: 'xbls' },
    { id: 'JAS', abbreviation: 'Jas', name: 'James', nameLong: 'James', chapters: 5, nameChinese: '雅各书', pinyin: 'yageshu', pinyinAbbr: 'ygs' },
    { id: '1PE', abbreviation: '1Pe', name: '1 Peter', nameLong: '1 Peter', chapters: 5, nameChinese: '彼得前书', pinyin: 'bideqianshu', pinyinAbbr: 'bdqs' },
    { id: '2PE', abbreviation: '2Pe', name: '2 Peter', nameLong: '2 Peter', chapters: 3, nameChinese: '彼得后书', pinyin: 'bidehoushu', pinyinAbbr: 'bdhs' },
    { id: '1JN', abbreviation: '1Jn', name: '1 John', nameLong: '1 John', chapters: 5, nameChinese: '约翰一书', pinyin: 'yuehanyishu', pinyinAbbr: 'yhys' },
    { id: '2JN', abbreviation: '2Jn', name: '2 John', nameLong: '2 John', chapters: 1, nameChinese: '约翰二书', pinyin: 'yuehanershu', pinyinAbbr: 'yhes' },
    { id: '3JN', abbreviation: '3Jn', name: '3 John', nameLong: '3 John', chapters: 1, nameChinese: '约翰三书', pinyin: 'yuehansanshu', pinyinAbbr: 'yhss' },
    { id: 'JUD', abbreviation: 'Jud', name: 'Jude', nameLong: 'Jude', chapters: 1, nameChinese: '犹大书', pinyin: 'youdashu', pinyinAbbr: 'yds' },
    { id: 'REV', abbreviation: 'Rev', name: 'Revelation', nameLong: 'Revelation', chapters: 22, nameChinese: '启示录', pinyin: 'qishilu', pinyinAbbr: 'qsl' },
  ];
}

