'use client';

import { useState, useEffect } from 'react';
import { getBooks, searchVerses, BibleBook, BibleVerse } from '@/lib/bible';
import VerseDisplay from '@/components/VerseDisplay';
import Link from 'next/link';

export default function SearchPage() {
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const data = await getBooks();
        setBooks(data);
      } catch (err) {
        console.error('Failed to load books:', err);
      }
    };

    loadBooks();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const data = await searchVerses(query);
      setResults(data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const getBookName = (bookId: string) => {
    return books.find((b) => b.id === bookId)?.name || bookId;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-blue-200 hover:text-white text-sm">
            ← Back to Reading
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Search Bible</h1>
            <p className="text-blue-100">Find verses by keyword</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for keywords..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-500"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Search
            </button>
          </div>
        </form>

        {/* Results */}
        <div>
          {loading && (
            <div className="flex items-center justify-center p-8">
              <div className="text-gray-600">Searching...</div>
            </div>
          )}

          {searched && !loading && results.length === 0 && (
            <div className="p-8 text-center text-gray-600">
              No verses found for &quot;{query}&quot;
            </div>
          )}

          {results.length > 0 && (
            <div>
              <p className="mb-4 text-gray-700">
                Found {results.length} verse{results.length !== 1 ? 's' : ''} matching
                &quot;{query}&quot;
              </p>
              <div>
                {results.map((verse) => (
                  <VerseDisplay
                    key={verse.id}
                    verse={verse}
                    bookName={getBookName(verse.bookId)}
                  />
                ))}
              </div>
            </div>
          )}

          {!searched && (
            <div className="p-8 text-center text-gray-600">
              Enter a keyword to search the Bible
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
