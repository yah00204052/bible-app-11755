import { NextRequest, NextResponse } from 'next/server';

// Bible API configuration
const BIBLE_API_KEY = process.env.BIBLE_API_KEY || '';
const BIBLE_API_URL = 'https://rest.api.bible/v1';

// Bible ID mappings for API.Bible
const BIBLE_IDS: { [key: string]: string } = {
  'kjv': 'de4e12af7f28f599-02', // King James Version
  'web': '9879dbb7cfe39e4d-04', // World English Bible
  'ccb': '3e27b3e43e1df61d-01', // Chinese Contemporary Bible (CCB - 当代译本圣经)
  'cunpss': 'ccb9229763033d43-01', // Chinese Union Version Simplified (CUNPSS - 和合本简体)
};

// Book abbreviation to API.Bible book ID mapping
const BOOK_IDS: { [key: string]: string } = {
  'GEN': 'GEN', 'EXO': 'EXO', 'LEV': 'LEV', 'NUM': 'NUM', 'DEU': 'DEU',
  'JOS': 'JOS', 'JDG': 'JDG', 'RUT': 'RUT', '1SA': '1SA', '2SA': '2SA',
  '1KI': '1KI', '2KI': '2KI', '1CH': '1CH', '2CH': '2CH', 'EZR': 'EZR',
  'NEH': 'NEH', 'EST': 'EST', 'JOB': 'JOB', 'PSA': 'PSA', 'PRO': 'PRO',
  'ECC': 'ECC', 'SOS': 'SNG', 'ISA': 'ISA', 'JER': 'JER', 'LAM': 'LAM',
  'EZK': 'EZK', 'DAN': 'DAN', 'HOS': 'HOS', 'JOL': 'JOL', 'AMO': 'AMO',
  'OBA': 'OBA', 'JON': 'JON', 'MIC': 'MIC', 'NAH': 'NAH', 'HAB': 'HAB',
  'ZEP': 'ZEP', 'HAG': 'HAG', 'ZEC': 'ZEC', 'MAL': 'MAL',
  'MAT': 'MAT', 'MRK': 'MRK', 'LUK': 'LUK', 'JHN': 'JHN', 'ACT': 'ACT',
  'ROM': 'ROM', '1CO': '1CO', '2CO': '2CO', 'GAL': 'GAL', 'EPH': 'EPH',
  'PHP': 'PHP', 'COL': 'COL', '1TH': '1TH', '2TH': '2TH', '1TI': '1TI',
  '2TI': '2TI', 'TIT': 'TIT', 'PHM': 'PHM', 'HEB': 'HEB', 'JAS': 'JAS',
  '1PE': '1PE', '2PE': '2PE', '1JN': '1JN', '2JN': '2JN', '3JN': '3JN',
  'JUD': 'JUD', 'REV': 'REV'
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const version = searchParams.get('version');
  const bookId = searchParams.get('bookId');
  const chapter = searchParams.get('chapter');

  if (!version || !bookId || !chapter) {
    return NextResponse.json(
      { error: 'Missing required parameters: version, bookId, chapter' },
      { status: 400 }
    );
  }

  // Check if API key is configured
  if (!BIBLE_API_KEY) {
    return NextResponse.json(
      { error: 'Bible API key not configured. Please add BIBLE_API_KEY to .env.local' },
      { status: 500 }
    );
  }

  const bibleId = BIBLE_IDS[version];
  if (!bibleId) {
    return NextResponse.json(
      { error: `Unsupported version: ${version}` },
      { status: 400 }
    );
  }

  const apiBookId = BOOK_IDS[bookId];
  if (!apiBookId) {
    return NextResponse.json(
      { error: `Invalid book ID: ${bookId}` },
      { status: 400 }
    );
  }

  try {
    // Fetch individual verses to get the text
    const versesResponse = await fetch(
      `${BIBLE_API_URL}/bibles/${bibleId}/chapters/${apiBookId}.${chapter}/verses`,
      {
        headers: {
          'api-key': BIBLE_API_KEY,
        },
        cache: 'force-cache',
      }
    );

    if (!versesResponse.ok) {
      const errorText = await versesResponse.text();
      console.error('Bible API error response:', versesResponse.status, errorText);
      throw new Error(`Bible API returned ${versesResponse.status}: ${errorText}`);
    }

    const versesData = await versesResponse.json();

    // Fetch each verse individually to get the text content
    const verses = await Promise.all(
      versesData.data.map(async (verseInfo: any) => {
        const verseNumber = parseInt(verseInfo.id.split('.')[2]);

        // Fetch individual verse with content
        const verseResponse = await fetch(
          `${BIBLE_API_URL}/bibles/${bibleId}/verses/${verseInfo.id}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=false&include-verse-spans=false`,
          {
            headers: {
              'api-key': BIBLE_API_KEY,
            },
            cache: 'force-cache',
          }
        );

        if (!verseResponse.ok) {
          return {
            id: `${bookId}-${chapter}-${verseNumber}`,
            orgId: bookId,
            bookId: bookId,
            chapter: parseInt(chapter),
            verse: verseNumber,
            text: '',
          };
        }

        const verseData = await verseResponse.json();

        return {
          id: `${bookId}-${chapter}-${verseNumber}`,
          orgId: bookId,
          bookId: bookId,
          chapter: parseInt(chapter),
          verse: verseNumber,
          text: verseData.data.content?.trim() || '',
        };
      })
    );

    return NextResponse.json({ verses });
  } catch (error) {
    console.error('Bible API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from Bible API', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
