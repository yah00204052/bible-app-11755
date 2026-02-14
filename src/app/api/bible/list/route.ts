import { NextRequest, NextResponse } from 'next/server';

const BIBLE_API_KEY = process.env.BIBLE_API_KEY || '';
const BIBLE_API_URL = 'https://api.scripture.api.bible/v1';

export async function GET(request: NextRequest) {
  if (!BIBLE_API_KEY) {
    return NextResponse.json(
      { error: 'Bible API key not configured' },
      { status: 500 }
    );
  }

  try {
    // Fetch list of available Bibles
    const response = await fetch(
      `${BIBLE_API_URL}/bibles?language=eng`,
      {
        headers: {
          'api-key': BIBLE_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    // Return formatted list
    return NextResponse.json({
      bibles: data.data.map((bible: any) => ({
        id: bible.id,
        name: bible.name,
        abbreviation: bible.abbreviation,
        description: bible.description,
        language: bible.language.name,
      }))
    });
  } catch (error) {
    console.error('Bible API list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Bible list', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
